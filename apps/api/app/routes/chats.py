"""Chat API — chat with a book using RAG over its embedded chunks."""
from __future__ import annotations

import logging
import uuid

from fastapi import APIRouter, Depends, HTTPException, Path, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.models import User
from app.auth.users import current_active_user
from app.db import get_async_session
from app.models.book import Book, BookStatus
from app.models.chat import Chat, ChatScope, Message, MessageRole
from app.models.translation import Translation
from app.schemas.chat import (
    ChatRead,
    MessageRead,
    SendMessageRequest,
    SendMessageResponse,
)
from app.services.chat import answer_question

log = logging.getLogger(__name__)

router = APIRouter(tags=["chats"])


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


async def _get_owned_chat(
    chat_id: uuid.UUID, user: User, session: AsyncSession
) -> Chat:
    result = await session.execute(
        select(Chat).where(Chat.id == chat_id, Chat.user_id == user.id)
    )
    chat = result.scalar_one_or_none()
    if chat is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chat not found")
    return chat


@router.get("/books/{book_id}/chats", response_model=list[ChatRead])
async def list_book_chats(
    book_id: uuid.UUID = Path(...),
    user: User = Depends(current_active_user),
    session: AsyncSession = Depends(get_async_session),
) -> list[Chat]:
    await _get_owned_book(book_id, user, session)
    result = await session.execute(
        select(Chat)
        .where(Chat.user_id == user.id, Chat.book_id == book_id)
        .order_by(Chat.created_at.desc())
    )
    return list(result.scalars().all())


@router.post(
    "/books/{book_id}/chats",
    response_model=ChatRead,
    status_code=status.HTTP_201_CREATED,
)
async def create_book_chat(
    book_id: uuid.UUID = Path(...),
    user: User = Depends(current_active_user),
    session: AsyncSession = Depends(get_async_session),
) -> Chat:
    book = await _get_owned_book(book_id, user, session)
    if book.status != BookStatus.ready:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Book is not ready yet.",
        )
    chat = Chat(
        user_id=user.id,
        book_id=book.id,
        scope=ChatScope.book,
        title=None,
    )
    session.add(chat)
    await session.commit()
    await session.refresh(chat)
    return chat


@router.delete("/chats/{chat_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_chat(
    chat_id: uuid.UUID = Path(...),
    user: User = Depends(current_active_user),
    session: AsyncSession = Depends(get_async_session),
) -> None:
    chat = await _get_owned_chat(chat_id, user, session)
    await session.delete(chat)
    await session.commit()


@router.get("/chats/{chat_id}/messages", response_model=list[MessageRead])
async def list_messages(
    chat_id: uuid.UUID = Path(...),
    user: User = Depends(current_active_user),
    session: AsyncSession = Depends(get_async_session),
) -> list[Message]:
    await _get_owned_chat(chat_id, user, session)
    result = await session.execute(
        select(Message)
        .where(Message.chat_id == chat_id)
        .order_by(Message.created_at.asc())
    )
    return list(result.scalars().all())


@router.post("/chats/{chat_id}/messages", response_model=SendMessageResponse)
async def send_message(
    payload: SendMessageRequest,
    chat_id: uuid.UUID = Path(...),
    user: User = Depends(current_active_user),
    session: AsyncSession = Depends(get_async_session),
) -> SendMessageResponse:
    chat = await _get_owned_chat(chat_id, user, session)
    if chat.book_id is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Library-scoped chats are not yet supported.",
        )
    book = await session.get(Book, chat.book_id)
    if book is None or book.user_id != user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Book not found")

    answer_language: str | None = None
    if payload.translation_id is not None:
        translation = await session.get(Translation, payload.translation_id)
        if (
            translation is None
            or translation.book_id != book.id
            or book.user_id != user.id
        ):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Translation not found for this book.",
            )
        answer_language = translation.target_language

    history_result = await session.execute(
        select(Message)
        .where(Message.chat_id == chat_id)
        .order_by(Message.created_at.asc())
    )
    history = list(history_result.scalars().all())

    user_msg = Message(
        chat_id=chat_id,
        role=MessageRole.user,
        content=payload.content.strip(),
    )
    session.add(user_msg)
    await session.flush()

    try:
        text, citations, usage = await answer_question(
            session=session,
            book=book,
            chat_id=chat_id,
            question=payload.content.strip(),
            history=history,
            answer_language=answer_language,
        )
    except Exception as exc:
        log.exception("chat answer failed for chat=%s", chat_id)
        await session.rollback()
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Assistant failed: {exc}",
        ) from exc

    assistant_msg = Message(
        chat_id=chat_id,
        role=MessageRole.assistant,
        content=text or "(no response)",
        citations=citations or None,
        input_tokens=usage.get("input_tokens"),
        output_tokens=usage.get("output_tokens"),
    )
    session.add(assistant_msg)

    if chat.title is None:
        chat.title = (payload.content.strip().splitlines()[0] or "New chat")[:200]

    await session.commit()
    await session.refresh(user_msg)
    await session.refresh(assistant_msg)

    return SendMessageResponse(
        user_message=MessageRead.model_validate(user_msg),
        assistant_message=MessageRead.model_validate(assistant_msg),
    )
