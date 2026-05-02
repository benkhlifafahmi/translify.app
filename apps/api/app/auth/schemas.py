"""Pydantic schemas for auth."""
from __future__ import annotations

import uuid

from fastapi_users import schemas


class UserRead(schemas.BaseUser[uuid.UUID]):
    display_name: str | None = None
    preferred_language: str = "en"


class UserCreate(schemas.BaseUserCreate):
    display_name: str | None = None
    preferred_language: str = "en"


class UserUpdate(schemas.BaseUserUpdate):
    display_name: str | None = None
    preferred_language: str | None = None
