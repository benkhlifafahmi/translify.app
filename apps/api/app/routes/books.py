"""Books API — upload, list, retrieve, delete."""
from __future__ import annotations

import io
import logging
import os
import uuid
from datetime import timedelta

from botocore.exceptions import ClientError
from fastapi import APIRouter, Depends, HTTPException, Path, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app import upload_session
from app.auth.models import User
from app.auth.users import current_active_user
from app.billing.quota import reserve_book_upload
from app.config import settings
from app.db import get_async_session
from app.models.book import Book, BookFormat, BookStatus
from app.schemas.book import (
    BookRead,
    BookUpdate,
    FinalizeUploadRequest,
    UploadUrlRequest,
    UploadUrlResponse,
)
from app.schemas.translation import FileUrlResponse
from app.storage import get_s3_client, presigned_get_url, presigned_put_url
from app.workers.jobs import process_book
from app.workers.queue import QUEUE_INGEST, get_queue

log = logging.getLogger(__name__)

router = APIRouter(prefix="/books", tags=["books"])

UPLOAD_URL_EXPIRY = timedelta(minutes=15)
FILE_URL_EXPIRY = timedelta(hours=1)

_FORMAT_BY_CONTENT_TYPE: dict[str, BookFormat] = {
    "application/pdf": BookFormat.pdf,
    "application/x-pdf": BookFormat.pdf,
    "application/epub+zip": BookFormat.epub,
    "application/epub": BookFormat.epub,
}

_FORMAT_BY_EXT: dict[str, BookFormat] = {
    ".pdf": BookFormat.pdf,
    ".epub": BookFormat.epub,
}


def _detect_format(content_type: str, filename: str) -> BookFormat:
    fmt = _FORMAT_BY_CONTENT_TYPE.get(content_type.lower())
    if fmt is not None:
        return fmt
    ext = os.path.splitext(filename)[1].lower()
    fmt = _FORMAT_BY_EXT.get(ext)
    if fmt is not None:
        return fmt
    raise HTTPException(
        status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
        detail="Only PDF and EPUB files are supported.",
    )


def _default_title(filename: str) -> str:
    base = os.path.basename(filename)
    name, _ = os.path.splitext(base)
    return (name.strip() or "Untitled")[:500]


# 1 KB is roughly 0.5 pages of EPUB body (HTML+CSS overhead included). This is
# a rough estimate used only for the upload-time quota gate; the real page
# count for EPUBs is set during ingestion based on chunk page boundaries.
_EPUB_BYTES_PER_PAGE_ESTIMATE = 2_000


