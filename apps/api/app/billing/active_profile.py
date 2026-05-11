"""Resolve the user's currently-active reader profile.

Every user has at least one profile (the default, backfilled at migration
time + recreated lazily in ``profiles._ensure_default`` if needed). This helper
gives the rest of the app one obvious way to ask "who's reading right now?"
without each route re-implementing the same fallback chain.

Resolution order:
  1. ``user.active_profile_id`` if it points at a profile the user still owns.
  2. The user's ``is_default=true`` profile.
  3. Any profile owned by the user (defensive — shouldn't happen).
  4. ``None`` (also defensive — pre-migration callers).
"""
from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.models import User
from app.models.profile import ReaderProfile


async def resolve_active_profile(
    user: User, session: AsyncSession
) -> ReaderProfile | None:
    if user.active_profile_id is not None:
        result = await session.execute(
            select(ReaderProfile).where(
                ReaderProfile.id == user.active_profile_id,
                ReaderProfile.user_id == user.id,
            )
        )
        profile = result.scalar_one_or_none()
        if profile is not None:
            return profile

    # Fallback: the default profile.
    result = await session.execute(
        select(ReaderProfile)
        .where(ReaderProfile.user_id == user.id)
        .order_by(ReaderProfile.is_default.desc(), ReaderProfile.created_at.asc())
        .limit(1)
    )
    return result.scalar_one_or_none()
