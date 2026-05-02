"""S3 / MinIO client — used for upload presigning and object retrieval."""
from __future__ import annotations

from datetime import timedelta
from functools import lru_cache

import boto3
from botocore.client import Config

from app.config import settings


@lru_cache
def get_s3_client():
    """Internal client — used by API/workers to access objects directly."""
    return boto3.client(
        "s3",
        endpoint_url=settings.minio_internal_url,
        aws_access_key_id=settings.minio_root_user,
        aws_secret_access_key=settings.minio_root_password,
        config=Config(signature_version="s3v4", s3={"addressing_style": "path"}),
        region_name="us-east-1",
    )


@lru_cache
def get_s3_public_client():
    """Public client — used only to generate presigned URLs (never makes real requests).

    Signed against http://127.0.0.1:9000 because that is the Host header Apache
    sends to MinIO when proxying (ProxyPreserveHost off, the default).  The
    generated URL base is then swapped to the browser-facing public URL by
    _rebase_to_public() so the path in the signature matches the path MinIO
    actually receives after Apache strips the /files/ prefix.
    """
    return boto3.client(
        "s3",
        endpoint_url="http://127.0.0.1:9000",
        aws_access_key_id=settings.minio_root_user,
        aws_secret_access_key=settings.minio_root_password,
        config=Config(signature_version="s3v4", s3={"addressing_style": "path"}),
        region_name="us-east-1",
    )


def _rebase_to_public(url: str) -> str:
    """Swap the internal MinIO base for the browser-facing public URL."""
    from urllib.parse import urlparse, urlunparse
    internal = urlparse(url)
    public = urlparse(settings.minio_public_url)
    return urlunparse((
        public.scheme,
        public.netloc,
        public.path.rstrip("/") + internal.path,
        internal.params,
        internal.query,
        internal.fragment,
    ))


def presigned_put_url(key: str, content_type: str, expires: timedelta = timedelta(minutes=15)) -> str:
    url = get_s3_public_client().generate_presigned_url(
        ClientMethod="put_object",
        Params={
            "Bucket": settings.minio_bucket,
            "Key": key,
            "ContentType": content_type,
        },
        ExpiresIn=int(expires.total_seconds()),
    )
    return _rebase_to_public(url)


def presigned_get_url(key: str, expires: timedelta = timedelta(hours=1)) -> str:
    url = get_s3_public_client().generate_presigned_url(
        ClientMethod="get_object",
        Params={"Bucket": settings.minio_bucket, "Key": key},
        ExpiresIn=int(expires.total_seconds()),
    )
    return _rebase_to_public(url)


def get_object_bytes(key: str) -> bytes:
    obj = get_s3_client().get_object(Bucket=settings.minio_bucket, Key=key)
    return obj["Body"].read()


def put_object_bytes(key: str, body: bytes, content_type: str) -> None:
    get_s3_client().put_object(
        Bucket=settings.minio_bucket,
        Key=key,
        Body=body,
        ContentType=content_type,
    )


def ensure_bucket() -> None:
    """Create the bucket if it doesn't exist. Safe to call repeatedly."""
    client = get_s3_client()
    existing = {b["Name"] for b in client.list_buckets().get("Buckets", [])}
    if settings.minio_bucket not in existing:
        client.create_bucket(Bucket=settings.minio_bucket)
