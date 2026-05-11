"""Reader profiles — Family-plan feature for multiple readers under one account.

Profiles are a *personalization* layer, not a data-isolation layer. The
library (books) is shared at the account level — that's the whole point of a
family plan. What profiles do separate is:

  * which reader is greeted in the UI;
  * whether ``family_safe_mode`` is forced on (child profiles always; adult
    profiles inherit the account-level toggle);
  * future: per-profile XP/streaks, reading history.

Quota enforcement (``PlanQuota.profiles``) is checked at create time.
"""
from __future__ import annotations

import enum
import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, String, Enum as SAEnum, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base


class ProfileKind(str, enum.Enum):
    adult = "adult"
    child = "child"


class ReaderProfile(Base):
    __tablename__ = "reader_profiles"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    name: Mapped[str] = mapped_column(String(60), nullable=False)
    # avatar_seed is just a short string — the frontend uses it to deterministic-
    # ally pick an emoji/illustration from a fixed palette. Storing the seed
    # (not the emoji) keeps the look swappable without a data migration.
    avatar_seed: Mapped[str] = mapped_column(String(32), nullable=False, default="lumi")
    kind: Mapped[ProfileKind] = mapped_column(
        SAEnum(ProfileKind, name="profilekind"),
        nullable=False,
        default=ProfileKind.adult,
    )
    # The "default" profile is auto-selected at login if no other is active.
    # Every user has exactly one — backfilled by migration for existing rows.
    is_default: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False, server_default="false"
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
