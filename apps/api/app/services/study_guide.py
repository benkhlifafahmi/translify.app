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
_FENCE_RE = re.compile(r"^```[A-Za-z0-9]*\s*|\s*```$")


def _loads_json(text: str, *, what: str) -> dict:
    """Parse a JSON object from a model response.

    Tolerates ```json fences and surrounding prose. On failure logs the raw
    output (so a malformed generation can actually be inspected) and raises.
    """
    raw = (text or "").strip()
    candidate = _FENCE_RE.sub("", raw).strip() if raw.startswith("```") else raw

    # Try the whole (de-fenced) body first, then the greedy {...} slice.
    attempts = [candidate]
    m = _JSON_OBJECT_RE.search(candidate)
    if m and m.group(0) != candidate:
        attempts.append(m.group(0))

    for attempt in attempts:
        try:
            obj = json.loads(attempt)
        except json.JSONDecodeError:
            continue
        if isinstance(obj, dict):
            return obj

    log.error(
        "%s: could not parse model JSON (len=%d). Raw output (first 2000 chars):\n%s",
        what, len(raw), raw[:2000],
    )
    raise RuntimeError(f"{what} JSON was malformed")


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

    context, has_timestamps = _build_context(chunks)
    system, user = _build_prompts(
        book_title=book_title,
        context=context,
        has_timestamps=has_timestamps,
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
    # Logged so a malformed generation can be debugged: which model answered
    # (Gemini vs. the Haiku fallback) and whether it hit the token cap (a
    # truncated response is invalid JSON).
    log.info(
        "study-guide generated: model=%s out_tokens=%s chars=%d",
        resp.model, resp.output_tokens, len(resp.text or ""),
    )
    return _parse_guide(resp.text)


def _build_prompts(
    *,
    book_title: str,
    context: str,
    has_timestamps: bool,
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

    # When the source is a timestamped transcript, ask the model to tag each
    # section with the video time range it covers so the reader can watch that
    # span while studying it.
    if has_timestamps:
        timeline_instruction = (
            "Each source passage is prefixed with its start time in whole "
            "seconds, like [t=754]. For every section set \"start_seconds\" to "
            "the [t=...] value of the first passage it covers and "
            "\"end_seconds\" to the [t=...] value where the next section begins "
            "(for the last section, the final passage's time). Sections must "
            "stay in chronological order.\n"
        )
    else:
        timeline_instruction = (
            "There are no timestamps in the source — set \"start_seconds\" and "
            "\"end_seconds\" to null.\n"
        )

    user = (
        f"Title: {book_title}\n\n"
        f"=== SOURCE ===\n{context}\n=== END SOURCE ===\n\n"
        "Produce between 4 and 8 sections covering the material in order.\n"
        + timeline_instruction
        + "Return STRICT JSON of the form:\n"
        "{\n"
        '  "sections": [\n'
        "    {\n"
        '      "title": "<short section title>",\n'
        '      "summary": "<study notes in Markdown — short paragraphs and/or bullet lists>",\n'
        '      "key_points": ["<takeaway>", "<takeaway>"],\n'
        '      "start_seconds": <integer seconds or null>,\n'
        '      "end_seconds": <integer seconds or null>,\n'
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


def _build_context(chunks: Sequence[Chunk]) -> tuple[str, bool]:
    """Join chunk text for the prompt. Returns (context, has_timestamps).

    For media transcripts each passage is prefixed with its start time as
    ``[t=<seconds>]`` so the model can tag sections with a video time range.
    """
    has_timestamps = any(c.time_start_seconds is not None for c in chunks)
    parts: list[str] = []
    total = 0
    for c in chunks:
        snippet = c.text.strip()
        if not snippet:
            continue
        prefix = ""
        if has_timestamps and c.time_start_seconds is not None:
            prefix = f"[t={int(c.time_start_seconds)}] "
        block = prefix + snippet
        if total + len(block) > MAX_CONTEXT_CHARS:
            # Take a final partial slice so the tail isn't silently dropped.
            remaining = MAX_CONTEXT_CHARS - total
            if remaining > 200:
                parts.append(block[:remaining])
            break
        parts.append(block)
        total += len(block)
    return "\n\n".join(parts), has_timestamps


def _coerce_seconds(value: object) -> int | None:
    try:
        n = int(round(float(value)))  # type: ignore[arg-type]
    except (TypeError, ValueError):
        return None
    return n if n >= 0 else None


def _parse_guide(text: str) -> list[dict]:
    data = _loads_json(text, what="Study-guide")

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
                "time_start_seconds": _coerce_seconds(sec.get("start_seconds")),
                "time_end_seconds": _coerce_seconds(sec.get("end_seconds")),
                "exercises": exercises,
            }
        )

    if not sections:
        raise RuntimeError("Study guide contained no usable sections")

    # Tidy the time ranges: drop a non-increasing end, and fill a missing end
    # with the next section's start so each timestamped section has a span.
    for i, s in enumerate(sections):
        start = s["time_start_seconds"]
        end = s["time_end_seconds"]
        if start is None:
            s["time_end_seconds"] = None
            continue
        if end is None and i + 1 < len(sections):
            nxt = sections[i + 1]["time_start_seconds"]
            if isinstance(nxt, int) and nxt > start:
                end = nxt
        if end is not None and end <= start:
            end = None
        s["time_end_seconds"] = end

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
    data = _loads_json(text, what="Grading")

    correct = bool(data.get("correct"))
    feedback = str(data.get("feedback", "")).strip()
    model_answer = str(data.get("model_answer", "")).strip() or fallback_answer
    if not feedback:
        feedback = (
            "Nice work — that's right." if correct
            else "Not quite — compare your answer with the model answer below."
        )
    return {"correct": correct, "feedback": feedback, "model_answer": model_answer}
