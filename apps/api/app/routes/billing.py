"""Billing API — checkout, customer portal, current subscription, webhooks."""
from __future__ import annotations

import logging

import stripe
from fastapi import APIRouter, Depends, Header, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.models import User
from app.auth.users import current_active_user
from app.billing import service
from app.billing.plans import Cycle, Plan, quota_for
from app.config import settings
from app.db import get_async_session
from app.models.subscription import UsageCounter
from app.schemas.billing import (
    CheckoutRequest,
    CheckoutResponse,
    PortalResponse,
    QuotaRead,
    SubscriptionRead,
    UsageRead,
)

log = logging.getLogger(__name__)

router = APIRouter(prefix="/billing", tags=["billing"])


@router.get("/me", response_model=SubscriptionRead)
async def get_my_subscription(
    user: User = Depends(current_active_user),
    session: AsyncSession = Depends(get_async_session),
) -> SubscriptionRead:
    sub = await service.get_or_create_subscription(user, session)

    usage_result = await session.execute(
        select(UsageCounter).where(UsageCounter.subscription_id == sub.id)
    )
    usage = usage_result.scalar_one_or_none()

    plan = Plan(sub.plan)
    q = quota_for(plan)

    return SubscriptionRead(
        plan=sub.plan,  # type: ignore[arg-type]
        cycle=sub.cycle,  # type: ignore[arg-type]
        status=sub.status.value,  # type: ignore[arg-type]
        current_period_start=sub.current_period_start,
        current_period_end=sub.current_period_end,
        trial_end=sub.trial_end,
        cancel_at_period_end=sub.cancel_at_period_end,
        canceled_at=sub.canceled_at,
        has_stripe_customer=bool(sub.stripe_customer_id),
        quota=QuotaRead(
            pages_per_month=q.pages_per_month,
            max_pages_per_book=q.max_pages_per_book,
            quizzes_per_book=q.quizzes_per_book,
            profiles=q.profiles,
            chat_with_citations=q.chat_with_citations,
            annotated_export=q.annotated_export,
            priority_queue=q.priority_queue,
            family_safe_mode=q.family_safe_mode,
            literary_translation=q.literary_translation,
            seed_book_page_cap=q.seed_book_page_cap,
        ),
        usage=UsageRead(
            period_start=usage.period_start if usage else None,
            pages_uploaded=usage.pages_uploaded if usage else 0,
            quizzes_generated=usage.quizzes_generated if usage else 0,
        ),
    )


@router.post("/checkout", response_model=CheckoutResponse)
async def create_checkout(
    payload: CheckoutRequest,
    user: User = Depends(current_active_user),
    session: AsyncSession = Depends(get_async_session),
) -> CheckoutResponse:
    if not settings.stripe_secret_key:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Billing is not configured on this environment.",
        )
    try:
        url = await service.create_checkout_session(
            user=user,
            plan=Plan(payload.plan),
            cycle=Cycle(payload.cycle),
            apply_first_month_discount=payload.apply_first_month_discount,
            session=session,
        )
    except stripe.error.StripeError as exc:
        log.exception("Stripe checkout error")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc.user_message or exc)
        ) from exc
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    return CheckoutResponse(url=url)


@router.post("/portal", response_model=PortalResponse)
async def create_portal(
    user: User = Depends(current_active_user),
    session: AsyncSession = Depends(get_async_session),
) -> PortalResponse:
    if not settings.stripe_secret_key:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Billing is not configured on this environment.",
        )
    try:
        url = await service.create_portal_session(user, session)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    except stripe.error.StripeError as exc:
        log.exception("Stripe portal error")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc.user_message or exc)
        ) from exc
    return PortalResponse(url=url)


@router.post("/webhook", include_in_schema=False)
async def stripe_webhook(
    request: Request,
    stripe_signature: str | None = Header(default=None, alias="Stripe-Signature"),
    session: AsyncSession = Depends(get_async_session),
) -> dict[str, str]:
    if not settings.stripe_webhook_secret:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Webhooks are not configured.",
        )
    if not stripe_signature:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Missing signature")

    payload = await request.body()
    try:
        event = service.construct_event(payload, stripe_signature)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="Invalid payload") from exc
    except stripe.error.SignatureVerificationError as exc:
        raise HTTPException(status_code=400, detail="Invalid signature") from exc

    try:
        await service.handle_event(event, session)
    except Exception as exc:
        log.exception("Stripe webhook handler error for event %s", event["id"] if "id" in event else "?")
        # Return 500 so Stripe retries; we keep the event row so the next try
        # is a no-op when handler ran cleanly the second time.
        raise HTTPException(status_code=500, detail="Webhook handler error") from exc

    return {"received": "ok"}
