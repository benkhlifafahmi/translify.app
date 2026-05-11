"""add users.family_safe_mode — Family-plan kid-safe content posture toggle

Revision ID: 0008
Revises: 0007
Create Date: 2026-05-11

When enabled (and the active plan exposes the feature), Translify adds a
"kid-safe" system-prompt addendum to chat answers, translations, and quiz
generation. Defaults to false for existing rows.
"""
from __future__ import annotations

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0008"
down_revision: str | None = "0007"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column(
            "family_safe_mode",
            sa.Boolean(),
            nullable=False,
            server_default=sa.false(),
        ),
    )


def downgrade() -> None:
    op.drop_column("users", "family_safe_mode")
