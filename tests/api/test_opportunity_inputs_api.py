from __future__ import annotations

from datetime import UTC, datetime

from fastapi.testclient import TestClient
from sqlalchemy import insert

from app.db import get_engine
from app.opportunity_models import opportunities_table


def _create_opportunity(
    authenticated_web_session,
) -> str:
    opportunity_id = "opp_phase4_inputs"
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


def test_list_inputs_returns_primary_input_and_history_for_d30_route(
    api_client: TestClient,
    authenticated_web_session,
) -> None:
    opportunity_id = _create_opportunity(authenticated_web_session)

    response = api_client.get(
        f"/api/v1/opportunities/{opportunity_id}/inputs",
        headers=authenticated_web_session.read_header_map(),
    )

    assert response.status_code == 200
    payload = response.json()

    assert payload["items"] == []
    assert payload["primary_input_id"] is None
    assert payload["allowed_input_types"] == ["raw_input", "extracted_text"]


def test_create_input_persists_manual_source_notes_on_d30_route(
    api_client: TestClient,
    authenticated_web_session,
    opportunity_input_payload_builder,
) -> None:
    opportunity_id = _create_opportunity(authenticated_web_session)

    response = api_client.post(
        f"/api/v1/opportunities/{opportunity_id}/inputs",
        json=opportunity_input_payload_builder(
            content="North Star needs a website redesign, migration support, and analytics cleanup.",
            source_label="kickoff notes",
        ),
        headers=authenticated_web_session.write_header_map(),
    )

    assert response.status_code == 201
    payload = response.json()

    assert payload["input"]["opportunity_id"] == opportunity_id
    assert payload["input"]["input_type"] == "raw_input"
    assert payload["input"]["source_label"] == "kickoff notes"
    assert payload["input"]["content"].startswith("North Star needs a website redesign")


def test_patch_input_updates_existing_manual_source_on_d30_route(
    api_client: TestClient,
    authenticated_web_session,
    opportunity_input_payload_builder,
) -> None:
    opportunity_id = _create_opportunity(authenticated_web_session)

    create_response = api_client.post(
        f"/api/v1/opportunities/{opportunity_id}/inputs",
        json=opportunity_input_payload_builder(),
        headers=authenticated_web_session.write_header_map(),
    )
    assert create_response.status_code == 201
    input_id = create_response.json()["input"]["id"]

    response = api_client.patch(
        f"/api/v1/opportunities/{opportunity_id}/inputs/{input_id}",
        json={
            "content": "The client wants launch support, analytics cleanup, and CMS training.",
            "source_label": "updated kickoff notes",
        },
        headers=authenticated_web_session.write_header_map(),
    )

    assert response.status_code == 200
    payload = response.json()

    assert payload["input"]["id"] == input_id
    assert payload["input"]["content"].startswith("The client wants launch support")
    assert payload["input"]["source_label"] == "updated kickoff notes"
