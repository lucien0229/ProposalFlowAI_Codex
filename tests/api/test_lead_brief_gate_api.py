from __future__ import annotations

from datetime import UTC, datetime

from fastapi.testclient import TestClient
from sqlalchemy import insert

from app.db import get_engine
from app.opportunity_models import opportunities_table


def _create_opportunity(
    authenticated_web_session,
    **overrides,
) -> str:
    opportunity_id = overrides.pop("id", "opp_phase4_gate")
    now = datetime.now(UTC)
    record: dict[str, object | None] = {
        "id": opportunity_id,
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

    return opportunity_id


def test_generate_lead_brief_returns_blocked_reason_when_business_context_is_incomplete(
    api_client: TestClient,
    authenticated_web_session,
) -> None:
    opportunity_id = _create_opportunity(
        authenticated_web_session,
        requested_service=None,
    )

    response = api_client.post(
        f"/api/v1/opportunities/{opportunity_id}/lead-brief/generate",
        headers=authenticated_web_session.write_header_map(),
    )

    assert response.status_code == 409
    assert response.json() == {
        "error": {
            "code": "LEAD_BRIEF_REQUIRED",
            "message": "Lead brief generation is blocked.",
            "details": {
                "reason": "missing_fields",
                "detail": "Add the core opportunity details before generating the lead brief.",
            },
            "restriction_reason": None,
        }
    }


def test_generate_lead_brief_returns_processing_gate_when_only_file_work_is_pending(
    api_client: TestClient,
    authenticated_web_session,
) -> None:
    opportunity_id = _create_opportunity(
        authenticated_web_session,
        title="North Star redesign",
        company_name="North Star Studio",
        requested_service="Website redesign and migration support",
    )

    patch_response = api_client.patch(
        f"/api/v1/opportunities/{opportunity_id}",
        json={
            "title": "North Star redesign",
            "company_name": "North Star Studio",
            "requested_service": "Website redesign and migration support",
            "source_type": "pdf_upload",
            "raw_input": "",
            "file_gate": {
                "file_status": "processing",
            },
        },
        headers=authenticated_web_session.write_header_map(),
    )
    assert patch_response.status_code == 200

    response = api_client.post(
        f"/api/v1/opportunities/{opportunity_id}/lead-brief/generate",
        headers=authenticated_web_session.write_header_map(),
    )

    assert response.status_code == 409
    assert response.json()["error"]["details"] == {
        "reason": "file_processing",
        "detail": "Your PDF is still processing. You can wait for extraction or add manual source notes now.",
    }


def test_generate_lead_brief_redirects_to_handoff_when_intake_is_ready(
    api_client: TestClient,
    authenticated_web_session,
) -> None:
    opportunity_id = _create_opportunity(
        authenticated_web_session,
        title="North Star redesign",
        company_name="North Star Studio",
        requested_service="Website redesign and migration support",
    )

    update_response = api_client.patch(
        f"/api/v1/opportunities/{opportunity_id}",
        json={
            "title": "North Star redesign",
            "company_name": "North Star Studio",
            "requested_service": "Website redesign and migration support",
            "source_type": "manual",
            "raw_input": "North Star needs a redesign, migration support, and analytics cleanup.",
        },
        headers=authenticated_web_session.write_header_map(),
    )
    assert update_response.status_code == 200

    response = api_client.post(
        f"/api/v1/opportunities/{opportunity_id}/lead-brief/generate",
        headers=authenticated_web_session.write_header_map(),
    )

    assert response.status_code == 202
    payload = response.json()
    assert payload["status"] == "queued"
    assert payload["redirect_to"] == f"/opportunities/{opportunity_id}/lead-brief"
    assert payload["lead_brief"]["opportunity_id"] == opportunity_id
