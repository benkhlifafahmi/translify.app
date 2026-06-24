"""Pydantic schemas for study-guide endpoints."""
from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class StudyExercisePublic(BaseModel):
    """Exercise shape sent to the client — note: no reference_answer.

    Extra keys (the stored ``reference_answer``) are ignored on validation, so
    building this from the stored section dict strips the answer automatically.
    """
    id: str
    question: str
    hint: str = ""


class StudySectionPublic(BaseModel):
    id: str
    title: str
    summary: str
    key_points: list[str] = []
    # Video time range this section covers (media books only; null otherwise).
    time_start_seconds: int | None = None
    time_end_seconds: int | None = None
    exercises: list[StudyExercisePublic] = []


class StudyGuideRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    book_id: uuid.UUID
    sections: list[StudySectionPublic]
    created_at: datetime


class StudyGuideGenerateRequest(BaseModel):
    translation_id: uuid.UUID | None = None


class GradeAnswerRequest(BaseModel):
    exercise_id: str
    answer: str = Field(min_length=1, max_length=5_000)
    translation_id: uuid.UUID | None = None


class GradeAnswerResult(BaseModel):
    exercise_id: str
    correct: bool
    feedback: str
    model_answer: str
