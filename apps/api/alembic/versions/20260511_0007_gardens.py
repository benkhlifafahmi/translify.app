"""add reading-garden gamification: gardens, garden_events, garden_tending_attempts

Revision ID: 0007
Revises: 0006
Create Date: 2026-05-11

One Garden per (user, book) — created lazily on first reading event. Vitality
decays over time; reading + quizzes top it back up. Each weekly tending
produces a row in garden_tending_attempts. Every grow/wilt/water/skip event
goes into garden_events as an immutable log so the journal can be replayed.
"""
from __future__ import annotations

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "0007"
down_revision: str | None = "0006"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    species = postgresql.ENUM(
        "ficus", "helianthus", "lavandula", "monstera",
        name="garden_species",
    )
    species.create(op.get_bind(), checkfirst=True)

    health = postgresql.ENUM(
        "thriving", "budding", "wilting", "dying",
        name="garden_health",
    )
    health.create(op.get_bind(), checkfirst=True)

    event_kind = postgresql.ENUM(
        "read", "quiz", "water", "skip", "translate", "tend",
        name="garden_event_kind",
    )
    event_kind.create(op.get_bind(), checkfirst=True)

    op.create_table(
        "gardens",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "user_id", postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False,
        ),
        sa.Column(
            "book_id", postgresql.UUID(as_uuid=True),
            sa.ForeignKey("books.id", ondelete="CASCADE"), nullable=False,
        ),

        sa.Column(
            "species",
            postgresql.ENUM(
                "ficus", "helianthus", "lavandula", "monstera",
                name="garden_species", create_type=False,
            ),
            nullable=False, server_default="ficus",
        ),
        # Farmer customization — small JSON blob (hat, coat, skin, tool, name).
        sa.Column(
            "farmer", postgresql.JSONB,
            nullable=False,
            server_default=sa.text(
                "'{\"hat\":\"straw\",\"coat\":\"earth\",\"skin\":\"tan\",\"tool\":\"watering-can\",\"name\":\"\"}'::jsonb"
            ),
        ),

        # Growth + vitality state. Stage is derived from growth_percent on
        # write, denormalized here so the read path stays fast.
        sa.Column("stage", sa.Integer, nullable=False, server_default="0"),
        sa.Column("growth_percent", sa.Integer, nullable=False, server_default="0"),
        sa.Column("vitality", sa.Integer, nullable=False, server_default="5"),
        sa.Column("vitality_capacity", sa.Integer, nullable=False, server_default="5"),
        sa.Column(
            "health",
            postgresql.ENUM(
                "thriving", "budding", "wilting", "dying",
                name="garden_health", create_type=False,
            ),
            nullable=False, server_default="thriving",
        ),

        # Counters mirrored from events for fast reads. Recomputed on every
        # event write — Postgres can do this in a single UPDATE so we don't
        # need a separate aggregate table.
        sa.Column("pages_read", sa.Integer, nullable=False, server_default="0"),
        sa.Column("quizzes_answered", sa.Integer, nullable=False, server_default="0"),
        sa.Column("quiz_correct_total", sa.Integer, nullable=False, server_default="0"),
        sa.Column("quiz_attempted_total", sa.Integer, nullable=False, server_default="0"),
        sa.Column("new_leaves", sa.Integer, nullable=False, server_default="0"),
        sa.Column("streak_days", sa.Integer, nullable=False, server_default="0"),
        sa.Column("best_streak_days", sa.Integer, nullable=False, server_default="0"),

        # Cached weekly-tending question pack — generated on demand, expires
        # after submission so the next week gets a fresh set. JSONB list.
        sa.Column("current_tending", postgresql.JSONB, nullable=True),

        sa.Column("started_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("last_event_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("last_tended_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("last_decay_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("weekly_tending_due_at", sa.DateTime(timezone=True), nullable=False),

        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),

        sa.UniqueConstraint("user_id", "book_id", name="uq_gardens_user_book"),
    )
    op.create_index("ix_gardens_user_id", "gardens", ["user_id"])
    op.create_index("ix_gardens_book_id", "gardens", ["book_id"])
    op.create_index("ix_gardens_due_at", "gardens", ["weekly_tending_due_at"])

    op.create_table(
        "garden_events",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "garden_id", postgresql.UUID(as_uuid=True),
            sa.ForeignKey("gardens.id", ondelete="CASCADE"), nullable=False,
        ),
        sa.Column(
            "user_id", postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False,
        ),
        sa.Column(
            "kind",
            postgresql.ENUM(
                "read", "quiz", "water", "skip", "translate", "tend",
                name="garden_event_kind", create_type=False,
            ),
            nullable=False,
        ),
        # Free-form event payload (e.g. {"pages": 12, "minutes": 28} for read).
        sa.Column("payload", postgresql.JSONB, nullable=False, server_default=sa.text("'{}'::jsonb")),
        # The deltas applied to the garden as a result of this event — kept on
        # the event so the journal can describe its own consequences without
        # re-running the rules engine.
        sa.Column("growth_delta", sa.Integer, nullable=False, server_default="0"),
        sa.Column("vitality_delta", sa.Integer, nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_garden_events_garden_id", "garden_events", ["garden_id"])
    op.create_index("ix_garden_events_created_at", "garden_events", ["created_at"])

    op.create_table(
        "garden_tending_attempts",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "garden_id", postgresql.UUID(as_uuid=True),
            sa.ForeignKey("gardens.id", ondelete="CASCADE"), nullable=False,
        ),
        sa.Column(
            "user_id", postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False,
        ),
        sa.Column("score", sa.Integer, nullable=False),
        sa.Column("total", sa.Integer, nullable=False),
        sa.Column("passed", sa.Boolean, nullable=False),
        sa.Column("growth_gained", sa.Integer, nullable=False, server_default="0"),
        sa.Column("vitality_restored", sa.Integer, nullable=False, server_default="0"),
        # Per-question results: list of {question_id, given_index, correct_index, correct, explanation}
        sa.Column("answers", postgresql.JSONB, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_garden_tending_garden_id", "garden_tending_attempts", ["garden_id"])
    op.create_index("ix_garden_tending_created_at", "garden_tending_attempts", ["created_at"])


def downgrade() -> None:
    op.drop_index("ix_garden_tending_created_at", table_name="garden_tending_attempts")
    op.drop_index("ix_garden_tending_garden_id", table_name="garden_tending_attempts")
    op.drop_table("garden_tending_attempts")

    op.drop_index("ix_garden_events_created_at", table_name="garden_events")
    op.drop_index("ix_garden_events_garden_id", table_name="garden_events")
    op.drop_table("garden_events")

    op.drop_index("ix_gardens_due_at", table_name="gardens")
    op.drop_index("ix_gardens_book_id", table_name="gardens")
    op.drop_index("ix_gardens_user_id", table_name="gardens")
    op.drop_table("gardens")

    op.execute("DROP TYPE IF EXISTS garden_event_kind")
    op.execute("DROP TYPE IF EXISTS garden_health")
    op.execute("DROP TYPE IF EXISTS garden_species")
