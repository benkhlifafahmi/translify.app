"""Pydantic schemas for translation endpoints."""
from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.models.translation import TranslationProvider, TranslationStatus


class TranslationRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    book_id: uuid.UUID
    target_language: str
    provider: TranslationProvider
    status: TranslationStatus
    progress_pct: int
    output_format: str | None
    error_message: str | None
    created_at: datetime
    updated_at: datetime
    completed_at: datetime | None


class TranslationCreateRequest(BaseModel):
    target_language: str = Field(min_length=2, max_length=8)


class FileUrlResponse(BaseModel):
    url: str
    expires_in_seconds: int
