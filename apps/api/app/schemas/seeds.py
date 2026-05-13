"""Pydantic schemas for the seed catalogue + clone-on-open flow."""
from __future__ import annotations

import uuid

from pydantic import BaseModel

from app.models.book import BookStatus


class SeedRead(BaseModel):
    """One entry in the seed catalogue, with per-user clone state.

    Returned by ``GET /seeds``. The frontend uses ``clone_id`` to decide:

    * ``null`` → user has not opened this book yet; tapping calls
      ``POST /seeds/{slug}/clone`` to materialise a personal copy.
    * not null → user already cloned; tapping deep-links straight to
      ``/library/{clone_id}``.
    """
    slug: str
    title: str
    author: str
    source_language: str
    topics: list[str]
    attribution: str
    # Per-user clone state — populated after the visitor opens the seed.
    clone_id: uuid.UUID | None = None
    clone_status: BookStatus | None = None
