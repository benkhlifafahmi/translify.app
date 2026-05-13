"""Onboarding-lead tracking — anonymous email capture before signup.

The /join flow captures email first, then walks visitors through topic-pick,
shelf, and a sample experience before asking for a password. We persist the
visitor's progress at every step so the team can re-engage drop-offs with
targeted offers (e.g. "you stopped at the topic step — here's 20% off").

The endpoint is **public** (no auth) because the visitor has no account yet.
Abuse is bounded by per-IP rate limits at the edge / reverse proxy layer; the
upsert itself is idempotent (unique index on email).
"""
from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, Header, Request, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.models import User
from app.db import get_async_session
from app.models.onboarding import OnboardingLead, OnboardingStep
from app.schemas.onboarding import OnboardingLeadRead, OnboardingLeadUpsert

router = APIRouter(prefix="/onboarding", tags=["onboarding"])


@router.post(
    "/lead",
    response_model=OnboardingLeadRead,
    status_code=status.HTTP_200_OK,
)
async def upsert_lead(
    payload: OnboardingLeadUpsert,
    request: Request,
    user_agent: str | None = Header(default=None, alias="User-Agent"),
    session: AsyncSession = Depends(get_async_session),
) -> OnboardingLead:
    """Upsert a lead row by email.

    Called on every step transition in the /join flow. Returns the (possibly
    new) lead. Safe to call repeatedly — non-null fields in the payload
    overwrite existing values, ``last_seen_at`` advances, and ``step`` is
    moved forward but never *backward* (so a refresh on an earlier step can't
    erase later progress).
    """
    email = payload.email.lower().strip()
    referrer = (payload.referrer or request.headers.get("referer") or "")[:512] or None
    ua = (user_agent or "")[:512] or None

    result = await session.execute(
        select(OnboardingLead).where(OnboardingLead.email == email)
    )
    lead = result.scalar_one_or_none()

    if lead is None:
        lead = OnboardingLead(
            email=email,
            step=payload.step,
            topics=payload.topics or [],
            chosen_book_id=payload.chosen_book_id,
            referrer=referrer,
            user_agent=ua,
            preferred_language=payload.preferred_language,
        )
        if payload.step == OnboardingStep.completed:
            lead.completed = True
            lead.completed_at = datetime.now(timezone.utc)
        session.add(lead)
    else:
        # Step only advances. STEP_RANK orders the funnel; lower index = earlier.
        if _step_rank(payload.step) > _step_rank(lead.step):
            lead.step = payload.step
        if payload.topics is not None:
            lead.topics = payload.topics
        if payload.chosen_book_id is not None:
            lead.chosen_book_id = payload.chosen_book_id
        if payload.preferred_language is not None:
            lead.preferred_language = payload.preferred_language
        if referrer and not lead.referrer:
            lead.referrer = referrer
        if ua and not lead.user_agent:
            lead.user_agent = ua
        if payload.step == OnboardingStep.completed and not lead.completed:
            lead.completed = True
            lead.completed_at = datetime.now(timezone.utc)
        lead.last_seen_at = datetime.now(timezone.utc)

    # Best-effort link to a User row — only when the funnel reached signup or
    # completion. We match by email; if the visitor signed up with a different
    # email (e.g. via Google OAuth) the link stays NULL and operations can
    # reconcile later.
    if lead.user_id is None and payload.step in (
        OnboardingStep.signup, OnboardingStep.completed,
    ):
        user_lookup = await session.execute(
            select(User.id).where(User.email == email)
        )
        uid = user_lookup.scalar_one_or_none()
        if uid is not None:
            lead.user_id = uid

    await session.commit()
    await session.refresh(lead)
    return lead


_STEP_RANK: dict[OnboardingStep, int] = {
    OnboardingStep.email: 0,
    OnboardingStep.topics: 1,
    OnboardingStep.shelf: 2,
    OnboardingStep.experience: 3,
    OnboardingStep.signup: 4,
    OnboardingStep.completed: 5,
}


def _step_rank(s: OnboardingStep) -> int:
    return _STEP_RANK.get(s, 0)
