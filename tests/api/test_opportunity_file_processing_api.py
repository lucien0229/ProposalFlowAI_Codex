from __future__ import annotations

from datetime import UTC, datetime
from pathlib import Path

from fastapi.testclient import TestClient
from sqlalchemy import insert

from app.db import get_engine
from app.opportunity_models import opportunities_table


FIXTURE_PDF = Path(__file__).resolve().parents[1] / "fixtures" / "north-star-intake.pdf"


def _create_opportunity(
    authenticated_web_session,
) -> str:
    opportunity_id = "opp_phase4_files"
    now = datetime.now(UTC)

    with get_engine().begin() as connection:
        connection.execute(
            insert(opportunities_table).values(
                id=opportunity_id,
                workspace_id=authenticated_web_session.workspace_id,
                owner_user_id=authenticated_web_session.user_id,
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


def test_create_upload_url_returns_file_asset_contract(
    api_client: TestClient,
    authenticated_web_session,
    file_upload_request_builder,
) -> None:
    opportunity_id = _create_opportunity(authenticated_web_session)

    response = api_client.post(
        f"/api/v1/opportunities/{opportunity_id}/files/upload-url",
        json=file_upload_request_builder(),
        headers=authenticated_web_session.write_header_map(),
    )

    assert response.status_code == 201
    payload = response.json()

    assert payload["file"]["opportunity_id"] == opportunity_id
    assert payload["file"]["file_status"] == "uploaded"
    assert payload["file"]["file_name"] == "north-star-intake.pdf"
    assert payload["upload"]["method"] == "PUT"
    assert payload["upload"]["upload_url"] == f"/api/v1/opportunities/{opportunity_id}/files/{payload['file']['id']}/upload"
    assert payload["upload"]["object_key"].startswith(f"opportunities/{opportunity_id}/")


def test_complete_upload_marks_processing_and_exposes_polling_shape(
    api_client: TestClient,
    authenticated_web_session,
    fake_object_store,
    file_upload_request_builder,
) -> None:
    opportunity_id = _create_opportunity(authenticated_web_session)

    upload_response = api_client.post(
        f"/api/v1/opportunities/{opportunity_id}/files/upload-url",
        json=file_upload_request_builder(),
        headers=authenticated_web_session.write_header_map(),
    )
    assert upload_response.status_code == 201
    upload_payload = upload_response.json()
    file_asset_id = upload_payload["file"]["id"]
    object_key = upload_payload["upload"]["object_key"]

    upload_response = api_client.put(
        f"/api/v1/opportunities/{opportunity_id}/files/{file_asset_id}/upload",
        data=FIXTURE_PDF.read_bytes(),
        headers={
            **authenticated_web_session.write_header_map(),
            "content-type": "application/pdf",
        },
    )
    assert upload_response.status_code == 200

    complete_response = api_client.post(
        f"/api/v1/opportunities/{opportunity_id}/files/{file_asset_id}/complete",
        json={"object_key": object_key},
        headers=authenticated_web_session.write_header_map(),
    )

    assert complete_response.status_code == 202
    complete_payload = complete_response.json()
    assert complete_payload["file"]["id"] == file_asset_id
    assert complete_payload["file"]["file_status"] == "ready"
    assert complete_payload["file"]["extracted_text"] == "North Star intake"
    assert complete_payload["latest_job"]["status"] == "ready"
    assert "poll_url" not in complete_payload

    detail_response = api_client.get(
        f"/api/v1/opportunities/{opportunity_id}/files/{file_asset_id}",
        headers=authenticated_web_session.read_header_map(),
    )

    assert detail_response.status_code == 200
    detail_payload = detail_response.json()
    assert detail_payload["file"]["file_status"] == "ready"
    assert detail_payload["latest_job"]["status"] == "ready"
    assert detail_payload.get("next_action_label") is None


def test_retry_file_creates_new_attempt_after_failed_processing(
    api_client: TestClient,
    authenticated_web_session,
    fake_object_store,
    file_upload_request_builder,
) -> None:
    opportunity_id = _create_opportunity(authenticated_web_session)

    upload_response = api_client.post(
        f"/api/v1/opportunities/{opportunity_id}/files/upload-url",
        json=file_upload_request_builder(),
        headers=authenticated_web_session.write_header_map(),
    )
    assert upload_response.status_code == 201
    upload_payload = upload_response.json()
    file_asset_id = upload_payload["file"]["id"]
    object_key = upload_payload["upload"]["object_key"]

    upload_response = api_client.put(
        f"/api/v1/opportunities/{opportunity_id}/files/{file_asset_id}/upload",
        data=FIXTURE_PDF.read_bytes(),
        headers={
            **authenticated_web_session.write_header_map(),
            "content-type": "application/pdf",
        },
    )
    assert upload_response.status_code == 200

    complete_response = api_client.post(
        f"/api/v1/opportunities/{opportunity_id}/files/{file_asset_id}/complete",
        json={"object_key": object_key, "simulate_failure": True},
        headers=authenticated_web_session.write_header_map(),
    )
    assert complete_response.status_code == 202

    failed_detail = api_client.get(
        f"/api/v1/opportunities/{opportunity_id}/files/{file_asset_id}",
        headers=authenticated_web_session.read_header_map(),
    )
    assert failed_detail.status_code == 200
    failed_payload = failed_detail.json()
    assert failed_payload["file"]["file_status"] == "failed"
    assert failed_payload["latest_job"]["status"] == "failed"
    assert failed_payload["latest_job"]["error_message"] == "Processing failed."
    assert failed_payload["next_action_label"] == "Retry extraction"

    retry_response = api_client.post(
        f"/api/v1/opportunities/{opportunity_id}/files/{file_asset_id}/retry",
        headers=authenticated_web_session.write_header_map(),
    )

    assert retry_response.status_code == 202
    retry_payload = retry_response.json()
    assert retry_payload["file"]["file_status"] == "processing"
    assert retry_payload["latest_job"]["attempt_number"] == 2
    assert retry_payload["latest_job"]["status"] == "pending"
