"""Pydantic schemas for auth."""
from __future__ import annotations

import uuid

from fastapi_users import schemas


class UserRead(schemas.BaseUser[uuid.UUID]):
    display_name: str | None = None
    preferred_language: str = "en"
    family_safe_mode: bool = False
    # Currently-selected reader profile. NULL after fresh signup; the
    # /profiles endpoint backfills + resolves to the default profile.
    active_profile_id: uuid.UUID | None = None


class UserCreate(schemas.BaseUserCreate):
    display_name: str | None = None
    preferred_language: str = "en"


class UserUpdate(schemas.BaseUserUpdate):
    display_name: str | None = None
    preferred_language: str | None = None
    family_safe_mode: bool | None = None
