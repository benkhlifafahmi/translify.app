"""Pydantic schemas for library folders."""
from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class FolderRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    color: str
    emoji: str
    cover_image_key: str | None
    position: int
    # Browser-fetchable presigned URL for ``cover_image_key`` — populated by
    # the route, not the model. None when no cover is set.
    cover_url: str | None = None
    book_count: int = 0
    created_at: datetime
    updated_at: datetime


class FolderCreate(BaseModel):
    name: str = Field(min_length=1, max_length=80)
    color: str = Field(default="saffron", min_length=1, max_length=24)
    emoji: str = Field(default="📚", min_length=1, max_length=8)


class FolderUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=80)
    color: str | None = Field(default=None, min_length=1, max_length=24)
    emoji: str | None = Field(default=None, min_length=1, max_length=8)
    # Set to empty string ("") to clear the cover and fall back to the
    # emoji+colour treatment. ``None`` leaves the existing key untouched.
    cover_image_key: str | None = Field(default=None, max_length=500)


class FolderReorderItem(BaseModel):
    id: uuid.UUID
    position: int = Field(ge=0)


class FolderReorderRequest(BaseModel):
    items: list[FolderReorderItem] = Field(min_length=1, max_length=200)


class FolderCoverUrlRequest(BaseModel):
    content_type: str = Field(min_length=1, max_length=100)
    size_bytes: int = Field(gt=0, le=5 * 1024 * 1024)  # 5 MB cap on cover art


class FolderCoverUrlResponse(BaseModel):
    upload_url: str
    file_key: str
    expires_in_seconds: int


class BookFolderAssign(BaseModel):
    """Body for ``PATCH /books/{id}/folder``. ``folder_id=None`` returns the
    book to the unsorted shelf."""
    folder_id: uuid.UUID | None = None
