"""Async SQLAlchemy engine + session + Base.

Engine creation is lazy so that importing ``app.db`` (e.g. from Alembic) does
not require a valid DSN at import time — useful when bootstrapping or
running schema-only commands.
"""
from __future__ import annotations

from collections.abc import AsyncGenerator
from functools import lru_cache

from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import DeclarativeBase

from app.config import settings


class Base(DeclarativeBase):
    pass


@lru_cache(maxsize=1)
def get_engine() -> AsyncEngine:
    return create_async_engine(
        settings.async_postgres_dsn,
        pool_pre_ping=True,
        pool_size=10,
        max_overflow=20,
    )


@lru_cache(maxsize=1)
def get_session_maker() -> async_sessionmaker[AsyncSession]:
    return async_sessionmaker(get_engine(), expire_on_commit=False)


async def get_async_session() -> AsyncGenerator[AsyncSession, None]:
    async with get_session_maker()() as session:
        yield session
