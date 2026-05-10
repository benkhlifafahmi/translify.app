"""Pydantic schemas for the Highlight API."""
from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.models.highlight import HighlightColor


class HighlightRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    book_id: uuid.UUID
    page: int
    text: str
    color: HighlightColor
    note: str | None
    ai_question: str | None
    ai_answer: str | None
    position_cfi: str | None
    created_at: datetime
    updated_at: datetime


class HighlightCreate(BaseModel):
    page: int = Field(ge=1)
    text: str = Field(min_length=1, max_length=10_000)
    color: HighlightColor = HighlightColor.yellow
    note: str | None = Field(default=None, max_length=10_000)
    # EPUB-only: optional CFI locator for inline rendering.
    position_cfi: str | None = Field(default=None, max_length=2_000)


class HighlightUpdate(BaseModel):
    note: str | None = Field(default=None, max_length=10_000)
    color: HighlightColor | None = None


class AskAiRequest(BaseModel):
    # If omitted, defaults to "Explain this passage." server-side.
    question: str | None = Field(default=None, max_length=2_000)


class AskAiResponse(BaseModel):
    highlight: HighlightRead
