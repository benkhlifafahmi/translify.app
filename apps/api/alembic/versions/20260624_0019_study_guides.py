"""study guides — AI-generated study material per (user, book)

Revision ID: 0019
Revises: 0018
Create Date: 2026-06-24

One ``study_guides`` row per (user, book): the ``sections`` JSONB holds the
generated study material (notes, key points, and free-text exercises with
server-side reference answers used for AI grading).
"""
from __future__ import annotations

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "0019"
down_revision: str | None = "0018"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "study_guides",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "book_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("books.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "user_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("sections", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.UniqueConstraint("user_id", "book_id", name="uq_study_guide_user_book"),
    )
    op.create_index("ix_study_guides_book_id", "study_guides", ["book_id"])
    op.create_index("ix_study_guides_user_id", "study_guides", ["user_id"])


def downgrade() -> None:
    op.drop_index("ix_study_guides_user_id", table_name="study_guides")
    op.drop_index("ix_study_guides_book_id", table_name="study_guides")
    op.drop_table("study_guides")
