"""users.is_anonymous — ghost accounts for TikTok-style frictionless try

Revision ID: 0015
Revises: 0014
Create Date: 2026-05-13

Visitors who arrive from social and tap a book on /join now get an
anonymous "ghost" account immediately — they can pick topics, clone seed
books, read pages 1–10, and only get prompted for an email when they try
a feature that costs us money (chat, quiz, upload, translation).

Anonymous users are real ``users`` rows with a synthetic email
(``anon-<uuid>@translify.app``) so every per-user FK keeps working without
schema changes. The flag below is the only thing that distinguishes them
from real readers.
"""
from __future__ import annotations

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0015"
down_revision: str | None = "0014"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column(
            "is_anonymous",
            sa.Boolean(),
            nullable=False,
            server_default=sa.false(),
        ),
    )
    op.create_index("ix_users_is_anonymous", "users", ["is_anonymous"])


def downgrade() -> None:
    op.drop_index("ix_users_is_anonymous", table_name="users")
    op.drop_column("users", "is_anonymous")
