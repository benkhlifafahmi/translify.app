"""Media ingestion: transcript → time windows → chunk → embed → persist.

Mirrors ``app.ingest.pipeline`` (documents), but the source is a remote media
transcript (YouTube captions in v1) rather than a parsed file. The transcript
is grouped into fixed-length time windows that stand in for "pages" so the
existing token-aware chunker runs unchanged; after chunking we map each
chunk's window span back to a wall-clock time range, which is what lets a chat
citation deep-link into the player at the right moment.
"""
from __future__ import annotations

import asyncio
import logging
import math
import re
import uuid

from sqlalchemy import delete
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

import app.auth.models  # noqa: F401 — register User mapper so FK to users.id resolves
import app.models  # noqa: F401 — register all other mappers
from app.auth.models import User
from app.billing.quota import reserve_media_minutes
from app.config import settings
from app.ingest.chunker import chunk_pages
from app.ingest.embeddings import embed_documents
from app.ingest.parsers import Page
from app.ingest.transcription import extract_video_id, fetch_transcript
from app.models.book import Book, BookStatus
from app.models.chunk import Chunk

log = logging.getLogger(__name__)

# Transcript cues are short; group ~45s of them into one "page" so the chunker
# packs a few windows per chunk while keeping citations time-precise.
WINDOW_SECONDS = 45

_WS_RE = re.compile(r"\s+")


def _normalize(text: str) -> str:
    # asyncpg can't store NUL; captions are otherwise clean. Collapse runs of
    # whitespace (cues arrive with embedded newlines) into single spaces.
    return _WS_RE.sub(" ", text.replace("\x00", "")).strip()


def _build_windows(segments) -> tuple[list[Page], list[int], list[int]]:
    """Group cues into ~WINDOW_SECONDS windows.

    Returns ``(pages, starts, ends)`` where ``pages[i].number == i + 1`` and
    ``starts[i]`` / ``ends[i]`` are the window's wall-clock bounds in whole
    seconds — used to translate chunk page-spans back into time ranges.
    """
    pages: list[Page] = []
    starts: list[int] = []
    ends: list[int] = []

    cur_texts: list[str] = []
    cur_start: float | None = None
    cur_end: float = 0.0

    def flush() -> None:
        nonlocal cur_texts, cur_start, cur_end
        if not cur_texts:
            return
        text = _normalize(" ".join(cur_texts))
        if text:
            pages.append(Page(number=len(pages) + 1, text=text))
            starts.append(int(cur_start or 0))
            ends.append(int(max(cur_end, cur_start or 0)))
        cur_texts = []
        cur_start = None
        cur_end = 0.0

    for seg in segments:
        if cur_texts and cur_start is not None and (seg.start_seconds - cur_start) >= WINDOW_SECONDS:
            flush()
        if not cur_texts:
            cur_start = seg.start_seconds
        cur_texts.append(seg.text)
        cur_end = seg.start_seconds + seg.duration_seconds
    flush()

    return pages, starts, ends


async def process_media_async(book_id: str) -> None:
    bid = uuid.UUID(book_id)

    engine = create_async_engine(settings.async_postgres_dsn, pool_pre_ping=True)
    session_maker = async_sessionmaker(engine, expire_on_commit=False)
    try:
        async with session_maker() as session:
            book = await session.get(Book, bid)
            if book is None:
                log.warning("process_media: %s not found", book_id)
                return

            book.status = BookStatus.processing
            book.error_message = None
            await session.commit()

            try:
                await _run(session, book)
            except Exception as exc:
                log.exception("process_media failed for %s", book_id)
                await session.rollback()
                stale = await session.get(Book, bid)
                if stale is not None:
                    stale.status = BookStatus.failed
                    stale.error_message = str(exc)[:1000]
                    await session.commit()
                raise
    finally:
        await engine.dispose()


async def _run(session, book: Book) -> None:
    log.info("media ingest start: book=%s url=%s", book.id, book.source_url)

    video_id = extract_video_id(book.source_url or "")
    if not video_id:
        raise RuntimeError("Couldn't parse a YouTube video ID from this link.")

    # 1. Pull the caption track (raises TranscriptUnavailable with a friendly
    #    message on failure — that message becomes the book's error_message).
    fetched = await asyncio.to_thread(fetch_transcript, video_id)
    duration = fetched.duration_seconds
    log.info(
        "media transcript: book=%s segments=%d duration=%.0fs lang=%s generated=%s",
        book.id, len(fetched.segments), duration, fetched.language_code, fetched.is_generated,
    )

    # 2. Quota — reserve transcription minutes (Free gets a small taste). On
    #    over-limit this returns a message we surface instead of proceeding.
    minutes = max(1, math.ceil(duration / 60))
    owner = await session.get(User, book.user_id)
    if owner is None:
        raise RuntimeError("Owner not found for this media import.")
    quota_error = await reserve_media_minutes(owner, minutes, session)
    if quota_error:
        raise RuntimeError(quota_error)

    # 3. Window → chunk → embed (identical downstream to document ingest).
    pages, starts, ends = _build_windows(fetched.segments)
    chunks = await asyncio.to_thread(chunk_pages, pages)
    if not chunks:
        raise RuntimeError("Transcript parsed but produced no chunks.")
    log.info("media ingest produced %d chunks for %s", len(chunks), book.id)

    if not book.source_language and fetched.language_code:
        book.source_language = fetched.language_code[:8]

    embeddings = await embed_documents([c.text for c in chunks])
    if len(embeddings) != len(chunks):
        raise RuntimeError(
            f"Embedding count {len(embeddings)} != chunk count {len(chunks)}"
        )

    # Replace any prior chunks (idempotent re-ingest).
    await session.execute(delete(Chunk).where(Chunk.book_id == book.id))

    n_windows = len(starts)
    rows: list[Chunk] = []
    for i, (c, emb) in enumerate(zip(chunks, embeddings, strict=True)):
        # chunk_pages records page_start/page_end as 1-based window numbers;
        # translate those back into the window time bounds. Store on the time
        # columns and leave page_start/page_end NULL for media.
        ts = starts[c.page_start - 1] if c.page_start and 1 <= c.page_start <= n_windows else None
        te = ends[c.page_end - 1] if c.page_end and 1 <= c.page_end <= n_windows else None
        rows.append(
            Chunk(
                book_id=book.id,
                ordinal=i,
                page_start=None,
                page_end=None,
                time_start_seconds=ts,
                time_end_seconds=te,
                text=c.text,
                token_count=c.token_count,
                embedding=emb,
            )
        )
    session.add_all(rows)

    book.duration_seconds = int(duration)
    book.status = BookStatus.ready
    book.error_message = None
    await session.commit()
    log.info(
        "media ingest done: book=%s chunks=%d duration=%ds",
        book.id, len(chunks), book.duration_seconds,
    )