def _peek_page_count(fmt: BookFormat, file_key: str, expected_size: int) -> int:
    """Return a best-effort page count without parsing the full document.

    For PDFs we read the metadata via pypdf, which is fast (no text extraction).
    For EPUBs we fall back to a size-based estimate — the ingestion pipeline
    will overwrite ``Book.page_count`` with the chunk-derived value later.
    """
    if fmt is BookFormat.epub:
        return max(1, expected_size // _EPUB_BYTES_PER_PAGE_ESTIMATE)

    try:
        from pypdf import PdfReader  # local import: heavy dep
        s3 = get_s3_client()
        obj = s3.get_object(Bucket=settings.minio_bucket, Key=file_key)
        data = obj["Body"].read()
        reader = PdfReader(io.BytesIO(data))
        return max(1, len(reader.pages))
    except Exception:
        log.exception("page-count peek failed for key=%s — falling back", file_key)
        return max(1, expected_size // _EPUB_BYTES_PER_PAGE_ESTIMATE)


async def _get_owned_book(
    book_id: uuid.UUID, user: User, session: AsyncSession
) -> Book:
    result = await session.execute(
        select(Book).where(Book.id == book_id, Book.user_id == user.id)
    )
    book = result.scalar_one_or_none()
    if book is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Book not found")
    return book


@router.get("", response_model=list[BookRead])
async def list_books(
    user: User = Depends(current_active_user),
    session: AsyncSession = Depends(get_async_session),
) -> list[Book]:
    result = await session.execute(
        select(Book).where(Book.user_id == user.id).order_by(Book.created_at.desc())
    )
    return list(result.scalars().all())


@router.get("/{book_id}", response_model=BookRead)
async def get_book(
    book_id: uuid.UUID = Path(...),
    user: User = Depends(current_active_user),
    session: AsyncSession = Depends(get_async_session),
) -> Book:
    return await _get_owned_book(book_id, user, session)


@router.get("/{book_id}/file-url", response_model=FileUrlResponse)
async def get_book_file_url(
    book_id: uuid.UUID = Path(...),
    user: User = Depends(current_active_user),
    session: AsyncSession = Depends(get_async_session),
) -> FileUrlResponse:
    book = await _get_owned_book(book_id, user, session)
    url = presigned_get_url(book.file_key, expires=FILE_URL_EXPIRY)
    return FileUrlResponse(
        url=url, expires_in_seconds=int(FILE_URL_EXPIRY.total_seconds())
    )


@router.post("/upload-url", response_model=UploadUrlResponse)
async def create_upload_url(
    payload: UploadUrlRequest,
    user: User = Depends(current_active_user),
) -> UploadUrlResponse:
    fmt = _detect_format(payload.content_type, payload.filename)
    upload_id, file_key = upload_session.reserve(
        user_id=str(user.id),
        filename=payload.filename,
        content_type=payload.content_type,
        size_bytes=payload.size_bytes,
        format_=fmt.value,
    )
    url = presigned_put_url(file_key, payload.content_type, expires=UPLOAD_URL_EXPIRY)
    return UploadUrlResponse(
        upload_id=upload_id,
        upload_url=url,
        file_key=file_key,
        format=fmt,
        expires_in_seconds=int(UPLOAD_URL_EXPIRY.total_seconds()),
    )


@router.post("/finalize", response_model=BookRead, status_code=status.HTTP_201_CREATED)
async def finalize_upload(
    payload: FinalizeUploadRequest,
    user: User = Depends(current_active_user),
    session: AsyncSession = Depends(get_async_session),
) -> Book:
    pending = upload_session.get(payload.upload_id)
    if pending is None or pending["user_id"] != str(user.id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Upload not found")

    s3 = get_s3_client()
    try:
        head = s3.head_object(Bucket=settings.minio_bucket, Key=pending["file_key"])
    except ClientError as exc:
        code = exc.response.get("Error", {}).get("Code")
        if code in {"404", "NoSuchKey", "NotFound"}:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Upload was not received by storage. Please retry.",
            ) from exc
        log.exception("head_object failed for %s", pending["file_key"])
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Storage backend error.",
        ) from exc

    actual_size = int(head.get("ContentLength", 0))
    expected_size = int(pending["size_bytes"])
    if actual_size != expected_size:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Uploaded size {actual_size} does not match reserved size {expected_size}.",
        )

    fmt = BookFormat(pending["format"])
    # Pre-quota: peek the page count without fully parsing. Quota gate uses it
    # to enforce both pages_per_month and max_pages_per_book.
    page_count = _peek_page_count(fmt, pending["file_key"], actual_size)

    # Plan + quota gate — raises 402 with structured detail when over limit.
    await reserve_book_upload(user, page_count, session)

    book = Book(
        user_id=user.id,
        title=(payload.title or _default_title(pending["filename"])).strip() or "Untitled",
        author=(payload.author or None),
        source_language=payload.source_language,
        format=fmt,
        file_key=pending["file_key"],
        file_size_bytes=actual_size,
        page_count=page_count,
        status=BookStatus.uploaded,
    )
    session.add(book)
    await session.commit()
    await session.refresh(book)

    upload_session.consume(payload.upload_id)

    get_queue(QUEUE_INGEST).enqueue(
        process_book,
        str(book.id),
        job_id=f"process_book_{book.id}",
        job_timeout=60 * 60,  # 1 hour
        result_ttl=60 * 60,
        failure_ttl=24 * 60 * 60,
    )

    return book


@router.patch("/{book_id}", response_model=BookRead)
async def update_book(
    payload: BookUpdate,
    book_id: uuid.UUID = Path(...),
    user: User = Depends(current_active_user),
    session: AsyncSession = Depends(get_async_session),
) -> Book:
    book = await _get_owned_book(book_id, user, session)
    data = payload.model_dump(exclude_unset=True)
    for k, v in data.items():
        setattr(book, k, v)
    await session.commit()
    await session.refresh(book)
    return book


@router.delete("/{book_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_book(
    book_id: uuid.UUID = Path(...),
    user: User = Depends(current_active_user),
    session: AsyncSession = Depends(get_async_session),
) -> None:
    book = await _get_owned_book(book_id, user, session)
    file_key = book.file_key
    await session.delete(book)
    await session.commit()

    try:
        get_s3_client().delete_object(Bucket=settings.minio_bucket, Key=file_key)
    except ClientError:
        log.exception("Failed to delete object %s from storage", file_key)
