"""Social API: profiles, posts (polymorphic), follows, feed, discover, search.

Design notes:

  - Posts are public by default. ``visibility=private`` keeps a row in the
    timeline of the author only; ``followers`` is reserved for V2.
  - The home feed (``GET /feed``) is "followed authors + self", ordered by
    ``created_at DESC``. Cheap; works without a follow graph until ~10k
    follows per user.
  - The discover feed (``GET /discover``) is "public posts in the last
    14 days, newest first". Editorial / popularity ranking is V2; recency
    is sufficient at launch.
  - Username search uses Postgres ILIKE on (username, display_name). pg_trgm
    works too but isn't needed at our scale yet.
  - Anonymous (ghost) users cannot post. Username claim is gated behind
    ``require_non_anonymous``.

Cross-cutting:

  - All quoted posts (sentence + passage) carry a per-user per-book ceiling
    of 10 public quoted posts. Enforced here, not at the DB level.
  - Soft limits: 20 public posts per user per rolling 24h.
"""
from __future__ import annotations

import logging
import uuid
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Path, Query, status
from sqlalchemy import and_, delete, exists, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.gate import require_non_anonymous
from app.auth.models import User
from app.auth.users import current_active_user, current_optional_user
from app.db import get_async_session
from app.models.book import Book
from app.models.social import Follow, Milestone, Post, PostType, PostVisibility
from app.schemas.social import (
    FollowStatus,
    MilestoneRead,
    MilestoneShareRequest,
    PostAuthor,
    PostCreate,
    PostRead,
    ProfilePatch,
    PublicProfile,
    UserSearchResult,
    UsernameClaim,
)
from app.services.milestones import share_milestone

log = logging.getLogger(__name__)

router = APIRouter(prefix="/social", tags=["social"])


PUBLIC_QUOTED_POSTS_PER_BOOK = 10
PUBLIC_POSTS_PER_DAY = 20
DISCOVER_WINDOW = timedelta(days=14)
FEED_PAGE_SIZE = 30


# ─── helpers ──────────────────────────────────────────────────────────────────


async def _hydrate(
    posts: list[Post], session: AsyncSession, viewer: User | None
) -> list[PostRead]:
    """Attach author + book title/author + viewer-relative fields to a batch."""
    if not posts:
        return []

    user_ids = {p.user_id for p in posts}
    book_ids = {p.book_id for p in posts if p.book_id is not None}

    authors: dict[uuid.UUID, User] = {}
    if user_ids:
        # User has `oauth_accounts` as a joined eager-loaded collection, so
        # the result set duplicates per-user-per-oauth-row. .unique() dedups
        # before .scalars(); without it SQLAlchemy raises InvalidRequestError.
        rows = (
            await session.execute(select(User).where(User.id.in_(user_ids)))
        ).unique().scalars().all()
        authors = {u.id: u for u in rows}

    books: dict[uuid.UUID, Book] = {}
    if book_ids:
        rows = (
            await session.execute(select(Book).where(Book.id.in_(book_ids)))
        ).scalars().all()
        books = {b.id: b for b in rows}

    out: list[PostRead] = []
    for p in posts:
        author = authors.get(p.user_id)
        book = books.get(p.book_id) if p.book_id else None
        out.append(
            PostRead(
                id=p.id,
                type=p.type,
                payload=p.payload,
                book_id=p.book_id,
                highlight_id=p.highlight_id,
                source_lang=p.source_lang,
                target_lang=p.target_lang,
                note=p.note,
                visibility=p.visibility,
                share_slug=p.share_slug,
                created_at=p.created_at,
                author=(
                    PostAuthor(
                        id=author.id,
                        username=author.username,
                        display_name=author.display_name,
                        avatar_url=author.avatar_url,
                    )
                    if author
                    else None
                ),
                book_title=book.title if book else None,
                book_author=book.author if book else None,
            )
        )
    return out


