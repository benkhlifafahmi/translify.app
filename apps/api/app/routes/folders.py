"""Folder CRUD + cover-upload + book-assignment routes.

Folders are personal shelves. Each user organises their library by creating
folders with a colour, emoji, and optional cover image, then dragging books
into them. ``Book.folder_id = NULL`` puts the book on the "Unsorted" shelf
that lives implicitly at the top of the library.
"""
from __future__ import annotations

import logging
import uuid
from datetime import timedelta

from fastapi import APIRouter, Depends, HTTPException, Path, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.models import User
from app.auth.users import current_active_user
from app.db import get_async_session
from app.models.book import Book
from app.models.folder import Folder
from app.schemas.folder import (
    FolderCoverUrlRequest,
    FolderCoverUrlResponse,
    FolderCreate,
    FolderRead,
    FolderReorderRequest,
    FolderUpdate,
)
from app.storage import presigned_get_url, presigned_put_url

log = logging.getLogger(__name__)

router = APIRouter(prefix="/folders", tags=["folders"])

COVER_UPLOAD_EXPIRY = timedelta(minutes=15)
COVER_GET_EXPIRY = timedelta(hours=24)

# Allowed cover-image MIME types — anything else gets a 415.
_ALLOWED_COVER_MIME = {
    "image/png", "image/jpeg", "image/jpg", "image/webp", "image/gif",
}


async def _owned_folder(
    folder_id: uuid.UUID, user: User, session: AsyncSession
) -> Folder:
    row = await session.execute(
        select(Folder).where(Folder.id == folder_id, Folder.user_id == user.id)
    )
    folder = row.scalar_one_or_none()
    if folder is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Folder not found."
        )
    return folder


def _to_read(folder: Folder, book_count: int) -> FolderRead:
    cover_url = (
        presigned_get_url(folder.cover_image_key, expires=COVER_GET_EXPIRY)
        if folder.cover_image_key else None
    )
    return FolderRead(
        id=folder.id,
        name=folder.name,
        color=folder.color,
        emoji=folder.emoji,
        cover_image_key=folder.cover_image_key,
        cover_url=cover_url,
        position=folder.position,
        book_count=book_count,
        created_at=folder.created_at,
        updated_at=folder.updated_at,
    )


@router.get("", response_model=list[FolderRead])
async def list_folders(
    user: User = Depends(current_active_user),
    session: AsyncSession = Depends(get_async_session),
) -> list[FolderRead]:
    """All folders for the current user, ordered by position then name."""
    # Pull folders + per-folder book counts in one round-trip.
    counts_q = await session.execute(
        select(Book.folder_id, func.count(Book.id))
        .where(Book.user_id == user.id, Book.folder_id.is_not(None))
        .group_by(Book.folder_id)
    )
    counts: dict[uuid.UUID, int] = {fid: int(c) for fid, c in counts_q.all() if fid}

    rows = await session.execute(
        select(Folder)
        .where(Folder.user_id == user.id)
        .order_by(Folder.position.asc(), Folder.name.asc())
    )
    folders = list(rows.scalars().all())
    return [_to_read(f, counts.get(f.id, 0)) for f in folders]


@router.post(
    "",
    response_model=FolderRead,
    status_code=status.HTTP_201_CREATED,
)
async def create_folder(
    payload: FolderCreate,
    user: User = Depends(current_active_user),
    session: AsyncSession = Depends(get_async_session),
) -> FolderRead:
    """Create a new folder at the bottom of the user's library."""
    # New folders go after existing ones so we don't disrupt the order.
    max_pos = await session.scalar(
        select(func.coalesce(func.max(Folder.position), -1)).where(
            Folder.user_id == user.id
        )
    )
    folder = Folder(
        user_id=user.id,
        name=payload.name.strip(),
        color=payload.color.strip(),
        emoji=payload.emoji.strip(),
        position=int(max_pos or -1) + 1,
    )
    session.add(folder)
    await session.commit()
    await session.refresh(folder)
    return _to_read(folder, book_count=0)


@router.patch("/{folder_id}", response_model=FolderRead)
async def update_folder(
    payload: FolderUpdate,
    folder_id: uuid.UUID = Path(...),
    user: User = Depends(current_active_user),
    session: AsyncSession = Depends(get_async_session),
) -> FolderRead:
    folder = await _owned_folder(folder_id, user, session)

    if payload.name is not None:
        folder.name = payload.name.strip()
    if payload.color is not None:
        folder.color = payload.color.strip()
    if payload.emoji is not None:
        folder.emoji = payload.emoji.strip()
    if payload.cover_image_key is not None:
        # Empty string is the documented "clear the cover" signal.
        folder.cover_image_key = payload.cover_image_key.strip() or None

    await session.commit()
    await session.refresh(folder)

    count = await session.scalar(
        select(func.count(Book.id)).where(
            Book.user_id == user.id, Book.folder_id == folder.id
        )
    ) or 0
    return _to_read(folder, book_count=int(count))


@router.delete("/{folder_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_folder(
    folder_id: uuid.UUID = Path(...),
    user: User = Depends(current_active_user),
    session: AsyncSession = Depends(get_async_session),
) -> None:
    """Delete a folder. Books inside drop back to the unsorted shelf
    (``ON DELETE SET NULL`` on ``books.folder_id``)."""
    folder = await _owned_folder(folder_id, user, session)
    await session.delete(folder)
    await session.commit()


@router.post("/reorder", status_code=status.HTTP_204_NO_CONTENT)
async def reorder_folders(
    payload: FolderReorderRequest,
    user: User = Depends(current_active_user),
    session: AsyncSession = Depends(get_async_session),
) -> None:
    """Bulk-update folder positions. Only the user's own folders are
    touched; foreign ids in the payload are silently ignored."""
    ids = [item.id for item in payload.items]
    rows = await session.execute(
        select(Folder).where(Folder.user_id == user.id, Folder.id.in_(ids))
    )
    by_id: dict[uuid.UUID, Folder] = {f.id: f for f in rows.scalars().all()}
    for item in payload.items:
        f = by_id.get(item.id)
        if f is not None:
            f.position = int(item.position)
    await session.commit()


@router.post("/{folder_id}/cover-url", response_model=FolderCoverUrlResponse)
async def create_cover_upload_url(
    payload: FolderCoverUrlRequest,
    folder_id: uuid.UUID = Path(...),
    user: User = Depends(current_active_user),
    session: AsyncSession = Depends(get_async_session),
) -> FolderCoverUrlResponse:
    """Mint a presigned PUT URL the browser uploads the cover image to.

    The frontend uploads directly to MinIO, then calls
    ``PATCH /folders/{id}`` with ``cover_image_key`` set to the returned
    key to make the cover stick.
    """
    folder = await _owned_folder(folder_id, user, session)

    content_type = payload.content_type.lower().strip()
    if content_type not in _ALLOWED_COVER_MIME:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="Cover must be a PNG, JPG, WebP, or GIF.",
        )

    ext = {
        "image/png": "png", "image/jpeg": "jpg", "image/jpg": "jpg",
        "image/webp": "webp", "image/gif": "gif",
    }[content_type]
    key = f"folder-covers/{user.id}/{folder.id}/{uuid.uuid4()}.{ext}"

    url = presigned_put_url(key, content_type=content_type, expires=COVER_UPLOAD_EXPIRY)
    return FolderCoverUrlResponse(
        upload_url=url,
        file_key=key,
        expires_in_seconds=int(COVER_UPLOAD_EXPIRY.total_seconds()),
    )
