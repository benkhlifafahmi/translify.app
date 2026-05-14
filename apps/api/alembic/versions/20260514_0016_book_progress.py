"""book_progress — per-(user, book) resume position

Revision ID: 0016
Revises: 0015
Create Date: 2026-05-14

Stores the user's last reading position so reopening a book picks up where
they left off. PDFs use ``current_page``; EPUBs use ``current_cfi`` (page is
best-effort, since CFI is the only stable locator across reflows).
"""
from __future__ import annotations

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "0016"
down_revision: str | None = "0015"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "book_progress",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "user_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "book_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("books.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("current_page", sa.Integer, nullable=True),
        sa.Column("current_cfi", sa.Text, nullable=True),
        sa.Column(
            "reading_time_seconds", sa.Integer,
            nullable=False, server_default="0",
        ),
        sa.Column(
            "last_read_at", sa.DateTime(timezone=True),
            server_default=sa.func.now(), nullable=False,
        ),
        sa.Column(
            "created_at", sa.DateTime(timezone=True),
            server_default=sa.func.now(), nullable=False,
        ),
        sa.Column(
            "updated_at", sa.DateTime(timezone=True),
            server_default=sa.func.now(), nullable=False,
        ),
        sa.UniqueConstraint("user_id", "book_id", name="uq_book_progress_user_book"),
    )
    op.create_index("ix_book_progress_user_id", "book_progress", ["user_id"])
    op.create_index("ix_book_progress_book_id", "book_progress", ["book_id"])
    op.create_index("ix_book_progress_last_read_at", "book_progress", ["last_read_at"])


def downgrade() -> None:
    op.drop_index("ix_book_progress_last_read_at", table_name="book_progress")
    op.drop_index("ix_book_progress_book_id", table_name="book_progress")
    op.drop_index("ix_book_progress_user_id", table_name="book_progress")
    op.drop_table("book_progress")
