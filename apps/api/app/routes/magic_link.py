"""Magic-link auth routes — passwordless one-click sign-in.

Two endpoints:

* ``POST /auth/magic-link/request`` — public, idempotent. Send a one-click
  sign-in email to the supplied address if (and only if) a user with that
  email exists. The response is always 202 to prevent email enumeration.

* ``POST /auth/magic-link/redeem`` — public. Exchange a magic-link token
  (delivered via the email above, or returned inline from the silent-signup
  endpoint) for a normal session JWT. The session JWT has the same lifetime
  as ones minted via ``/auth/jwt/login``.
"""
from __future__ import annotations

import logging
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi_users.jwt import generate_jwt
from pydantic import BaseModel, EmailStr
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import magic_link as ml
from app.auth.models import User
from app.config import settings
from app.db import get_async_session
from app.emails import client as email_client
from app.emails import templates as email_templates

log = logging.getLogger(__name__)

router = APIRouter(prefix="/auth/magic-link", tags=["auth"])


class MagicLinkRequestBody(BaseModel):
    email: EmailStr


class MagicLinkRedeemBody(BaseModel):
    token: str


class MagicLinkRedeemResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: str


def magic_link_url(token: str) -> str:
    """Public URL the magic-link email points at. The /auth/magic-login page
    on the web app calls /redeem with the token and stores the JWT.
    """
    return f"{settings.web_public_url}/auth/magic-login?token={token}"


async def send_magic_link(user: User) -> None:
    """Mint a magic-link token, email it. Used by /request and silent-signup."""
    token = ml.issue(user.id)
    url = magic_link_url(token)
    subject, html, text = email_templates.magic_link(
        name=user.display_name, login_url=url
    )
    try:
        await email_client.send(
            to=user.email,
            subject=subject,
            html=html,
            text=text,
            tag="magic-link",
        )
    except Exception:
        # Swallow — we always return 202 to the caller to avoid enumeration.
        log.exception("Failed to send magic-link email to %s", user.email)


@router.post(
    "/request",
    status_code=status.HTTP_202_ACCEPTED,
    summary="Request a magic sign-in link by email",
)
async def request_magic_link(
    payload: MagicLinkRequestBody,
    session: Annotated[AsyncSession, Depends(get_async_session)],
) -> dict[str, str]:
    """Always returns 202 — never reveals whether the email is registered."""
    email = payload.email.lower().strip()
    result = await session.execute(select(User).where(User.email == email))
    # User has lazy="joined" oauth_accounts → must collapse duplicates.
    user = result.unique().scalar_one_or_none()
    if user is not None:
        await send_magic_link(user)
    return {"status": "accepted"}


@router.post(
    "/redeem",
    response_model=MagicLinkRedeemResponse,
    summary="Exchange a magic-link token for a session JWT",
)
async def redeem_magic_link(
    payload: MagicLinkRedeemBody,
    session: Annotated[AsyncSession, Depends(get_async_session)],
) -> MagicLinkRedeemResponse:
    try:
        user_id = ml.verify(payload.token)
    except ml.MagicLinkError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail=str(exc)
        ) from exc

    user = await session.get(User, user_id)
    if user is None or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Account is not available — sign up again or contact support.",
        )

    # Mint a regular session JWT, matching the audience the rest of the
    # FastAPI-Users backend expects.
    access_token = generate_jwt(
        data={"sub": str(user.id), "aud": ["fastapi-users:auth"]},
        secret=settings.jwt_secret,
        lifetime_seconds=settings.jwt_lifetime_seconds,
    )
    return MagicLinkRedeemResponse(
        access_token=access_token, user_id=str(user.id)
    )
