"""YouTube transcript retrieval.

v1 of the media-import feature uses *existing captions only* — no audio
download, no speech-to-text. We pull the caption track via
``youtube-transcript-api`` (which returns timestamped cues for free) and hand
the segments to the media ingest pipeline.

Everything here is synchronous/blocking (the library uses ``requests`` under
the hood), so callers must invoke it via ``asyncio.to_thread``.
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


def _pick_transcript(transcript_list):
    """Choose a transcript from the available tracks.

    Prefer a manually-created track (more accurate) over an auto-generated one;
    accept any language since we re-detect / can translate downstream.
    """
    transcripts = list(transcript_list)
    if not transcripts:
        raise TranscriptUnavailable(
            "This video has no captions available, so we can't turn it into "
            "study material yet. Try a video that has captions or subtitles."
        )
    manual = [t for t in transcripts if not getattr(t, "is_generated", False)]
    return (manual or transcripts)[0]


def fetch_transcript(
    video_id: str, *, languages: list[str] | None = None
) -> FetchedTranscript:
    """Fetch the best available caption track for ``video_id``.

    Targets youtube-transcript-api v1.x (instance API). Raises
    ``TranscriptUnavailable`` (with a user-facing message) for any failure —
    no captions, private/removed video, IP block, or missing dependency.
    """
    try:
        from youtube_transcript_api import (
            YouTubeTranscriptApi,
        )
        from youtube_transcript_api import (
            _errors as yt_errors,
        )
    except ImportError as exc:  # dependency not installed yet (pre-rebuild)
        raise TranscriptUnavailable(
            "Video transcript support isn't available on the server right now."
        ) from exc

    transcripts_disabled = getattr(yt_errors, "TranscriptsDisabled", ())
    no_transcript = getattr(yt_errors, "NoTranscriptFound", ())
    video_unavailable = getattr(yt_errors, "VideoUnavailable", ())

    api = YouTubeTranscriptApi()
    try:
        if languages:
            fetched = api.fetch(video_id, languages=languages)
        else:
            fetched = _pick_transcript(api.list(video_id)).fetch()
    except TranscriptUnavailable:
        raise
    except transcripts_disabled as exc:
        raise TranscriptUnavailable(
            "Captions are disabled for this video, so we can't build study "
            "material from it. Try a video with captions."
        ) from exc
    except no_transcript as exc:
        raise TranscriptUnavailable(
            "We couldn't find a usable caption track for this video."
        ) from exc
    except video_unavailable as exc:
        raise TranscriptUnavailable(
            "This video is unavailable, private, or region-locked."
        ) from exc
    except Exception as exc:  # IP block, network, parsing — keep it friendly
        log.warning("transcript fetch failed for %s: %s", video_id, exc)
        raise TranscriptUnavailable(
            "We couldn't fetch this video's transcript. It may have no "
            "captions, or YouTube blocked the request — please try again."
        ) from exc

    # FetchedTranscript exposes `.snippets`; older shapes are iterable.
    snippets = getattr(fetched, "snippets", None)
    if snippets is None:
        snippets = list(fetched)

    segments = [
        TranscriptSegment(
            start_seconds=float(getattr(s, "start", 0.0) or 0.0),
            duration_seconds=float(getattr(s, "duration", 0.0) or 0.0),
            text=str(getattr(s, "text", "") or "").strip(),
        )
        for s in snippets
    ]
    segments = [s for s in segments if s.text]
    if not segments:
        raise TranscriptUnavailable("This video's transcript was empty.")

    return FetchedTranscript(
        segments=segments,
        language_code=getattr(fetched, "language_code", None),
        is_generated=bool(getattr(fetched, "is_generated", False)),
    )
