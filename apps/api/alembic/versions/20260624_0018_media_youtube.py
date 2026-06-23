"""media youtube — book media formats + chunk timestamps + transcription quota

Revision ID: 0018
Revises: 0017
Create Date: 2026-06-24

Adds the columns that let a YouTube video live as a ``Book`` whose chunks carry
transcript time ranges:

  - ``book_format`` enum gains ``youtube`` / ``audio`` / ``video``
  - ``books.file_key`` / ``books.file_size_bytes`` become nullable (media books
    sourced from a URL have no stored file)
  - ``books.source_url`` + ``books.duration_seconds`` (media metadata)
  - ``chunks.time_start_seconds`` + ``chunks.time_end_seconds`` (citation
    deep-links into the player)
  - ``usage_counters.minutes_transcribed`` (the media analogue of
    pages_uploaded, for the per-period transcription quota)
"""
from __future__ import annotations

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0018"
down_revision: str | None = "0017"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # ─── book_format: new enum values ────────────────────────────────────────
    # ADD VALUE must run outside the migration's main transaction. autocommit
    # IF NOT EXISTS keeps this idempotent across partial re-runs.
    with op.get_context().autocommit_block():
        op.execute("ALTER TYPE book_format ADD VALUE IF NOT EXISTS 'youtube'")
        op.execute("ALTER TYPE book_format ADD VALUE IF NOT EXISTS 'audio'")
        op.execute("ALTER TYPE book_format ADD VALUE IF NOT EXISTS 'video'")

    # ─── books: relax file columns + add media metadata ──────────────────────
    op.alter_column("books", "file_key", existing_type=sa.String(length=500), nullable=True)
    op.alter_column("books", "file_size_bytes", existing_type=sa.Integer(), nullable=True)
    op.add_column("books", sa.Column("source_url", sa.String(length=1000), nullable=True))
    op.add_column("books", sa.Column("duration_seconds", sa.Integer(), nullable=True))

    # ─── chunks: transcript time range ───────────────────────────────────────
    op.add_column("chunks", sa.Column("time_start_seconds", sa.Integer(), nullable=True))
    op.add_column("chunks", sa.Column("time_end_seconds", sa.Integer(), nullable=True))

    # ─── usage_counters: transcription minutes ───────────────────────────────
    op.add_column(
        "usage_counters",
        sa.Column(
            "minutes_transcribed",
            sa.Integer(),
            nullable=False,
            server_default=sa.text("0"),
        ),
    )


def downgrade() -> None:
    op.drop_column("usage_counters", "minutes_transcribed")
    op.drop_column("chunks", "time_end_seconds")
    op.drop_column("chunks", "time_start_seconds")
    op.drop_column("books", "duration_seconds")
    op.drop_column("books", "source_url")
    # Restore NOT NULL. Safe only when no media (file-less) rows remain — drop
    # them first so the constraint can be re-applied on a clean document table.
    op.execute("DELETE FROM books WHERE format IN ('youtube', 'audio', 'video')")
    op.alter_column("books", "file_size_bytes", existing_type=sa.Integer(), nullable=False)
    op.alter_column("books", "file_key", existing_type=sa.String(length=500), nullable=False)
    # Postgres can't DROP enum values; 'youtube'/'audio'/'video' remain on
    # book_format harmlessly after downgrade.
