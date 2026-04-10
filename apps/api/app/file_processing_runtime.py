from __future__ import annotations

import os
import re
from io import BytesIO
from pathlib import Path
from typing import Protocol


class ObjectStore(Protocol):
    def put_bytes(self, key: str, payload: bytes) -> None: ...

    def get_bytes(self, key: str) -> bytes: ...

    def exists(self, key: str) -> bool: ...


class LocalObjectStore:
    def __init__(self, root: str | Path | None = None) -> None:
        self.root = Path(root or ".object-store").resolve()

    def _resolve(self, key: str) -> Path:
        return self.root / key

    def put_bytes(self, key: str, payload: bytes) -> None:
        path = self._resolve(key)
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(payload)

    def get_bytes(self, key: str) -> bytes:
        return self._resolve(key).read_bytes()

    def exists(self, key: str) -> bool:
        return self._resolve(key).exists()


class S3ObjectStore:
    def __init__(self, client, bucket: str) -> None:
        self.client = client
        self.bucket = bucket

    def put_bytes(self, key: str, payload: bytes) -> None:
        self.client.put_object(Bucket=self.bucket, Key=key, Body=payload)

    def get_bytes(self, key: str) -> bytes:
        response = self.client.get_object(Bucket=self.bucket, Key=key)
        return response["Body"].read()

    def exists(self, key: str) -> bool:
        try:
            from botocore.exceptions import ClientError

            self.client.head_object(Bucket=self.bucket, Key=key)
            return True
        except ClientError as error:
            code = str(error.response.get("Error", {}).get("Code", ""))
            if code in {"404", "403", "NoSuchKey", "NotFound"}:
                return False
            raise


def _env_value(*names: str) -> str | None:
    for name in names:
        value = os.environ.get(name)
        if value:
            return value
    return None


def _deployment_environment() -> str:
    return (_env_value("APP_ENV", "NEXT_PUBLIC_APP_ENV", "NODE_ENV") or "local").lower()


def resolve_object_store() -> ObjectStore:
    backend = _env_value("OBJECT_STORAGE_BACKEND", "OBJECT_STORE_BACKEND", "S3_BACKEND", "MINIO_BACKEND")
    endpoint_url = _env_value(
        "OBJECT_STORAGE_ENDPOINT_URL",
        "OBJECT_STORE_ENDPOINT_URL",
        "S3_ENDPOINT_URL",
        "MINIO_ENDPOINT_URL",
    )
    bucket = _env_value("OBJECT_STORAGE_BUCKET", "OBJECT_STORE_BUCKET", "S3_BUCKET", "MINIO_BUCKET")

    if (backend or "").lower().strip() == "s3" or bucket or endpoint_url:
        if not bucket:
            raise ValueError("OBJECT_STORAGE_BUCKET is required when using S3 object storage.")

        import boto3
        from botocore.config import Config

        access_key_id = _env_value(
            "OBJECT_STORAGE_ACCESS_KEY_ID",
            "OBJECT_STORE_ACCESS_KEY_ID",
            "AWS_ACCESS_KEY_ID",
            "MINIO_ROOT_USER",
        )
        secret_access_key = _env_value(
            "OBJECT_STORAGE_SECRET_ACCESS_KEY",
            "OBJECT_STORE_SECRET_ACCESS_KEY",
            "AWS_SECRET_ACCESS_KEY",
            "MINIO_ROOT_PASSWORD",
        )
        region_name = _env_value(
            "OBJECT_STORAGE_REGION_NAME",
            "OBJECT_STORE_REGION_NAME",
            "AWS_REGION",
            "AWS_DEFAULT_REGION",
        ) or "us-east-1"
        use_path_style = os.environ.get("OBJECT_STORAGE_USE_PATH_STYLE", os.environ.get("OBJECT_STORE_USE_PATH_STYLE", "1")).lower() not in {"0", "false", "no"}

        client_kwargs: dict[str, object] = {"region_name": region_name}
        if endpoint_url:
            client_kwargs["endpoint_url"] = endpoint_url
        if access_key_id:
            client_kwargs["aws_access_key_id"] = access_key_id
        if secret_access_key:
            client_kwargs["aws_secret_access_key"] = secret_access_key
        if use_path_style:
            client_kwargs["config"] = Config(s3={"addressing_style": "path"})

        client = boto3.client("s3", **client_kwargs)
        return S3ObjectStore(client, bucket)

    if _deployment_environment() in {"staging", "production"}:
        raise ValueError("OBJECT_STORAGE_* is required in staging and production environments.")

    return LocalObjectStore(_env_value("OBJECT_STORAGE_DIR", "OBJECT_STORE_DIR"))


def extract_text_from_pdf_bytes(payload: bytes) -> str:
    try:
        from pypdf import PdfReader  # type: ignore[import-not-found]

        reader = PdfReader(BytesIO(payload))
        text_parts: list[str] = []

        for page in reader.pages:
            extracted = page.extract_text() or ""
            if extracted.strip():
                text_parts.append(extracted.strip())

        extracted_text = "\n\n".join(text_parts).strip()
        if extracted_text:
            return extracted_text
    except Exception:
        pass

    decoded = payload.decode("latin-1", errors="ignore")
    text_parts = [match.strip() for match in re.findall(r"\((.*?)\)\s*Tj", decoded, flags=re.S) if match.strip()]
    extracted_text = "\n\n".join(text_parts).strip()
    if extracted_text:
        return extracted_text

    raise ValueError("No extractable text found. OCR is not part of the MVP pipeline.")
