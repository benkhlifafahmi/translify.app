"""library folders — user-owned shelves with cover/colour/emoji

Revision ID: 0014
Revises: 0013
Create Date: 2026-05-13

Adds ``folders`` and ``books.folder_id``. NULL ``folder_id`` keeps the book
on the user's "Unsorted" shelf; deleting a folder drops its books back to
NULL via ``ON DELETE SET NULL``.
"""
from __future__ import annotations

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "0014"
down_revision: str | None = "0013"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "folders",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column(
            "user_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("name", sa.String(length=80), nullable=False),
        sa.Column("color", sa.String(length=24), nullable=False, server_default="saffron"),
        sa.Column("emoji", sa.String(length=8), nullable=False, server_default="📚"),
        sa.Column("cover_image_key", sa.String(length=500), nullable=True),
        sa.Column("position", sa.Integer(), nullable=False, server_default="0"),
        sa.Column(
            "created_at", sa.DateTime(timezone=True),
            server_default=sa.func.now(), nullable=False,
        ),
        sa.Column(
            "updated_at", sa.DateTime(timezone=True),
            server_default=sa.func.now(), nullable=False,
        ),
    )
    op.create_index("ix_folders_user_id", "folders", ["user_id"])
    # Helpful for the library query — pull a user's folders ordered already.
    op.create_index(
        "ix_folders_user_position", "folders", ["user_id", "position"]
    )

    op.add_column(
        "books",
        sa.Column(
            "folder_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("folders.id", ondelete="SET NULL"),
            nullable=True,
        ),
    )
    op.create_index("ix_books_folder_id", "books", ["folder_id"])


def downgrade() -> None:
    op.drop_index("ix_books_folder_id", table_name="books")
    op.drop_column("books", "folder_id")
    op.drop_index("ix_folders_user_position", table_name="folders")
    op.drop_index("ix_folders_user_id", table_name="folders")
    op.drop_table("folders")
