from __future__ import annotations

import sys
import types

from app.file_processing_runtime import S3ObjectStore, resolve_object_store


class FakeConfig:
    def __init__(self, **kwargs):
        self.kwargs = kwargs


class FakeClientError(Exception):
    def __init__(self, code: str) -> None:
        self.response = {"Error": {"Code": code}}


class FakeS3Client:
    def __init__(self) -> None:
        self.objects: dict[tuple[str, str], bytes] = {}
        self.last_kwargs: dict[str, object] | None = None

    def put_object(self, *, Bucket: str, Key: str, Body: bytes) -> None:
        self.objects[(Bucket, Key)] = Body

    def get_object(self, *, Bucket: str, Key: str):
        payload = self.objects[(Bucket, Key)]
        return {"Body": types.SimpleNamespace(read=lambda: payload)}

    def head_object(self, *, Bucket: str, Key: str) -> None:
        if (Bucket, Key) not in self.objects:
            raise FakeClientError("404")


def test_resolve_object_store_uses_s3_when_configured(monkeypatch) -> None:
    fake_client = FakeS3Client()

    fake_boto3 = types.SimpleNamespace(client=lambda service_name, **kwargs: fake_client)
    fake_botocore_config = types.SimpleNamespace(Config=FakeConfig)
    fake_botocore_exceptions = types.SimpleNamespace(ClientError=FakeClientError)

    monkeypatch.setenv("APP_ENV", "local")
    monkeypatch.setenv("OBJECT_STORAGE_BACKEND", "s3")
    monkeypatch.setenv("OBJECT_STORAGE_BUCKET", "proposalflow-files")
    monkeypatch.setenv("OBJECT_STORAGE_ENDPOINT_URL", "http://minio:9000")
    monkeypatch.setenv("OBJECT_STORAGE_ACCESS_KEY_ID", "proposalflow")
    monkeypatch.setenv("OBJECT_STORAGE_SECRET_ACCESS_KEY", "proposalflow123")
    monkeypatch.setenv("OBJECT_STORAGE_REGION_NAME", "us-east-1")
    monkeypatch.setitem(sys.modules, "boto3", fake_boto3)
    monkeypatch.setitem(sys.modules, "botocore.config", fake_botocore_config)
    monkeypatch.setitem(sys.modules, "botocore.exceptions", fake_botocore_exceptions)

    object_store = resolve_object_store()

    assert isinstance(object_store, S3ObjectStore)
    object_store.put_bytes("opportunities/abc/file.pdf", b"pdf-bytes")
    assert object_store.exists("opportunities/abc/file.pdf") is True
    assert object_store.get_bytes("opportunities/abc/file.pdf") == b"pdf-bytes"


def test_resolve_object_store_requires_configuration_in_production(monkeypatch) -> None:
    monkeypatch.setenv("APP_ENV", "production")
    monkeypatch.delenv("OBJECT_STORAGE_BACKEND", raising=False)
    monkeypatch.delenv("OBJECT_STORAGE_ENDPOINT_URL", raising=False)
    monkeypatch.delenv("OBJECT_STORAGE_BUCKET", raising=False)
    monkeypatch.delenv("OBJECT_STORE_BACKEND", raising=False)
    monkeypatch.delenv("OBJECT_STORE_ENDPOINT_URL", raising=False)
    monkeypatch.delenv("OBJECT_STORE_BUCKET", raising=False)

    try:
        resolve_object_store()
    except ValueError as error:
        assert "OBJECT_STORAGE_" in str(error)
    else:  # pragma: no cover - defensive branch
        raise AssertionError("expected production object storage config to be required")
