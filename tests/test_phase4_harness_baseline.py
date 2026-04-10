from __future__ import annotations

from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


def read_text(relative_path: str) -> str:
    return (ROOT / relative_path).read_text(encoding="utf-8")


def test_phase4_harness_exports_api_bootstrap_fixtures() -> None:
    conftest_source = read_text("tests/conftest.py")

    expected_fixture_defs = [
        "def api_client(",
        "def authenticated_web_session(",
        "def opportunity_payload_builder(",
        "def opportunity_input_payload_builder(",
        "def file_upload_request_builder(",
        "def fake_queue(",
        "def fake_object_store(",
    ]

    for fixture_def in expected_fixture_defs:
        assert fixture_def in conftest_source


def test_phase4_harness_declares_compose_healthchecks_and_deterministic_fakes() -> None:
    compose_source = read_text("infra/compose/docker-compose.local.yml")

    assert "NEXT_PUBLIC_API_BASE_URL: http://api.localhost:8000" in compose_source
    assert "OBJECT_STORAGE_BUCKET: proposalflow-intake-local" in compose_source
    assert "redis:" in compose_source
    assert "minio:" in compose_source
    assert "healthcheck:" in compose_source

    from tests.support.file_processing_fakes import InMemoryObjectStore, InlineQueue

    queue = InlineQueue()
    job = queue.enqueue(lambda value: value.upper(), "ready")
    store = InMemoryObjectStore()
    store.put_text("opportunities/example.txt", "baseline")

    assert job.result == "READY"
    assert queue.enqueued_jobs[0].status == "ready"
    assert store.get_text("opportunities/example.txt") == "baseline"


def test_phase4_harness_wires_runtime_api_and_object_storage_env() -> None:
    web_deploy = read_text("infra/deploy/web.yaml")
    api_deploy = read_text("infra/deploy/api.yaml")
    worker_deploy = read_text("infra/deploy/worker.yaml")

    expected_web_fragments = [
        "NEXT_PUBLIC_API_BASE_URL: http://api.localhost:8000",
        "NEXT_PUBLIC_API_BASE_URL: http://api.staging.localhost:8000",
        "NEXT_PUBLIC_API_BASE_URL: http://api.proposalflow.ai:8000",
        "API_BASE_URL: http://api.localhost:8000",
        "API_BASE_URL: http://api.staging.localhost:8000",
        "API_BASE_URL: http://api.proposalflow.ai:8000",
    ]
    expected_storage_fragments = [
        "APP_ENV: local",
        "APP_ENV: staging",
        "APP_ENV: production",
        "OBJECT_STORAGE_BACKEND: s3",
        "OBJECT_STORAGE_BUCKET: proposalflow-intake-local",
        "OBJECT_STORAGE_BUCKET: proposalflow-intake-staging",
        "OBJECT_STORAGE_BUCKET: proposalflow-intake-production",
        "OBJECT_STORAGE_ENDPOINT_URL: http://minio:9000",
        "OBJECT_STORAGE_ACCESS_KEY_ID: proposalflow",
        "OBJECT_STORAGE_SECRET_ACCESS_KEY: proposalflow123",
        "OBJECT_STORAGE_REGION_NAME: us-east-1",
        "OBJECT_STORAGE_USE_PATH_STYLE: \"1\"",
    ]

    for fragment in expected_web_fragments:
        assert fragment in web_deploy

    for fragment in expected_storage_fragments:
        assert fragment in api_deploy
        assert fragment in worker_deploy
