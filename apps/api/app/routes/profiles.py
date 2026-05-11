"""Reader profile CRUD + activation.

Profile semantics:
  * Every user has at least one profile (a "default" backfilled at signup).
  * The active profile is tracked on ``User.active_profile_id``.
  * The plan's ``profiles`` quota caps the total — Free/Reader/Scholar = 1
    (the default), Family = 5.
  * Child profiles silently force ``family_safe_mode`` to on in the chat /
    quiz helpers regardless of the account-level toggle.
"""
from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException, Path, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.models import User
from app.auth.users import current_active_user
from app.billing.plans import Plan, quota_for
from app.billing.service import get_or_create_subscription
from app.db import get_async_session
from app.models.profile import ProfileKind, ReaderProfile
from app.schemas.profile import ProfileCreate, ProfileRead, ProfileUpdate

router = APIRouter(prefix="/profiles", tags=["profiles"])


async def _ensure_default(user: User, session: AsyncSession) -> ReaderProfile:
    """Guarantee the user has a default profile and return it.

    The migration backfilled one for every existing user, but freshly-created
    users (or anyone whose default got deleted via a future code path) get a
    just-in-time backstop here so the rest of the app can rely on "user always
    has at least one profile."
    """
    result = await session.execute(
        select(ReaderProfile)
        .where(ReaderProfile.user_id == user.id, ReaderProfile.is_default.is_(True))
        .limit(1)
    )
    default = result.scalar_one_or_none()
    if default is not None:
        return default

    default = ReaderProfile(
        user_id=user.id,
        name=(user.display_name or "Reader").strip()[:60] or "Reader",
        avatar_seed="lumi",
        kind=ProfileKind.adult,
        is_default=True,
    )
    session.add(default)
    await session.flush()
    return default


@router.get("", response_model=list[ProfileRead])
async def list_profiles(
    user: User = Depends(current_active_user),
    session: AsyncSession = Depends(get_async_session),
) -> list[ReaderProfile]:
    await _ensure_default(user, session)
    result = await session.execute(
        select(ReaderProfile)
        .where(ReaderProfile.user_id == user.id)
        # Default profile first, then alphabetically by name.
        .order_by(ReaderProfile.is_default.desc(), ReaderProfile.name.asc())
    )
    profiles = list(result.scalars().all())
    await session.commit()
    return profiles


@router.post("", response_model=ProfileRead, status_code=status.HTTP_201_CREATED)
async def create_profile(
    payload: ProfileCreate,
    user: User = Depends(current_active_user),
    session: AsyncSession = Depends(get_async_session),
) -> ReaderProfile:
    await _ensure_default(user, session)

    # Plan gate. We compare against existing profile count rather than the
    # subscription's "tier" — that way a Family-plan account that downgrades
    # keeps its existing profiles but can't add more.
    sub = await get_or_create_subscription(user, session)
    quota = quota_for(Plan(sub.plan))

    count = await session.scalar(
        select(func.count(ReaderProfile.id)).where(ReaderProfile.user_id == user.id)
    )
    existing_count = int(count or 0)
    if existing_count >= quota.profiles:
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail={
                "error": "quota_exceeded",
                "message": (
                    f"Your plan allows {quota.profiles} reader "
                    f"profile{'s' if quota.profiles != 1 else ''}. "
                    "Upgrade to Family for up to 5."
                ),
                "plan": sub.plan,
                "limit": quota.profiles,
                "used": existing_count,
                "feature": "profiles",
            },
        )

    profile = ReaderProfile(
        user_id=user.id,
        name=payload.name.strip(),
        avatar_seed=payload.avatar_seed.strip() or "lumi",
        kind=payload.kind,
        is_default=False,
    )
    session.add(profile)
    await session.commit()
    await session.refresh(profile)
    return profile


@router.patch("/{profile_id}", response_model=ProfileRead)
async def update_profile(
    payload: ProfileUpdate,
    profile_id: uuid.UUID = Path(...),
    user: User = Depends(current_active_user),
    session: AsyncSession = Depends(get_async_session),
) -> ReaderProfile:
    profile = await _get_owned(profile_id, user, session)
    data = payload.model_dump(exclude_unset=True)
    for k, v in data.items():
        if v is None:
            continue
        if k == "name":
            v = v.strip()
        setattr(profile, k, v)
    await session.commit()
    await session.refresh(profile)
    return profile


@router.delete("/{profile_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_profile(
    profile_id: uuid.UUID = Path(...),
    user: User = Depends(current_active_user),
    session: AsyncSession = Depends(get_async_session),
) -> None:
    profile = await _get_owned(profile_id, user, session)
    if profile.is_default:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The default profile cannot be deleted. Promote another first.",
        )
    # If the user was sitting on this profile, drop the pointer so the next
    # request falls back to the default.
    if user.active_profile_id == profile.id:
        user.active_profile_id = None
        session.add(user)
    await session.delete(profile)
    await session.commit()


@router.post("/{profile_id}/activate", response_model=ProfileRead)
async def activate_profile(
    profile_id: uuid.UUID = Path(...),
    user: User = Depends(current_active_user),
    session: AsyncSession = Depends(get_async_session),
) -> ReaderProfile:
    profile = await _get_owned(profile_id, user, session)
    user.active_profile_id = profile.id
    session.add(user)
    await session.commit()
    return profile


async def _get_owned(
    profile_id: uuid.UUID, user: User, session: AsyncSession
) -> ReaderProfile:
    result = await session.execute(
        select(ReaderProfile).where(
            ReaderProfile.id == profile_id, ReaderProfile.user_id == user.id
        )
    )
    profile = result.scalar_one_or_none()
    if profile is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found"
        )
    return profile