async def _enforce_post_caps(
    user: User, payload: PostCreate, session: AsyncSession
) -> None:
    """Daily + per-book ceilings on public quoted posts."""
    if payload.visibility != PostVisibility.public:
        return

    # Daily ceiling on public posts of any type.
    since = datetime.now(timezone.utc) - timedelta(hours=24)
    day_count = (
        await session.execute(
            select(func.count(Post.id)).where(
                Post.user_id == user.id,
                Post.visibility == PostVisibility.public,
                Post.created_at >= since,
            )
        )
    ).scalar_one()
    if day_count >= PUBLIC_POSTS_PER_DAY:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="You've shared the maximum number of public posts today. Try again tomorrow.",
        )

    # Per-book ceiling on quoted material.
    is_quoted = payload.type in {PostType.sentence, PostType.passage}
    if is_quoted and getattr(payload, "book_id", None) is not None:
        book_count = (
            await session.execute(
                select(func.count(Post.id)).where(
                    Post.user_id == user.id,
                    Post.book_id == payload.book_id,
                    Post.type.in_([PostType.sentence, PostType.passage]),
                    Post.visibility == PostVisibility.public,
                )
            )
        ).scalar_one()
        if book_count >= PUBLIC_QUOTED_POSTS_PER_BOOK:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=(
                    "You've shared the maximum number of public quotes from this book. "
                    "Existing posts can stay; new public quotes from this book are paused."
                ),
            )


async def _profile_counters(
    user_id: uuid.UUID, session: AsyncSession, viewer_id: uuid.UUID | None
) -> tuple[int, int, int, bool]:
    """Return (post_count, follower_count, following_count, viewer_is_following)."""
    post_count = (
        await session.execute(
            select(func.count(Post.id)).where(
                Post.user_id == user_id, Post.visibility == PostVisibility.public
            )
        )
    ).scalar_one()
    follower_count = (
        await session.execute(
            select(func.count(Follow.id)).where(Follow.followed_id == user_id)
        )
    ).scalar_one()
    following_count = (
        await session.execute(
            select(func.count(Follow.id)).where(Follow.follower_id == user_id)
        )
    ).scalar_one()

    is_following = False
    if viewer_id and viewer_id != user_id:
        is_following = (
            await session.execute(
                select(
                    exists().where(
                        Follow.follower_id == viewer_id,
                        Follow.followed_id == user_id,
                    )
                )
            )
        ).scalar_one()

    return post_count, follower_count, following_count, is_following


async def _get_user_by_username(
    username: str, session: AsyncSession
) -> User:
    user = (
        await session.execute(
            select(User).where(func.lower(User.username) == username.lower())
        )
    ).unique().scalar_one_or_none()
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return user


# ─── Profile ──────────────────────────────────────────────────────────────────


@router.post("/profile/username", response_model=PublicProfile)
async def claim_username(
    body: UsernameClaim,
    user: User = Depends(current_active_user),
    session: AsyncSession = Depends(get_async_session),
) -> PublicProfile:
    """Claim a handle. One-shot; subsequent calls error unless the same user
    is re-confirming their own existing handle."""
    require_non_anonymous(user, action="claim_username")
    new = body.username  # already lowercased + validated
    if user.username == new:
        # Idempotent re-confirm
        pc, fc, gc, _ = await _profile_counters(user.id, session, user.id)
        return PublicProfile.model_validate(user).model_copy(
            update={"post_count": pc, "follower_count": fc, "following_count": gc}
        )

    # Anyone else holding the handle blocks the claim.
    taken = (
        await session.execute(
            select(User.id).where(func.lower(User.username) == new, User.id != user.id)
        )
    ).scalar_one_or_none()
    if taken is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail="That username is taken."
        )

    user.username = new
    await session.commit()
    await session.refresh(user)

    pc, fc, gc, _ = await _profile_counters(user.id, session, user.id)
    return PublicProfile.model_validate(user).model_copy(
        update={"post_count": pc, "follower_count": fc, "following_count": gc}
    )


