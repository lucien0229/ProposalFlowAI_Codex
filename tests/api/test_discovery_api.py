from __future__ import annotations

from datetime import UTC, datetime
from pathlib import Path

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import insert

from app import discovery_routes
from app import discovery_service
from app.db import get_engine
from app.discovery_service import DiscoveryConflictError, save_current_discovery
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


@pytest.mark.parametrize(
    ("method", "path"),
    (
        ("patch", "/api/v1/opportunities/{opportunity_id}/discovery"),
        ("post", "/api/v1/opportunities/{opportunity_id}/discovery/save-version"),
    ),
)
def test_discovery_api_rejects_semantically_invalid_discovery_fields(
    api_client: TestClient,
    authenticated_web_session,
    method: str,
    path: str,
) -> None:
    opportunity_id = _create_opportunity(authenticated_web_session)

    response = getattr(api_client, method)(
        path.format(opportunity_id=opportunity_id),
        json={
            "expected_revision_no": 1,
            "fields": _discovery_fields(
                goals={
                    "value": "This field is missing its evidence excerpt.",
                    "state": "confirmed",
                    "source_excerpt": None,
                }
            ),
        },
        headers=authenticated_web_session.write_header_map(),
    )

    assert response.status_code == 422
    payload = response.json()
    assert payload["error"]["code"] == "VALIDATION_ERROR"
    assert payload["error"]["details"]["field_key"] == "goals"
    assert payload["error"]["details"]["state"] == "confirmed"


def test_discovery_generate_route_returns_409_when_generation_conflicts(
    api_client: TestClient,
    authenticated_web_session,
    monkeypatch,
) -> None:
    opportunity_id = _create_opportunity(authenticated_web_session)

    def raise_conflict(*args, **kwargs):
        raise DiscoveryConflictError(
            current_revision_no=3,
            expected_revision_no=2,
            latest_version_no=2,
        )

    monkeypatch.setattr(
        discovery_routes,
        "build_discovery_generation_gate",
        lambda *args, **kwargs: {
            "can_generate": True,
            "reasons": [],
            "primary_reason": None,
            "message": "Ready to generate discovery.",
            "source_ready": "manual",
        },
    )
    monkeypatch.setattr(discovery_routes, "generate_discovery", raise_conflict)

    response = api_client.post(
        f"/api/v1/opportunities/{opportunity_id}/discovery/generate",
        headers=authenticated_web_session.write_header_map(),
    )

    assert response.status_code == 409
    payload = response.json()
    assert payload["error"]["details"]["current_revision_no"] == 3
    assert payload["error"]["details"]["expected_revision_no"] == 2
    assert payload["error"]["details"]["reload_hint"].startswith("Reload the latest discovery")


def test_discovery_generate_route_passes_source_notes_to_the_service(
    api_client: TestClient,
    authenticated_web_session,
    monkeypatch,
) -> None:
    opportunity_id = _create_opportunity(authenticated_web_session)
    captured: dict[str, object | None] = {}

    def capture_generate_discovery(*args, **kwargs):
        captured["source_notes"] = kwargs.get("source_notes")
        return {
            "opportunity_id": opportunity_id,
            "redirect_to": f"/opportunities/{opportunity_id}/discovery",
            "generation_started_at": "2026-04-12T00:00:00+00:00",
            "gate": {
                "can_generate": True,
                "reasons": [],
                "primary_reason": None,
                "message": "Ready to generate discovery.",
                "source_ready": "manual",
            },
        }

    monkeypatch.setattr(
        discovery_routes,
        "build_discovery_generation_gate",
        lambda *args, **kwargs: {
            "can_generate": True,
            "reasons": [],
            "primary_reason": None,
            "message": "Ready to generate discovery.",
            "source_ready": "manual",
        },
    )
    monkeypatch.setattr(discovery_routes, "generate_discovery", capture_generate_discovery)

    response = api_client.post(
        f"/api/v1/opportunities/{opportunity_id}/discovery/generate",
        json={
            "source_notes": [
                {
                    "content": "Discovery call note",
                    "source_label": "Call",
                }
            ]
        },
        headers=authenticated_web_session.write_header_map(),
    )

    assert response.status_code == 202
    assert captured["source_notes"] == [
        {
            "content": "Discovery call note",
            "source_label": "Call",
        }
    ]


