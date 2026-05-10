"""Book translation engine.

Translates a list of strings in a single batched API call so the model can
keep terminology consistent across nearby segments. Returns translations
in the same order as inputs.

Model selection is centralized in services/llm.py:
  - literary=False (Reader / Free)      → Gemini 2.5 Flash, Haiku fallback
  - literary=True  (Scholar / Family)   → Claude Sonnet 4.6, Haiku fallback

This swaps the prior hardcoded-Sonnet-for-everyone setup, which was costing
us ~$10 of LLM per translated book regardless of plan tier.

The model is asked to return strict JSON: {"items":[{"i":int,"t":str},...]}.
We parse and re-order by index; missing items fall back to the source text.
"""
from __future__ import annotations

import asyncio
import json
import logging
import re
from collections.abc import Sequence

from app.services.llm import complete

log = logging.getLogger(__name__)

MAX_TOKENS = 8_192

# Keep each batch well under the model's per-request context budget while
# still amortising overhead across many segments.
MAX_BATCH_CHARS = 12_000
MAX_BATCH_ITEMS = 60
CONCURRENCY = 4

# Per-batch retry attempts before giving up. Each retry already cascades
# primary→fallback inside llm.py, so 2 is enough — more would just amplify
# costs on systemic outages.
BATCH_RETRIES = 2


async def translate_segments(
    segments: Sequence[str],
    *,
    source_lang: str | None,
    target_lang: str,
    literary: bool = False,
) -> list[str]:
    """Translate `segments` from `source_lang` to `target_lang`, preserving order.

    `literary=True` routes through the Sonnet-tier engine for paid plans that
    include the literary-translation feature flag. Default False uses the
    cheaper Flash engine.
    """
    if not segments:
        return []

    batches = _pack_batches(segments)
    sem = asyncio.Semaphore(CONCURRENCY)

    async def run(batch: list[tuple[int, str]]) -> list[tuple[int, str]]:
        async with sem:
            return await _translate_batch(
                batch,
                source_lang=source_lang,
                target_lang=target_lang,
                literary=literary,
            )

    results = await asyncio.gather(*(run(b) for b in batches))

    out: list[str] = list(segments)
    for batch_result in results:
        for idx, text in batch_result:
            if 0 <= idx < len(out):
                out[idx] = text
    return out


def _pack_batches(segments: Sequence[str]) -> list[list[tuple[int, str]]]:
    batches: list[list[tuple[int, str]]] = []
    current: list[tuple[int, str]] = []
    current_chars = 0
    for i, s in enumerate(segments):
        size = len(s) + 16  # JSON overhead per item
        if current and (
            current_chars + size > MAX_BATCH_CHARS or len(current) >= MAX_BATCH_ITEMS
        ):
            batches.append(current)
            current = []
            current_chars = 0
        current.append((i, s))
        current_chars += size
    if current:
        batches.append(current)
    return batches


async def _translate_batch(
    batch: list[tuple[int, str]],
    *,
    source_lang: str | None,
    target_lang: str,
    literary: bool,
) -> list[tuple[int, str]]:
    payload = {"items": [{"i": idx, "t": text} for idx, text in batch]}
    src = source_lang or "the source language"
    system = (
        "You are a professional document translator. Translate each item from "
        f"{src} to {target_lang}. Preserve meaning, register, and formatting "
        "(line breaks, lists, punctuation). Do NOT add commentary. If an item "
        "is a heading, fragment, page number, or untranslatable code, keep it "
        "as-is or translate as appropriate. Return STRICT JSON of the form "
        '{"items":[{"i":<int>,"t":"<translated>"}]}'
        " — every input item must appear exactly once in the output."
    )

    task = "translate_literary" if literary else "translate"
    user_content = json.dumps(payload, ensure_ascii=False)

    last_exc: Exception | None = None
    for attempt in range(1, BATCH_RETRIES + 1):
        try:
            resp = await complete(
                task=task,
                system=system,
                user=user_content,
                max_tokens=MAX_TOKENS,
                temperature=0.3,  # lower temp for translation consistency
                response_format="json",
            )
            return _parse_response(resp.text, batch)
        except Exception as exc:
            last_exc = exc
            log.warning(
                "translate batch attempt %d/%d failed (task=%s): %s",
                attempt, BATCH_RETRIES, task, exc,
            )
            if attempt < BATCH_RETRIES:
                await asyncio.sleep(1.5 * attempt)
    assert last_exc is not None
    raise last_exc


_JSON_OBJECT_RE = re.compile(r"\{.*\}", re.DOTALL)


def _parse_response(text: str, batch: list[tuple[int, str]]) -> list[tuple[int, str]]:
    match = _JSON_OBJECT_RE.search(text)
    if not match:
        log.warning("translate response had no JSON; falling back to source")
        return batch
    try:
        data = json.loads(match.group(0))
    except json.JSONDecodeError:
        log.warning("translate response JSON was malformed; falling back to source")
        return batch

    items = data.get("items")
    if not isinstance(items, list):
        return batch

    by_index: dict[int, str] = {}
    for entry in items:
        if not isinstance(entry, dict):
            continue
        idx = entry.get("i")
        translated = entry.get("t")
        if isinstance(idx, int) and isinstance(translated, str):
            by_index[idx] = translated

    out: list[tuple[int, str]] = []
    for idx, source in batch:
        out.append((idx, by_index.get(idx, source)))
    return out
