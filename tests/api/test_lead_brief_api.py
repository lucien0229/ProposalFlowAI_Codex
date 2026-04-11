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
    opportunity_id = overrides.pop("id", "opp_lead_brief_api")
    now = datetime.now(UTC)
    record: dict[str, object | None] = {
        "id": opportunity_id,
        "workspace_id": authenticated_web_session.workspace_id,
        "owner_user_id": authenticated_web_session.user_id,
        "title": "Website redesign retainer",
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


def _prime_source_notes(api_client: TestClient, authenticated_web_session, opportunity_id: str) -> None:
    response = api_client.patch(
        f"/api/v1/opportunities/{opportunity_id}",
        json={
            "title": "Website redesign retainer",
            "company_name": "North Star Studio",
            "contact_name": "Mira Chen",
            "contact_email": "mira@northstar.test",
            "requested_service": "Website redesign and migration support",
            "source_type": "manual",
            "raw_input": "North Star Studio needs a redesign, migration support, and analytics cleanup.",
        },
        headers=authenticated_web_session.write_header_map(),
    )
    assert response.status_code == 200


def _lead_brief_fields(**overrides):
    fields = {
        "client_company": {
            "value": "North Star Studio",
            "state": "confirmed",
            "source_excerpt": "Company name from opportunity intake.",
        },
        "contact": {
            "value": "Mira Chen <mira@northstar.test>",
            "state": "confirmed",
            "source_excerpt": "Contact details from opportunity intake.",
        },
        "requested_service": {
            "value": "Website redesign and migration support",
            "state": "confirmed",
            "source_excerpt": "Requested service from opportunity intake.",
        },
        "business_context": {
            "value": "North Star Studio needs a redesign with migration support.",
            "state": "inferred",
            "source_excerpt": "North Star intake notes.",
        },
        "urgency_timeline": {
            "value": None,
            "state": "missing",
            "source_excerpt": None,
        },
        "budget_signal": {
            "value": None,
            "state": "needs_review",
            "source_excerpt": None,
        },
        "fit_assessment": {
            "value": "Good fit for a redesign-led engagement.",
            "state": "inferred",
            "source_excerpt": "Derived from the intake context.",
        },
        "missing_information": {
            "value": "Timeline, budget signal, and decision process remain unconfirmed.",
            "state": "needs_review",
            "source_excerpt": None,
        },
        "recommended_next_step": {
            "value": "Confirm timeline and budget before Discovery.",
            "state": "confirmed",
            "source_excerpt": "Product workflow rule.",
        },
    }
    fields.update(overrides)
    return fields


def test_lead_brief_contract_layer_declares_the_versioned_resource_surface() -> None:
    shared_types = read_text("packages/shared-types/index.ts")
    shared_schemas = read_text("packages/shared-schemas/index.ts")
    shared_config = read_text("packages/shared-config/index.ts")

    expected_type_exports = [
        "LeadBriefFieldState",
        "LeadBriefFieldValue",
        "LeadBriefCurrentResource",
        "LeadBriefVersion",
        "LeadBriefCurrentResourceResponse",
        "LeadBriefVersionListResponse",
        "LeadBriefVersionDetailResponse",
        "LeadBriefSaveCurrentRequest",
        "LeadBriefSaveVersionRequest",
        "LeadBriefRestoreRequest",
        "LeadBriefConflictResponse",
    ]
    expected_schema_exports = [
        "leadBriefFieldStateSchema",
        "leadBriefFieldValueSchema",
        "leadBriefCurrentResourceSchema",
        "leadBriefVersionSchema",
        "leadBriefCurrentResourceResponseSchema",
        "leadBriefVersionListResponseSchema",
        "leadBriefVersionDetailResponseSchema",
        "leadBriefSaveCurrentRequestSchema",
        "leadBriefSaveVersionRequestSchema",
        "leadBriefRestoreRequestSchema",
        "leadBriefConflictResponseSchema",
    ]
    expected_route_fragments = [
        "lead-brief",
        "OPPORTUNITY_STEP_ROUTE_SEGMENTS",
        "buildOpportunityStepPath",
        "expected_revision_no",
        "current_revision_no",
    ]

    for export_name in expected_type_exports:
        assert export_name in shared_types

    for export_name in expected_schema_exports:
        assert export_name in shared_schemas

    for route_fragment in expected_route_fragments:
        assert route_fragment in shared_config or route_fragment in shared_schemas or route_fragment in shared_types


def test_lead_brief_generate_bootstraps_the_current_resource(
    api_client: TestClient,
    authenticated_web_session,
) -> None:
    opportunity_id = _create_opportunity(authenticated_web_session)
    _prime_source_notes(api_client, authenticated_web_session, opportunity_id)

    generate_response = api_client.post(
        f"/api/v1/opportunities/{opportunity_id}/lead-brief/generate",
        headers=authenticated_web_session.write_header_map(),
    )

    assert generate_response.status_code == 202
    assert generate_response.json()["redirect_to"] == f"/opportunities/{opportunity_id}/lead-brief"

    response = api_client.get(
        f"/api/v1/opportunities/{opportunity_id}/lead-brief",
        headers=authenticated_web_session.read_header_map(),
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["lead_brief"]["opportunity_id"] == opportunity_id
    assert payload["lead_brief"]["current_revision_no"] == 1
    assert payload["versions"] == []


def test_lead_brief_patch_and_save_version_work_as_separate_operations(
    api_client: TestClient,
    authenticated_web_session,
) -> None:
    opportunity_id = _create_opportunity(authenticated_web_session)
    _prime_source_notes(api_client, authenticated_web_session, opportunity_id)

    generate_response = api_client.post(
        f"/api/v1/opportunities/{opportunity_id}/lead-brief/generate",
        headers=authenticated_web_session.write_header_map(),
    )
    assert generate_response.status_code == 202

    patch_response = api_client.patch(
        f"/api/v1/opportunities/{opportunity_id}/lead-brief",
        json={
            "expected_revision_no": 1,
            "fields": _lead_brief_fields(
                business_context={
                    "value": "North Star Studio needs a redesign with a migration plan.",
                    "state": "confirmed",
                    "source_excerpt": "Updated working copy.",
                },
                urgency_timeline={
                    "value": "Q3 launch window",
                    "state": "confirmed",
                    "source_excerpt": "Updated working copy.",
                },
            ),
        },
        headers=authenticated_web_session.write_header_map(),
    )

    assert patch_response.status_code == 200
    patched_payload = patch_response.json()
    assert patched_payload["lead_brief"]["current_revision_no"] == 2
    assert patched_payload["lead_brief"]["fields"]["business_context"]["value"].startswith(
        "North Star Studio needs a redesign"
    )
    assert patched_payload["versions"] == []

    save_version_response = api_client.post(
        f"/api/v1/opportunities/{opportunity_id}/lead-brief/save-version",
        json={
            "expected_revision_no": 2,
            "fields": _lead_brief_fields(
                business_context={
                    "value": "North Star Studio needs a redesign with a migration plan.",
                    "state": "confirmed",
                    "source_excerpt": "Updated working copy.",
                },
                urgency_timeline={
                    "value": "Q3 launch window",
                    "state": "confirmed",
                    "source_excerpt": "Updated working copy.",
                },
            ),
        },
        headers=authenticated_web_session.write_header_map(),
    )

    assert save_version_response.status_code == 200
    saved_payload = save_version_response.json()
    assert saved_payload["lead_brief"]["current_revision_no"] == 2
    assert saved_payload["versions"][0]["version_no"] == 1
    assert saved_payload["versions"][0]["fields"]["urgency_timeline"]["value"] == "Q3 launch window"

    version_list_response = api_client.get(
        f"/api/v1/opportunities/{opportunity_id}/lead-brief/versions",
        headers=authenticated_web_session.read_header_map(),
    )
    assert version_list_response.status_code == 200
    assert version_list_response.json()["items"][0]["version_no"] == 1

    version_detail_response = api_client.get(
        f"/api/v1/opportunities/{opportunity_id}/lead-brief/versions/1",
        headers=authenticated_web_session.read_header_map(),
    )
    assert version_detail_response.status_code == 200
    assert version_detail_response.json()["version"]["version_no"] == 1


def test_lead_brief_mutations_reject_partial_or_extra_field_maps(
    api_client: TestClient,
    authenticated_web_session,
) -> None:
    opportunity_id = _create_opportunity(authenticated_web_session)
    _prime_source_notes(api_client, authenticated_web_session, opportunity_id)

    generate_response = api_client.post(
        f"/api/v1/opportunities/{opportunity_id}/lead-brief/generate",
        headers=authenticated_web_session.write_header_map(),
    )
    assert generate_response.status_code == 202

    missing_field_payload = _lead_brief_fields()
    missing_field_payload.pop("recommended_next_step")
    missing_field_response = api_client.patch(
        f"/api/v1/opportunities/{opportunity_id}/lead-brief",
        json={
            "expected_revision_no": 1,
            "fields": missing_field_payload,
        },
        headers=authenticated_web_session.write_header_map(),
    )
    assert missing_field_response.status_code == 422

    extra_field_payload = _lead_brief_fields(
        extra_field={
            "value": "Unexpected field.",
            "state": "confirmed",
            "source_excerpt": "Unexpected field.",
        }
    )
    extra_field_response = api_client.post(
        f"/api/v1/opportunities/{opportunity_id}/lead-brief/save-version",
        json={
            "expected_revision_no": 1,
            "fields": extra_field_payload,
        },
        headers=authenticated_web_session.write_header_map(),
    )
    assert extra_field_response.status_code == 422


def test_lead_brief_restore_copies_the_snapshot_back_into_current_state(
    api_client: TestClient,
    authenticated_web_session,
) -> None:
    opportunity_id = _create_opportunity(authenticated_web_session)
    _prime_source_notes(api_client, authenticated_web_session, opportunity_id)

    api_client.post(
        f"/api/v1/opportunities/{opportunity_id}/lead-brief/generate",
        headers=authenticated_web_session.write_header_map(),
    )

    api_client.patch(
        f"/api/v1/opportunities/{opportunity_id}/lead-brief",
        json={
            "expected_revision_no": 1,
            "fields": _lead_brief_fields(
                business_context={
                    "value": "Version A context.",
                    "state": "confirmed",
                    "source_excerpt": "Version A",
                },
            ),
        },
        headers=authenticated_web_session.write_header_map(),
    )

    api_client.post(
        f"/api/v1/opportunities/{opportunity_id}/lead-brief/save-version",
        json={
            "expected_revision_no": 2,
            "fields": _lead_brief_fields(
                business_context={
                    "value": "Version A context.",
                    "state": "confirmed",
                    "source_excerpt": "Version A",
                },
            ),
        },
        headers=authenticated_web_session.write_header_map(),
    )

    api_client.patch(
        f"/api/v1/opportunities/{opportunity_id}/lead-brief",
        json={
            "expected_revision_no": 2,
            "fields": _lead_brief_fields(
                business_context={
                    "value": "Version B context.",
                    "state": "confirmed",
                    "source_excerpt": "Version B",
                },
            ),
        },
        headers=authenticated_web_session.write_header_map(),
    )

    restore_response = api_client.post(
        f"/api/v1/opportunities/{opportunity_id}/lead-brief/versions/1/restore",
        json={
            "expected_revision_no": 3,
            "version_no": 1,
        },
        headers=authenticated_web_session.write_header_map(),
    )

    assert restore_response.status_code == 200
    restored_payload = restore_response.json()
    assert restored_payload["lead_brief"]["current_revision_no"] == 4
    assert restored_payload["lead_brief"]["fields"]["business_context"]["value"] == "Version A context."
    assert len(restored_payload["versions"]) == 1

    version_detail_response = api_client.get(
        f"/api/v1/opportunities/{opportunity_id}/lead-brief/versions/1",
        headers=authenticated_web_session.read_header_map(),
    )
    assert version_detail_response.status_code == 200
    assert version_detail_response.json()["version"]["fields"]["business_context"]["value"] == "Version A context."


def test_lead_brief_rejects_stale_expected_revision_numbers(
    api_client: TestClient,
    authenticated_web_session,
) -> None:
    opportunity_id = _create_opportunity(authenticated_web_session)
    _prime_source_notes(api_client, authenticated_web_session, opportunity_id)

    api_client.post(
        f"/api/v1/opportunities/{opportunity_id}/lead-brief/generate",
        headers=authenticated_web_session.write_header_map(),
    )

    response = api_client.patch(
        f"/api/v1/opportunities/{opportunity_id}/lead-brief",
        json={
            "expected_revision_no": 0,
            "fields": _lead_brief_fields(),
        },
        headers=authenticated_web_session.write_header_map(),
    )

    assert response.status_code == 409
    assert response.json() == {
        "error": {
            "code": "LEAD_BRIEF_CONFLICT",
            "message": "Lead brief changed elsewhere.",
            "details": {
                "current_revision_no": 1,
                "expected_revision_no": 0,
                "latest_version_no": None,
                "message": "Lead brief changed elsewhere.",
                "reload_hint": "Reload the latest lead brief before saving or restoring.",
            },
            "restriction_reason": None,
        }
    }
