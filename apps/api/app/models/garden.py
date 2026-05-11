"""Garden + GardenEvent + GardenTendingAttempt — reading-garden gamification.

One Garden per (user, book), created lazily on the first reading event.
Events are immutable; the garden row is denormalized state recomputed on every
event write so list/detail reads are a single SELECT.
"""
from __future__ import annotations

import enum
import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, Integer, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base


class GardenSpecies(str, enum.Enum):
    ficus = "ficus"
    helianthus = "helianthus"
    lavandula = "lavandula"
    monstera = "monstera"


class GardenHealth(str, enum.Enum):
    thriving = "thriving"
    budding = "budding"
    wilting = "wilting"
    dying = "dying"


class GardenEventKind(str, enum.Enum):
    read = "read"
    quiz = "quiz"
    water = "water"
    skip = "skip"
    translate = "translate"
    tend = "tend"


class Garden(Base):
    __tablename__ = "gardens"
    __table_args__ = (UniqueConstraint("user_id", "book_id", name="uq_gardens_user_book"),)

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    book_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("books.id", ondelete="CASCADE"), nullable=False, index=True
    )

    species: Mapped[GardenSpecies] = mapped_column(
        Enum(GardenSpecies, name="garden_species"),
        nullable=False, default=GardenSpecies.ficus, server_default=GardenSpecies.ficus.value,
    )
    farmer: Mapped[dict] = mapped_column(JSONB, nullable=False)

    stage: Mapped[int] = mapped_column(Integer, nullable=False, default=0, server_default="0")
    growth_percent: Mapped[int] = mapped_column(Integer, nullable=False, default=0, server_default="0")
    vitality: Mapped[int] = mapped_column(Integer, nullable=False, default=5, server_default="5")
    vitality_capacity: Mapped[int] = mapped_column(Integer, nullable=False, default=5, server_default="5")
    health: Mapped[GardenHealth] = mapped_column(
        Enum(GardenHealth, name="garden_health"),
        nullable=False, default=GardenHealth.thriving, server_default=GardenHealth.thriving.value,
    )

    pages_read: Mapped[int] = mapped_column(Integer, nullable=False, default=0, server_default="0")
    quizzes_answered: Mapped[int] = mapped_column(Integer, nullable=False, default=0, server_default="0")
    quiz_correct_total: Mapped[int] = mapped_column(Integer, nullable=False, default=0, server_default="0")
    quiz_attempted_total: Mapped[int] = mapped_column(Integer, nullable=False, default=0, server_default="0")
    new_leaves: Mapped[int] = mapped_column(Integer, nullable=False, default=0, server_default="0")
    streak_days: Mapped[int] = mapped_column(Integer, nullable=False, default=0, server_default="0")
    best_streak_days: Mapped[int] = mapped_column(Integer, nullable=False, default=0, server_default="0")

    # Cached pack of weekly-tending questions. Replaced on each new tending,
    # cleared after submission so the next week regenerates.
    current_tending: Mapped[list | None] = mapped_column(JSONB, nullable=True)

    started_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    last_event_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    last_tended_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    last_decay_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    weekly_tending_due_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, index=True
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    events: Mapped[list["GardenEvent"]] = relationship(
        back_populates="garden", cascade="all, delete-orphan", passive_deletes=True
    )


class GardenEvent(Base):
    __tablename__ = "garden_events"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    garden_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("gardens.id", ondelete="CASCADE"), nullable=False, index=True
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    kind: Mapped[GardenEventKind] = mapped_column(
        Enum(GardenEventKind, name="garden_event_kind"), nullable=False
    )
    payload: Mapped[dict] = mapped_column(JSONB, nullable=False, default=dict)
    growth_delta: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    vitality_delta: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False, index=True
    )

    garden: Mapped["Garden"] = relationship(back_populates="events")


class GardenTendingAttempt(Base):
    __tablename__ = "garden_tending_attempts"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    garden_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("gardens.id", ondelete="CASCADE"), nullable=False, index=True
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    score: Mapped[int] = mapped_column(Integer, nullable=False)
    total: Mapped[int] = mapped_column(Integer, nullable=False)
    passed: Mapped[bool] = mapped_column(Boolean, nullable=False)
    growth_gained: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    vitality_restored: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    answers: Mapped[list] = mapped_column(JSONB, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False, index=True
    )
