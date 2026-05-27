"""Social layer: Post (polymorphic), Follow, Milestone.

A Post is the atomic unit of the social timeline. Six types share one row:

- word        : a single word + its translation. Vocab card.
- sentence    : one sentence (source + target). Default highlight share.
- passage     : a longer passage, capped at 500 chars source-side.
- milestone   : auto-generated achievement (streak, finished book, quiz perfect).
- list        : a curated stack of books.
- reflection  : pure user prose about a book (no book text quoted).

Per-type fields live in ``payload`` (JSONB) so the wire shape can evolve
without migrations. Stable cross-type fields (book, languages, note,
visibility, slug) are columns so they index well.

Copyright posture for V1:
- ``word`` and ``milestone`` and ``list`` and ``reflection`` carry zero
  third-party text and are always shareable.
- ``sentence`` capped at 280 chars source-side.
- ``passage`` capped at 500 chars source-side.
- Per-user / per-book ceiling of 10 public quoted posts (sentence + passage)
  is enforced at the route level, not modelled here.
"""
from __future__ import annotations

import enum
import secrets
import uuid
from datetime import datetime

from sqlalchemy import (
    Boolean,
    DateTime,
    Enum,
    ForeignKey,
    Index,
    String,
    UniqueConstraint,
    func,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base


class PostType(str, enum.Enum):
    word = "word"
    sentence = "sentence"
    passage = "passage"
    milestone = "milestone"
    list = "list"
    reflection = "reflection"


class PostVisibility(str, enum.Enum):
    public = "public"
    followers = "followers"  # reserved for V2 follow-graph filter
    private = "private"


def _new_share_slug() -> str:
    """11-char URL-safe slug. ~66 bits of entropy, collision-free at our scale."""
    return secrets.token_urlsafe(8)


class Post(Base):
    __tablename__ = "posts"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    type: Mapped[PostType] = mapped_column(
        Enum(PostType, name="post_type"), nullable=False, index=True
    )
    # Source content + type-specific data. Shape varies per type:
    #   word:       { source_word, target_word, pos?, pronunciation?, example? }
    #   sentence:   { source_text, target_text }
    #   passage:    { source_text, target_text, source_page? }
    #   milestone:  { kind, label, value, icon }   e.g. kind=streak, value=30
    #   list:       { title, description?, book_ids: [uuid, ...] }
    #   reflection: { text }                       user's own prose
    payload: Mapped[dict] = mapped_column(JSONB, nullable=False)

    # Book of provenance (null for milestone/list/reflection that aren't tied
    # to a single book). CASCADE delete: if the user removes the book the
    # quoted posts go too.
    book_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("books.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )
    # Original highlight this was minted from, if applicable. Useful for
    # de-dup on the share toggle ("already posted").
    highlight_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("highlights.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    source_lang: Mapped[str | None] = mapped_column(String(8), nullable=True)
    target_lang: Mapped[str | None] = mapped_column(String(8), nullable=True)

    # User's commentary on the share. Plain text, capped at 280 chars at the
    # schema layer.
    note: Mapped[str | None] = mapped_column(String(280), nullable=True)

    visibility: Mapped[PostVisibility] = mapped_column(
        Enum(PostVisibility, name="post_visibility"),
        nullable=False,
        default=PostVisibility.public,
        server_default=PostVisibility.public.value,
        index=True,
    )

    # Stable URL slug. Generated once at insert; never reused on edit.
    share_slug: Mapped[str] = mapped_column(
        String(16), nullable=False, unique=True, default=_new_share_slug, index=True
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False, index=True
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    __table_args__ = (
        Index("ix_posts_user_created", "user_id", "created_at"),
        Index("ix_posts_visibility_created", "visibility", "created_at"),
    )


class Follow(Base):
    __tablename__ = "follows"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    follower_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    followed_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    __table_args__ = (
        UniqueConstraint("follower_id", "followed_id", name="uq_follows_pair"),
        Index("ix_follows_followed_created", "followed_id", "created_at"),
    )


class MilestoneKind(str, enum.Enum):
    """Auto-derived achievements. Adding new kinds doesn't require a migration
    because the underlying value is stored as a string in the column."""
    first_book_finished = "first_book_finished"
    book_finished = "book_finished"
    streak_7 = "streak_7"
    streak_30 = "streak_30"
    streak_100 = "streak_100"
    words_100 = "words_100"
    words_500 = "words_500"
    words_1000 = "words_1000"
    quiz_perfect = "quiz_perfect"
    garden_bloom = "garden_bloom"


class Milestone(Base):
    """Per-user achievement, auto-created when the underlying event fires.

    Lives separately from Post so we can:
      1) De-duplicate (one streak_7 per user, not one per share)
      2) Show the toast / notification even if the user never shares
      3) Backfill historical milestones without spamming the timeline
    """
    __tablename__ = "milestones"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    kind: Mapped[MilestoneKind] = mapped_column(
        Enum(MilestoneKind, name="milestone_kind"), nullable=False
    )
    # Free-form context per kind. E.g. book_finished: { book_id, book_title,
    # source_lang, target_lang }. streak_30: { days: 30 }. quiz_perfect:
    # { quiz_id, book_id, score, total }.
    context: Mapped[dict] = mapped_column(JSONB, nullable=False, default=dict)

    # Filled when the user opts in to share via the toast.
    shared_post_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("posts.id", ondelete="SET NULL"),
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False, index=True
    )

    __table_args__ = (
        # One-time milestones (streak_*, words_*, first_book_finished) dedup
        # at the route layer by checking (user_id, kind) before insert.
        # Per-target milestones (book_finished, quiz_perfect) dedup by
        # checking (user_id, kind, context->>'book_id'-or-similar). Keeping
        # the table constraint-free so both shapes work.
        Index("ix_milestones_user_kind", "user_id", "kind"),
    )
