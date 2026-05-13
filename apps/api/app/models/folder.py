"""Library folders — user-owned shelves a book can be filed under.

Each folder belongs to one user; each book belongs to at most one folder
(``Book.folder_id`` is nullable — NULL means the book is on the "Unsorted"
shelf at the top of the library). Folders carry per-user visual identity:
a palette colour, an emoji, an optional uploaded cover image — so the
library actually feels like *the user's* library, not a generic list.
"""
from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base


class Folder(Base):
    __tablename__ = "folders"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    name: Mapped[str] = mapped_column(String(80), nullable=False)
    # One of a small set of palette tokens — the frontend maps these to
    # gradient stops so the look stays coherent across folders. Free-form
    # short string (e.g. "saffron", "sage", "plum", "coral", "ink") rather
    # than an enum so additions don't need migrations.
    color: Mapped[str] = mapped_column(String(24), nullable=False, default="saffron")
    # One emoji or short pictogram. Doubles as the folder's icon when no
    # cover image is set. Capped to keep the row compact.
    emoji: Mapped[str] = mapped_column(String(8), nullable=False, default="📚")
    # Optional uploaded picture for the folder cover — same MinIO bucket as
    # books, key prefix ``folder-covers/``. Null when the user is happy with
    # the emoji+colour treatment.
    cover_image_key: Mapped[str | None] = mapped_column(String(500), nullable=True)
    # Ordering on the library page. Recomputed on reorder; lower = earlier.
    position: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
