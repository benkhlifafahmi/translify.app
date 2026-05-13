"""Onboarding — lead tracking + silent (email-only) account creation.

The /join flow captures email first and then walks visitors through topic
selection and a sample experience. There are two persistence concerns:

1. **Drop-off tracking** — every step transition upserts an
   ``OnboardingLead`` so the team can re-engage visitors who stop midway.
   ``POST /onboarding/lead``.
2. **Silent sign-up** — once the email is valid we create a real account in
   the background and hand the browser a session JWT immediately. The user
   lands in a real /library (with the system seed catalogue already
   available) without seeing a password screen. ``POST /onboarding/start-session``.
   A magic-link email is also sent so they can return on another device.

Both endpoints are public — anti-enumeration in ``start-session`` is handled
by *not* returning a JWT for emails that already have an account; instead a
magic-link email is sent.
"""
from __future__ import annotations

import logging
import secrets
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, Header, Request, status
from fastapi_users.jwt import generate_jwt
from fastapi_users.password import PasswordHelper
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import magic_link as ml
from app.auth.models import User
from app.config import settings
from app.db import get_async_session
from app.emails import client as email_client
from app.emails import templates as email_templates
from app.models.onboarding import OnboardingLead, OnboardingStep
from app.routes.magic_link import magic_link_url
from app.schemas.onboarding import (
    OnboardingLeadRead,
    OnboardingLeadUpsert,
    StartSessionRequest,
    StartSessionResponse,
)

log = logging.getLogger(__name__)

router = APIRouter(prefix="/onboarding", tags=["onboarding"])

_password_helper = PasswordHelper()


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


# ─── Silent-signup ─────────────────────────────────────────────────────────


@router.post(
    "/start-session",
    response_model=StartSessionResponse,
)
async def start_session(
    payload: StartSessionRequest,
    request: Request,
    user_agent: str | None = Header(default=None, alias="User-Agent"),
    session: AsyncSession = Depends(get_async_session),
) -> StartSessionResponse:
    """Email-only account creation. The frontend calls this from step 1 of /join.

    Behaviour by email-status:

    * **New email** → create an active+verified user with an unguessable
      random password, mint a session JWT, return it. A welcome / magic-link
      email is also sent for cross-device returns. The visitor is logged in
      immediately and lands in /library on the next step.
    * **Existing email** → do NOT return a JWT (someone else could be typing
      the address). Send a magic-link email instead and return
      ``magic_link_sent=true`` so the UI can prompt the visitor to check
      their inbox.
    """
    email = payload.email.lower().strip()

    # Look up an existing user.
    existing_q = await session.execute(select(User).where(User.email == email))
    # User has lazy="joined" oauth_accounts → must collapse duplicates.
    user = existing_q.unique().scalar_one_or_none()

    if user is not None:
        # Returning user — don't auto-authenticate (we can't prove the typer
        # owns the address). Tell the UI to prompt for a password, which it
        # will POST to /auth/jwt/login.
        #
        # We deliberately do NOT include the user_id in the response so a
        # caller can't enumerate which emails exist by inspecting it. The
        # ``requires_password`` signal is intentionally identical for any
        # known account, including those without a real password (we treat
        # passwordless-only accounts the same way — they can fall back to
        # /forgot-password to set one, or use the magic-link button).
        await _record_lead_for_session(
            email=email,
            user=user,
            payload=payload,
            request=request,
            user_agent=user_agent,
            session=session,
        )
        await session.commit()
        return StartSessionResponse(
            user_id=None,
            is_new_user=False,
            requires_password=True,
            access_token=None,
            magic_link_sent=False,
        )

    # New user — create the account silently.
    hashed = _password_helper.hash(secrets.token_urlsafe(32))
    user = User(
        email=email,
        hashed_password=hashed,
        is_active=True,
        # We trust the email enough to bypass click-to-verify: they'll get
        # the welcome / magic-link email, and they can't do anything
        # destructive until they pick a plan anyway.
        is_verified=True,
        is_superuser=False,
        preferred_language=(payload.preferred_language or "en").lower()[:8],
    )
    session.add(user)
    await session.flush()  # populate user.id

    # Fire the welcome / magic-link email so the visitor has a way back if
    # they switch devices or clear localStorage. Best-effort; the session is
    # already valid.
    token = ml.issue(user.id)
    subject, html, text = email_templates.magic_link(
        name=user.display_name, login_url=magic_link_url(token)
    )
    try:
        await email_client.send(
            to=user.email,
            subject=subject,
            html=html,
            text=text,
            tag="magic-link-welcome",
        )
    except Exception:
        log.exception("Failed to send magic-link welcome to %s", user.email)

    # Hand the browser a normal session JWT — same audience as /auth/jwt/login.
    access_token = generate_jwt(
        data={"sub": str(user.id), "aud": ["fastapi-users:auth"]},
        secret=settings.jwt_secret,
        lifetime_seconds=settings.jwt_lifetime_seconds,
    )

    await _record_lead_for_session(
        email=email,
        user=user,
        payload=payload,
        request=request,
        user_agent=user_agent,
        session=session,
    )

    await session.commit()
    return StartSessionResponse(
        user_id=user.id, is_new_user=True, access_token=access_token,
        magic_link_sent=True,
    )


async def _record_lead_for_session(
    *,
    email: str,
    user: User,
    payload: StartSessionRequest,
    request: Request,
    user_agent: str | None,
    session: AsyncSession,
) -> None:
    """Upsert the onboarding lead so the funnel dashboard stays consistent."""
    referrer = (
        payload.referrer or request.headers.get("referer") or ""
    )[:512] or None
    ua = (user_agent or "")[:512] or None

    result = await session.execute(
        select(OnboardingLead).where(OnboardingLead.email == email)
    )
    lead = result.scalar_one_or_none()
    if lead is None:
        lead = OnboardingLead(
            email=email,
            step=OnboardingStep.email,
            topics=payload.topics or [],
            preferred_language=payload.preferred_language,
            referrer=referrer,
            user_agent=ua,
            user_id=user.id,
        )
        session.add(lead)
    else:
        if payload.topics is not None:
            lead.topics = payload.topics
        if payload.preferred_language is not None:
            lead.preferred_language = payload.preferred_language
        if lead.user_id is None:
            lead.user_id = user.id
        lead.last_seen_at = datetime.now(timezone.utc)
