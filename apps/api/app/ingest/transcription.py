"""YouTube transcript retrieval.

v1 of the media-import feature uses *existing captions only* — no audio
download, no speech-to-text.

We don't query YouTube directly: our server IP gets blocked. Instead we fetch
the transcript from an external service that exposes it as HTML
(``settings.transcript_service_url?v=<id>``) and pull the timestamped
``transcript-segment`` spans out of the page with BeautifulSoup. Each span
looks like::

    <span data-start="8.0" data-duration="5.0"
          class="transcript-segment ...">this course took me weeks ...</span>

Everything here is synchronous/blocking (httpx sync client + bs4), so callers
must invoke it via ``asyncio.to_thread``.
"""
from __future__ import annotations

import logging
import re
from dataclasses import dataclass
from urllib.parse import parse_qs, urlparse

log = logging.getLogger(__name__)

# YouTube video IDs are 11 chars from the URL-safe base64 alphabet.
_ID_RE = re.compile(r"^[A-Za-z0-9_-]{11}$")
_PATH_PREFIXES = ("embed", "shorts", "v", "live")

# Browser-like UA — the transcript service serves different (or no) content to
# obvious bots.
_USER_AGENT = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
)


class TranscriptUnavailable(Exception):
    """Raised when a usable transcript can't be retrieved.

    The message is user-facing — it's surfaced as the book's ``error_message``
    so the reader sees exactly why the import couldn't proceed.
    """


@dataclass(slots=True)
class TranscriptSegment:
    start_seconds: float
    duration_seconds: float
    text: str


@dataclass(slots=True)
class FetchedTranscript:
    segments: list[TranscriptSegment]
    language_code: str | None
    is_generated: bool

    @property
    def duration_seconds(self) -> float:
        if not self.segments:
            return 0.0
        return max(s.start_seconds + s.duration_seconds for s in self.segments)


def extract_video_id(url: str) -> str | None:
    """Parse a YouTube video ID from a watch / youtu.be / embed / shorts URL.

    Accepts a bare 11-char ID too. Returns ``None`` when the input isn't a
    recognisable YouTube link.
    """
    raw = (url or "").strip()
    if not raw:
        return None
    if _ID_RE.match(raw):
        return raw

    parsed = urlparse(raw if "//" in raw else f"https://{raw}")
    host = (parsed.hostname or "").lower()
    host = host.removeprefix("www.").removeprefix("m.")

    if host == "youtu.be":
        candidate = parsed.path.lstrip("/").split("/", 1)[0]
        return candidate if _ID_RE.match(candidate) else None

    if host in ("youtube.com", "youtube-nocookie.com"):
        if parsed.path == "/watch":
            values = parse_qs(parsed.query).get("v", [])
            candidate = values[0] if values else ""
            return candidate if _ID_RE.match(candidate) else None
        parts = [p for p in parsed.path.split("/") if p]
        if len(parts) >= 2 and parts[0] in _PATH_PREFIXES:
            return parts[1] if _ID_RE.match(parts[1]) else None

    return None


def canonical_watch_url(video_id: str) -> str:
    return f"https://www.youtube.com/watch?v={video_id}"


def _to_float(value: object) -> float:
    try:
        return float(value)  # type: ignore[arg-type]
    except (TypeError, ValueError):
        return 0.0


def _parse_segments(html: str) -> list[TranscriptSegment]:
    """Pull timestamped transcript segments out of the service's HTML.

    Targets ``<span class="transcript-segment ...">`` elements carrying
    ``data-start`` and ``data-duration`` attributes. Tolerant of extra classes
    and missing/garbled timing attributes (those fall back to 0).
    """
    from bs4 import BeautifulSoup

    soup = BeautifulSoup(html, "html.parser")
    segments: list[TranscriptSegment] = []
    # ``[class*="transcript-segment"]`` matches any span whose class attribute
    # *contains* the token, so future utility classes on the element don't
    # break extraction.
    for span in soup.select('span[class*="transcript-segment"]'):
        text = span.get_text(" ", strip=True)
        if not text:
            continue
        segments.append(
            TranscriptSegment(
                start_seconds=_to_float(span.get("data-start")),
                duration_seconds=_to_float(span.get("data-duration")),
                text=text,
            )
        )
    return segments


def fetch_transcript(video_id: str) -> FetchedTranscript:
    """Fetch a video's transcript via the external transcript service.

    Raises ``TranscriptUnavailable`` (with a user-facing message) on any
    failure: network/HTTP error, blocked request, or no captions for the
    video.
    """
    import httpx

    from app.config import settings

    try:
        resp = httpx.get(
            settings.transcript_service_url,
            params={"v": video_id},
            headers={
                "User-Agent": _USER_AGENT,
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
                "Accept-Language": "en-US,en;q=0.9",
            },
            timeout=settings.transcript_timeout_seconds,
            follow_redirects=True,
        )
        resp.raise_for_status()
    except Exception as exc:  # network, HTTP status, timeout — keep it friendly
        log.warning("transcript service request failed for %s: %s", video_id, exc)
        raise TranscriptUnavailable(
            "We couldn't fetch this video's transcript right now. It may have "
            "no captions, or the transcript service is busy — please try again."
        ) from exc

    segments = _parse_segments(resp.text)
    if not segments:
        raise TranscriptUnavailable(
            "This video has no captions available, so we can't turn it into "
            "study material yet. Try a video that has captions or subtitles."
        )

    log.info("transcript: video=%s segments=%d", video_id, len(segments))
    # The service doesn't expose language metadata; the pipeline treats a
    # missing language as "unknown" and leaves source_language null.
    return FetchedTranscript(segments=segments, language_code=None, is_generated=False)
