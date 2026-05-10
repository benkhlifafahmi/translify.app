"""Quota enforcement helpers — used as FastAPI dependencies on gated routes."""
from __future__ import annotations

import uuid

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.models import User
from app.billing.plans import UNLIMITED, Plan, quota_for
from app.billing.service import get_or_create_subscription
from app.models.quiz import Quiz
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


async def reserve_book_upload(
    user: User, page_count: int, session: AsyncSession
) -> Subscription:
    """Refuse the upload if it'd push the user over their monthly page quota
    or if the single book exceeds ``max_pages_per_book``.

    Free users get a tiny lifetime allowance (the demo page budget) — we do
    NOT require an active plan here. Other gated routes (chat, quiz,
    translation) still call ``require_active_plan`` so the only thing Free
    users can do is upload + view their demo translation.

    Increments ``pages_uploaded`` by ``page_count`` on success. Rollback on
    failure happens via the surrounding transaction (caller controls commit).
    """
    sub = await get_or_create_subscription(user, session)
    plan = Plan(sub.plan)
    quota = quota_for(plan)
    usage = await _load_usage(sub, session)

    pages = max(1, int(page_count))  # treat unknown / zero as 1, never free

    # Per-book ceiling — protects against a single 600-page-textbook upload.
    if quota.max_pages_per_book < UNLIMITED and pages > quota.max_pages_per_book:
        raise QuotaExceeded(
            f"This book has {pages} pages — your plan caps single uploads at "
            f"{quota.max_pages_per_book} pages. Upgrade to upload longer books.",
            plan=plan.value,
            limit=quota.max_pages_per_book,
            used=pages,
        )

    if quota.pages_per_month >= UNLIMITED:
        usage.pages_uploaded += pages
        return sub

    if usage.pages_uploaded + pages > quota.pages_per_month:
        raise QuotaExceeded(
            f"This upload ({pages} pages) would put you over your "
            f"{quota.pages_per_month}-pages-per-month cap. Upgrade to keep going.",
            plan=plan.value,
            limit=quota.pages_per_month,
            used=usage.pages_uploaded,
        )

    usage.pages_uploaded += pages
    return sub


async def reserve_quiz_for_book(
    user: User, book_id: uuid.UUID, session: AsyncSession
) -> Subscription:
    """Refuse the request if the user is at the per-book quiz cap.

    We count *existing* quizzes for the book — quizzes are durable artifacts
    on Translify (they don't auto-expire), so the cap is a "how many quizzes
    can co-exist per book," not a rolling rate.
    """
    sub = await require_active_plan(user, session)
    plan = Plan(sub.plan)
    quota = quota_for(plan)
    usage = await _load_usage(sub, session)

    if quota.quizzes_per_book < UNLIMITED:
        existing = await session.scalar(
            select(func.count(Quiz.id)).where(
                Quiz.book_id == book_id, Quiz.user_id == user.id
            )
        )
        existing_count = int(existing or 0)
        if existing_count >= quota.quizzes_per_book:
            raise QuotaExceeded(
                f"You already have {quota.quizzes_per_book} quizzes for this "
                "book — that's the cap on your plan. Delete one or upgrade.",
                plan=plan.value,
                limit=quota.quizzes_per_book,
                used=existing_count,
            )

    # Track lifetime activity for the dashboard — not a hard cap.
    usage.quizzes_generated += 1
    return sub
