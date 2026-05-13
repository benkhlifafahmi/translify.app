"""Seed-book catalogue + clone-on-open.

The /join flow shows visitors a curated shelf of public-domain books before
they have anything of their own. Those books exist once as system-owned
templates (created by ``app.scripts.seed_books``). When a visitor taps one,
we **clone** the template into their library — same MinIO file (no
re-upload), but a fresh ``Book`` row plus a bulk-copy of every ``Chunk``
(text + embedding) so the user has a self-contained, mutable copy with no
shared state with anyone else.

Why clone instead of share:

* Translations, chat history, quizzes, highlights, and the reading garden
  are all keyed on ``(user_id, book_id)`` — already user-private.
* Cloning means the user's library actually contains their books (clean
  mental model). They can rename, delete, and translate without worrying
  about side effects on other readers.
* Storage cost is bounded by interest: only the books a user opens get
  cloned, not all 8.
* No re-indexing AI cost — we copy chunks (including pgvector embeddings)
  via a single ``INSERT … SELECT``.
"""
from __future__ import annotations

import logging
import uuid

from fastapi import APIRouter, Depends, HTTPException, Path, status
from sqlalchemy import and_, select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.models import User
from app.auth.users import current_active_user, current_optional_user
from app.db import get_async_session
from app.models.book import Book, BookStatus
from app.schemas.book import BookRead
from app.schemas.seeds import SeedRead
from app.seeds import SEED_BOOKS, SEED_BY_SLUG, SeedBookSpec
from app.seeds.system_user import get_or_create_system_user

log = logging.getLogger(__name__)

router = APIRouter(prefix="/seeds", tags=["seeds"])


@router.get("", response_model=list[SeedRead])
async def list_seeds(
    user: User | None = Depends(current_optional_user),
    session: AsyncSession = Depends(get_async_session),
) -> list[SeedRead]:
    """Return the catalogue with per-user clone state.

    **Public** — works without a session so /join can render the shelf
    before the visitor has done anything. When a session *is* present,
    ``clone_id`` is populated for books they've already opened so the
    frontend can deep-link rather than re-clone.
    """
    clones_by_slug: dict[str, tuple[uuid.UUID, BookStatus]] = {}
    if user is not None:
        clones_q = await session.execute(
            select(Book.seed_slug, Book.id, Book.status).where(
                Book.user_id == user.id,
                Book.seed_slug.is_not(None),
            )
        )
        clones_by_slug = {
            slug: (bid, st) for slug, bid, st in clones_q.all() if slug
        }

    return [
        SeedRead(
            slug=spec.slug,
            title=spec.title,
            author=spec.author,
            source_language=spec.source_language,
            topics=list(spec.topics),
            attribution=spec.attribution,
            clone_id=clones_by_slug.get(spec.slug, (None, None))[0],
            clone_status=clones_by_slug.get(spec.slug, (None, None))[1],
        )
        for spec in SEED_BOOKS
    ]


@router.post(
    "/{slug}/clone",
    response_model=BookRead,
    status_code=status.HTTP_201_CREATED,
)
async def clone_seed(
    slug: str = Path(..., max_length=64),
    user: User = Depends(current_active_user),
    session: AsyncSession = Depends(get_async_session),
) -> Book:
    """Clone the named seed into the current user's library. Idempotent.

    Returns the user's clone — creating one (with a deep copy of chunks) if
    they don't already have it. The MinIO file is shared with the template;
    only ``Book`` + ``Chunk`` rows are duplicated.
    """
    spec: SeedBookSpec | None = SEED_BY_SLUG.get(slug)
    if spec is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Unknown seed slug.",
        )

    # If the user already has a clone, return it — re-running the click is safe.
    existing_q = await session.execute(
        select(Book).where(
            and_(Book.user_id == user.id, Book.seed_slug == slug)
        )
    )
    existing = existing_q.scalar_one_or_none()
    if existing is not None:
        return existing

    # Find the system template. The seed-books script must have run first.
    system_user = await get_or_create_system_user(session)
    template_q = await session.execute(
        select(Book).where(
            and_(Book.user_id == system_user.id, Book.seed_slug == slug)
        )
    )
    template = template_q.scalar_one_or_none()
    if template is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=(
                "The seed catalogue isn't loaded on this server yet. "
                "Run `python -m app.scripts.seed_books` to ingest it."
            ),
        )

    # Materialise the clone. Same MinIO file_key — the EPUB is shared, the
    # row is not.
    clone = Book(
        user_id=user.id,
        title=template.title,
        author=template.author,
        source_language=template.source_language,
        format=template.format,
        file_key=template.file_key,
        file_size_bytes=template.file_size_bytes,
        page_count=template.page_count,
        status=template.status,
        summary=template.summary,
        is_seed=True,
        seed_slug=slug,
    )
    session.add(clone)
    await session.flush()  # populate clone.id for the chunk copy below

    # Bulk-copy chunks — text + page positions + pgvector embeddings. Pure
    # SQL, no Python iteration: ~ms for a typical 200-chunk book.
    await session.execute(
        text(
            """
            INSERT INTO chunks (
                id, book_id, ordinal, page_start, page_end,
                text, token_count, embedding, created_at
            )
            SELECT
                gen_random_uuid(), :clone_id, ordinal, page_start, page_end,
                text, token_count, embedding, NOW()
            FROM chunks
            WHERE book_id = :template_id
            """
        ),
        {"clone_id": clone.id, "template_id": template.id},
    )

    await session.commit()
    await session.refresh(clone)
    log.info(
        "cloned seed %s → book %s for user %s",
        slug, clone.id, user.id,
    )
    return clone
