"""The system user that owns every seed book.

Books are normally per-user; seed books are an exception — they need a real
``user_id`` to satisfy the FK, but they aren't visible in any real person's
admin panel. We resolve "the system user" by a well-known email and create
it on demand. Its password is unusable (random + locked).
"""
from __future__ import annotations

import secrets
import uuid
from typing import cast

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.models import User

SYSTEM_USER_EMAIL = "system+seeds@translify.app"


async def get_or_create_system_user(session: AsyncSession) -> User:
    """Return the system user, creating it the first time we're called.

    The user is created as active + verified so seed rows have a valid FK,
    but its password is randomised and never used — no one logs in as this
    account.
    """
    result = await session.execute(
        select(User).where(User.email == SYSTEM_USER_EMAIL)
    )
    user = result.scalar_one_or_none()
    if user is not None:
        return user

    # Hash a long random secret; this account is non-login.
    from fastapi_users.password import PasswordHelper
    helper = PasswordHelper()
    hashed = helper.hash(secrets.token_urlsafe(48))

    user = User(
        id=uuid.uuid4(),
        email=SYSTEM_USER_EMAIL,
        hashed_password=hashed,
        is_active=False,         # cannot log in
        is_verified=True,        # FK invariants
        is_superuser=False,
        display_name="Translify Seed Library",
        preferred_language="en",
    )
    session.add(user)
    await session.flush()
    return cast(User, user)
