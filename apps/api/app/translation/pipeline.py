"""Translation worker pipeline: load → translate → store output → mark ready."""
from __future__ import annotations

import asyncio
import logging
import uuid
from datetime import datetime, timezone

from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

import app.auth.models  # noqa: F401
import app.models  # noqa: F401
from app.auth.models import User
from app.billing.plans import Plan, quota_for
from app.billing.service import get_or_create_subscription
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
    # Look up the user's plan to decide which translation engine to use.
    # Scholar / Family get the Sonnet-quality literary path; Reader / Free
    # use Gemini Flash (~5x cheaper, quality comparable for prose).
    literary = await _user_gets_literary(session, book.user_id)

    log.info(
        "translation start: book=%s translation=%s target=%s literary=%s",
        book.id,
        translation.id,
        translation.target_language,
        literary,
    )
    file_bytes = await asyncio.to_thread(get_object_bytes, book.file_key)

    if book.format is BookFormat.pdf:
        out_bytes = await translate_pdf(
            file_bytes,
            source_lang=book.source_language,
            target_lang=translation.target_language,
            literary=literary,
        )
        ext = "pdf"
        content_type = "application/pdf"
    elif book.format is BookFormat.epub:
        out_bytes = await translate_epub(
            file_bytes,
            source_lang=book.source_language,
            target_lang=translation.target_language,
            literary=literary,
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


async def _user_gets_literary(session, user_id) -> bool:
    """Return True if the user's plan includes the literary-translation flag.

    Defaults to False on any error (missing user, no subscription) — we'd
    rather translate cheaply than fail the job because of a billing edge.
    """
    try:
        user = await session.get(User, user_id)
        if user is None:
            return False
        sub = await get_or_create_subscription(user, session)
        plan = Plan(sub.plan)
        return quota_for(plan).literary_translation
    except Exception:
        log.warning("could not determine plan for user=%s; using standard engine", user_id)
        return False
