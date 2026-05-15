"""End-to-end book ingestion: download → parse → chunk → embed → persist."""
from __future__ import annotations

import asyncio
import logging
import uuid

from sqlalchemy import delete
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

import app.auth.models  # noqa: F401 — register User mapper so FK to users.id resolves
import app.models  # noqa: F401 — register all other mappers
from app.config import settings
from app.ingest.chunker import chunk_pages
from app.ingest.embeddings import embed_documents
from app.ingest.language import detect_language
from app.ingest.parsers import parse
from app.models.book import Book, BookStatus
from app.models.chunk import Chunk
from app.storage import get_object_bytes

log = logging.getLogger(__name__)


async def process_book_async(book_id: str) -> None:
    bid = uuid.UUID(book_id)

    engine = create_async_engine(settings.async_postgres_dsn, pool_pre_ping=True)
    session_maker = async_sessionmaker(engine, expire_on_commit=False)
    try:
        async with session_maker() as session:
            book = await session.get(Book, bid)
            if book is None:
                log.warning("process_book: %s not found", book_id)
                return

            book.status = BookStatus.processing
            book.error_message = None
            await session.commit()

            try:
                await _run(session, book)
            except Exception as exc:
                log.exception("process_book failed for %s", book_id)
                # If _run failed inside a commit, the session is in a
                # ``PendingRollbackError`` state and the next commit would
                # raise too — leaving the book stuck in ``processing``.
                # Roll back, then re-fetch the row in a clean state before
                # marking it failed so the user actually sees the error.
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
    log.info("ingest start: book=%s key=%s", book.id, book.file_key)

    file_bytes = await asyncio.to_thread(get_object_bytes, book.file_key)
    log.info("ingest downloaded %d bytes for %s", len(file_bytes), book.id)

    pages = await asyncio.to_thread(parse, file_bytes, book.format)
    if not any(p.text.strip() for p in pages):
        raise RuntimeError(
            "No readable text found in this document. "
            "Scanned or image-only PDFs aren't supported yet — please upload a text-based file."
        )

    chunks = await asyncio.to_thread(chunk_pages, pages)
    if not chunks:
        raise RuntimeError("Document parsed but produced no chunks.")
    log.info("ingest produced %d chunks for %s", len(chunks), book.id)

    if not book.source_language:
        detected = await asyncio.to_thread(detect_language, (p.text for p in pages))
        if detected:
            book.source_language = detected
            log.info("ingest detected language=%s for %s", detected, book.id)

    embeddings = await embed_documents([c.text for c in chunks])
    if len(embeddings) != len(chunks):
        raise RuntimeError(
            f"Embedding count {len(embeddings)} != chunk count {len(chunks)}"
        )

    # Replace any prior chunks (idempotent re-ingest).
    await session.execute(delete(Chunk).where(Chunk.book_id == book.id))

    session.add_all(
        Chunk(
            book_id=book.id,
            ordinal=i,
            page_start=c.page_start,
            page_end=c.page_end,
            text=c.text,
            token_count=c.token_count,
            embedding=emb,
        )
        for i, (c, emb) in enumerate(zip(chunks, embeddings, strict=True))
    )

    book.page_count = pages[-1].number
    book.status = BookStatus.ready
    book.error_message = None
    await session.commit()
    log.info("ingest done: book=%s chunks=%d pages=%d", book.id, len(chunks), book.page_count)
