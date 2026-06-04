"""Back-office /admin router — customer lookup, stats, and 1:1 email.

Every endpoint is gated by ``current_superuser`` (FastAPI-Users ``is_superuser``
flag). Read-only inspection plus a single side-effect: sending a Resend email to
one customer. Grant a teammate access with
``UPDATE users SET is_superuser = true WHERE email = '...';``.
"""
from __future__ import annotations

import logging
import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.models import User
from app.auth.users import current_superuser
from app.config import settings
from app.db import get_async_session
from app.emails import client as email_client
from app.emails import templates as email_templates
from app.models.book import Book
from app.models.chat import Chat
from app.models.highlight import Highlight
from app.models.quiz import Quiz
from app.models.subscription import Subscription, UsageCounter
from app.models.translation import Translation
from app.schemas.admin import (
    AdminBookRow,
    AdminEmailRequest,
    AdminEmailResponse,
    AdminSubscriptionInfo,
    AdminUsageInfo,
    AdminUserDetail,
    AdminUserList,
    AdminUserStats,
    AdminUserSummary,
)

log = logging.getLogger(__name__)

router = APIRouter(prefix="/admin", tags=["admin"], dependencies=[Depends(current_superuser)])


@router.get("/users", response_model=AdminUserList)
async def list_users(
    query: str | None = Query(default=None, description="Match email / name / username"),
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    session: AsyncSession = Depends(get_async_session),
) -> AdminUserList:
    """Paginated customer list with plan + book count. Newest first."""
    where = []
    if query and query.strip():
        like = f"%{query.strip()}%"
        where.append(
            or_(
                User.email.ilike(like),
                User.display_name.ilike(like),
                User.username.ilike(like),
            )
        )

    count_stmt = select(func.count(User.id))
    list_stmt = select(User).order_by(User.created_at.desc()).limit(limit).offset(offset)
    for cond in where:
        count_stmt = count_stmt.where(cond)
        list_stmt = list_stmt.where(cond)

    total = (await session.execute(count_stmt)).scalar_one()
    # .unique() is required because User eager-loads the oauth_accounts
    # collection (lazy="joined"), which yields duplicate entity rows.
    users = (await session.execute(list_stmt)).unique().scalars().all()
    ids = [u.id for u in users]

    subs: dict[uuid.UUID, Subscription] = {}
    book_counts: dict[uuid.UUID, int] = {}
    if ids:
        sub_rows = (
            await session.execute(select(Subscription).where(Subscription.user_id.in_(ids)))
        ).scalars().all()
        subs = {s.user_id: s for s in sub_rows}
        bc_rows = (
            await session.execute(
                select(Book.user_id, func.count(Book.id))
                .where(Book.user_id.in_(ids))
                .group_by(Book.user_id)
            )
        ).all()
        book_counts = {uid: count for uid, count in bc_rows}

    return AdminUserList(
        users=[
            AdminUserSummary(
                id=u.id,
                email=u.email,
                display_name=u.display_name,
                username=u.username,
                is_anonymous=u.is_anonymous,
                is_verified=u.is_verified,
                is_superuser=u.is_superuser,
                created_at=u.created_at,
                plan=subs[u.id].plan if u.id in subs else "free",
                status=subs[u.id].status.value if u.id in subs else "inactive",
                book_count=book_counts.get(u.id, 0),
            )
            for u in users
        ],
        total=total,
        limit=limit,
        offset=offset,
    )


