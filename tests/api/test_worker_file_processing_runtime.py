from __future__ import annotations

import importlib.util
from datetime import UTC, datetime
from pathlib import Path

from app.account_service import SessionRecord
from app.db import clear_engine_cache, get_engine
from app.opportunity_models import opportunities_table
from app.opportunity_service import complete_file_upload, create_file_upload_url
from tests.support.file_processing_fakes import InMemoryObjectStore
from sqlalchemy import insert


ROOT = Path(__file__).resolve().parents[2]
WORKER_MAIN_PATH = ROOT / "apps" / "worker" / "main.py"
FIXTURE_PDF = Path(__file__).resolve().parents[1] / "fixtures" / "north-star-intake.pdf"


def _load_worker_main():
    spec = importlib.util.spec_from_file_location("worker_main", WORKER_MAIN_PATH)
    assert spec is not None
    assert spec.loader is not None
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def _create_opportunity(session: SessionRecord) -> str:
    now = datetime.now(UTC)
    opportunity_id = "opp_worker_drain"

    with get_engine().begin() as connection:
        connection.execute(
            insert(opportunities_table).values(
                id=opportunity_id,
                workspace_id=session.workspace_id or "",
                owner_user_id=session.user_id,
                title="Website redesign retainer",
                company_name="North Star Studio",
                contact_name=None,
                contact_email=None,
                requested_service="Website redesign and migration support",
                source_type="manual",
                status="new",
                status_before_archive=None,
                archived_at=None,
                created_at=now,
                updated_at=now,
            )
        )

    return opportunity_id


def test_worker_run_once_drains_pending_file_job(
    api_client,
    authenticated_web_session,
    monkeypatch,
) -> None:
    object_store = InMemoryObjectStore()
    opportunity_id = _create_opportunity(
        SessionRecord(
            session_id=authenticated_web_session.session_id,
            user_id=authenticated_web_session.user_id,
            csrf_secret="",
            workspace_id=authenticated_web_session.workspace_id,
            session_type="web",
        )
    )

    with get_engine().begin() as connection:
        upload = create_file_upload_url(
            connection,
            session=SessionRecord(
                session_id=authenticated_web_session.session_id,
                user_id=authenticated_web_session.user_id,
                csrf_secret="",
                workspace_id=authenticated_web_session.workspace_id,
                session_type="web",
            ),
            opportunity_id=opportunity_id,
            payload={
                "file_name": "north-star-intake.pdf",
                "mime_type": "application/pdf",
                "size_bytes": len(FIXTURE_PDF.read_bytes()),
            },
        )
        assert upload is not None
        object_key = upload["upload"]["object_key"]
        file_asset_id = upload["file"]["id"]
        object_store.put_bytes(object_key, FIXTURE_PDF.read_bytes())
        pending = complete_file_upload(
            connection,
            session=SessionRecord(
                session_id=authenticated_web_session.session_id,
                user_id=authenticated_web_session.user_id,
                csrf_secret="",
                workspace_id=authenticated_web_session.workspace_id,
                session_type="web",
            ),
            opportunity_id=opportunity_id,
            file_asset_id=file_asset_id,
            payload={"object_key": object_key},
        )
        assert pending is not None
        assert pending["latest_job"]["status"] == "pending"

    worker_main = _load_worker_main()
    monkeypatch.setattr(worker_main, "resolve_object_store", lambda: object_store)
    monkeypatch.setenv("WORKER_RUN_ONCE", "1")

    exit_code = worker_main.main()
    assert exit_code == 0

    with get_engine().begin() as connection:
        detail = worker_main.process_file_upload(
            connection,
            workspace_id=authenticated_web_session.workspace_id,
            opportunity_id=opportunity_id,
            file_asset_id=file_asset_id,
            object_store=object_store,
        )
        assert detail is not None
        assert detail["file"]["file_status"] == "ready"
        assert detail["latest_job"]["status"] == "ready"
