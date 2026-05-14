"""Pydantic schemas for reading-progress endpoints."""
from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class BookProgressRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    current_page: int | None = None
    current_cfi: str | None = None
    reading_time_seconds: int = 0
    last_read_at: datetime
    updated_at: datetime


class BookProgressListItem(BaseModel):
    """Row in the ``/books/progress`` list — used to render the "Continue
    reading" shelf without N+1 round trips."""

    model_config = ConfigDict(from_attributes=True)

    book_id: uuid.UUID
    current_page: int | None = None
    current_cfi: str | None = None
    reading_time_seconds: int = 0
    last_read_at: datetime


class BookProgressUpdate(BaseModel):
    """Client may report any subset; the server stamps last_read_at on write."""

    current_page: int | None = Field(default=None, ge=1)
    current_cfi: str | None = Field(default=None, max_length=4000)
    # Cumulative reading-time delta in seconds since the last save. Server
    # adds it to ``reading_time_seconds``; clients send 0 if they don't track.
    reading_time_delta_seconds: int = Field(default=0, ge=0, le=24 * 60 * 60)