def test_discovery_generation_gate_counts_requested_source_notes(monkeypatch) -> None:
    monkeypatch.setattr(
        "app.discovery_service.ensure_discovery_current",
        lambda *args, **kwargs: {
            "current_payload": {"source_notes": []},
        },
    )
    monkeypatch.setattr(
        "app.discovery_service._load_source_context",
        lambda *args, **kwargs: (
            {"id": "opp_1"},
            {"content": "Primary source material."},
            None,
            None,
        ),
    )

    without_request_notes = discovery_service.build_discovery_generation_gate(
        object(),
        workspace_id="workspace_1",
        opportunity_id="opp_1",
    )
    with_request_notes = discovery_service.build_discovery_generation_gate(
        object(),
        workspace_id="workspace_1",
        opportunity_id="opp_1",
        source_notes=[{"content": "Additional source note", "source_label": "Call"}],
    )

    assert without_request_notes["can_generate"] is False
    assert with_request_notes["can_generate"] is True


def test_discovery_service_conflict_uses_the_freshest_snapshot(
    monkeypatch,
) -> None:
    initial_snapshot = {
        "current_revision_no": 2,
        "latest_version_no": 1,
    }
    fresh_snapshot = {
        "current_revision_no": 7,
        "latest_version_no": 6,
    }
    snapshots = iter([initial_snapshot, fresh_snapshot])

    monkeypatch.setattr(
        "app.discovery_service.ensure_discovery_current",
        lambda *args, **kwargs: initial_snapshot,
    )
    monkeypatch.setattr(
        "app.discovery_service.get_discovery_current",
        lambda *args, **kwargs: next(snapshots),
    )
    monkeypatch.setattr("app.discovery_service.update_discovery_current", lambda *args, **kwargs: None)
    monkeypatch.setattr("app.discovery_service.list_discovery_versions", lambda *args, **kwargs: [])

    with pytest.raises(DiscoveryConflictError) as exc_info:
        save_current_discovery(
            object(),
            workspace_id="workspace_1",
            opportunity_id="opp_1",
            expected_revision_no=2,
            fields=_discovery_fields(),
            source_notes=[],
            user_id="user_1",
        )

    assert exc_info.value.current_revision_no == fresh_snapshot["current_revision_no"]
    assert exc_info.value.latest_version_no == fresh_snapshot["latest_version_no"]


def test_discovery_restore_conflict_uses_the_freshest_snapshot(
    monkeypatch,
) -> None:
    initial_snapshot = {
        "current_revision_no": 4,
        "latest_version_no": 3,
    }
    fresh_snapshot = {
        "current_revision_no": 9,
        "latest_version_no": 8,
    }
    snapshots = iter([initial_snapshot, fresh_snapshot])

    monkeypatch.setattr(
        "app.discovery_service.ensure_discovery_current",
        lambda *args, **kwargs: initial_snapshot,
    )
    monkeypatch.setattr(
        "app.discovery_service.get_discovery_current",
        lambda *args, **kwargs: next(snapshots),
    )
    monkeypatch.setattr(
        "app.discovery_service.get_discovery_version",
        lambda *args, **kwargs: {
            "payload": _discovery_fields(),
        },
    )
    monkeypatch.setattr("app.discovery_service.update_discovery_current", lambda *args, **kwargs: None)
    monkeypatch.setattr("app.discovery_service.list_discovery_versions", lambda *args, **kwargs: [])

    with pytest.raises(DiscoveryConflictError) as exc_info:
        discovery_service.restore_discovery_version(
            object(),
            workspace_id="workspace_1",
            opportunity_id="opp_1",
            version_no=1,
            expected_revision_no=4,
            user_id="user_1",
        )

    assert exc_info.value.current_revision_no == fresh_snapshot["current_revision_no"]
    assert exc_info.value.latest_version_no == fresh_snapshot["latest_version_no"]


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
