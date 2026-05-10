"""add highlights table (page text, color, note, optional AI Q&A)

Revision ID: 0004
Revises: 0003
Create Date: 2026-05-10
"""
from __future__ import annotations

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "0004"
down_revision: str | None = "0003"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    highlight_color = postgresql.ENUM(
        "yellow", "green", "blue", "pink", name="highlight_color"
    )
    highlight_color.create(op.get_bind(), checkfirst=True)

    op.create_table(
        "highlights",
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
        sa.Column("page", sa.Integer, nullable=False),
        sa.Column("text", sa.Text, nullable=False),
        sa.Column(
            "color",
            postgresql.ENUM(
                "yellow", "green", "blue", "pink",
                name="highlight_color", create_type=False,
            ),
            nullable=False,
            server_default="yellow",
        ),
        sa.Column("note", sa.Text, nullable=True),
        sa.Column("ai_question", sa.Text, nullable=True),
        sa.Column("ai_answer", sa.Text, nullable=True),
        sa.Column(
            "created_at", sa.DateTime(timezone=True),
            server_default=sa.func.now(), nullable=False,
        ),
        sa.Column(
            "updated_at", sa.DateTime(timezone=True),
            server_default=sa.func.now(), nullable=False,
        ),
    )
    op.create_index("ix_highlights_user_id", "highlights", ["user_id"])
    op.create_index("ix_highlights_book_id", "highlights", ["book_id"])
    op.create_index("ix_highlights_created_at", "highlights", ["created_at"])


def downgrade() -> None:
    op.drop_index("ix_highlights_created_at", table_name="highlights")
    op.drop_index("ix_highlights_book_id", table_name="highlights")
    op.drop_index("ix_highlights_user_id", table_name="highlights")
    op.drop_table("highlights")
    op.execute("DROP TYPE IF EXISTS highlight_color")
