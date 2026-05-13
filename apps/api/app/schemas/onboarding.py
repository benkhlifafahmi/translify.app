"""Pydantic schemas for onboarding-lead tracking."""
from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel, EmailStr, Field

from app.models.onboarding import OnboardingStep


class OnboardingLeadUpsert(BaseModel):
    """Body for ``POST /onboarding/lead``.

    Unauthenticated — anyone walking through /join calls this. Email is the
    natural key; the row is upserted on every step transition.
    """
    email: EmailStr
    step: OnboardingStep
    topics: list[str] | None = Field(default=None, max_length=20)
    chosen_book_id: str | None = Field(default=None, max_length=64)
    preferred_language: str | None = Field(default=None, min_length=2, max_length=8)
    referrer: str | None = Field(default=None, max_length=512)


class OnboardingLeadRead(BaseModel):
    id: uuid.UUID
    email: str
    step: OnboardingStep
    topics: list[str]
    chosen_book_id: str | None
    completed: bool
    completed_at: datetime | None
    created_at: datetime
    updated_at: datetime
    last_seen_at: datetime

    model_config = {"from_attributes": True}
