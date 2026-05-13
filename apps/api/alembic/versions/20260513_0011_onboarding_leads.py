"""add onboarding_leads — capture email + step before signup completes

Revision ID: 0011
Revises: 0010
Create Date: 2026-05-13

The /join flow now asks for email first, then walks the visitor through topics,
a sample shelf, and a try-the-magic preview before they create an account. We
upsert a lead row at every step so we can re-engage visitors who drop off.
"""
from __future__ import annotations

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "0011"
down_revision: str | None = "0010"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


# Use create_type=False here so column references don't auto-emit CREATE TYPE.
# The explicit ``.create(checkfirst=True)`` below is the one and only emission.
onboarding_step = postgresql.ENUM(
    "email",
    "topics",
    "shelf",
    "experience",
    "signup",
    "completed",
    name="onboardingstep",
    create_type=False,
)


def upgrade() -> None:
    postgresql.ENUM(
        "email",
        "topics",
        "shelf",
        "experience",
        "signup",
        "completed",
        name="onboardingstep",
    ).create(op.get_bind(), checkfirst=True)

    op.create_table(
        "onboarding_leads",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("email", sa.String(length=320), nullable=False),
        sa.Column("step", onboarding_step, nullable=False, server_default="email"),
        sa.Column(
            "topics",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=False,
            server_default=sa.text("'[]'::jsonb"),
        ),
        sa.Column("chosen_book_id", sa.String(length=64), nullable=True),
        sa.Column(
            "completed", sa.Boolean(), nullable=False, server_default=sa.false()
        ),
        sa.Column(
            "completed_at", sa.DateTime(timezone=True), nullable=True
        ),
        sa.Column(
            "user_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column("referrer", sa.String(length=512), nullable=True),
        sa.Column("user_agent", sa.String(length=512), nullable=True),
        sa.Column("preferred_language", sa.String(length=8), nullable=True),
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
        sa.Column(
            "last_seen_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
    )
    op.create_index(
        "ix_onboarding_leads_email", "onboarding_leads", ["email"], unique=True
    )
    op.create_index(
        "ix_onboarding_leads_user_id", "onboarding_leads", ["user_id"]
    )
    # Index used by the "lapsed leads" query — find rows that stopped a while
    # ago and haven't converted.
    op.create_index(
        "ix_onboarding_leads_pending",
        "onboarding_leads",
        ["completed", "last_seen_at"],
    )


def downgrade() -> None:
    op.drop_index("ix_onboarding_leads_pending", table_name="onboarding_leads")
    op.drop_index("ix_onboarding_leads_user_id", table_name="onboarding_leads")
    op.drop_index("ix_onboarding_leads_email", table_name="onboarding_leads")
    op.drop_table("onboarding_leads")
    postgresql.ENUM(name="onboardingstep").drop(op.get_bind(), checkfirst=True)
