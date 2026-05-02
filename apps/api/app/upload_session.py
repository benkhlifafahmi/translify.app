"""Short-lived pending-upload metadata, stored in Redis.

The upload flow is:
  1. Client requests a presigned URL (`reserve`) — we mint a key under
     ``uploads/<user_id>/<upload_id>/...`` and stash the file metadata in Redis.
  2. Client PUTs the bytes to MinIO/R2.
  3. Client calls finalize with the upload_id; we look up the metadata and
     create a Book row from it (`get` / `consume`).
"""
from __future__ import annotations

import json
import re
import uuid
from datetime import timedelta
from typing import TypedDict

from app.workers.queue import get_redis

UPLOAD_TTL = timedelta(hours=1)
_KEY_PREFIX = "translify:upload:"

_SAFE_NAME = re.compile(r"[^A-Za-z0-9._-]+")


class UploadSession(TypedDict):
    user_id: str
    file_key: str
    filename: str
    content_type: str
    size_bytes: int
    format: str


def _sanitize(name: str) -> str:
    cleaned = _SAFE_NAME.sub("_", name).strip("._-") or "file"
    # Filesystem-style names can be arbitrarily long; cap to keep keys sane.
    return cleaned[-180:]


def _key(upload_id: str) -> str:
    return f"{_KEY_PREFIX}{upload_id}"


def reserve(
    *,
    user_id: str,
    filename: str,
    content_type: str,
    size_bytes: int,
    format_: str,
) -> tuple[str, str]:
    upload_id = str(uuid.uuid4())
    file_key = f"uploads/{user_id}/{upload_id}/{_sanitize(filename)}"
    payload: UploadSession = {
        "user_id": user_id,
        "file_key": file_key,
        "filename": filename,
        "content_type": content_type,
        "size_bytes": size_bytes,
        "format": format_,
    }
    get_redis().setex(_key(upload_id), int(UPLOAD_TTL.total_seconds()), json.dumps(payload))
    return upload_id, file_key


def get(upload_id: str) -> UploadSession | None:
    raw = get_redis().get(_key(upload_id))
    if raw is None:
        return None
    return json.loads(raw)


def consume(upload_id: str) -> UploadSession | None:
    raw = get_redis().getdel(_key(upload_id))
    if raw is None:
        return None
    return json.loads(raw)
