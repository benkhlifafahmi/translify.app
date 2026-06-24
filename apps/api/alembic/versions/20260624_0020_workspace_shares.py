"""workspace shares — public view-only share links for media workspaces

Revision ID: 0020
Revises: 0019
Create Date: 2026-06-24

One ``workspace_shares`` row per shared book: an unguessable ``slug`` that
anyone can open to view the video + study guide read-only and save a copy.
"""
from __future__ import annotations

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "0020"
down_revision: str | None = "0019"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "workspace_shares",
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
        sa.Column("slug", sa.String(length=24), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.UniqueConstraint("book_id", name="uq_workspace_shares_book"),
        sa.UniqueConstraint("slug", name="uq_workspace_shares_slug"),
    )
    op.create_index("ix_workspace_shares_book_id", "workspace_shares", ["book_id"])
    op.create_index("ix_workspace_shares_user_id", "workspace_shares", ["user_id"])
    op.create_index("ix_workspace_shares_slug", "workspace_shares", ["slug"])


def downgrade() -> None:
    op.drop_index("ix_workspace_shares_slug", table_name="workspace_shares")
    op.drop_index("ix_workspace_shares_user_id", table_name="workspace_shares")
    op.drop_index("ix_workspace_shares_book_id", table_name="workspace_shares")
    op.drop_table("workspace_shares")
