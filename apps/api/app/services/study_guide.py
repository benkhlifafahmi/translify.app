"""Study-guide generation + free-text answer grading.

Generation turns a book/video transcript into a structured set of study
sections (notes, key points, and open-ended exercises). Grading evaluates a
learner's free-text answer to one exercise against the reference answer stored
at generation time. Model routing lives in services/llm.py (``study_guide`` /
``study_grade``).
"""
from __future__ import annotations

import json
import logging
import re
import uuid
from collections.abc import Sequence

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.billing.family_safe import safe_addendum
from app.models.chunk import Chunk
from app.services.llm import complete

log = logging.getLogger(__name__)

GEN_MAX_TOKENS = 6_000
GRADE_MAX_TOKENS = 600
# Study guides cover the whole text, so we feed more context than the quiz
# sampler does. Gemini Flash handles large prompts cheaply.
MAX_CONTEXT_CHARS = 30_000

_JSON_OBJECT_RE = re.compile(r"\{.*\}", re.DOTALL)


# ───────────────────────── Generation ─────────────────────────


async def generate_study_guide(
    *,
    session: AsyncSession,
    book_id: uuid.UUID,
    book_title: str,
    output_language: str | None = None,
    family_safe: bool = False,
) -> list[dict]:
    """Return a list of section dicts:

        {id, title, summary, key_points: [str],
         exercises: [{id, question, reference_answer, hint}]}

    ``reference_answer`` is kept for grading and stripped before the guide is
    returned to the client.
    """
    chunks = await _load_chunks(session, book_id)
    if not chunks:
        raise RuntimeError("Book has no chunks; cannot generate a study guide.")

    context = _build_context(chunks)
    system, user = _build_prompts(
        book_title=book_title,
        context=context,
        output_language=output_language,
        family_safe=family_safe,
    )

    resp = await complete(
        task="study_guide",
        system=system,
        user=user,
        max_tokens=GEN_MAX_TOKENS,
        temperature=0.6,
        response_format="json",
    )
    return _parse_guide(resp.text)


def _build_prompts(
    *,
    book_title: str,
    context: str,
    output_language: str | None,
    family_safe: bool,
) -> tuple[str, str]:
    language_instruction = ""
    if output_language:
        language_instruction = (
            f" Write every section — titles, notes, key points, exercises, and "
            f"reference answers — in {output_language}, even though the source "
            "may be in another language."
        )

    system = (
        "You are an expert tutor who turns source material into a clear, "
        "well-structured study guide. Break the material into logical sections "
        "that follow its natural flow. For each section write concise study "
        "notes a student can revise from, a few key takeaways, and one or two "
        "open-ended exercises that test real understanding (not trivia). "
        "Every exercise must be answerable from the section's content, and you "
        "must provide a model reference answer for each."
        + language_instruction
        + safe_addendum(family_safe)
    )

    user = (
        f"Title: {book_title}\n\n"
        f"=== SOURCE ===\n{context}\n=== END SOURCE ===\n\n"
        "Produce between 4 and 8 sections covering the material in order.\n"
        "Return STRICT JSON of the form:\n"
        "{\n"
        '  "sections": [\n'
        "    {\n"
        '      "title": "<short section title>",\n'
        '      "summary": "<study notes in Markdown — short paragraphs and/or bullet lists>",\n'
        '      "key_points": ["<takeaway>", "<takeaway>"],\n'
        '      "exercises": [\n'
        "        {\n"
        '          "question": "<open-ended question the learner answers in their own words>",\n'
        '          "reference_answer": "<the ideal answer, used to grade>",\n'
        '          "hint": "<one short nudge, optional>"\n'
        "        }\n"
        "      ]\n"
        "    }\n"
        "  ]\n"
        "}\n"
        "Each section needs at least one exercise. Keep summaries focused. Do "
        "not include any text outside the JSON object."
    )
    return system, user


async def _load_chunks(session: AsyncSession, book_id: uuid.UUID) -> list[Chunk]:
    result = await session.execute(
        select(Chunk).where(Chunk.book_id == book_id).order_by(Chunk.ordinal.asc())
    )
    return list(result.scalars().all())


