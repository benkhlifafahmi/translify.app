"""Job functions called by RQ workers."""
from __future__ import annotations

import asyncio
import logging

log = logging.getLogger(__name__)


def process_book(book_id: str) -> None:
    """Parse PDF/EPUB → chunk → embed → mark book ready."""
    from app.ingest.pipeline import process_book_async

    asyncio.run(process_book_async(book_id))


def translate_book(translation_id: str) -> None:
    """Translate a book and store the rendered output."""
    from app.translation.pipeline import run_translation_async

    asyncio.run(run_translation_async(translation_id))


def process_media(book_id: str) -> None:
    """Fetch a media transcript (YouTube captions) → chunk → embed → ready."""
    from app.ingest.media_pipeline import process_media_async

    asyncio.run(process_media_async(book_id))
