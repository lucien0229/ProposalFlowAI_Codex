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
    **overrides,
) -> dict[str, object]:
    now = datetime.now(UTC)
    record: dict[str, object | None] = {
        "id": overrides.pop("id", "opp_phase4_overview"),
        "workspace_id": authenticated_web_session.workspace_id,
        "owner_user_id": authenticated_web_session.user_id,
        "title": "Website redesign retainer",
        "company_name": "North Star Studio",
        "contact_name": None,
        "contact_email": None,
        "requested_service": "Website redesign and migration support",
        "source_type": "manual",
        "status": "new",
        "status_before_archive": None,
        "archived_at": None,
        "created_at": now,
        "updated_at": now,
    }
    record.update(overrides)

    with get_engine().begin() as connection:
        connection.execute(insert(opportunities_table).values(**record))

    return record


def test_opportunity_detail_returns_nested_intake_workspace_contract(
    api_client: TestClient,
    authenticated_web_session,
) -> None:
    opportunity = _create_opportunity(
        authenticated_web_session,
        title="North Star redesign",
        company_name="North Star Studio",
        requested_service="Website redesign and migration support",
    )

    response = api_client.get(
        f"/api/v1/opportunities/{opportunity['id']}",
        headers=authenticated_web_session.read_header_map(),
    )

    assert response.status_code == 200
    payload = response.json()

    assert payload["opportunity"]["id"] == opportunity["id"]
    assert payload["opportunity"]["title"] == "North Star redesign"
    assert payload["opportunity"]["company_name"] == "North Star Studio"
    assert payload["workspace"]["eyebrow"] == "Opportunity intake"
    assert payload["workflow"]["current_step"]["key"] == "overview"
    assert payload["workflow"]["current_step"]["label"] == "Lead Intake"
    assert payload["workflow"]["steps"] == [
        "Lead Intake",
        "Lead Brief",
        "Discovery",
        "Proposal Draft",
        "Follow-up",
    ]
    assert payload["minimum_context"]["owner"]["user_id"] == authenticated_web_session.user_id
    assert payload["minimum_context"]["owner"]["name"] == "Test Owner"
    assert payload["minimum_context"]["fields"]["requested_service"] == "Website redesign and migration support"
    assert payload["intake"]["primary_input"] is None
    assert payload["intake"]["latest_file"] is None
    assert payload["intake"]["generation_gate"] == {
        "can_generate": False,
        "reason": "missing_source",
        "detail": "Add raw source notes or wait for extracted text before generating the lead brief.",
    }


def test_patch_opportunity_updates_minimum_context_and_primary_input(
    api_client: TestClient,
    authenticated_web_session,
) -> None:
    opportunity = _create_opportunity(
        authenticated_web_session,
    )

    response = api_client.patch(
        f"/api/v1/opportunities/{opportunity['id']}",
        json={
            "title": "North Star redesign retainer",
            "company_name": "North Star Studio",
            "contact_name": "Mira Chen",
            "contact_email": "mira@northstar.test",
            "requested_service": "Website redesign and migration support",
            "source_type": "manual",
            "raw_input": "Existing raw notes stay editable and persist on the overview route.",
        },
        headers=authenticated_web_session.write_header_map(),
    )

    assert response.status_code == 200
    payload = response.json()

    assert payload["opportunity"]["title"] == "North Star redesign retainer"
    assert payload["minimum_context"]["fields"]["contact_name"] == "Mira Chen"
    assert payload["minimum_context"]["fields"]["contact_email"] == "mira@northstar.test"
    assert payload["intake"]["primary_input"]["input_type"] == "raw_input"
    assert payload["intake"]["primary_input"]["content"].startswith("Existing raw notes")
    assert payload["save_state"] == {
        "status": "saved",
        "label": "Saved just now",
    }


def test_opportunity_detail_exposes_latest_uploaded_file_asset(
    api_client: TestClient,
    authenticated_web_session,
    fake_object_store,
    file_upload_request_builder,
) -> None:
    opportunity = _create_opportunity(
        authenticated_web_session,
        title="North Star redesign",
        company_name="North Star Studio",
        requested_service="Website redesign and migration support",
    )

    upload_response = api_client.post(
        f"/api/v1/opportunities/{opportunity['id']}/files/upload-url",
        json=file_upload_request_builder(),
        headers=authenticated_web_session.write_header_map(),
    )
    assert upload_response.status_code == 201
    upload_payload = upload_response.json()
    file_asset_id = upload_payload["file"]["id"]
    object_key = upload_payload["upload"]["object_key"]

    upload_response = api_client.put(
        f"/api/v1/opportunities/{opportunity['id']}/files/{file_asset_id}/upload",
        data=FIXTURE_PDF.read_bytes(),
        headers={
            **authenticated_web_session.write_header_map(),
            "content-type": "application/pdf",
        },
    )
    assert upload_response.status_code == 200

    complete_response = api_client.post(
        f"/api/v1/opportunities/{opportunity['id']}/files/{file_asset_id}/complete",
        json={"object_key": object_key},
        headers=authenticated_web_session.write_header_map(),
    )
    assert complete_response.status_code == 202

    detail_response = api_client.get(
        f"/api/v1/opportunities/{opportunity['id']}",
        headers=authenticated_web_session.read_header_map(),
    )
    assert detail_response.status_code == 200
    detail_payload = detail_response.json()

    assert detail_payload["intake"]["latest_file"]["id"] == file_asset_id
    assert detail_payload["intake"]["latest_file"]["file_name"] == "north-star-intake.pdf"
    assert detail_payload["intake"]["latest_file"]["file_status"] == "ready"
    assert detail_payload["intake"]["latest_file"]["extracted_text"] == "North Star intake"


def test_missing_opportunity_returns_product_not_found_error_shape(
    api_client: TestClient,
    authenticated_web_session,
) -> None:
    response = api_client.get(
        "/api/v1/opportunities/opp_missing_overview",
        headers=authenticated_web_session.read_header_map(),
    )

    assert response.status_code == 404
    assert response.json() == {
        "error": {
            "code": "OPPORTUNITY_NOT_FOUND",
            "message": "Opportunity not found.",
            "details": {
                "opportunity_id": "opp_missing_overview",
            },
            "restriction_reason": None,
        }
    }