@router.patch("/profile", response_model=PublicProfile)
async def patch_profile(
    body: ProfilePatch,
    user: User = Depends(current_active_user),
    session: AsyncSession = Depends(get_async_session),
) -> PublicProfile:
    if body.bio is not None:
        user.bio = body.bio.strip() or None
    if body.avatar_url is not None:
        user.avatar_url = body.avatar_url.strip() or None
    if body.profile_public is not None:
        user.profile_public = body.profile_public
    await session.commit()
    await session.refresh(user)

    pc, fc, gc, _ = await _profile_counters(user.id, session, user.id)
    return PublicProfile.model_validate(user).model_copy(
        update={"post_count": pc, "follower_count": fc, "following_count": gc}
    )


@router.get("/users/{username}", response_model=PublicProfile)
async def get_public_profile(
    username: str = Path(..., min_length=3, max_length=20),
    viewer: User | None = Depends(current_optional_user),
    session: AsyncSession = Depends(get_async_session),
) -> PublicProfile:
    user = await _get_user_by_username(username, session)
    if not user.profile_public and (viewer is None or viewer.id != user.id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    pc, fc, gc, follows = await _profile_counters(
        user.id, session, viewer.id if viewer else None
    )
    return PublicProfile.model_validate(user).model_copy(
        update={
            "post_count": pc,
            "follower_count": fc,
            "following_count": gc,
            "is_following": follows,
        }
    )


# ─── Posts ────────────────────────────────────────────────────────────────────


@router.post("/posts", response_model=PostRead, status_code=status.HTTP_201_CREATED)
async def create_post(
    body: PostCreate,
    user: User = Depends(current_active_user),
    session: AsyncSession = Depends(get_async_session),
) -> PostRead:
    require_non_anonymous(user, action="create_post")
    await _enforce_post_caps(user, body, session)

    # Strip the pydantic discriminator; SQLA column expects a plain dict for
    # the payload.
    payload_dict = body.payload.model_dump(mode="json")
    post = Post(
        user_id=user.id,
        type=body.type,
        payload=payload_dict,
        book_id=getattr(body, "book_id", None),
        highlight_id=getattr(body, "highlight_id", None),
        source_lang=getattr(body, "source_lang", None),
        target_lang=getattr(body, "target_lang", None),
        note=body.note,
        visibility=body.visibility,
    )
    session.add(post)
    await session.commit()
    await session.refresh(post)

    hydrated = await _hydrate([post], session, user)
    return hydrated[0]


@router.get("/posts/{slug}", response_model=PostRead)
async def get_post(
    slug: str = Path(..., min_length=4, max_length=16),
    viewer: User | None = Depends(current_optional_user),
    session: AsyncSession = Depends(get_async_session),
) -> PostRead:
    post = (
        await session.execute(select(Post).where(Post.share_slug == slug))
    ).scalar_one_or_none()
    if post is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found")
    # Private posts are visible only to the author.
    if post.visibility == PostVisibility.private and (viewer is None or viewer.id != post.user_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found")

    # Honor profile_public: if the author hid their profile, posts go with
    # them (except for the author themselves).
    author = (
        await session.execute(select(User).where(User.id == post.user_id))
    ).unique().scalar_one()
    if not author.profile_public and (viewer is None or viewer.id != author.id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found")

    hydrated = await _hydrate([post], session, viewer)
    return hydrated[0]


@router.delete("/posts/{post_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_post(
    post_id: uuid.UUID,
    user: User = Depends(current_active_user),
    session: AsyncSession = Depends(get_async_session),
) -> None:
    post = (
        await session.execute(
            select(Post).where(Post.id == post_id, Post.user_id == user.id)
        )
    ).scalar_one_or_none()
    if post is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found")
    await session.delete(post)
    await session.commit()


@router.get("/users/{username}/posts", response_model=list[PostRead])
async def list_user_posts(
    username: str = Path(..., min_length=3, max_length=20),
    type_filter: PostType | None = Query(default=None, alias="type"),
    cursor: datetime | None = Query(default=None, description="created_at < cursor"),
    limit: int = Query(default=FEED_PAGE_SIZE, ge=1, le=100),
    viewer: User | None = Depends(current_optional_user),
    session: AsyncSession = Depends(get_async_session),
) -> list[PostRead]:
    user = await _get_user_by_username(username, session)
    if not user.profile_public and (viewer is None or viewer.id != user.id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    is_self = viewer is not None and viewer.id == user.id
    q = select(Post).where(Post.user_id == user.id)
    if not is_self:
        q = q.where(Post.visibility == PostVisibility.public)
    if type_filter is not None:
        q = q.where(Post.type == type_filter)
    if cursor is not None:
        q = q.where(Post.created_at < cursor)
    q = q.order_by(Post.created_at.desc()).limit(limit)

    rows = (await session.execute(q)).scalars().all()
    return await _hydrate(list(rows), session, viewer)


# ─── Feed + Discover ──────────────────────────────────────────────────────────


@router.get("/feed", response_model=list[PostRead])
async def home_feed(
    cursor: datetime | None = Query(default=None),
    limit: int = Query(default=FEED_PAGE_SIZE, ge=1, le=100),
    user: User = Depends(current_active_user),
    session: AsyncSession = Depends(get_async_session),
) -> list[PostRead]:
    """Posts from people the viewer follows, plus their own. Public only."""
    followed_subq = select(Follow.followed_id).where(Follow.follower_id == user.id)
    q = (
        select(Post)
        .where(
            Post.visibility == PostVisibility.public,
            or_(
                Post.user_id == user.id,
                Post.user_id.in_(followed_subq),
            ),
        )
        .order_by(Post.created_at.desc())
        .limit(limit)
    )
    if cursor is not None:
        q = q.where(Post.created_at < cursor)
    rows = (await session.execute(q)).scalars().all()
    return await _hydrate(list(rows), session, user)


@router.get("/discover", response_model=list[PostRead])
async def discover_feed(
    cursor: datetime | None = Query(default=None),
    limit: int = Query(default=FEED_PAGE_SIZE, ge=1, le=100),
    type_filter: PostType | None = Query(default=None, alias="type"),
    viewer: User | None = Depends(current_optional_user),
    session: AsyncSession = Depends(get_async_session),
) -> list[PostRead]:
    """Recent public posts from public profiles. No-auth route."""
    cutoff = datetime.now(timezone.utc) - DISCOVER_WINDOW
    q = (
        select(Post)
        .join(User, User.id == Post.user_id)
        .where(
            Post.visibility == PostVisibility.public,
            Post.created_at >= cutoff,
            User.profile_public.is_(True),
        )
        .order_by(Post.created_at.desc())
        .limit(limit)
    )
    if cursor is not None:
        q = q.where(Post.created_at < cursor)
    if type_filter is not None:
        q = q.where(Post.type == type_filter)
    rows = (await session.execute(q)).scalars().all()
    return await _hydrate(list(rows), session, viewer)


# ─── Follow ───────────────────────────────────────────────────────────────────


@router.post("/follow/{user_id}", response_model=FollowStatus)
async def follow_user(
    user_id: uuid.UUID,
    user: User = Depends(current_active_user),
    session: AsyncSession = Depends(get_async_session),
) -> FollowStatus:
    require_non_anonymous(user, action="follow")
    if user_id == user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="You can't follow yourself."
        )
    target = (
        await session.execute(select(User).where(User.id == user_id))
    ).unique().scalar_one_or_none()
    if target is None or not target.profile_public:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    existing = (
        await session.execute(
            select(Follow).where(
                Follow.follower_id == user.id, Follow.followed_id == user_id
            )
        )
    ).scalar_one_or_none()
    if existing is None:
        session.add(Follow(follower_id=user.id, followed_id=user_id))
        await session.commit()

    _, fc, gc, _ = await _profile_counters(user_id, session, user.id)
    return FollowStatus(is_following=True, follower_count=fc, following_count=gc)


@router.delete("/follow/{user_id}", response_model=FollowStatus)
async def unfollow_user(
    user_id: uuid.UUID,
    user: User = Depends(current_active_user),
    session: AsyncSession = Depends(get_async_session),
) -> FollowStatus:
    await session.execute(
        delete(Follow).where(
            and_(Follow.follower_id == user.id, Follow.followed_id == user_id)
        )
    )
    await session.commit()
    _, fc, gc, _ = await _profile_counters(user_id, session, user.id)
    return FollowStatus(is_following=False, follower_count=fc, following_count=gc)


# ─── Search ───────────────────────────────────────────────────────────────────


@router.get("/search", response_model=list[UserSearchResult])
async def search_users(
    q: str = Query(..., min_length=2, max_length=40),
    limit: int = Query(default=10, ge=1, le=30),
    session: AsyncSession = Depends(get_async_session),
) -> list[UserSearchResult]:
    """Naive ILIKE on username + display_name. Good to ~10k users; swap to
    pg_trgm when growth justifies it."""
    needle = f"%{q.strip().lower()}%"
    rows = (
        await session.execute(
            select(User)
            .where(
                User.profile_public.is_(True),
                or_(
                    func.lower(User.username).ilike(needle),
                    func.lower(User.display_name).ilike(needle),
                ),
            )
            .order_by(User.username.asc())
            .limit(limit)
        )
    ).unique().scalars().all()
    return [UserSearchResult.model_validate(u) for u in rows]


# ─── Milestones ───────────────────────────────────────────────────────────────


@router.get("/milestones/pending", response_model=list[MilestoneRead])
async def list_pending_milestones(
    user: User = Depends(current_active_user),
    session: AsyncSession = Depends(get_async_session),
) -> list[MilestoneRead]:
    """Milestones the user has earned but not yet shared. Drives the toast."""
    rows = (
        await session.execute(
            select(Milestone)
            .where(Milestone.user_id == user.id, Milestone.shared_post_id.is_(None))
            .order_by(Milestone.created_at.desc())
            .limit(20)
        )
    ).scalars().all()
    return [MilestoneRead.model_validate(m) for m in rows]


@router.post("/milestones/{milestone_id}/share", response_model=PostRead)
async def share_milestone_route(
    milestone_id: uuid.UUID,
    body: MilestoneShareRequest,
    user: User = Depends(current_active_user),
    session: AsyncSession = Depends(get_async_session),
) -> PostRead:
    """Atomically create a Post from a Milestone and link them."""
    require_non_anonymous(user, action="share_milestone")

    milestone = (
        await session.execute(
            select(Milestone).where(
                Milestone.id == milestone_id, Milestone.user_id == user.id
            )
        )
    ).scalar_one_or_none()
    if milestone is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Milestone not found")

    post = await share_milestone(
        milestone=milestone,
        session=session,
        note=body.note,
        visibility=body.visibility,
    )
    await session.commit()
    await session.refresh(post)

    hydrated = await _hydrate([post], session, user)
    return hydrated[0]


@router.post("/milestones/{milestone_id}/dismiss", status_code=status.HTTP_204_NO_CONTENT)
async def dismiss_milestone(
    milestone_id: uuid.UUID,
    user: User = Depends(current_active_user),
    session: AsyncSession = Depends(get_async_session),
) -> None:
    """Hard-delete a pending milestone. Used when the user closes the toast
    without sharing. Already-shared milestones cannot be dismissed (the
    shared Post is the canonical artifact and lives on its own lifecycle)."""
    milestone = (
        await session.execute(
            select(Milestone).where(
                Milestone.id == milestone_id, Milestone.user_id == user.id
            )
        )
    ).scalar_one_or_none()
    if milestone is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Milestone not found")
    if milestone.shared_post_id is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This milestone has already been shared. Delete the post instead.",
        )
    await session.delete(milestone)
    await session.commit()
