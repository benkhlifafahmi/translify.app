"""Provider-agnostic LLM dispatcher.

Each task (chat, highlight_explain, quiz) declares its preferred model in
TASK_CONFIG below. Swap models by editing one line — no caller-side
changes required.

Currently supported providers:
  - Gemini (google-genai SDK) — Flash Lite, Flash, Pro
  - Anthropic (anthropic SDK) — Haiku, Sonnet, Opus

If a primary model fails (rate-limited, unavailable, missing API key,
SDK not installed), the call falls back to a secondary model so the
user gets *something* rather than a 5xx. Fallback failures surface as
exceptions for the caller to handle.

Pricing snapshot (per 1M tokens, Jan 2026 list prices, input → output):
  gemini-2.5-flash-lite     $0.10 → $0.40
  gemini-2.5-flash          $0.30 → $2.50
  claude-haiku-4-5          $1.00 → $5.00
  claude-sonnet-4-6         $3.00 → $15.00
  claude-opus-4-7           $15.00 → $75.00
"""
from __future__ import annotations

import logging
from typing import Literal, NamedTuple

from app.config import settings

log = logging.getLogger(__name__)


# ───────────────────────── Task → model routing ─────────────────────────
#
# Edit this dict to swap models per task. Provider is inferred from the
# model name prefix (gemini-* → Gemini, claude-* → Anthropic).

TASK_CONFIG: dict[str, dict[str, str]] = {
    "chat": {
        # Chat is quality-sensitive: nuanced cross-chapter reasoning, citation
        # accuracy. Keeping on Sonnet for now; revisit after A/B data.
        "primary": "claude-sonnet-4-6",
        "fallback": "claude-haiku-4-5-20251001",
    },
    "highlight_explain": {
        # Short, localized explanations — Flash Lite is plenty.
        "primary": "gemini-2.5-flash-lite",
        "fallback": "claude-haiku-4-5-20251001",
    },
    "quiz": {
        # Structured JSON output — Flash Lite is the right tool.
        "primary": "gemini-2.5-flash-lite",
        "fallback": "claude-haiku-4-5-20251001",
    },
    "translate": {
        # Standard translation (Free + Reader tiers). Flash gives us
        # ~5x cost reduction vs Sonnet at quality that's comparable for
        # straightforward prose. Haiku catches any Gemini downtime.
        "primary": "gemini-2.5-flash",
        "fallback": "claude-haiku-4-5-20251001",
    },
    "translate_literary": {
        # Premium translation (Scholar + Family). Sonnet's nuance + register
        # control matter most on literary works, classical philosophy,
        # and other style-sensitive content.
        "primary": "claude-sonnet-4-6",
        "fallback": "claude-haiku-4-5-20251001",
    },
    "summarize": {
        # Book summary generated once at ingest time. Gemini Flash handles
        # large contexts well (1M tokens) and the structured prose output
        # is fine on Flash quality. Haiku catches Gemini outages.
        "primary": "gemini-2.5-flash",
        "fallback": "claude-haiku-4-5-20251001",
    },
    "study_guide": {
        # Generates a structured study guide (notes + exercises) from a whole
        # transcript/book. Needs solid instruction-following + a large context
        # window; Flash is the cost-effective fit. Haiku catches outages.
        "primary": "gemini-2.5-flash",
        "fallback": "claude-haiku-4-5-20251001",
    },
    "study_grade": {
        # Grades a single free-text exercise answer against a reference — short
        # structured output, so Flash Lite is plenty.
        "primary": "gemini-2.5-flash-lite",
        "fallback": "claude-haiku-4-5-20251001",
    },
}


class LLMResponse(NamedTuple):
    text: str
    input_tokens: int | None
    output_tokens: int | None
    model: str  # actual model that responded (could be fallback)


class ChatTurn(NamedTuple):
    role: Literal["user", "assistant"]
    content: str


# ───────────────────────── Public API ─────────────────────────


async def complete(
    *,
    task: str,
    system: str,
    user: str,
    max_tokens: int = 2_000,
    temperature: float = 0.7,
    response_format: Literal["text", "json"] = "text",
) -> LLMResponse:
    """Single-shot completion: system + one user message → text response.

    Used for quiz generation and one-off highlight explanations.
    """
    return await chat_complete(
        task=task,
        system=system,
        messages=[ChatTurn(role="user", content=user)],
        max_tokens=max_tokens,
        temperature=temperature,
        response_format=response_format,
    )


