"""add oauth_accounts table for Google (and future) social login

Revision ID: 0010
Revises: 0009
Create Date: 2026-05-13
"""
from __future__ import annotations

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "0010"
down_revision: str | None = "0009"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "oauth_accounts",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("oauth_name", sa.String(length=100), nullable=False),
        sa.Column("access_token", sa.String(length=1024), nullable=False),
        sa.Column("expires_at", sa.Integer(), nullable=True),
        sa.Column("refresh_token", sa.String(length=1024), nullable=True),
        sa.Column("account_id", sa.String(length=320), nullable=False),
        sa.Column("account_email", sa.String(length=320), nullable=False),
        sa.Column(
            "user_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
    )
    op.create_index("ix_oauth_accounts_account_id", "oauth_accounts", ["account_id"])
    op.create_index("ix_oauth_accounts_oauth_name", "oauth_accounts", ["oauth_name"])


def downgrade() -> None:
    op.drop_index("ix_oauth_accounts_oauth_name", "oauth_accounts")
    op.drop_index("ix_oauth_accounts_account_id", "oauth_accounts")
    op.drop_table("oauth_accounts")
