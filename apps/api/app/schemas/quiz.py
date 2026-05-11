"""Pydantic schemas for quiz endpoints."""
from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class QuizQuestionPublic(BaseModel):
    """Question shape returned to the frontend (no answer_index/explanation)."""
    id: str
    type: str
    prompt: str
    choices: list[str]


class QuizRead(BaseModel):
    """Quiz without revealing answers — used while taking the quiz."""
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    book_id: uuid.UUID
    title: str
    scope_label: str | None
    questions: list[QuizQuestionPublic]
    created_at: datetime


class QuizSummary(BaseModel):
    """Lightweight quiz row for the list view (no questions payload)."""
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    book_id: uuid.UUID
    title: str
    scope_label: str | None
    question_count: int
    created_at: datetime


class QuizCreateRequest(BaseModel):
    question_count: int = Field(default=8, ge=3, le=20)
    translation_id: uuid.UUID | None = None


class QuizAttemptAnswer(BaseModel):
    question_id: str
    answer_index: int


class QuizAttemptCreate(BaseModel):
    answers: list[QuizAttemptAnswer]


class QuizGradeRequest(BaseModel):
    """Single-question peek used by the mobile card-by-card flow.
    Does not persist an attempt; the client still POSTs the full attempt
    when the quiz finishes so XP / Garden side effects fire once."""
    question_id: str
    answer_index: int


class QuizAnswerResult(BaseModel):
    question_id: str
    given_index: int
    correct_index: int
    correct: bool
    explanation: str


class QuizAttemptRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    quiz_id: uuid.UUID
    score: int
    total: int
    results: list[QuizAnswerResult]
    created_at: datetime
