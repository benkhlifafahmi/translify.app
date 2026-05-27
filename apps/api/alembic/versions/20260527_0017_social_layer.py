"""social layer — username on users + posts/follows/milestones

Revision ID: 0017
Revises: 0016
Create Date: 2026-05-27

Adds the public-handle fields to ``users`` and the three new tables that
back the share-to-timeline / follow / discover surfaces:

  - ``posts``      polymorphic via ``type`` + JSONB ``payload``
  - ``follows``    simple join table with (follower_id, followed_id) unique
  - ``milestones`` per-user achievement, opt-in to share into ``posts``
"""
from __future__ import annotations

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "0017"
down_revision: str | None = "0016"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # ─── users: social fields ────────────────────────────────────────────────
    op.add_column("users", sa.Column("username", sa.String(length=32), nullable=True))
    op.create_unique_constraint("uq_users_username", "users", ["username"])
    op.create_index("ix_users_username", "users", ["username"])
    op.add_column("users", sa.Column("bio", sa.String(length=160), nullable=True))
    op.add_column("users", sa.Column("avatar_url", sa.String(length=500), nullable=True))
    op.add_column(
        "users",
        sa.Column(
            "profile_public",
            sa.Boolean(),
            nullable=False,
            server_default=sa.text("true"),
        ),
    )

    # ─── posts ───────────────────────────────────────────────────────────────
    post_type = postgresql.ENUM(
        "word", "sentence", "passage", "milestone", "list", "reflection",
        name="post_type",
    )
    post_type.create(op.get_bind(), checkfirst=True)

    post_visibility = postgresql.ENUM(
        "public", "followers", "private",
        name="post_visibility",
    )
    post_visibility.create(op.get_bind(), checkfirst=True)

    op.create_table(
        "posts",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "user_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "type",
            sa.Enum(
                "word", "sentence", "passage", "milestone", "list", "reflection",
                name="post_type",
                create_type=False,
            ),
            nullable=False,
        ),
        sa.Column("payload", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column(
            "book_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("books.id", ondelete="CASCADE"),
            nullable=True,
        ),
        sa.Column(
            "highlight_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("highlights.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column("source_lang", sa.String(length=8), nullable=True),
        sa.Column("target_lang", sa.String(length=8), nullable=True),
        sa.Column("note", sa.String(length=280), nullable=True),
        sa.Column(
            "visibility",
            sa.Enum(
                "public", "followers", "private",
                name="post_visibility",
                create_type=False,
            ),
            nullable=False,
            server_default="public",
        ),
        sa.Column("share_slug", sa.String(length=16), nullable=False),
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
        sa.UniqueConstraint("share_slug", name="uq_posts_share_slug"),
    )
    op.create_index("ix_posts_user_id", "posts", ["user_id"])
    op.create_index("ix_posts_type", "posts", ["type"])
    op.create_index("ix_posts_book_id", "posts", ["book_id"])
    op.create_index("ix_posts_highlight_id", "posts", ["highlight_id"])
    op.create_index("ix_posts_visibility", "posts", ["visibility"])
    op.create_index("ix_posts_share_slug", "posts", ["share_slug"])
    op.create_index("ix_posts_created_at", "posts", ["created_at"])
    op.create_index("ix_posts_user_created", "posts", ["user_id", "created_at"])
    op.create_index("ix_posts_visibility_created", "posts", ["visibility", "created_at"])

    # ─── follows ─────────────────────────────────────────────────────────────
    op.create_table(
        "follows",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "follower_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "followed_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.UniqueConstraint("follower_id", "followed_id", name="uq_follows_pair"),
    )
    op.create_index("ix_follows_follower_id", "follows", ["follower_id"])
    op.create_index("ix_follows_followed_id", "follows", ["followed_id"])
    op.create_index("ix_follows_followed_created", "follows", ["followed_id", "created_at"])

    # ─── milestones ──────────────────────────────────────────────────────────
    milestone_kind = postgresql.ENUM(
        "first_book_finished", "book_finished",
        "streak_7", "streak_30", "streak_100",
        "words_100", "words_500", "words_1000",
        "quiz_perfect", "garden_bloom",
        name="milestone_kind",
    )
    milestone_kind.create(op.get_bind(), checkfirst=True)

    op.create_table(
        "milestones",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "user_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "kind",
            sa.Enum(
                "first_book_finished", "book_finished",
                "streak_7", "streak_30", "streak_100",
                "words_100", "words_500", "words_1000",
                "quiz_perfect", "garden_bloom",
                name="milestone_kind",
                create_type=False,
            ),
            nullable=False,
        ),
        sa.Column(
            "context",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=False,
            server_default=sa.text("'{}'::jsonb"),
        ),
        sa.Column(
            "shared_post_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("posts.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
    )
    op.create_index("ix_milestones_user_id", "milestones", ["user_id"])
    op.create_index("ix_milestones_created_at", "milestones", ["created_at"])
    op.create_index("ix_milestones_user_kind", "milestones", ["user_id", "kind"])


def downgrade() -> None:
    op.drop_index("ix_milestones_user_kind", table_name="milestones")
    op.drop_index("ix_milestones_created_at", table_name="milestones")
    op.drop_index("ix_milestones_user_id", table_name="milestones")
    op.drop_table("milestones")

    op.drop_index("ix_follows_followed_created", table_name="follows")
    op.drop_index("ix_follows_followed_id", table_name="follows")
    op.drop_index("ix_follows_follower_id", table_name="follows")
    op.drop_table("follows")

    op.drop_index("ix_posts_visibility_created", table_name="posts")
    op.drop_index("ix_posts_user_created", table_name="posts")
    op.drop_index("ix_posts_created_at", table_name="posts")
    op.drop_index("ix_posts_share_slug", table_name="posts")
    op.drop_index("ix_posts_visibility", table_name="posts")
    op.drop_index("ix_posts_highlight_id", table_name="posts")
    op.drop_index("ix_posts_book_id", table_name="posts")
    op.drop_index("ix_posts_type", table_name="posts")
    op.drop_index("ix_posts_user_id", table_name="posts")
    op.drop_table("posts")

    bind = op.get_bind()
    sa.Enum(name="milestone_kind").drop(bind, checkfirst=True)
    sa.Enum(name="post_visibility").drop(bind, checkfirst=True)
    sa.Enum(name="post_type").drop(bind, checkfirst=True)

    op.drop_column("users", "profile_public")
    op.drop_column("users", "avatar_url")
    op.drop_column("users", "bio")
    op.drop_index("ix_users_username", table_name="users")
    op.drop_constraint("uq_users_username", "users", type_="unique")
    op.drop_column("users", "username")
