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

import uuid

from fastapi import APIRouter, Depends, Header, HTTPException, Request, status
from fastapi_users.jwt import generate_jwt
from fastapi_users.password import PasswordHelper
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import magic_link as ml
from app.auth.models import User
from app.auth.rate_limit import rate_limit_ip
from app.auth.users import current_active_user
from app.config import settings
from app.db import get_async_session
from app.emails import client as email_client
from app.emails import templates as email_templates
from app.models.onboarding import OnboardingLead, OnboardingStep
from app.routes.magic_link import magic_link_url
from app.schemas.onboarding import (
    AnonymousSessionResponse,
    ClaimSessionRequest,
    ClaimSessionResponse,
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
        # Returning user — we can't prove the typer owns the address, so we
        # don't hand out a JWT. We don't ask for a password either, because
        # /join-created accounts have an unguessable random password the
        # user has never seen. Instead we mail a magic-link sign-in URL;
        # anyone who can read the inbox can complete sign-in.
        #
        # Users who *did* set a password via /forgot-password still have the
        # password path available on /login (see the collapsible "Sign in
        # with password" panel).
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
                tag="magic-link-resume",
            )
        except Exception:
            log.exception("Failed to send magic-link email to %s", user.email)

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
            access_token=None,
            magic_link_sent=True,
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


# ─── Anonymous sessions ────────────────────────────────────────────────────

ANON_EMAIL_DOMAIN = "anon.translify.app"


def _is_anonymous_email(email: str) -> bool:
    return email.endswith(f"@{ANON_EMAIL_DOMAIN}")


@router.post(
    "/anonymous-session",
    response_model=AnonymousSessionResponse,
    # 10 anonymous accounts per hour per IP is plenty for any legitimate
    # visitor (refresh, multiple tabs, family on the same Wi-Fi) and
    # capped tight enough that a bot can't quietly fill ``users`` with
    # ghost rows. Tighten the bucket if abuse becomes visible.
    dependencies=[Depends(rate_limit_ip("anon-session", limit=10, window_seconds=3600))],
)
async def create_anonymous_session(
    session: AsyncSession = Depends(get_async_session),
) -> AnonymousSessionResponse:
    """Mint a JWT for a ghost account so the visitor can clone seeds + read
    without giving an email up front.

    The user row is real (so every FK in the schema keeps working) but
    carries ``is_anonymous=True`` and a synthetic email under
    ``anon.translify.app`` that nothing else can collide with. Cost-bearing
    routes (chat send, quiz create, upload, translation) reject the user
    via ``require_non_anonymous`` until they ``claim_session`` with a real
    email.

    No abuse limits here yet — add per-IP throttling at the edge before
    opening this to broad public traffic.
    """
    uid = uuid.uuid4()
    placeholder = f"anon-{uid}@{ANON_EMAIL_DOMAIN}"

    hashed = _password_helper.hash(secrets.token_urlsafe(32))
    user = User(
        id=uid,
        email=placeholder,
        hashed_password=hashed,
        is_active=True,
        # We never email anonymous accounts, so "verified" is a no-op label
        # here but keeps invariants happy elsewhere.
        is_verified=True,
        is_superuser=False,
        is_anonymous=True,
        preferred_language="en",
    )
    session.add(user)
    await session.commit()
    await session.refresh(user)

    access_token = generate_jwt(
        data={"sub": str(user.id), "aud": ["fastapi-users:auth"]},
        secret=settings.jwt_secret,
        lifetime_seconds=settings.jwt_lifetime_seconds,
    )
    return AnonymousSessionResponse(
        user_id=user.id, access_token=access_token, is_anonymous=True,
    )


@router.post(
    "/claim-session",
    response_model=ClaimSessionResponse,
)
async def claim_session(
    payload: ClaimSessionRequest,
    user: User = Depends(current_active_user),
    session: AsyncSession = Depends(get_async_session),
) -> ClaimSessionResponse:
    """Turn an anonymous account into a real one — keyed by the email the
    visitor just gave us.

    Three terminal outcomes:

    1. Caller is already a real user → 409, this endpoint is meaningless.
    2. Email is brand new → adopt it on the current row, drop the
       ``is_anonymous`` flag, send a magic-link welcome, return the same JWT.
       All books/chat/reading state stay attached.
    3. Email already belongs to *another* account → don't merge (too easy to
       weaponise). Send a magic link to the established account; keep the
       anonymous session alive on this device.
    """
    if not user.is_anonymous:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This session is already a real account.",
        )

    email = payload.email.lower().strip()
    if _is_anonymous_email(email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="That looks like a placeholder address — use your real email.",
        )

    # Does the email already belong to someone else?
    existing_q = await session.execute(select(User).where(User.email == email))
    existing = existing_q.unique().scalar_one_or_none()
    if existing is not None and existing.id != user.id:
        # Branch 3 — established account. Mail them a sign-in link, keep
        # the anon JWT live on this device so the visitor can either click
        # the link or carry on as anonymous.
        token = ml.issue(existing.id)
        subject, html, text = email_templates.magic_link(
            name=existing.display_name, login_url=magic_link_url(token),
        )
        try:
            await email_client.send(
                to=existing.email, subject=subject, html=html, text=text,
                tag="claim-existing-account",
            )
        except Exception:
            log.exception("magic-link mail failed during claim for %s", email)
        return ClaimSessionResponse(
            claimed=False, magic_link_sent=True,
            user_id=None, access_token=None,
        )

    # Branch 2 — adopt the email on this anonymous row.
    user.email = email
    user.is_anonymous = False
    if payload.preferred_language:
        user.preferred_language = payload.preferred_language.lower()[:8]
    # Welcome / magic-link email so they have a cross-device recovery path.
    token = ml.issue(user.id)
    subject, html, text = email_templates.magic_link(
        name=user.display_name, login_url=magic_link_url(token),
    )
    try:
        await email_client.send(
            to=email, subject=subject, html=html, text=text,
            tag="magic-link-claim-welcome",
        )
    except Exception:
        log.exception("Welcome mail failed during claim for %s", email)

    # Also upsert the onboarding lead for this newly-real user so the funnel
    # dashboard sees them.
    lead_q = await session.execute(
        select(OnboardingLead).where(OnboardingLead.email == email)
    )
    lead = lead_q.scalar_one_or_none()
    if lead is None:
        session.add(OnboardingLead(
            email=email,
            step=OnboardingStep.experience,
            user_id=user.id,
        ))
    elif lead.user_id is None:
        lead.user_id = user.id

    await session.commit()
    await session.refresh(user)

    # Re-issue the JWT (same sub) so the token isn't tied to the old
    # is_anonymous claim if anything caches the user attributes.
    access_token = generate_jwt(
        data={"sub": str(user.id), "aud": ["fastapi-users:auth"]},
        secret=settings.jwt_secret,
        lifetime_seconds=settings.jwt_lifetime_seconds,
    )
    return ClaimSessionResponse(
        claimed=True, magic_link_sent=True,
        user_id=user.id, access_token=access_token,
    )
