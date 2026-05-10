"""Quiz generation — multiple-choice questions from book chunks.

Model selection is centralized in services/llm.py. By default this routes
to Gemini 2.5 Flash Lite with Claude Haiku 4.5 as fallback — ~30× cheaper
than Sonnet for what is essentially structured JSON output.
"""
from __future__ import annotations

import json
import logging
import random
import re
import uuid
from collections.abc import Sequence

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.chunk import Chunk
from app.services.llm import complete

log = logging.getLogger(__name__)

MAX_TOKENS = 3_000
DEFAULT_QUESTION_COUNT = 8
# Cap context size: smaller prompt = smaller cost + faster generation.
MAX_CONTEXT_CHARS = 12_000


async def generate_quiz(
    *,
    session: AsyncSession,
    book_id: uuid.UUID,
    book_title: str,
    question_count: int = DEFAULT_QUESTION_COUNT,
    output_language: str | None = None,
) -> list[dict]:
    """Return a list of question dicts:
        {id, type: 'mcq', prompt, choices: [..], answer_index, explanation}
    """
    chunks = await _sample_chunks(session, book_id)
    if not chunks:
        raise RuntimeError("Book has no chunks; cannot generate a quiz.")

    context = _build_context(chunks)
    system, user = _build_prompts(
        book_title=book_title,
        context=context,
        question_count=question_count,
        output_language=output_language,
    )

    resp = await complete(
        task="quiz",
        system=system,
        user=user,
        max_tokens=MAX_TOKENS,
        temperature=0.7,
        response_format="json",
    )

    return _parse_quiz(resp.text, want_count=question_count)


# ───────────────────────── Prompt assembly ─────────────────────────


def _build_prompts(
    *,
    book_title: str,
    context: str,
    question_count: int,
    output_language: str | None,
) -> tuple[str, str]:
    language_instruction = ""
    if output_language:
        language_instruction = (
            f" Write all questions, choices, and explanations in {output_language}, "
            "even though the source passages may be in another language."
        )

    system = (
        "You are an expert teacher who writes high-quality multiple-choice "
        "comprehension questions. Each question must be answerable from the "
        "provided source passages alone. Avoid trivia about page numbers or "
        "metadata. Each question should test understanding of a meaningful "
        "concept, fact, or argument from the book. "
        f"Generate exactly {question_count} questions."
        + language_instruction
    )

    user = (
        f"Book title: {book_title}\n\n"
        f"=== SOURCE PASSAGES ===\n{context}\n=== END PASSAGES ===\n\n"
        "Return STRICT JSON of the form:\n"
        "{\n"
        '  "questions": [\n'
        "    {\n"
        '      "prompt": "<question text>",\n'
        '      "choices": ["A", "B", "C", "D"],\n'
        '      "answer_index": 0,\n'
        '      "explanation": "<one-sentence justification, citing the passage>"\n'
        "    }\n"
        "  ]\n"
        "}\n"
        "Each question must have exactly 4 choices, one of which is correct. "
        "Vary the position of the correct answer. Do not include any text "
        "outside the JSON object."
    )
    return system, user


# ───────────────────────── Chunk sampling ─────────────────────────


async def _sample_chunks(session: AsyncSession, book_id: uuid.UUID) -> list[Chunk]:
    result = await session.execute(
        select(Chunk).where(Chunk.book_id == book_id).order_by(Chunk.ordinal.asc())
    )
    chunks = list(result.scalars().all())
    if not chunks:
        return []
    if len(chunks) <= 8:
        return chunks
    step = max(1, len(chunks) // 8)
    sampled = chunks[::step][:8]
    random.shuffle(sampled)
    return sampled


def _build_context(chunks: Sequence[Chunk]) -> str:
    parts: list[str] = []
    total = 0
    for i, c in enumerate(chunks, start=1):
        snippet = c.text.strip()
        if not snippet:
            continue
        chunk_text = f"[Passage {i}]\n{snippet}"
        if total + len(chunk_text) > MAX_CONTEXT_CHARS:
            break
        parts.append(chunk_text)
        total += len(chunk_text)
    return "\n\n".join(parts)


# ───────────────────────── JSON parsing ─────────────────────────


_JSON_OBJECT_RE = re.compile(r"\{.*\}", re.DOTALL)


def _parse_quiz(text: str, *, want_count: int) -> list[dict]:
    match = _JSON_OBJECT_RE.search(text)
    if not match:
        raise RuntimeError("Quiz model returned no JSON object")
    try:
        data = json.loads(match.group(0))
    except json.JSONDecodeError as exc:
        raise RuntimeError(f"Quiz JSON was malformed: {exc}") from exc

    raw = data.get("questions")
    if not isinstance(raw, list) or not raw:
        raise RuntimeError("Quiz JSON missing questions list")

    out: list[dict] = []
    for entry in raw:
        if not isinstance(entry, dict):
            continue
        prompt = entry.get("prompt")
        choices = entry.get("choices")
        answer_index = entry.get("answer_index")
        explanation = entry.get("explanation", "")
        if (
            not isinstance(prompt, str)
            or not isinstance(choices, list)
            or len(choices) < 2
            or not all(isinstance(c, str) for c in choices)
            or not isinstance(answer_index, int)
            or not (0 <= answer_index < len(choices))
        ):
            continue
        out.append(
            {
                "id": str(uuid.uuid4()),
                "type": "mcq",
                "prompt": prompt.strip(),
                "choices": [c.strip() for c in choices],
                "answer_index": answer_index,
                "explanation": str(explanation).strip(),
            }
        )

    if not out:
        raise RuntimeError("Quiz contained no usable questions")
    return out[:want_count]
