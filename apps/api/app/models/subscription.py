"""Subscription + usage models — one row per user, even when on free tier.

We mirror the bits of Stripe state we need for routing and quota checks
(no need to round-trip to Stripe on every request). Stripe remains the
source of truth — webhooks reconcile this table.
"""
from __future__ import annotations

import enum
import uuid
from datetime import datetime

from sqlalchemy import (
    Boolean,
    DateTime,
    ForeignKey,
    Integer,
    String,
    UniqueConstraint,
    func,
)
from sqlalchemy.dialects.postgresql import ENUM as PgEnum
from sqlalchemy.dialects.postgresql import UUID as PgUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base


class SubscriptionStatus(str, enum.Enum):
    """Mirrors a subset of Stripe's subscription.status values.

    ``inactive`` is our own state for users who have never subscribed (no
    Stripe subscription object yet).
    """
    inactive = "inactive"
    trialing = "trialing"
    active = "active"
    past_due = "past_due"
    canceled = "canceled"
    unpaid = "unpaid"


class Subscription(Base):
    __tablename__ = "subscriptions"

    id: Mapped[uuid.UUID] = mapped_column(
        PgUUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        PgUUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
    )

    # Stripe identifiers — set when first subscribing.
    stripe_customer_id: Mapped[str | None] = mapped_column(String(64), nullable=True, index=True)
    stripe_subscription_id: Mapped[str | None] = mapped_column(String(64), nullable=True, index=True)

    # Current plan + status (mirrored from Stripe via webhook).
    plan: Mapped[str] = mapped_column(String(16), nullable=False, default="free")
    cycle: Mapped[str | None] = mapped_column(String(16), nullable=True)
    status: Mapped[SubscriptionStatus] = mapped_column(
        PgEnum(
            SubscriptionStatus,
            name="subscription_status",
            values_callable=lambda enum_cls: [e.value for e in enum_cls],
        ),
        nullable=False,
        default=SubscriptionStatus.inactive,
    )

    current_period_start: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    current_period_end: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    trial_end: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    cancel_at_period_end: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    canceled_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    usage: Mapped[UsageCounter | None] = relationship(
        "UsageCounter", back_populates="subscription", uselist=False, cascade="all, delete-orphan"
    )


class UsageCounter(Base):
    """Per-period usage counters. Reset on subscription anniversary.

    A row exists per subscription. The ``period_start`` field tracks which
    billing period this counter belongs to; when it changes, counters reset.
    """
    __tablename__ = "usage_counters"

    id: Mapped[uuid.UUID] = mapped_column(
        PgUUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    subscription_id: Mapped[uuid.UUID] = mapped_column(
        PgUUID(as_uuid=True),
        ForeignKey("subscriptions.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
    )

    period_start: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    pages_uploaded: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    quizzes_generated: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    subscription: Mapped[Subscription] = relationship("Subscription", back_populates="usage")

    __table_args__ = (UniqueConstraint("subscription_id", name="uq_usage_subscription"),)


class StripeEvent(Base):
    """Idempotency log — record processed Stripe webhook events.

    Stripe occasionally retries — the unique constraint on ``stripe_event_id``
    lets us no-op on dupes.
    """
    __tablename__ = "stripe_events"

    id: Mapped[uuid.UUID] = mapped_column(
        PgUUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    stripe_event_id: Mapped[str] = mapped_column(
        String(64), nullable=False, unique=True, index=True
    )
    event_type: Mapped[str] = mapped_column(String(64), nullable=False)
    received_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
