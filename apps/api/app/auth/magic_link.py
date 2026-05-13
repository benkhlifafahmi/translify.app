"""Magic-link tokens — short-lived JWTs that exchange for a session.

Used by the /join silent-signup flow: when a visitor types their email we
create the account, return a session JWT to the browser *and* email them a
magic-link URL. The magic link lets them return to their library from
another device (or after clearing localStorage) without remembering a
password.

The token payload is intentionally tiny — just the user id and an expiry —
so it fits comfortably in a URL. Verification compares against the JWT
secret shared by the rest of the auth backend.
"""
from __future__ import annotations

import time
import uuid

import jwt

from app.config import settings

_ALG = "HS256"
_AUDIENCE = "magic-link"
DEFAULT_TTL_SECONDS = 60 * 30  # 30 minutes


class MagicLinkError(Exception):
    """Raised when a magic-link token is invalid, expired, or wrong audience."""


def issue(user_id: uuid.UUID, *, ttl_seconds: int = DEFAULT_TTL_SECONDS) -> str:
    """Mint a magic-link token bound to ``user_id``."""
    now = int(time.time())
    payload = {
        "sub": str(user_id),
        "aud": _AUDIENCE,
        "iat": now,
        "exp": now + ttl_seconds,
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm=_ALG)


def verify(token: str) -> uuid.UUID:
    """Return the user id encoded in the token, or raise MagicLinkError."""
    try:
        payload = jwt.decode(
            token, settings.jwt_secret, algorithms=[_ALG], audience=_AUDIENCE
        )
    except jwt.ExpiredSignatureError as exc:
        raise MagicLinkError("The magic link has expired — request a new one.") from exc
    except jwt.InvalidTokenError as exc:
        raise MagicLinkError("This magic link is invalid.") from exc

    sub = payload.get("sub")
    if not sub:
        raise MagicLinkError("Magic link token is missing its subject.")
    try:
        return uuid.UUID(str(sub))
    except (ValueError, TypeError) as exc:
        raise MagicLinkError("Magic link token has an unreadable subject.") from exc
