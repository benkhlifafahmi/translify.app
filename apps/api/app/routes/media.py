"""Media API — import a YouTube video as a study-able book.

v1 builds the book from the video's existing captions (no audio download /
speech-to-text). The heavy work — transcript fetch, chunk, embed — runs in the
background ``process_media`` job, exactly like a document upload, so this route
returns immediately with an ``uploaded`` book the client polls until ``ready``.
Quota (transcription minutes) and no-captions failures surface as the book's
``status=failed`` + ``error_message``, mirroring the document upload flow.
"""
from __future__ import annotations

import logging

import httpx
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.gate import require_non_anonymous
from app.auth.models import User
from app.auth.users import current_active_user
from app.billing.plans import Plan, quota_for
from app.billing.service import get_or_create_subscription
from app.db import get_async_session
from app.ingest.transcription import canonical_watch_url, extract_video_id
from app.models.book import Book, BookFormat, BookStatus
from app.schemas.book import BookRead, YouTubeImportRequest
from app.workers.jobs import process_media
from app.workers.queue import QUEUE_INGEST, queue_for

log = logging.getLogger(__name__)

router = APIRouter(prefix="/media", tags=["media"])

_OEMBED_URL = "https://www.youtube.com/oembed"
_OEMBED_TIMEOUT = 3.0
_DEFAULT_TITLE = "YouTube video"


async def _fetch_oembed(watch_url: str) -> tuple[str | None, str | None]:
    """Best-effort title + channel via YouTube's oEmbed endpoint.

    Never raises — a missing title just falls back to a generic one. Keeps the
    import working even if oEmbed is down or the video blocks it.
    """
    try:
        async with httpx.AsyncClient(timeout=_OEMBED_TIMEOUT) as client:
            resp = await client.get(
                _OEMBED_URL, params={"url": watch_url, "format": "json"}
            )
            resp.raise_for_status()
            data = resp.json()
        title = (data.get("title") or "").strip() or None
        author = (data.get("author_name") or "").strip() or None
        return title[:500] if title else None, author[:500] if author else None
    except Exception as exc:
        log.info("oEmbed lookup failed for %s: %s", watch_url, exc)
        return None, None


@router.post(
    "/youtube", response_model=BookRead, status_code=status.HTTP_201_CREATED
)
async def import_youtube(
    payload: YouTubeImportRequest,
    user: User = Depends(current_active_user),
    session: AsyncSession = Depends(get_async_session),
) -> Book:
    require_non_anonymous(user, action="import")

    video_id = extract_video_id(payload.url)
    if not video_id:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="That doesn't look like a YouTube link. Paste a youtube.com or youtu.be URL.",
        )

    watch_url = canonical_watch_url(video_id)
    title, author = await _fetch_oembed(watch_url)

    # Resolve the queue priority from the user's plan (the minutes quota itself
    # is enforced in the worker once we know the video's real duration).
    sub = await get_or_create_subscription(user, session)
    priority = quota_for(Plan(sub.plan)).priority_queue

    book = Book(
        user_id=user.id,
        title=title or _DEFAULT_TITLE,
        author=author,
        source_language=payload.source_language,
        format=BookFormat.youtube,
        file_key=None,
        file_size_bytes=None,
        source_url=watch_url,
        status=BookStatus.uploaded,
    )
    session.add(book)
    await session.commit()
    await session.refresh(book)

    queue_for(QUEUE_INGEST, priority=priority).enqueue(
        process_media,
        str(book.id),
        job_id=f"process_media_{book.id}",
        job_timeout=30 * 60,  # 30 min — captions ingest is light vs. a textbook
        result_ttl=60 * 60,
        failure_ttl=24 * 60 * 60,
    )

    return book
