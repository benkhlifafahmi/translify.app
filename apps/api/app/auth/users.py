"""FastAPI-Users wiring: user manager, JWT strategy, dependency factory."""
from __future__ import annotations

import logging
import uuid
from collections.abc import AsyncGenerator
from typing import Optional

from fastapi import Depends, Request
from fastapi_users import BaseUserManager, FastAPIUsers, UUIDIDMixin
from fastapi_users.authentication import (
    AuthenticationBackend,
    BearerTransport,
    JWTStrategy,
)
from fastapi_users.db import SQLAlchemyUserDatabase
from httpx_oauth.clients.google import GoogleOAuth2
from httpx_oauth.exceptions import GetIdEmailError, GetProfileError
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.models import OAuthAccount, User
from app.config import settings
from app.db import get_async_session
from app.emails import client as email_client
from app.emails import templates as email_templates

log = logging.getLogger(__name__)


class _GoogleOAuth2(GoogleOAuth2):
    """GoogleOAuth2 with OIDC userinfo endpoint + error logging."""

    async def get_profile(self, token: str) -> dict:
        async with self.get_httpx_client() as client:
            response = await client.get(
                "https://openidconnect.googleapis.com/v1/userinfo",
                headers={"Authorization": f"Bearer {token}"},
            )
        if response.status_code != 200:
            log.error(
                "Google OIDC userinfo HTTP %d: %s",
                response.status_code,
                response.text[:500],
            )
            raise GetProfileError(response=response)
        return response.json()

    async def get_id_email(self, token: str) -> tuple[str, str | None]:
        try:
            profile = await self.get_profile(token)
        except GetProfileError as exc:
            raise GetIdEmailError(response=exc.response) from exc
        # OIDC userinfo returns "sub" (not "id" as in v2 endpoint)
        user_id = profile.get("sub") or profile.get("id")
        return str(user_id), profile.get("email")


google_oauth_client = _GoogleOAuth2(
    client_id=settings.google_client_id,
    client_secret=settings.google_client_secret,
    scopes=["openid", "email", "profile"],
)


async def get_user_db(
    session: AsyncSession = Depends(get_async_session),
) -> AsyncGenerator[SQLAlchemyUserDatabase, None]:
    yield SQLAlchemyUserDatabase(session, User, OAuthAccount)


def _verify_url(token: str) -> str:
    return f"{settings.web_public_url}/verify-email?token={token}"


def _reset_url(token: str) -> str:
    return f"{settings.web_public_url}/reset-password?token={token}"


class UserManager(UUIDIDMixin, BaseUserManager[User, uuid.UUID]):
    reset_password_token_secret = settings.jwt_secret
    verification_token_secret = settings.jwt_secret

    async def on_after_register(self, user: User, request: Optional[Request] = None) -> None:
        # Trigger the verification flow — that hook delivers the actual email
        # (we get the token there, not here).
        try:
            await self.request_verify(user, request)
        except Exception:
            log.exception("Failed to request verification for %s", user.email)

    async def on_after_forgot_password(
        self, user: User, token: str, request: Optional[Request] = None
    ) -> None:
        subject, html, text = email_templates.password_reset(
            name=user.display_name,
            reset_url=_reset_url(token),
        )
        await email_client.send(
            to=user.email,
            subject=subject,
            html=html,
            text=text,
            tag="password-reset",
        )

    async def on_after_request_verify(
        self, user: User, token: str, request: Optional[Request] = None
    ) -> None:
        subject, html, text = email_templates.welcome_verify(
            name=user.display_name,
            verify_url=_verify_url(token),
        )
        await email_client.send(
            to=user.email,
            subject=subject,
            html=html,
            text=text,
            tag="welcome-verify",
        )


async def get_user_manager(
    user_db: SQLAlchemyUserDatabase = Depends(get_user_db),
) -> AsyncGenerator[UserManager, None]:
    yield UserManager(user_db)


bearer_transport = BearerTransport(tokenUrl="auth/jwt/login")


def get_jwt_strategy() -> JWTStrategy:
    return JWTStrategy(secret=settings.jwt_secret, lifetime_seconds=settings.jwt_lifetime_seconds)


auth_backend = AuthenticationBackend(
    name="jwt",
    transport=bearer_transport,
    get_strategy=get_jwt_strategy,
)


fastapi_users = FastAPIUsers[User, uuid.UUID](get_user_manager, [auth_backend])

current_active_user = fastapi_users.current_user(active=True)
current_verified_user = fastapi_users.current_user(active=True, verified=True)
# Optional auth — returns the User if a valid JWT is present, else None.
# Used by endpoints that can render for anonymous visitors but enrich their
# response when a session exists (e.g. /seeds returns clone_id only for
# authenticated callers).
current_optional_user = fastapi_users.current_user(active=True, optional=True)
