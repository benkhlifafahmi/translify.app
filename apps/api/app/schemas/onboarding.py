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

    Two possible terminal states from the same endpoint:

    * **New email** — we create the account and return an ``access_token``;
      the user is logged in instantly and continues to the topic picker.
    * **Existing email** — we return ``user_id=None``, ``access_token=None``,
      ``magic_link_sent=True``. The UI shows a "check your inbox" message
      and the visitor signs in by tapping the link in the email. We don't
      prompt for a password here because /join-created accounts have an
      unguessable one the user has never seen; users who *did* set a
      password via /forgot-password can use the password fallback on
      /login.
    """
    user_id: uuid.UUID | None = None
    is_new_user: bool
    access_token: str | None = None
    token_type: str = "bearer"
    magic_link_sent: bool = False
