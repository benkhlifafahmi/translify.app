"""Pydantic schemas for auth."""
from __future__ import annotations

import uuid
from datetime import datetime

from fastapi_users import schemas


class UserRead(schemas.BaseUser[uuid.UUID]):
    display_name: str | None = None
    preferred_language: str = "en"
    family_safe_mode: bool = False
    # Currently-selected reader profile. NULL after fresh signup; the
    # /profiles endpoint backfills + resolves to the default profile.
    active_profile_id: uuid.UUID | None = None
    # Anonymous (ghost) accounts gate cost-bearing writes — see
    # ``app.auth.gate.require_non_anonymous``. Surfacing the flag here lets
    # the frontend skip features that would otherwise round-trip a 402.
    is_anonymous: bool = False
    # Social-layer fields: handle, bio, avatar, public profile flag. The
    # handle is null until the user claims one via /settings/profile.
    username: str | None = None
    bio: str | None = None
    avatar_url: str | None = None
    profile_public: bool = True
    created_at: datetime | None = None


class UserCreate(schemas.BaseUserCreate):
    display_name: str | None = None
    preferred_language: str = "en"


class UserUpdate(schemas.BaseUserUpdate):
    display_name: str | None = None
    preferred_language: str | None = None
    family_safe_mode: bool | None = None
