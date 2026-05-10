"""add highlights.position_cfi (nullable) for EPUB inline highlight rendering

Revision ID: 0005
Revises: 0004
Create Date: 2026-05-11

PDFs locate highlights with (page, text) — a substring search inside the
text layer of the given page. EPUBs need a more precise locator because
the same text can appear across multiple chapters and there is no fixed
"page" concept. epubjs uses CFI (Canonical Fragment Identifier), a string
that addresses a specific range inside the EPUB spine.

We store CFI in a nullable column so:
 - existing PDF highlights still work (position_cfi = NULL)
 - EPUB highlights persist the CFI and render inline at the exact location
 - older EPUB highlights created before this migration also work; they
   just won't render as inline marks until re-saved.
"""
from __future__ import annotations

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0005"
down_revision: str | None = "0004"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "highlights",
        sa.Column("position_cfi", sa.Text(), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("highlights", "position_cfi")
