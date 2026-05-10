"""Highlight — a user-saved passage in a book, with optional note + AI answer."""
from __future__ import annotations

import enum
import uuid
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, Integer, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base


class HighlightColor(str, enum.Enum):
    yellow = "yellow"
    green = "green"
    blue = "blue"
    pink = "pink"


class Highlight(Base):
    __tablename__ = "highlights"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    book_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("books.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    page: Mapped[int] = mapped_column(Integer, nullable=False)
    text: Mapped[str] = mapped_column(Text, nullable=False)
    color: Mapped[HighlightColor] = mapped_column(
        Enum(HighlightColor, name="highlight_color"),
        nullable=False,
        default=HighlightColor.yellow,
        server_default=HighlightColor.yellow.value,
    )

    note: Mapped[str | None] = mapped_column(Text, nullable=True)
    ai_question: Mapped[str | None] = mapped_column(Text, nullable=True)
    ai_answer: Mapped[str | None] = mapped_column(Text, nullable=True)

    # EPUB-only: CFI locator for inline highlight rendering. PDFs use
    # (page, text) substring matching; EPUBs need CFI for precise rendering
    # across the spine.
    position_cfi: Mapped[str | None] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False, index=True
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )
