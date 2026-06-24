"""Workspace sharing API.

A user can share a YouTube-course workspace as a public, view-only link.
Anyone with the link sees the video + study guide read-only (no chat, no
grading) and can "Save a copy" into their own library — which deep-copies the
transcript chunks + study guide so their copy is immediately interactive.

v1 is media (YouTube) courses only.
"""
from __future__ import annotations

import logging
import uuid

from fastapi import APIRouter, Depends, HTTPException, Path, status
from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.gate import require_non_anonymous
from app.auth.models import User
from app.auth.users import current_active_user, current_optional_user
from app.book_access import visible_to
from app.config import settings
from app.db import get_async_session
from app.emails import client as email_client
from app.emails import templates as email_templates
from app.models.book import Book, BookStatus
from app.models.study_guide import StudyGuide
from app.models.workspace_share import WorkspaceShare
from app.schemas.book import BookRead
from app.schemas.share import InviteRequest, ShareInfo, SharedWorkspaceRead

log = logging.getLogger(__name__)

router = APIRouter(tags=["shares"])


def _share_url(slug: str) -> str:
    return f"{settings.web_public_url.rstrip('/')}/shared/{slug}"


async def _owned_media_book(
    book_id: uuid.UUID, user: User, session: AsyncSession
) -> Book:
    book = (
        await session.execute(select(Book).where(Book.id == book_id, visible_to(user)))
    ).scalar_one_or_none()
    if book is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Book not found")
    if not book.format.is_media:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only video courses can be shared for now.",
        )
    return book


async def _share_for_book(
    book_id: uuid.UUID, user: User, session: AsyncSession
) -> WorkspaceShare | None:
    return await session.scalar(
        select(WorkspaceShare).where(
            WorkspaceShare.book_id == book_id, WorkspaceShare.user_id == user.id
        )
    )


# ───────────────────────── Owner: manage the share ─────────────────────────


@router.get("/books/{book_id}/share", response_model=ShareInfo)
async def get_share(
    book_id: uuid.UUID = Path(...),
    user: User = Depends(current_active_user),
    session: AsyncSession = Depends(get_async_session),
) -> ShareInfo:
    await _owned_media_book(book_id, user, session)
    share = await _share_for_book(book_id, user, session)
    if share is None:
        return ShareInfo(shared=False)
    return ShareInfo(shared=True, slug=share.slug, url=_share_url(share.slug))


@router.post(
    "/books/{book_id}/share", response_model=ShareInfo, status_code=status.HTTP_201_CREATED
)
async def create_share(
    book_id: uuid.UUID = Path(...),
    user: User = Depends(current_active_user),
    session: AsyncSession = Depends(get_async_session),
) -> ShareInfo:
    book = await _owned_media_book(book_id, user, session)
    require_non_anonymous(user, action="share")

    share = await _share_for_book(book_id, user, session)
    if share is None:
        share = WorkspaceShare(book_id=book.id, user_id=user.id)
        session.add(share)
        await session.commit()
        await session.refresh(share)
    return ShareInfo(shared=True, slug=share.slug, url=_share_url(share.slug))


async def _ensure_share(book: Book, user: User, session: AsyncSession) -> WorkspaceShare:
    share = await _share_for_book(book.id, user, session)
    if share is None:
        share = WorkspaceShare(book_id=book.id, user_id=user.id)
        session.add(share)
        await session.commit()
        await session.refresh(share)
    return share


@router.post("/books/{book_id}/share/invite", response_model=ShareInfo)
async def invite_to_share(
    payload: InviteRequest,
    book_id: uuid.UUID = Path(...),
    user: User = Depends(current_active_user),
    session: AsyncSession = Depends(get_async_session),
) -> ShareInfo:
    """Email the public share link to up to 10 people. Creates the share if it
    doesn't exist yet, so the owner can invite in one step."""
    book = await _owned_media_book(book_id, user, session)
    require_non_anonymous(user, action="invite")

    share = await _ensure_share(book, user, session)
    url = _share_url(share.slug)
    subject, html_body, text_body = email_templates.course_invite(
        inviter_name=user.display_name,
        course_title=book.title,
        share_url=url,
    )

    sent: set[str] = set()
    for raw in payload.emails:
        email = str(raw).lower().strip()
        if not email or email in sent:
            continue
        sent.add(email)
        # Best-effort: a Resend hiccup on one address shouldn't fail the batch.
        await email_client.send(
            to=email,
            subject=subject,
            html=html_body,
            text=text_body,
            tag="course-invite",
        )
    log.info("invited %d email(s) to shared course %s", len(sent), share.slug)
    return ShareInfo(shared=True, slug=share.slug, url=url)


@router.delete("/books/{book_id}/share", status_code=status.HTTP_204_NO_CONTENT)
async def revoke_share(
    book_id: uuid.UUID = Path(...),
    user: User = Depends(current_active_user),
    session: AsyncSession = Depends(get_async_session),
) -> None:
    await _owned_media_book(book_id, user, session)
    share = await _share_for_book(book_id, user, session)
    if share is not None:
        await session.delete(share)
        await session.commit()


# ───────────────────────── Public: view + save a copy ─────────────────────────


async def _load_share(slug: str, session: AsyncSession) -> tuple[WorkspaceShare, Book]:
    share = await session.scalar(select(WorkspaceShare).where(WorkspaceShare.slug == slug))
    if share is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Shared course not found")
    book = await session.get(Book, share.book_id)
    if book is None or not book.format.is_media:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Shared course not found")
    return share, book


@router.get("/shared/{slug}", response_model=SharedWorkspaceRead)
async def get_shared_workspace(
    slug: str = Path(..., min_length=4, max_length=24),
    _viewer: User | None = Depends(current_optional_user),
    session: AsyncSession = Depends(get_async_session),
) -> SharedWorkspaceRead:
    """Public, no-auth: the video + the owner's study guide, read-only."""
    share, book = await _load_share(slug, session)
    guide = await session.scalar(
        select(StudyGuide).where(
            StudyGuide.book_id == book.id, StudyGuide.user_id == share.user_id
        )
    )
    sections = guide.sections if guide is not None else []
    return SharedWorkspaceRead(
        title=book.title,
        author=book.author,
        source_url=book.source_url,
        duration_seconds=book.duration_seconds,
        sections=sections,
    )


@router.post(
    "/shared/{slug}/save", response_model=BookRead, status_code=status.HTTP_201_CREATED
)
async def save_shared_copy(
    slug: str = Path(..., min_length=4, max_length=24),
    user: User = Depends(current_active_user),
    session: AsyncSession = Depends(get_async_session),
) -> Book:
    """Clone a shared course into the current user's library — deep-copying the
    transcript chunks (with embeddings + timestamps) and the study guide so the
    copy works immediately, with no re-fetch or LLM call."""
    require_non_anonymous(user, action="save")
    share, source = await _load_share(slug, session)

    clone = Book(
        user_id=user.id,
        title=source.title,
        author=source.author,
        source_language=source.source_language,
        format=source.format,
        file_key=None,
        file_size_bytes=None,
        source_url=source.source_url,
        duration_seconds=source.duration_seconds,
        status=BookStatus.ready,
    )
    session.add(clone)
    await session.flush()  # populate clone.id for the chunk copy

    # Bulk-copy chunks — text + timestamps + pgvector embeddings. Pure SQL.
    await session.execute(
        text(
            """
            INSERT INTO chunks (
                id, book_id, ordinal, page_start, page_end,
                time_start_seconds, time_end_seconds,
                text, token_count, embedding, created_at
            )
            SELECT
                gen_random_uuid(), :clone_id, ordinal, page_start, page_end,
                time_start_seconds, time_end_seconds,
                text, token_count, embedding, NOW()
            FROM chunks
            WHERE book_id = :source_id
            """
        ),
        {"clone_id": clone.id, "source_id": source.id},
    )

    # Copy the owner's study guide so the saved copy is interactive right away.
    src_guide = await session.scalar(
        select(StudyGuide).where(
            StudyGuide.book_id == source.id, StudyGuide.user_id == share.user_id
        )
    )
    if src_guide is not None:
        session.add(
            StudyGuide(book_id=clone.id, user_id=user.id, sections=src_guide.sections)
        )

    await session.commit()
    await session.refresh(clone)
    log.info("saved shared course %s → book %s for user %s", slug, clone.id, user.id)
    return clone
