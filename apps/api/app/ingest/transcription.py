"""YouTube transcript retrieval.

v1 of the media-import feature uses *existing captions only* — no audio
download, no speech-to-text.

We don't query YouTube directly (our server IP gets blocked). Instead we POST
to an external transcript API (``settings.transcript_service_url``) with
``{"video_id": "<id>"}`` and read its JSON::

    {
      "status": "READY",
      "durationSeconds": 884,
      "data": {"transcripts": [{"t": "text", "s": "8.0", "e": "13.0"}, ...]}
    }

Each segment carries text (``t``), start (``s``), and *end* (``e``) — duration
is ``e - s``. Some videos return a non-READY status with an empty transcript
while the service prepares it, so we poll briefly.

Everything here is synchronous/blocking (httpx sync client), so callers must
invoke it via ``asyncio.to_thread``.
"""
from __future__ import annotations

import logging
import re
import time
from dataclasses import dataclass
from urllib.parse import parse_qs, urlparse

log = logging.getLogger(__name__)

# YouTube video IDs are 11 chars from the URL-safe base64 alphabet.
_ID_RE = re.compile(r"^[A-Za-z0-9_-]{11}$")
_PATH_PREFIXES = ("embed", "shorts", "v", "live")

_USER_AGENT = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36"
)

# The transcript API expects these app headers and, for some videos, prepares
# the transcript asynchronously — poll a few times before giving up.
_MAX_ATTEMPTS = 6
_POLL_DELAY_SECONDS = 2.5


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


def _parse_payload(payload: object) -> list[TranscriptSegment]:
    """Extract timestamped segments from the API's JSON body.

    Shape: ``{"data": {"transcripts": [{"t": str, "s": str, "e": str}, ...]}}``
    where ``s``/``e`` are start/end seconds as strings. Tolerant of missing or
    malformed fields.
    """
    if not isinstance(payload, dict):
        return []
    data = payload.get("data")
    transcripts = data.get("transcripts") if isinstance(data, dict) else None
    if not isinstance(transcripts, list):
        return []

    segments: list[TranscriptSegment] = []
    for item in transcripts:
        if not isinstance(item, dict):
            continue
        text = str(item.get("t") or "").strip()
        if not text:
            continue
        start = _to_float(item.get("s"))
        end = _to_float(item.get("e"))
        segments.append(
            TranscriptSegment(
                start_seconds=start,
                duration_seconds=max(0.0, end - start),
                text=text,
            )
        )
    return segments


def fetch_transcript(video_id: str) -> FetchedTranscript:
    """Fetch a video's transcript via the external transcript API.

    POSTs ``{"video_id": ...}`` and reads the JSON. Polls briefly while the
    service prepares a not-yet-ready transcript. Raises ``TranscriptUnavailable``
    (with a user-facing message) on network/HTTP failure or when the video has
    no captions.
    """
    import httpx

    from app.config import settings

    headers = {
        "Accept": "*/*",
        "Accept-Language": "en,en-US;q=0.9",
        "Content-Type": "application/json",
        "Origin": "https://tubetranscript.com",
        "Referer": "https://tubetranscript.com/",
        "User-Agent": _USER_AGENT,
        "x-app-version": "1",
        "x-source": "tubetranscript",
    }

    with httpx.Client(
        timeout=settings.transcript_timeout_seconds, follow_redirects=True
    ) as client:
        for attempt in range(1, _MAX_ATTEMPTS + 1):
            try:
                resp = client.post(
                    settings.transcript_service_url,
                    json={"video_id": video_id},
                    headers=headers,
                )
                resp.raise_for_status()
                payload = resp.json()
            except Exception as exc:  # network, HTTP status, bad JSON
                log.warning(
                    "transcript request failed for %s (attempt %d): %s",
                    video_id, attempt, exc,
                )
                raise TranscriptUnavailable(
                    "We couldn't fetch this video's transcript right now. It "
                    "may have no captions, or the service is busy — please try "
                    "again in a moment."
                ) from exc

            segments = _parse_payload(payload)
            if segments:
                log.info(
                    "transcript: video=%s segments=%d attempt=%d",
                    video_id, len(segments), attempt,
                )
                return FetchedTranscript(
                    segments=segments, language_code=None, is_generated=False
                )

            status = str((payload or {}).get("status") or "").upper() if isinstance(payload, dict) else ""
            # READY + no segments => genuinely no captions; stop polling.
            if status == "READY":
                break
            if attempt < _MAX_ATTEMPTS:
                time.sleep(_POLL_DELAY_SECONDS)

    raise TranscriptUnavailable(
        "This video has no captions available, so we can't turn it into "
        "study material yet. Try a video that has captions or subtitles."
    )
