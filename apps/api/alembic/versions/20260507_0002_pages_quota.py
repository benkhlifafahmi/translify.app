"""rename usage_counters.books_uploaded → pages_uploaded

We track the page-quota in pages, not books. The renamed column resets the
old counter intentionally — books and pages aren't fungible, so any in-flight
counts would over- or under-state the new period.

Revision ID: 0003
Revises: 0002
Create Date: 2026-05-07
"""
from __future__ import annotations

from collections.abc import Sequence

from alembic import op

revision: str = "0003"
down_revision: str | None = "0002"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.alter_column(
        "usage_counters",
        "books_uploaded",
        new_column_name="pages_uploaded",
    )
    # Reset existing counters — old book-counts aren't comparable to page-counts.
    op.execute("UPDATE usage_counters SET pages_uploaded = 0")


def downgrade() -> None:
    op.alter_column(
        "usage_counters",
        "pages_uploaded",
        new_column_name="books_uploaded",
    )
    op.execute("UPDATE usage_counters SET books_uploaded = 0")
