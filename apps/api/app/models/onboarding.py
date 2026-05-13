"""Onboarding lead — captures email + progress from anonymous /join visitors.

Stored before a real account exists so we can re-engage drop-offs. A row is
upserted on every step the visitor reaches; when they finally complete signup
the row is linked to the new ``users.id`` and ``completed_at`` is stamped.
"""
from __future__ import annotations

import enum
import uuid
from datetime import datetime

from sqlalchemy import (
    Boolean,
    DateTime,
    Enum as SAEnum,
    ForeignKey,
    String,
    func,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base


class OnboardingStep(str, enum.Enum):
    email = "email"
    topics = "topics"
    shelf = "shelf"
    experience = "experience"
    signup = "signup"
    completed = "completed"


class OnboardingLead(Base):
    __tablename__ = "onboarding_leads"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    email: Mapped[str] = mapped_column(
        String(320), nullable=False, unique=True, index=True
    )
    step: Mapped[OnboardingStep] = mapped_column(
        SAEnum(OnboardingStep, name="onboardingstep"),
        nullable=False,
        default=OnboardingStep.email,
    )
    # Multi-select topic IDs the visitor picked, e.g. ["fiction", "self-help"].
    topics: Mapped[list[str]] = mapped_column(
        JSONB, nullable=False, default=list, server_default="[]"
    )
    # Frontend slug for the sample book they opened in the experience step.
    chosen_book_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    # True only once signup actually completes — drives the dunning logic in
    # "lapsed lead" emails (don't pester users who finished).
    completed: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False, server_default="false"
    )
    completed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    # Linked when the lead actually converts to a real user. Nullable because
    # the lead row exists *before* the user row does.
    user_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    # Lightweight attribution. Truncated to keep the row small.
    referrer: Mapped[str | None] = mapped_column(String(512), nullable=True)
    user_agent: Mapped[str | None] = mapped_column(String(512), nullable=True)
    preferred_language: Mapped[str | None] = mapped_column(String(8), nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
    last_seen_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
