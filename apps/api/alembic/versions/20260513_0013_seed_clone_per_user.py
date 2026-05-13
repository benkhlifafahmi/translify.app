"""seed books are cloned per user — relax seed_slug uniqueness

Revision ID: 0013
Revises: 0012
Create Date: 2026-05-13

We used to have one shared system-owned row per seed book that every user
could read via a visibility predicate. We now clone the seed (Book row +
Chunk rows) into each user's library on first open, so every user owns their
copy. This means many rows can share the same ``seed_slug`` (one per user
plus the system template), so the global unique partial index has to go.

The replacement is unique on ``(user_id, seed_slug) WHERE seed_slug IS NOT
NULL`` — each user can have at most one clone per seed, the system user
holds exactly one template per slug.
"""
from __future__ import annotations

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0013"
down_revision: str | None = "0012"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.drop_index("uq_books_seed_slug_unique", table_name="books")
    op.create_index(
        "uq_books_user_seed_slug",
        "books",
        ["user_id", "seed_slug"],
        unique=True,
        postgresql_where=sa.text("seed_slug IS NOT NULL"),
    )


def downgrade() -> None:
    op.drop_index("uq_books_user_seed_slug", table_name="books")
    op.create_index(
        "uq_books_seed_slug_unique",
        "books",
        ["seed_slug"],
        unique=True,
        postgresql_where=sa.text("seed_slug IS NOT NULL"),
    )
