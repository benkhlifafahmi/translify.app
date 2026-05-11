"""Pydantic schemas for garden endpoints.

Keep field names in sync with apps/web/src/lib/garden.ts — the frontend uses
camelCase via populate_by_name aliasing so the wire format stays JS-friendly.
"""
from __future__ import annotations

import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

GardenSpeciesLiteral = Literal["ficus", "helianthus", "lavandula", "monstera"]
GardenHealthLiteral = Literal["thriving", "budding", "wilting", "dying"]
GardenEventKindLiteral = Literal["read", "quiz", "water", "skip", "translate", "tend"]
FarmerHat = Literal["straw", "wool", "scholar", "none"]
FarmerCoat = Literal["denim", "linen", "earth", "moss"]
FarmerSkin = Literal["fair", "tan", "umber", "sepia"]
FarmerTool = Literal["watering-can", "shears", "lantern", "book"]


def _alias(name: str) -> str:
    """snake_case → camelCase for the JSON wire format."""
    parts = name.split("_")
    return parts[0] + "".join(p.title() for p in parts[1:])


class _CamelModel(BaseModel):
    model_config = ConfigDict(alias_generator=_alias, populate_by_name=True, from_attributes=True)


class FarmerSchema(_CamelModel):
    hat: FarmerHat = "straw"
    coat: FarmerCoat = "earth"
    skin: FarmerSkin = "tan"
    tool: FarmerTool = "watering-can"
    name: str = ""


class JournalEntry(_CamelModel):
    id: uuid.UUID
    at: datetime
    kind: GardenEventKindLiteral
    what: str
    delta: str
    warn: bool = False


class GardenSummary(_CamelModel):
    book_id: uuid.UUID
    book_title: str
    book_author: str | None = None
    species: GardenSpeciesLiteral
    stage: int
    growth_percent: int
    health: GardenHealthLiteral


class GardenRead(_CamelModel):
    book_id: uuid.UUID
    book_title: str
    book_author: str | None = None
    started_at: datetime
    species: GardenSpeciesLiteral
    farmer: FarmerSchema

    stage: int
    growth_percent: int
    pages_read: int
    page_count: int = 0
    pages_read_delta: int = 0
    quizzes_answered: int
    quizzes_total: int = 0
    quiz_accuracy_percent: int = 0

    vitality: int
    vitality_capacity: int
    days_until_thirst: int
    weekly_tending_due_at: datetime

    streak_days: int
    best_streak_days: int
    new_leaves: int
    last_leaf_at: datetime | None = None

    journal: list[JournalEntry] = Field(default_factory=list)


class GardenUpdate(_CamelModel):
    species: GardenSpeciesLiteral | None = None
    farmer: FarmerSchema | None = None


# --- events --------------------------------------------------------------

class RecordEventRequest(_CamelModel):
    kind: GardenEventKindLiteral
    payload: dict = Field(default_factory=dict)


# --- weekly tending ------------------------------------------------------

class TendingQuestion(_CamelModel):
    id: str
    prompt: str
    choices: list[str]
    # `correctIndex` and `explanation` are present in the mock; in the real
    # backend the server holds them privately and these are absent on the
    # wire pre-submit. Kept optional for forward-compat with the mock client.
    correct_index: int | None = None
    explanation: str | None = None


class SubmitTendingAnswer(_CamelModel):
    question_id: str
    choice_index: int


class SubmitTendingRequest(_CamelModel):
    answers: list[SubmitTendingAnswer]


class TendingPerQuestion(_CamelModel):
    id: str
    correct: bool
    given_index: int
    # Revealed only post-submit so the review screen can show the right
    # answer and the explanation. Absent in the pre-submit GET payload.
    correct_index: int | None = None
    explanation: str | None = None


class TendingResult(_CamelModel):
    score: int
    total: int
    passed: bool
    growth_gained: int
    vitality_restored: int
    new_stage: int
    next_due_at: datetime
    per_question: list[TendingPerQuestion]
