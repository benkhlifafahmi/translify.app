"""Pydantic schemas for chat endpoints."""
from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.models.chat import ChatScope, MessageRole


class ChatRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    book_id: uuid.UUID | None
    scope: ChatScope
    title: str | None
    created_at: datetime
    updated_at: datetime


class MessageRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    chat_id: uuid.UUID
    role: MessageRole
    content: str
    citations: list | None
    created_at: datetime


class SendMessageRequest(BaseModel):
    content: str = Field(min_length=1, max_length=8_000)
    translation_id: uuid.UUID | None = None


class SendMessageResponse(BaseModel):
    user_message: MessageRead
    assistant_message: MessageRead
