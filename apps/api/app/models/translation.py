"""Translation — a target-language rendering of a book."""
from __future__ import annotations

import enum
import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, Enum, ForeignKey, Integer, String, Text, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base

if TYPE_CHECKING:
    from app.models.book import Book


class TranslationStatus(str, enum.Enum):
    queued = "queued"
    in_progress = "in_progress"
    ready = "ready"
    failed = "failed"


class TranslationProvider(str, enum.Enum):
    deepl = "deepl"
    anthropic = "anthropic"


class Translation(Base):
    __tablename__ = "translations"
    __table_args__ = (
        UniqueConstraint("book_id", "target_language", name="uq_translation_book_lang"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    book_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("books.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    target_language: Mapped[str] = mapped_column(String(8), nullable=False)
    provider: Mapped[TranslationProvider] = mapped_column(
        Enum(TranslationProvider, name="translation_provider"), nullable=False
    )

    status: Mapped[TranslationStatus] = mapped_column(
        Enum(TranslationStatus, name="translation_status"),
        nullable=False,
        default=TranslationStatus.queued,
        index=True,
    )
    progress_pct: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    output_file_key: Mapped[str | None] = mapped_column(String(500), nullable=True)
    output_format: Mapped[str | None] = mapped_column(String(16), nullable=True)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)

    chars_translated: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    book: Mapped["Book"] = relationship(back_populates="translations")
