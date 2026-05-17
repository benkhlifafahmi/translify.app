"""Mobile social authentication — Google ID token exchange."""
from __future__ import annotations

import uuid

import httpx
from fastapi import APIRouter, Depends, HTTPException
from jose import jwt
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.models import OAuthAccount, User
from app.config import settings
from app.db import get_async_session

router = APIRouter(prefix="/auth/mobile", tags=["auth"])

_TOKEN_AUDIENCE = ["fastapi-users:auth"]


def _mint_jwt(user: User) -> str:
    return jwt.encode(
        {"sub": str(user.id), "aud": _TOKEN_AUDIENCE},
        settings.jwt_secret,
        algorithm="HS256",
    )


class _GoogleTokenBody(BaseModel):
    id_token: str


@router.post("/google")
async def google_mobile_auth(
    body: _GoogleTokenBody,
    session: AsyncSession = Depends(get_async_session),
) -> dict:
    """Exchange a native Google ID token (from google_sign_in SDK) for a Translify JWT."""
    async with httpx.AsyncClient(timeout=10) as client:
        resp = await client.get(
            "https://oauth2.googleapis.com/tokeninfo",
            params={"id_token": body.id_token},
        )
    if resp.status_code != 200:
        raise HTTPException(status_code=401, detail="Invalid Google ID token.")

    info = resp.json()
    email: str | None = info.get("email")
    google_sub: str | None = info.get("sub")

    if not email or not google_sub or info.get("email_verified") != "true":
        raise HTTPException(status_code=401, detail="Google token missing required claims.")

    # Find or create user by email.
    user = await session.scalar(select(User).where(User.email == email))
    if user is None:
        user = User(
            id=uuid.uuid4(),
            email=email,
            hashed_password="",
            is_active=True,
            is_verified=True,
            is_superuser=False,
            is_anonymous=False,
            display_name=info.get("name"),
        )
        session.add(user)
        await session.flush()

    # Upsert the OAuth account link so the account shows in oauth_accounts.
    oauth = await session.scalar(
        select(OAuthAccount).where(
            OAuthAccount.oauth_name == "google",
            OAuthAccount.account_id == google_sub,
        )
    )
    if oauth is None:
        session.add(OAuthAccount(
            id=uuid.uuid4(),
            oauth_name="google",
            account_id=google_sub,
            account_email=email,
            access_token="mobile",
            user_id=user.id,
        ))

    await session.commit()
    return {"access_token": _mint_jwt(user), "token_type": "bearer"}
