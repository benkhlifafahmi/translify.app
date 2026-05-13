"""Pydantic schemas for the Book API."""
from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.models.book import BookFormat, BookStatus


class BookRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    title: str
    author: str | None
    source_language: str | None
    format: BookFormat
    file_size_bytes: int
    page_count: int | None
    status: BookStatus
    error_message: str | None
    is_seed: bool = False
    seed_slug: str | None = None
    folder_id: uuid.UUID | None = None
    created_at: datetime
    updated_at: datetime


class BookUpdate(BaseModel):
    title: str | None = Field(default=None, max_length=500)
    author: str | None = Field(default=None, max_length=500)
    source_language: str | None = Field(default=None, max_length=8)


class UploadUrlRequest(BaseModel):
    filename: str = Field(min_length=1, max_length=500)
    content_type: str = Field(min_length=1, max_length=200)
    size_bytes: int = Field(gt=0, le=500 * 1024 * 1024)  # 500 MB cap


class UploadUrlResponse(BaseModel):
    upload_id: str
    upload_url: str
    file_key: str
    format: BookFormat
    expires_in_seconds: int


class FinalizeUploadRequest(BaseModel):
    upload_id: str
    title: str | None = Field(default=None, max_length=500)
    author: str | None = Field(default=None, max_length=500)
    source_language: str | None = Field(default=None, max_length=8)
