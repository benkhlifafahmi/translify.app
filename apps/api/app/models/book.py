"""Book — uploaded source file (PDF/EPUB)."""
from __future__ import annotations

import enum
import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base

if TYPE_CHECKING:
    from app.models.chunk import Chunk
    from app.models.translation import Translation


class BookStatus(str, enum.Enum):
    uploaded = "uploaded"      # file in storage, not yet processed
    processing = "processing"  # parse + chunk + embed in flight
    ready = "ready"            # available for chat / translate / quiz
    failed = "failed"


class BookFormat(str, enum.Enum):
    pdf = "pdf"
    epub = "epub"
    # Media formats — transcribed into a timestamped transcript that flows
    # through the same chunk/embed pipeline as documents. ``youtube`` has no
    # stored file (only ``source_url``); ``audio``/``video`` are uploaded files
    # (reserved for the v2 upload path — captions-only YouTube ships first).
    youtube = "youtube"
    audio = "audio"
    video = "video"

    @property
    def is_media(self) -> bool:
        return self in (BookFormat.youtube, BookFormat.audio, BookFormat.video)


class Book(Base):
    __tablename__ = "books"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    title: Mapped[str] = mapped_column(String(500), nullable=False)
    author: Mapped[str | None] = mapped_column(String(500), nullable=True)
    source_language: Mapped[str | None] = mapped_column(String(8), nullable=True)
    format: Mapped[BookFormat] = mapped_column(Enum(BookFormat, name="book_format"), nullable=False)

    # Nullable for media books sourced from a remote URL (e.g. a YouTube video
    # ingested from its captions) — those have no stored file, just a
    # ``source_url`` + a transcript. Document uploads always set both.
    file_key: Mapped[str | None] = mapped_column(String(500), nullable=True)
    file_size_bytes: Mapped[int | None] = mapped_column(Integer, nullable=True)
    page_count: Mapped[int | None] = mapped_column(Integer, nullable=True)

    # Media-only fields. ``source_url`` is the canonical watch URL (YouTube);
    # ``duration_seconds`` is the transcript length, the media analogue of
    # ``page_count``. Both NULL for document uploads.
    source_url: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    duration_seconds: Mapped[int | None] = mapped_column(Integer, nullable=True)

    status: Mapped[BookStatus] = mapped_column(
        Enum(BookStatus, name="book_status"),
        nullable=False,
        default=BookStatus.uploaded,
        index=True,
    )
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Book-level AI summary, generated once at ingest end. Used as the
    # primary context for quiz generation (vs. random chunk sampling) so
    # quizzes test the book's actual ideas rather than localized passages.
    summary: Mapped[str | None] = mapped_column(Text, nullable=True)

    # True when this book is a system-owned seed visible to every user. Seed
    # rows are filtered into a user's library alongside their own uploads; per-
    # user state (chats, quizzes, highlights) still keys on (user_id, book_id)
    # — only the source content + chunks are shared. Free readers can browse
    # the first ``Plan.free.seed_book_page_cap`` pages of any seed before the
    # upgrade modal fires.
    is_seed: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False, server_default="false", index=True,
    )
    # Stable identifier for a seed book across deploys — referenced by the
    # /join flow when the visitor picks a sample. Matches `slug` in
    # ``app/seeds/catalog.py``. Unique across seed rows, NULL for user uploads.
    seed_slug: Mapped[str | None] = mapped_column(String(64), nullable=True, index=True)

    # Optional folder this book is filed under (NULL = "Unsorted" shelf at
    # the top of the library). Per-user — the FK target's CASCADE on user
    # delete already covers cleanup; folder delete sets this to NULL so the
    # books drop back to the unsorted shelf instead of disappearing.
    folder_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("folders.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    chunks: Mapped[list["Chunk"]] = relationship(
        back_populates="book", cascade="all, delete-orphan", passive_deletes=True
    )
    translations: Mapped[list["Translation"]] = relationship(
        back_populates="book", cascade="all, delete-orphan", passive_deletes=True
    )
