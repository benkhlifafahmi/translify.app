"""add books.is_seed + books.seed_slug — system-owned seed catalogue

Revision ID: 0012
Revises: 0011
Create Date: 2026-05-13

Seed books are pre-ingested public-domain titles owned by a system user. The
/join flow makes them appear in every visitor's library so they can read,
chat, and quiz on real content before signing up. Per-user state (chats,
quizzes, highlights) is still keyed on (user_id, book_id) — only the source
content + chunks are shared.
"""
from __future__ import annotations

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0012"
down_revision: str | None = "0011"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "books",
        sa.Column(
            "is_seed",
            sa.Boolean(),
            nullable=False,
            server_default=sa.false(),
        ),
    )
    op.add_column(
        "books",
        sa.Column("seed_slug", sa.String(length=64), nullable=True),
    )
    op.create_index("ix_books_is_seed", "books", ["is_seed"])
    op.create_index("ix_books_seed_slug", "books", ["seed_slug"])
    # A given seed slug should exist at most once globally — protects against
    # accidental double-ingest.
    op.create_index(
        "uq_books_seed_slug_unique",
        "books",
        ["seed_slug"],
        unique=True,
        postgresql_where=sa.text("seed_slug IS NOT NULL"),
    )


def downgrade() -> None:
    op.drop_index("uq_books_seed_slug_unique", table_name="books")
    op.drop_index("ix_books_seed_slug", table_name="books")
    op.drop_index("ix_books_is_seed", table_name="books")
    op.drop_column("books", "seed_slug")
    op.drop_column("books", "is_seed")
