"""add reader_profiles + users.active_profile_id — Family-plan readers

Revision ID: 0009
Revises: 0008
Create Date: 2026-05-11

Profiles let one Family account host up to 5 readers (parents + kids). The
table is created here along with a backing FK from ``users.active_profile_id``,
and every existing user is given a "default" profile so the application code
can rely on every user having at least one profile.
"""
from __future__ import annotations

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0009"
down_revision: str | None = "0008"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


profile_kind = sa.Enum("adult", "child", name="profilekind")


def upgrade() -> None:
    # Create the enum type explicitly so we can reuse it; SQLAlchemy's
    # ``checkfirst=True`` keeps re-runs (or partial failures) idempotent.
    profile_kind.create(op.get_bind(), checkfirst=True)

    op.create_table(
        "reader_profiles",
        sa.Column("id", sa.dialects.postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "user_id",
            sa.dialects.postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("name", sa.String(60), nullable=False),
        sa.Column("avatar_seed", sa.String(32), nullable=False, server_default="lumi"),
        sa.Column(
            "kind",
            profile_kind,
            nullable=False,
            server_default="adult",
        ),
        sa.Column(
            "is_default",
            sa.Boolean(),
            nullable=False,
            server_default=sa.false(),
        ),
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
    )
    op.create_index(
        "ix_reader_profiles_user_id",
        "reader_profiles",
        ["user_id"],
    )

    # Backfill: every existing user gets one default profile so application
    # code can treat "default profile exists" as an invariant. Name derived
    # from display_name, falling back to "Reader".
    op.execute(
        """
        INSERT INTO reader_profiles (id, user_id, name, avatar_seed, kind, is_default, created_at, updated_at)
        SELECT
            gen_random_uuid(),
            u.id,
            COALESCE(NULLIF(TRIM(u.display_name), ''), 'Reader'),
            'lumi',
            'adult',
            TRUE,
            NOW(),
            NOW()
        FROM users u
        """
    )

    op.add_column(
        "users",
        sa.Column(
            "active_profile_id",
            sa.dialects.postgresql.UUID(as_uuid=True),
            sa.ForeignKey("reader_profiles.id", ondelete="SET NULL"),
            nullable=True,
        ),
    )

    # Point every user at their default profile so a fresh login lands on a
    # real profile, not NULL.
    op.execute(
        """
        UPDATE users u
        SET active_profile_id = p.id
        FROM reader_profiles p
        WHERE p.user_id = u.id AND p.is_default = TRUE
        """
    )


def downgrade() -> None:
    op.drop_column("users", "active_profile_id")
    op.drop_index("ix_reader_profiles_user_id", table_name="reader_profiles")
    op.drop_table("reader_profiles")
    profile_kind.drop(op.get_bind(), checkfirst=True)
