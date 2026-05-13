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


# ─── Silent-signup (email-only) ─────────────────────────────────────────────


class StartSessionRequest(BaseModel):
    """Body for ``POST /onboarding/start-session``."""
    email: EmailStr
    topics: list[str] | None = Field(default=None, max_length=20)
    preferred_language: str | None = Field(default=None, min_length=2, max_length=8)
    referrer: str | None = Field(default=None, max_length=512)


class StartSessionResponse(BaseModel):
    """What the browser uses to take action after start-session.

    For brand-new emails: ``access_token`` is populated and the user is
    logged in immediately — same JWT format the rest of the API uses.
    For known emails: ``access_token`` is ``null`` and ``magic_link_sent``
    is True — the user must click the email to log in (we never hand a JWT
    to whoever typed in someone else's address).
    """
    user_id: uuid.UUID
    is_new_user: bool
    access_token: str | None = None
    token_type: str = "bearer"
    magic_link_sent: bool = False
