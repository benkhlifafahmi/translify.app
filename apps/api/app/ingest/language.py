"""Detect the dominant language of a parsed document."""
from __future__ import annotations

import logging
from typing import Iterable

from langdetect import DetectorFactory, LangDetectException, detect_langs

# Make langdetect deterministic — otherwise the same input can yield different
# results between calls.
DetectorFactory.seed = 42

log = logging.getLogger(__name__)

# Sample at most this many characters when running detection. langdetect is
# accurate well below this — going larger just slows ingest.
_MAX_SAMPLE_CHARS = 8_000


def detect_language(text_pages: Iterable[str]) -> str | None:
    """Return an ISO 639-1 code for the document's main language, or None."""
    sample = _build_sample(text_pages)
    if not sample:
        return None
    try:
        candidates = detect_langs(sample)
    except LangDetectException:
        log.warning("langdetect failed", exc_info=True)
        return None
    if not candidates:
        return None
    top = candidates[0]
    if top.prob < 0.6:
        return None
    return top.lang


def _build_sample(text_pages: Iterable[str]) -> str:
    parts: list[str] = []
    total = 0
    for text in text_pages:
        if not text:
            continue
        snippet = text.strip()
        if not snippet:
            continue
        parts.append(snippet)
        total += len(snippet)
        if total >= _MAX_SAMPLE_CHARS:
            break
    return "\n".join(parts)[:_MAX_SAMPLE_CHARS]
