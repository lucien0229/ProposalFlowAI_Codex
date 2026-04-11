from __future__ import annotations

from datetime import UTC, datetime
from pathlib import Path

from fastapi.testclient import TestClient
from sqlalchemy import insert

from app.db import get_engine
from app.opportunity_models import opportunities_table


ROOT = Path(__file__).resolve().parents[2]


def read_text(relative_path: str) -> str:
    return (ROOT / relative_path).read_text(encoding="utf-8")


def _create_opportunity(
    authenticated_web_session,
    **overrides,
) -> str:
    opportunity_id = overrides.pop("id", "opp_discovery_api")
    now = datetime.now(UTC)
    record: dict[str, object | None] = {
        "id": opportunity_id,
        "workspace_id": authenticated_web_session.workspace_id,
        "owner_user_id": authenticated_web_session.user_id,
        "title": "Discovery contract test opportunity",
        "company_name": "North Star Studio",
        "contact_name": "Mira Chen",
        "contact_email": "mira@northstar.test",
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


def _discovery_fields(**overrides):
    fields = {
        "goals": {
            "value": "Deliver a proposal-ready discovery summary for the relaunch.",
            "state": "confirmed",
            "source_excerpt": "Client wants a proposal-ready summary.",
        },
        "constraints": {
            "value": "Must preserve SEO and the current CMS migration plan.",
            "state": "inferred",
            "source_excerpt": "SEO and CMS migration constraints were mentioned.",
        },
        "ambiguities": {
            "value": "Budget owner and launch timing remain unclear.",
            "state": "needs_review",
            "source_excerpt": "Budget and timing are still open.",
        },
        "risk_flags": {
            "value": "Compressed timeline may create delivery risk.",
            "state": "inferred",
            "source_excerpt": "The schedule is aggressive.",
        },
        "follow_up_questions": {
            "value": "Who approves scope, budget, and launch timing?",
            "state": "confirmed",
            "source_excerpt": "Approval path needs clarification.",
        },
    }
    fields.update(overrides)
    return fields


def test_discovery_api_returns_the_current_resource_and_version_history(
    api_client: TestClient,
    authenticated_web_session,
) -> None:
    opportunity_id = _create_opportunity(authenticated_web_session)

    response = api_client.get(
        f"/api/v1/opportunities/{opportunity_id}/discovery",
        headers=authenticated_web_session.read_header_map(),
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["discovery"]["opportunity_id"] == opportunity_id
    assert payload["discovery"]["current_revision_no"] == 1
    assert payload["versions"] == []


def test_discovery_api_patch_save_version_list_detail_and_restore_use_expected_revision_no(
    api_client: TestClient,
    authenticated_web_session,
) -> None:
    opportunity_id = _create_opportunity(authenticated_web_session)
    update_response = api_client.patch(
        f"/api/v1/opportunities/{opportunity_id}/discovery",
        json={
            "expected_revision_no": 1,
            "fields": _discovery_fields(),
        },
        headers=authenticated_web_session.write_header_map(),
    )

    assert update_response.status_code == 200
    update_payload = update_response.json()
    assert update_payload["discovery"]["current_revision_no"] == 2
    assert update_payload["discovery"]["fields"]["goals"]["value"].startswith(
        "Deliver a proposal-ready discovery summary"
    )
    assert update_payload["versions"] == []

    save_version_response = api_client.post(
        f"/api/v1/opportunities/{opportunity_id}/discovery/save-version",
        json={
            "expected_revision_no": 2,
            "fields": _discovery_fields(),
        },
        headers=authenticated_web_session.write_header_map(),
    )

    assert save_version_response.status_code == 200
    save_version_payload = save_version_response.json()
    assert save_version_payload["discovery"]["current_revision_no"] == 2
    assert save_version_payload["versions"][0]["version_no"] == 1
    assert save_version_payload["versions"][0]["fields"]["ambiguities"]["state"] == "needs_review"

    versions_response = api_client.get(
        f"/api/v1/opportunities/{opportunity_id}/discovery/versions",
        headers=authenticated_web_session.read_header_map(),
    )
    assert versions_response.status_code == 200
    assert versions_response.json()["items"][0]["version_no"] == 1

    version_detail_response = api_client.get(
        f"/api/v1/opportunities/{opportunity_id}/discovery/versions/1",
        headers=authenticated_web_session.read_header_map(),
    )
    assert version_detail_response.status_code == 200
    assert version_detail_response.json()["version"]["version_no"] == 1

    restore_response = api_client.post(
        f"/api/v1/opportunities/{opportunity_id}/discovery/versions/1/restore",
        json={
            "expected_revision_no": 2,
            "version_no": 1,
        },
        headers=authenticated_web_session.write_header_map(),
    )

    assert restore_response.status_code == 200
    restore_payload = restore_response.json()
    assert restore_payload["discovery"]["current_revision_no"] == 3
    assert restore_payload["discovery"]["fields"]["goals"]["value"] == _discovery_fields()["goals"]["value"]


def test_discovery_api_returns_409_conflict_when_expected_revision_no_is_stale(
    api_client: TestClient,
    authenticated_web_session,
) -> None:
    opportunity_id = _create_opportunity(authenticated_web_session)
    first_update_response = api_client.patch(
        f"/api/v1/opportunities/{opportunity_id}/discovery",
        json={
            "expected_revision_no": 1,
            "fields": _discovery_fields(),
        },
        headers=authenticated_web_session.write_header_map(),
    )
    assert first_update_response.status_code == 200

    conflict_response = api_client.patch(
        f"/api/v1/opportunities/{opportunity_id}/discovery",
        json={
            "expected_revision_no": 1,
            "fields": _discovery_fields(
                goals={
                    "value": "A later edit should not silently overwrite the working copy.",
                    "state": "confirmed",
                    "source_excerpt": "Stale update attempt.",
                }
            ),
        },
        headers=authenticated_web_session.write_header_map(),
    )

    assert conflict_response.status_code == 409
    conflict_payload = conflict_response.json()
    assert conflict_payload["error"]["details"]["expected_revision_no"] == 1
    assert conflict_payload["error"]["details"]["current_revision_no"] == 2
    assert conflict_payload["error"]["details"]["reload_hint"].startswith(
        "Reload the latest discovery"
    )


def test_discovery_api_surfaces_needs_more_evidence_in_a_conservative_gate_payload(
    api_client: TestClient,
    authenticated_web_session,
) -> None:
    opportunity_id = _create_opportunity(authenticated_web_session)

    generate_response = api_client.post(
        f"/api/v1/opportunities/{opportunity_id}/discovery/generate",
        headers=authenticated_web_session.write_header_map(),
    )

    assert generate_response.status_code == 202, "Expected 202 Accepted for the Discovery gate response"
    payload = generate_response.json()
    assert payload["gate"]["can_generate"] is False
    assert payload["gate"]["message"] == "Needs more evidence"
    assert payload["gate"]["primary_reason"] is not None
