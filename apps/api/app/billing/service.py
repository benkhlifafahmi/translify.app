"""Stripe service — checkout sessions, customer portal, webhook handling.

The service treats Stripe as the source of truth and our DB as a cache. All
state-changing flows go: client → API → Stripe → webhook → DB. This keeps
us consistent even when the user closes the tab mid-checkout.
"""
from __future__ import annotations

import logging
from datetime import UTC, datetime

import stripe
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.models import User
from app.billing.plans import Cycle, Plan, plan_for_price_id, price_id_for
from app.config import settings
from app.models.subscription import (
    StripeEvent,
    Subscription,
    SubscriptionStatus,
    UsageCounter,
)

log = logging.getLogger(__name__)


def _g(obj, key, default=None):
    """Safe `.get()` for Stripe SDK objects (whose attr-style ``get`` is
    shadowed by ``__getattr__``). Falls back to ``default`` if missing."""
    try:
        if obj is None or key not in obj:
            return default
        val = obj[key]
        return default if val is None else val
    except (KeyError, TypeError):
        return default


stripe.api_key = settings.stripe_secret_key
# Pin a recent Stripe API version so unrelated updates don't break payloads.
stripe.api_version = "2024-11-20.acacia"


# ─────────────────────────────  Subscriptions  ─────────────────────────────


async def get_or_create_subscription(
    user: User, session: AsyncSession
) -> Subscription:
    """Return the user's subscription row, creating an inactive one if absent."""
    result = await session.execute(
        select(Subscription).where(Subscription.user_id == user.id)
    )
    sub = result.scalar_one_or_none()
    if sub is None:
        sub = Subscription(
            user_id=user.id,
            plan=Plan.free.value,
            status=SubscriptionStatus.inactive,
        )
        session.add(sub)
        await session.flush()
        usage = UsageCounter(subscription_id=sub.id)
        session.add(usage)
        await session.commit()
        await session.refresh(sub)
    return sub


async def ensure_stripe_customer(
    user: User, sub: Subscription, session: AsyncSession
) -> str:
    """Return the Stripe customer ID for this user, creating it on first need."""
    if sub.stripe_customer_id:
        return sub.stripe_customer_id

    customer = stripe.Customer.create(
        email=user.email,
        name=user.display_name or None,
        metadata={"user_id": str(user.id)},
    )
    sub.stripe_customer_id = customer.id
    await session.commit()
    return customer.id


# ─────────────────────────────  Checkout  ─────────────────────────────


def _success_url() -> str:
    return f"{settings.web_public_url}/account?checkout=success&session_id={{CHECKOUT_SESSION_ID}}"


def _cancel_url() -> str:
    return f"{settings.web_public_url}/account?checkout=cancelled"


async def create_checkout_session(
    user: User,
    plan: Plan,
    cycle: Cycle,
    apply_first_month_discount: bool,
    session: AsyncSession,
) -> str:
    """Create a Stripe Checkout Session and return its hosted URL."""
    price_id = price_id_for(plan, cycle)
    if not price_id:
        raise ValueError(f"No Stripe price configured for {plan.value}/{cycle.value}")

    sub = await get_or_create_subscription(user, session)
    customer_id = await ensure_stripe_customer(user, sub, session)

    discounts: list[dict] = []
    if apply_first_month_discount and settings.stripe_first_month_coupon:
        discounts.append({"coupon": settings.stripe_first_month_coupon})

    params: dict = {
        "mode": "subscription",
        "customer": customer_id,
        "line_items": [{"price": price_id, "quantity": 1}],
        "success_url": _success_url(),
        "cancel_url": _cancel_url(),
        "subscription_data": {
            "metadata": {
                "user_id": str(user.id),
                "plan": plan.value,
                "cycle": cycle.value,
            },
            "trial_period_days": 30,
        },
        "metadata": {
            "user_id": str(user.id),
            "plan": plan.value,
            "cycle": cycle.value,
        },
    }
    if discounts:
        params["discounts"] = discounts
    else:
        params["allow_promotion_codes"] = True

    checkout = stripe.checkout.Session.create(**params)
    if not checkout.url:
        raise RuntimeError("Stripe did not return a checkout URL")
    return checkout.url


async def create_portal_session(user: User, session: AsyncSession) -> str:
    """Create a Customer Portal session for a subscriber to manage billing."""
    sub = await get_or_create_subscription(user, session)
    if not sub.stripe_customer_id:
        raise ValueError("No Stripe customer for this user yet — subscribe first.")
    portal = stripe.billing_portal.Session.create(
        customer=sub.stripe_customer_id,
        return_url=f"{settings.web_public_url}/account",
    )
    return portal.url