@router.get("/users/{user_id}", response_model=AdminUserDetail)
async def get_user_detail(
    user_id: uuid.UUID,
    session: AsyncSession = Depends(get_async_session),
) -> AdminUserDetail:
    """Full profile for one customer: subscription, usage, content stats, files."""
    user = (
        await session.execute(select(User).where(User.id == user_id))
    ).unique().scalar_one_or_none()
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    sub = (
        await session.execute(select(Subscription).where(Subscription.user_id == user_id))
    ).scalar_one_or_none()
    usage = None
    if sub is not None:
        usage = (
            await session.execute(
                select(UsageCounter).where(UsageCounter.subscription_id == sub.id)
            )
        ).scalar_one_or_none()

    async def _scalar(stmt) -> int:
        return (await session.execute(stmt)).scalar_one() or 0

    book_count = await _scalar(select(func.count(Book.id)).where(Book.user_id == user_id))
    pages_total = await _scalar(
        select(func.coalesce(func.sum(Book.page_count), 0)).where(Book.user_id == user_id)
    )
    storage_bytes = await _scalar(
        select(func.coalesce(func.sum(Book.file_size_bytes), 0)).where(Book.user_id == user_id)
    )
    highlight_count = await _scalar(
        select(func.count(Highlight.id)).where(Highlight.user_id == user_id)
    )
    quiz_count = await _scalar(select(func.count(Quiz.id)).where(Quiz.user_id == user_id))
    chat_count = await _scalar(select(func.count(Chat.id)).where(Chat.user_id == user_id))
    translation_count = await _scalar(
        select(func.count(Translation.id))
        .select_from(Translation)
        .join(Book, Translation.book_id == Book.id)
        .where(Book.user_id == user_id)
    )

    books = (
        await session.execute(
            select(Book)
            .where(Book.user_id == user_id)
            .order_by(Book.created_at.desc())
            .limit(100)
        )
    ).scalars().all()

    return AdminUserDetail(
        id=user.id,
        email=user.email,
        display_name=user.display_name,
        username=user.username,
        bio=user.bio,
        preferred_language=user.preferred_language,
        is_anonymous=user.is_anonymous,
        is_active=user.is_active,
        is_verified=user.is_verified,
        is_superuser=user.is_superuser,
        family_safe_mode=user.family_safe_mode,
        created_at=user.created_at,
        subscription=AdminSubscriptionInfo(
            plan=sub.plan if sub else "free",
            cycle=sub.cycle if sub else None,
            status=sub.status.value if sub else "inactive",
            current_period_start=sub.current_period_start if sub else None,
            current_period_end=sub.current_period_end if sub else None,
            trial_end=sub.trial_end if sub else None,
            cancel_at_period_end=sub.cancel_at_period_end if sub else False,
            canceled_at=sub.canceled_at if sub else None,
            has_stripe_customer=bool(sub and sub.stripe_customer_id),
            stripe_customer_id=sub.stripe_customer_id if sub else None,
        ),
        usage=AdminUsageInfo(
            period_start=usage.period_start if usage else None,
            pages_uploaded=usage.pages_uploaded if usage else 0,
            quizzes_generated=usage.quizzes_generated if usage else 0,
        ),
        stats=AdminUserStats(
            book_count=book_count,
            pages_total=pages_total,
            storage_bytes=storage_bytes,
            highlight_count=highlight_count,
            quiz_count=quiz_count,
            chat_count=chat_count,
            translation_count=translation_count,
        ),
        books=[
            AdminBookRow(
                id=b.id,
                title=b.title,
                author=b.author,
                format=b.format.value,
                status=b.status.value,
                page_count=b.page_count,
                file_size_bytes=b.file_size_bytes,
                created_at=b.created_at,
            )
            for b in books
        ],
    )


@router.post("/users/{user_id}/email", response_model=AdminEmailResponse)
async def send_user_email(
    user_id: uuid.UUID,
    payload: AdminEmailRequest,
    session: AsyncSession = Depends(get_async_session),
) -> AdminEmailResponse:
    """Send a one-off branded email to a single customer via Resend."""
    user = (
        await session.execute(select(User).where(User.id == user_id))
    ).unique().scalar_one_or_none()
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    if not user.email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="User has no email address"
        )
    if not settings.resend_api_key:
        return AdminEmailResponse(
            sent=False, to=user.email, detail="Email is not configured on this environment."
        )

    subject, html, text = email_templates.admin_message(
        name=user.display_name,
        subject=payload.subject.strip(),
        body=payload.body,
    )
    result = await email_client.send(
        to=user.email, subject=subject, html=html, text=text, tag="admin-message"
    )
    if result is None:
        log.warning("Admin email to %s was not delivered (Resend returned nothing)", user.email)
        return AdminEmailResponse(
            sent=False, to=user.email, detail="Resend did not confirm delivery. Check the logs."
        )
    return AdminEmailResponse(sent=True, to=user.email)
