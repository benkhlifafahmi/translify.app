"""Quota enforcement helpers — used as FastAPI dependencies on gated routes."""
from __future__ import annotations

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.models import User
from app.billing.plans import UNLIMITED, Plan, quota_for
from app.billing.service import get_or_create_subscription
from app.models.subscription import Subscription, SubscriptionStatus, UsageCounter

_ACTIVE_STATUSES = {
    SubscriptionStatus.active,
    SubscriptionStatus.trialing,
    # past_due gets a grace window — Stripe handles dunning + cancellation.
    SubscriptionStatus.past_due,
}


class QuotaExceeded(HTTPException):
    def __init__(self, detail: str, *, plan: str, limit: int, used: int) -> None:
        super().__init__(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail={
                "error": "quota_exceeded",
                "message": detail,
                "plan": plan,
                "limit": limit,
                "used": used,
            },
        )


async def _load_usage(sub: Subscription, session: AsyncSession) -> UsageCounter:
    result = await session.execute(
        select(UsageCounter).where(UsageCounter.subscription_id == sub.id)
    )
    usage = result.scalar_one_or_none()
    if usage is None:
        usage = UsageCounter(subscription_id=sub.id)
        session.add(usage)
        await session.flush()
    return usage


async def require_active_plan(user: User, session: AsyncSession) -> Subscription:
    """Refuse the request unless the user has a paid (or trialing) plan."""
    sub = await get_or_create_subscription(user, session)
    if sub.status not in _ACTIVE_STATUSES:
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail={
                "error": "no_active_plan",
                "message": "An active subscription is required for this action.",
                "plan": sub.plan,
                "status": sub.status.value,
            },
        )
    return sub


async def reserve_book_upload(user: User, session: AsyncSession) -> Subscription:
    """Refuse the upload if the user is over their monthly book quota.

    Increments ``books_uploaded`` on success so the counter reflects the
    reserved slot. Roll-back on failure happens via the surrounding
    transaction (caller controls commit/rollback).
    """
    sub = await require_active_plan(user, session)
    plan = Plan(sub.plan)
    quota = quota_for(plan)
    usage = await _load_usage(sub, session)

    if quota.books_per_month >= UNLIMITED:
        usage.books_uploaded += 1
        return sub

    if usage.books_uploaded >= quota.books_per_month:
        raise QuotaExceeded(
            f"You've used all {quota.books_per_month} books in your current period. "
            "Upgrade to keep going.",
            plan=plan.value,
            limit=quota.books_per_month,
            used=usage.books_uploaded,
        )

    usage.books_uploaded += 1
    return sub


async def reserve_quiz_generation(user: User, session: AsyncSession) -> Subscription:
    sub = await require_active_plan(user, session)
    plan = Plan(sub.plan)
    quota = quota_for(plan)
    usage = await _load_usage(sub, session)

    if quota.quizzes_per_book >= UNLIMITED:
        usage.quizzes_generated += 1
        return sub

    # quizzes_per_book is per-book, so this is a soft accumulator we surface in
    # the UI rather than a hard global quota — only the book-level limiter is
    # the strict cap. We still increment so the dashboard reflects activity.
    usage.quizzes_generated += 1
    return sub
