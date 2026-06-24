"""WorkspaceShare — a public, view-only share of a (media) book's workspace.

One share per book. Anyone with the slug can view the video + study guide
read-only and "Save a copy" into their own library. v1 is media (YouTube)
courses only — enforced at the route layer.
"""
from __future__ import annotations

import secrets
import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base


def _new_share_slug() -> str:
    # ~11 URL-safe chars — unguessable, like the social Post share slug.
    return secrets.token_urlsafe(8)


class WorkspaceShare(Base):
    __tablename__ = "workspace_shares"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    # One share per book — unique so re-sharing is idempotent.
    book_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("books.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
        index=True,
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    slug: Mapped[str] = mapped_column(
        String(24), nullable=False, unique=True, default=_new_share_slug, index=True
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
