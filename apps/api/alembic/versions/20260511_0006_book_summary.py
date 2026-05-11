"""add books.summary — book-level AI summary used as quiz context

Revision ID: 0006
Revises: 0005
Create Date: 2026-05-11

Generated once at ingest time from the book's full text. Quiz generation
prefers this over random chunk sampling — produces more coherent questions
about the book's actual ideas, and the prompt is ~10x smaller.
"""
from __future__ import annotations

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0006"
down_revision: str | None = "0005"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("books", sa.Column("summary", sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column("books", "summary")
