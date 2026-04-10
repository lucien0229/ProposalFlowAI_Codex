from __future__ import annotations

from datetime import UTC, datetime

from fastapi.testclient import TestClient
from sqlalchemy import insert

from app.db import get_engine
from app.opportunity_models import opportunities_table


def _create_opportunity(authenticated_web_session, **overrides) -> str:
    opportunity_id = overrides.pop("id", "opp_lead_brief_route")
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
        "status": "lead_brief_generated",
        "status_before_archive": None,
        "archived_at": None,
        "created_at": now,
        "updated_at": now,
    }
    record.update(overrides)

    with get_engine().begin() as connection:
        connection.execute(insert(opportunities_table).values(**record))

    return opportunity_id


def test_lead_brief_current_step_url_canonicalizes_the_public_slug(
    api_client: TestClient,
    authenticated_web_session,
) -> None:
    opportunity_id = _create_opportunity(authenticated_web_session)

    response = api_client.get(
        f"/api/v1/opportunities/{opportunity_id}",
        headers=authenticated_web_session.read_header_map(),
    )

    assert response.status_code == 200
    payload = response.json()

    assert payload["opportunity"]["current_step"] == "lead_brief"
    assert payload["opportunity"]["current_step_url"] == f"/opportunities/{opportunity_id}/lead-brief"
    assert payload["opportunity"]["current_step_url"] != f"/opportunities/{opportunity_id}/lead_brief"

    list_response = api_client.get(
        "/api/v1/opportunities",
        headers=authenticated_web_session.read_header_map(),
    )
    assert list_response.status_code == 200
    assert list_response.json()["items"][0]["current_step_url"] == f"/opportunities/{opportunity_id}/lead-brief"


def test_generate_lead_brief_redirects_to_the_same_canonical_slug(
    api_client: TestClient,
    authenticated_web_session,
) -> None:
    opportunity_id = _create_opportunity(
        authenticated_web_session,
        id="opp_lead_brief_generate_route",
        status="new",
        requested_service="Website redesign and migration support",
    )

    update_response = api_client.patch(
        f"/api/v1/opportunities/{opportunity_id}",
        json={
            "title": "Website redesign retainer",
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
    assert response.json()["redirect_to"] == f"/opportunities/{opportunity_id}/lead-brief"