def _build_context(chunks: Sequence[Chunk]) -> str:
    parts: list[str] = []
    total = 0
    for c in chunks:
        snippet = c.text.strip()
        if not snippet:
            continue
        if total + len(snippet) > MAX_CONTEXT_CHARS:
            # Take a final partial slice so the tail isn't silently dropped.
            remaining = MAX_CONTEXT_CHARS - total
            if remaining > 200:
                parts.append(snippet[:remaining])
            break
        parts.append(snippet)
        total += len(snippet)
    return "\n\n".join(parts)


def _parse_guide(text: str) -> list[dict]:
    match = _JSON_OBJECT_RE.search(text)
    if not match:
        raise RuntimeError("Study-guide model returned no JSON object")
    try:
        data = json.loads(match.group(0))
    except json.JSONDecodeError as exc:
        raise RuntimeError(f"Study-guide JSON was malformed: {exc}") from exc

    raw_sections = data.get("sections")
    if not isinstance(raw_sections, list) or not raw_sections:
        raise RuntimeError("Study-guide JSON missing sections list")

    sections: list[dict] = []
    for sec in raw_sections:
        if not isinstance(sec, dict):
            continue
        title = sec.get("title")
        summary = sec.get("summary")
        if not isinstance(title, str) or not isinstance(summary, str):
            continue

        key_points = [
            str(k).strip()
            for k in sec.get("key_points", [])
            if isinstance(k, str) and k.strip()
        ]

        exercises: list[dict] = []
        for ex in sec.get("exercises", []):
            if not isinstance(ex, dict):
                continue
            question = ex.get("question")
            reference = ex.get("reference_answer", "")
            if not isinstance(question, str) or not question.strip():
                continue
            exercises.append(
                {
                    "id": str(uuid.uuid4()),
                    "question": question.strip(),
                    "reference_answer": str(reference).strip(),
                    "hint": str(ex.get("hint", "")).strip(),
                }
            )

        sections.append(
            {
                "id": str(uuid.uuid4()),
                "title": title.strip(),
                "summary": summary.strip(),
                "key_points": key_points,
                "exercises": exercises,
            }
        )

    if not sections:
        raise RuntimeError("Study guide contained no usable sections")
    return sections


# ───────────────────────── Grading ─────────────────────────


async def grade_answer(
    *,
    question: str,
    reference_answer: str,
    section_title: str,
    learner_answer: str,
    output_language: str | None = None,
    family_safe: bool = False,
) -> dict:
    """Grade a free-text answer. Returns {correct, feedback, model_answer}."""
    language_instruction = (
        f" Respond in {output_language}." if output_language else ""
    )

    system = (
        "You are a supportive but rigorous tutor grading a learner's free-text "
        "answer to a study question. Judge whether the answer is correct in "
        "substance — reward correct understanding even if the wording differs "
        "from the reference, and don't penalise minor omissions. If it's wrong "
        "or incomplete, explain what's missing or mistaken, kindly and "
        "specifically, so the learner can improve."
        + language_instruction
        + safe_addendum(family_safe)
    )

    user = (
        f"Section: {section_title}\n"
        f"Question: {question}\n"
        f"Reference answer: {reference_answer}\n"
        f"Learner's answer: {learner_answer}\n\n"
        "Return STRICT JSON:\n"
        "{\n"
        '  "correct": true/false,\n'
        '  "feedback": "<2-3 sentences of specific, encouraging feedback>",\n'
        '  "model_answer": "<a concise correct answer>"\n'
        "}\n"
        "Do not include any text outside the JSON object."
    )

    resp = await complete(
        task="study_grade",
        system=system,
        user=user,
        max_tokens=GRADE_MAX_TOKENS,
        temperature=0.2,
        response_format="json",
    )
    return _parse_grade(resp.text, fallback_answer=reference_answer)


def _parse_grade(text: str, *, fallback_answer: str) -> dict:
    match = _JSON_OBJECT_RE.search(text)
    if not match:
        raise RuntimeError("Grading model returned no JSON object")
    try:
        data = json.loads(match.group(0))
    except json.JSONDecodeError as exc:
        raise RuntimeError(f"Grading JSON was malformed: {exc}") from exc

    correct = bool(data.get("correct"))
    feedback = str(data.get("feedback", "")).strip()
    model_answer = str(data.get("model_answer", "")).strip() or fallback_answer
    if not feedback:
        feedback = (
            "Nice work — that's right." if correct
            else "Not quite — compare your answer with the model answer below."
        )
    return {"correct": correct, "feedback": feedback, "model_answer": model_answer}
