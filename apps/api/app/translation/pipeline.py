"""Translation worker pipeline: load → translate → store output → mark ready."""
from __future__ import annotations

import asyncio
import logging
import uuid
from datetime import datetime, timezone

from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

import app.auth.models  # noqa: F401
import app.models  # noqa: F401
from app.config import settings
from app.models.book import Book, BookFormat
from app.models.translation import Translation, TranslationStatus
from app.storage import get_object_bytes, put_object_bytes
from app.translation.epub import translate_epub
from app.translation.pdf import translate_pdf

log = logging.getLogger(__name__)


async def run_translation_async(translation_id: str) -> None:
    tid = uuid.UUID(translation_id)

    engine = create_async_engine(settings.async_postgres_dsn, pool_pre_ping=True)
    session_maker = async_sessionmaker(engine, expire_on_commit=False)
    try:
        async with session_maker() as session:
            translation = await session.get(Translation, tid)
            if translation is None:
                log.warning("run_translation: %s not found", translation_id)
                return
            book = await session.get(Book, translation.book_id)
            if book is None:
                raise RuntimeError(f"Book {translation.book_id} missing for translation")

            translation.status = TranslationStatus.in_progress
            translation.error_message = None
            await session.commit()

            try:
                await _run(session, translation, book)
            except Exception as exc:
                log.exception("translation failed: %s", translation_id)
                translation.status = TranslationStatus.failed
                translation.error_message = str(exc)[:1000]
                await session.commit()
                raise
    finally:
        await engine.dispose()


async def _run(session, translation: Translation, book: Book) -> None:
    log.info(
        "translation start: book=%s translation=%s target=%s",
        book.id,
        translation.id,
        translation.target_language,
    )
    file_bytes = await asyncio.to_thread(get_object_bytes, book.file_key)

    if book.format is BookFormat.pdf:
        out_bytes = await translate_pdf(
            file_bytes,
            source_lang=book.source_language,
            target_lang=translation.target_language,
        )
        ext = "pdf"
        content_type = "application/pdf"
    elif book.format is BookFormat.epub:
        out_bytes = await translate_epub(
            file_bytes,
            source_lang=book.source_language,
            target_lang=translation.target_language,
        )
        ext = "epub"
        content_type = "application/epub+zip"
    else:
        raise RuntimeError(f"Unsupported book format: {book.format}")

    output_key = f"translations/{book.user_id}/{book.id}/{translation.id}.{ext}"
    await asyncio.to_thread(put_object_bytes, output_key, out_bytes, content_type)

    translation.output_file_key = output_key
    translation.output_format = ext
    translation.status = TranslationStatus.ready
    translation.progress_pct = 100
    translation.completed_at = datetime.now(timezone.utc)
    await session.commit()
    log.info("translation done: %s -> %s (%d bytes)", translation.id, output_key, len(out_bytes))
