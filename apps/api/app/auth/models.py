"""User model — extends FastAPI-Users SQLAlchemy base."""
from __future__ import annotations

import uuid
from datetime import datetime

from fastapi_users.db import SQLAlchemyBaseUserTableUUID
from sqlalchemy import Boolean, DateTime, ForeignKey, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base


class User(SQLAlchemyBaseUserTableUUID, Base):
    __tablename__ = "users"

    display_name: Mapped[str | None] = mapped_column(String(120), nullable=True)
    preferred_language: Mapped[str] = mapped_column(String(8), default="en", nullable=False)
    # Family plan: enables a stricter content posture across chat / translation /
    # quizzes. Gated by ``plans.PlanQuota.family_safe_mode`` — toggling has no
    # effect unless the active plan exposes the feature.
    family_safe_mode: Mapped[bool] = mapped_column(
        Boolean, default=False, nullable=False, server_default="false"
    )
    # Currently-selected reader profile. Nullable: NULL means "use the default
    # profile" (every user has one, backfilled at migration time). We avoid a
    # NOT NULL + FK loop by leaving this nullable and resolving server-side.
    active_profile_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("reader_profiles.id", ondelete="SET NULL"),
        nullable=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    # Inherits: id (UUID), email, hashed_password, is_active, is_superuser, is_verified
