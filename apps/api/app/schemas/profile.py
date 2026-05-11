"""Pydantic schemas for reader profiles."""
from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel, Field

from app.models.profile import ProfileKind


class ProfileRead(BaseModel):
    id: uuid.UUID
    name: str
    avatar_seed: str
    kind: ProfileKind
    is_default: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ProfileCreate(BaseModel):
    name: str = Field(min_length=1, max_length=60)
    # Child profiles always run with family_safe_mode forced on. Parents can
    # still flip the family-safe toggle for adult profiles via /users/me.
    kind: ProfileKind = ProfileKind.adult
    avatar_seed: str = Field(default="lumi", min_length=1, max_length=32)


class ProfileUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=60)
    kind: ProfileKind | None = None
    avatar_seed: str | None = Field(default=None, min_length=1, max_length=32)