# ─────────────────────────────  Webhooks  ─────────────────────────────


def construct_event(payload: bytes, signature: str) -> stripe.Event:
    """Verify a webhook signature and return the parsed event."""
    return stripe.Webhook.construct_event(
        payload=payload,
        sig_header=signature,
        secret=settings.stripe_webhook_secret,
    )


def _ts_to_dt(value: int | None) -> datetime | None:
    if value is None:
        return None
    return datetime.fromtimestamp(value, tz=UTC)


async def _record_event(event_id: str, event_type: str, session: AsyncSession) -> bool:
    """Insert a row in stripe_events; return False if already seen (duplicate)."""
    existing = await session.execute(
        select(StripeEvent).where(StripeEvent.stripe_event_id == event_id)
    )
    if existing.scalar_one_or_none() is not None:
        return False
    session.add(StripeEvent(stripe_event_id=event_id, event_type=event_type))
    await session.flush()
    return True


async def _apply_subscription_object(
    sub_obj: dict, session: AsyncSession
) -> Subscription | None:
    """Reconcile a Stripe subscription object into our DB row."""
    customer_id: str | None = _g(sub_obj, "customer")
    if not customer_id:
        return None

    result = await session.execute(
        select(Subscription).where(Subscription.stripe_customer_id == customer_id)
    )
    sub = result.scalar_one_or_none()
    if sub is None:
        log.warning("Received subscription event for unknown customer %s", customer_id)
        return None

    items = _g(_g(sub_obj, "items", {}), "data", []) or []
    plan: Plan | None = None
    cycle: Cycle | None = None
    if items:
        price_id = _g(_g(items[0], "price", {}), "id")
        if price_id:
            mapped = plan_for_price_id(price_id)
            if mapped:
                plan, cycle = mapped

    status_raw = _g(sub_obj, "status") or "inactive"
    try:
        status = SubscriptionStatus(status_raw)
    except ValueError:
        log.warning("Unknown Stripe subscription status %r — falling back", status_raw)
        status = SubscriptionStatus.inactive

    sub.stripe_subscription_id = _g(sub_obj, "id")
    if plan is not None:
        sub.plan = plan.value
    if cycle is not None:
        sub.cycle = cycle.value
    sub.status = status
    sub.current_period_start = _ts_to_dt(_g(sub_obj, "current_period_start"))
    sub.current_period_end = _ts_to_dt(_g(sub_obj, "current_period_end"))
    sub.trial_end = _ts_to_dt(_g(sub_obj, "trial_end"))
    sub.cancel_at_period_end = bool(_g(sub_obj, "cancel_at_period_end") or False)
    sub.canceled_at = _ts_to_dt(_g(sub_obj, "canceled_at"))

    # Roll usage counters when the period rolls.
    usage_result = await session.execute(
        select(UsageCounter).where(UsageCounter.subscription_id == sub.id)
    )
    usage = usage_result.scalar_one_or_none()
    if usage is None:
        usage = UsageCounter(subscription_id=sub.id)
        session.add(usage)
    if sub.current_period_start and (
        usage.period_start is None or usage.period_start < sub.current_period_start
    ):
        usage.period_start = sub.current_period_start
        usage.books_uploaded = 0
        usage.quizzes_generated = 0

    return sub


async def handle_event(event: stripe.Event, session: AsyncSession) -> None:
    """Dispatch a verified Stripe event to the appropriate handler."""
    fresh = await _record_event(event["id"], event["type"], session)
    if not fresh:
        log.info("Skipping duplicate Stripe event %s", event["id"])
        return

    event_type: str = event["type"]
    obj = event["data"]["object"]

    if event_type in {
        "customer.subscription.created",
        "customer.subscription.updated",
        "customer.subscription.deleted",
        "customer.subscription.trial_will_end",
    }:
        await _apply_subscription_object(obj, session)

    elif event_type == "checkout.session.completed":
        # The subscription will be created via customer.subscription.created;
        # nothing to do here unless we want to react to one-time mode (we don't).
        log.info("Checkout completed for customer %s", _g(obj, "customer"))

    elif event_type == "invoice.payment_failed":
        # Status will already be flipped to past_due via subscription.updated.
        log.warning("Invoice payment failed for customer %s", _g(obj, "customer"))

    else:
        log.debug("Unhandled Stripe event type: %s", event_type)

    await session.commit()