async def chat_complete(
    *,
    task: str,
    system: str,
    messages: list[ChatTurn],
    max_tokens: int = 1_500,
    temperature: float = 0.7,
    response_format: Literal["text", "json"] = "text",
) -> LLMResponse:
    """Multi-turn chat completion. Used for the book chat panel.

    The `messages` list should be in chronological order with roles
    alternating user/assistant. System prompt is passed separately —
    both providers handle it natively.
    """
    config = TASK_CONFIG.get(task)
    if config is None:
        # Unknown task — fall back to chat-tier model. Surfaces config bugs
        # in dev without blowing up production.
        log.warning("Unknown LLM task=%r; using chat config", task)
        config = TASK_CONFIG["chat"]
    primary = config["primary"]
    fallback = config["fallback"]

    try:
        return await _call(primary, system, messages, max_tokens, temperature, response_format)
    except _FatalLLMError:
        # E.g. malformed input. No point falling back.
        raise
    except Exception as exc:
        log.warning(
            "LLM primary %s failed for task=%s (%s); trying fallback %s",
            primary, task, type(exc).__name__, fallback,
        )
        return await _call(fallback, system, messages, max_tokens, temperature, response_format)


# ───────────────────────── Provider dispatch ─────────────────────────


class _FatalLLMError(Exception):
    """Errors that shouldn't trigger fallback (e.g. bad input)."""


def _provider_for(model: str) -> str:
    if model.startswith("gemini-"):
        return "gemini"
    if model.startswith("claude-"):
        return "anthropic"
    raise _FatalLLMError(f"Unknown LLM provider for model={model!r}")


async def _call(
    model: str,
    system: str,
    messages: list[ChatTurn],
    max_tokens: int,
    temperature: float,
    response_format: Literal["text", "json"],
) -> LLMResponse:
    provider = _provider_for(model)
    if provider == "gemini":
        return await _call_gemini(model, system, messages, max_tokens, temperature, response_format)
    return await _call_anthropic(model, system, messages, max_tokens, temperature, response_format)


# ───────────────────────── Gemini ─────────────────────────


async def _call_gemini(
    model: str,
    system: str,
    messages: list[ChatTurn],
    max_tokens: int,
    temperature: float,
    response_format: Literal["text", "json"],
) -> LLMResponse:
    if not settings.gemini_api_key:
        raise RuntimeError("GEMINI_API_KEY is not configured")
    # Lazy import so the API still boots if google-genai isn't installed
    # (e.g. before a Docker rebuild after dep change).
    try:
        from google import genai
        from google.genai import types
    except ImportError as exc:
        raise RuntimeError(
            "google-genai SDK not installed. Run `pip install google-genai` "
            "or rebuild the Docker image."
        ) from exc

    # Gemini's contents are role/parts pairs. Their "model" role maps to
    # Anthropic's "assistant" — translate.
    contents = [
        types.Content(
            role="user" if m.role == "user" else "model",
            parts=[types.Part.from_text(text=m.content)],
        )
        for m in messages
    ]

    config_kwargs: dict = {
        "system_instruction": system,
        "max_output_tokens": max_tokens,
        "temperature": temperature,
    }
    if response_format == "json":
        config_kwargs["response_mime_type"] = "application/json"

    client = genai.Client(api_key=settings.gemini_api_key)
    resp = await client.aio.models.generate_content(
        model=model,
        contents=contents,
        config=types.GenerateContentConfig(**config_kwargs),
    )

    usage = getattr(resp, "usage_metadata", None)
    return LLMResponse(
        text=resp.text or "",
        input_tokens=getattr(usage, "prompt_token_count", None) if usage else None,
        output_tokens=getattr(usage, "candidates_token_count", None) if usage else None,
        model=model,
    )


# ───────────────────────── Anthropic ─────────────────────────


_anthropic_client = None


def _get_anthropic_client():
    global _anthropic_client
    if _anthropic_client is None:
        from anthropic import AsyncAnthropic

        if not settings.anthropic_api_key:
            raise RuntimeError("ANTHROPIC_API_KEY is not configured")
        _anthropic_client = AsyncAnthropic(api_key=settings.anthropic_api_key)
    return _anthropic_client


async def _call_anthropic(
    model: str,
    system: str,
    messages: list[ChatTurn],
    max_tokens: int,
    temperature: float,
    response_format: Literal["text", "json"],
) -> LLMResponse:
    client = _get_anthropic_client()

    # Anthropic doesn't have a strict JSON mode flag; we rely on the system
    # prompt telling the model to return JSON. The caller's parser handles
    # the rest.
    _ = response_format  # acknowledged

    resp = await client.messages.create(
        model=model,
        max_tokens=max_tokens,
        system=system,
        temperature=temperature,
        messages=[{"role": m.role, "content": m.content} for m in messages],
    )
    text = "".join(b.text for b in resp.content if getattr(b, "type", "") == "text")
    return LLMResponse(
        text=text,
        input_tokens=getattr(resp.usage, "input_tokens", None),
        output_tokens=getattr(resp.usage, "output_tokens", None),
        model=model,
    )
