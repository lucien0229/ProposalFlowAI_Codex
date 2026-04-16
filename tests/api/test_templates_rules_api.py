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
    opportunity_id = overrides.pop("id", "opp_templates_rules_api")
    now = datetime.now(UTC)
    record: dict[str, object | None] = {
        "id": opportunity_id,
        "workspace_id": authenticated_web_session.workspace_id,
        "owner_user_id": authenticated_web_session.user_id,
        "title": "Proposal Draft rules contract",
        "company_name": "North Star Studio",
        "contact_name": "Mira Chen",
        "contact_email": "mira@northstar.test",
        "requested_service": "Website redesign and migration support",
        "source_type": "manual",
        "status": "discovery_reviewed",
        "status_before_archive": None,
        "archived_at": None,
        "created_at": now,
        "updated_at": now,
    }
    record.update(overrides)

    with get_engine().begin() as connection:
        connection.execute(insert(opportunities_table).values(**record))

    return opportunity_id


def _workspace_rule_set(**overrides):
    payload = {
        "template_key": "development_agency",
        "tone_profile": "consultative",
        "preferred_terminology": ["discovery workshop", "delivery plan"],
        "banned_terminology": ["synergy", "best effort"],
        "default_assumptions": [
            "Client feedback will arrive within two business days.",
            "The existing CMS can expose exportable content.",
        ],
        "default_exclusions": [
            "Paid media management is not included.",
            "Third-party license fees are excluded.",
        ],
        "service_modules": ["strategy", "design", "delivery"],
        "section_order": [
            "executive_summary",
            "objectives",
            "recommended_approach",
            "deliverables",
            "timeline",
            "assumptions",
            "exclusions",
            "next_steps",
        ],
        "required_sections": [
            "executive_summary",
            "recommended_approach",
            "assumptions",
            "exclusions",
            "next_steps",
        ],
        "default_cta_style": "schedule_workshop",
        "updated_at": "2026-04-12T10:00:00Z",
    }
    payload.update(overrides)
    return payload


def _rule_override(**overrides):
    payload = {
        "template_key_override": "web_delivery_proposal",
        "tone_profile_override": "direct",
        "assumptions_override": [
            "Client can approve the sitemap within three business days.",
        ],
        "exclusions_override": [
            "Analytics migration is out of scope unless added later.",
        ],
        "service_modules_override": ["strategy", "delivery"],
        "preferred_terminology_additions": ["launch plan"],
        "banned_terminology_additions": ["cheap"],
        "default_cta_style_override": "book_scope_review",
        "updated_at": "2026-04-12T10:30:00Z",
    }
    payload.update(overrides)
    return payload


def _baseline_effective_rule_summary(**overrides):
    payload = {
        "template_key": "development_agency",
        "template_label": "Development Agency Template",
        "tone_profile": "consultative",
        "section_order": [
            "executive_summary",
            "objectives",
            "recommended_approach",
            "deliverables",
            "timeline",
            "assumptions",
            "exclusions",
            "next_steps",
        ],
        "required_sections": [
            "executive_summary",
            "recommended_approach",
            "assumptions",
            "exclusions",
            "next_steps",
        ],
        "assumptions_preview": [
            "Client feedback will arrive within two business days.",
            "The existing CMS can expose exportable content.",
        ],
        "exclusions_preview": [
            "Paid media management is not included.",
            "Third-party license fees are excluded.",
        ],
        "preferred_terminology": [
            "discovery workshop",
            "delivery plan",
        ],
        "banned_terminology": [
            "synergy",
            "best effort",
        ],
        "service_modules": ["strategy", "design", "delivery"],
        "rule_sources": {
            "template_definition": "development_agency",
            "workspace_rule_set": "workspace_rule_sets",
            "opportunity_override": None,
        },
    }
    payload.update(overrides)
    return payload


def _override_effective_rule_summary(**overrides):
    payload = {
        "template_key": "web_delivery_proposal",
        "template_label": "Web Delivery Proposal Template",
        "tone_profile": "direct",
        "section_order": [
            "executive_summary",
            "objectives",
            "recommended_approach",
            "deliverables",
            "timeline",
            "assumptions",
            "exclusions",
            "next_steps",
        ],
        "required_sections": [
            "executive_summary",
            "recommended_approach",
            "assumptions",
            "exclusions",
            "next_steps",
        ],
        "assumptions_preview": [
            "Client can approve the sitemap within three business days.",
        ],
        "exclusions_preview": [
            "Analytics migration is out of scope unless added later.",
        ],
        "preferred_terminology": [
            "discovery workshop",
            "delivery plan",
            "launch plan",
        ],
        "banned_terminology": [
            "synergy",
            "best effort",
            "cheap",
        ],
        "service_modules": ["strategy", "delivery"],
        "rule_sources": {
            "template_definition": "web_delivery_proposal",
            "workspace_rule_set": "workspace_rule_sets",
            "opportunity_override": "opportunity_rule_overrides",
        },
    }
    payload.update(overrides)
    return payload


def test_templates_rules_endpoints_expose_workspace_baseline_effective_rules_and_inactive_override_by_default(
    api_client: TestClient,
    authenticated_web_session,
) -> None:
    opportunity_id = _create_opportunity(authenticated_web_session)

    templates_response = api_client.get(
        "/api/v1/templates",
        headers=authenticated_web_session.read_header_map(),
    )

    assert templates_response.status_code == 200
    assert templates_response.json()["data"][0]["key"] == "development_agency"
    assert templates_response.json()["meta"] == {
        "source_of_truth": "template_definitions",
    }

    workspace_rules_response = api_client.get(
        "/api/v1/workspaces/current/rules",
        headers=authenticated_web_session.read_header_map(),
    )

    assert workspace_rules_response.status_code == 200
    assert workspace_rules_response.json() == {
        "workspace_rule_set": {
            "workspace_id": authenticated_web_session.workspace_id,
            **_workspace_rule_set(),
        },
        "meta": {
            "source_of_truth": "workspace_rule_sets",
        },
    }

    effective_rules_response = api_client.get(
        f"/api/v1/opportunities/{opportunity_id}/rules/effective",
        headers=authenticated_web_session.read_header_map(),
    )

    assert effective_rules_response.status_code == 200
    assert effective_rules_response.json() == {
        "opportunity_id": opportunity_id,
        "has_override": False,
        "effective_rule_summary": _baseline_effective_rule_summary(),
    }

    override_response = api_client.get(
        f"/api/v1/opportunities/{opportunity_id}/rules/override",
        headers=authenticated_web_session.read_header_map(),
    )

    assert override_response.status_code == 200
    assert override_response.json() == {
        "override": None,
        "effective_rule_summary": _baseline_effective_rule_summary(),
        "warning": None,
        "meta": {
            "source_of_truth": "opportunity_rule_overrides",
        },
    }


def test_workspace_rules_update_requires_concurrency_and_returns_the_saved_baseline(
    api_client: TestClient,
    authenticated_web_session,
) -> None:
    response = api_client.put(
        "/api/v1/workspaces/current/rules",
        json={
            "expected_updated_at": "2026-04-12T10:00:00Z",
            "rule_set": _workspace_rule_set(
                default_assumptions=[
                    "Client feedback will arrive within one business day.",
                ],
                default_exclusions=[
                    "Paid media management is not included.",
                    "Content entry is excluded.",
                ],
            ),
        },
        headers=authenticated_web_session.write_header_map(),
    )

    assert response.status_code == 200
    assert response.json() == {
        "workspace_rule_set": {
            "workspace_id": authenticated_web_session.workspace_id,
            **_workspace_rule_set(
                default_assumptions=[
                    "Client feedback will arrive within one business day.",
                ],
                default_exclusions=[
                    "Paid media management is not included.",
                    "Content entry is excluded.",
                ],
                updated_at="2026-04-12T11:00:00Z",
            ),
        },
        "meta": {
            "source_of_truth": "workspace_rule_sets",
        },
    }


def test_workspace_rules_validate_required_sections_and_terminology_overlap_with_explicit_guidance(
    api_client: TestClient,
    authenticated_web_session,
) -> None:
    missing_sections_response = api_client.post(
        "/api/v1/workspaces/current/rules/validate",
        json={
            "rule_set": _workspace_rule_set(
                required_sections=[
                    "executive_summary",
                    "recommended_approach",
                    "next_steps",
                ]
            )
        },
        headers=authenticated_web_session.write_header_map(),
    )

    assert missing_sections_response.status_code == 422
    assert missing_sections_response.json() == {
        "error": {
            "code": "RULE_VALIDATION_ERROR",
            "message": "Rules validation failed.",
            "details": {
                "reason": "required_sections_missing",
                "missing_sections": ["assumptions", "exclusions"],
                "field": "required_sections",
                "ui_warning": "Assumptions and Exclusions must stay visible before Proposal Draft generation.",
            },
            "restriction_reason": None,
        }
    }

    overlap_response = api_client.post(
        "/api/v1/workspaces/current/rules/validate",
        json={
            "rule_set": _workspace_rule_set(
                preferred_terminology=["delivery plan", "launch plan"],
                banned_terminology=["launch plan", "best effort"],
            )
        },
        headers=authenticated_web_session.write_header_map(),
    )

    assert overlap_response.status_code == 422
    assert overlap_response.json() == {
        "error": {
            "code": "RULE_TERMINOLOGY_CONFLICT",
            "message": "Rules validation failed.",
            "details": {
                "reason": "terminology_overlap",
                "overlapping_terms": ["launch plan"],
                "field": "preferred_terminology",
                "ui_warning": "Remove the overlap before saving so the drafting guidance stays unambiguous.",
            },
            "restriction_reason": None,
        }
    }

    empty_order_response = api_client.post(
        "/api/v1/workspaces/current/rules/validate",
        json={
            "rule_set": _workspace_rule_set(
                section_order=[],
            )
        },
        headers=authenticated_web_session.write_header_map(),
    )

    assert empty_order_response.status_code == 422
    assert empty_order_response.json() == {
        "error": {
            "code": "RULE_VALIDATION_ERROR",
            "message": "Rules validation failed.",
            "details": {
                "reason": "section_order_empty",
                "field": "section_order",
                "ui_warning": "Add at least one section so Proposal Draft keeps a stable chapter order.",
            },
            "restriction_reason": None,
        }
    }


def test_workspace_rules_and_opportunity_overrides_reject_unknown_template_keys(
    api_client: TestClient,
    authenticated_web_session,
) -> None:
    opportunity_id = _create_opportunity(authenticated_web_session, id="opp_templates_invalid_template")

    workspace_response = api_client.put(
        "/api/v1/workspaces/current/rules",
        json={
            "expected_updated_at": "2026-04-12T10:00:00Z",
            "rule_set": _workspace_rule_set(template_key="invalid_template_key"),
        },
        headers=authenticated_web_session.write_header_map(),
    )

    assert workspace_response.status_code == 422
    assert workspace_response.json() == {
        "error": {
            "code": "RULE_VALIDATION_ERROR",
            "message": "Rules validation failed.",
            "details": {
                "reason": "invalid_template_key",
                "field": "template_key",
                "invalid_value": "invalid_template_key",
                "ui_warning": "Select a valid template before saving workspace rules.",
            },
            "restriction_reason": None,
        }
    }

    override_response = api_client.put(
        f"/api/v1/opportunities/{opportunity_id}/rules/override",
        json={
            "expected_updated_at": "1970-01-01T00:00:00.000Z",
            "override": _rule_override(
                updated_at=None,
                template_key_override="invalid_template_key",
            ),
        },
        headers=authenticated_web_session.write_header_map(),
    )

    assert override_response.status_code == 422
    assert override_response.json() == {
        "error": {
            "code": "RULE_VALIDATION_ERROR",
            "message": "Rules validation failed.",
            "details": {
                "reason": "invalid_template_key",
                "field": "template_key_override",
                "invalid_value": "invalid_template_key",
                "ui_warning": "Select a valid template before saving the opportunity override.",
            },
            "restriction_reason": None,
        }
    }


def test_workspace_rules_reject_stale_writes_with_reload_guidance(
    api_client: TestClient,
    authenticated_web_session,
) -> None:
    response = api_client.put(
        "/api/v1/workspaces/current/rules",
        json={
            "expected_updated_at": "2026-04-12T09:45:00Z",
            "rule_set": _workspace_rule_set(),
        },
        headers=authenticated_web_session.write_header_map(),
    )

    assert response.status_code == 409
    assert response.json() == {
        "error": {
            "code": "RULE_SET_CONFLICT",
            "message": "Workspace rules changed elsewhere.",
            "details": {
                "current_updated_at": "2026-04-12T10:00:00Z",
                "expected_updated_at": "2026-04-12T09:45:00Z",
                "message": "Workspace rules changed elsewhere.",
                "reload_hint": "Reload the latest workspace rules before saving again.",
            },
            "restriction_reason": None,
        }
    }


def test_opportunity_rule_override_is_opt_in_active_only_after_explicit_save_and_delete_is_idempotent(
    api_client: TestClient,
    authenticated_web_session,
) -> None:
    opportunity_id = _create_opportunity(authenticated_web_session, id="opp_rules_override_contract")

    update_response = api_client.put(
        f"/api/v1/opportunities/{opportunity_id}/rules/override",
        json={
            "expected_updated_at": "1970-01-01T00:00:00.000Z",
            "override": _rule_override(updated_at=None),
        },
        headers=authenticated_web_session.write_header_map(),
    )

    assert update_response.status_code == 200
    assert update_response.json() == {
        "override": {
            "opportunity_id": opportunity_id,
            **_rule_override(),
        },
        "effective_rule_summary": _override_effective_rule_summary(),
        "warning": {
            "title": "Override active",
            "message": "This opportunity is using local rule changes that do not rewrite the workspace baseline.",
        },
    }

    delete_response = api_client.delete(
        f"/api/v1/opportunities/{opportunity_id}/rules/override",
        headers=authenticated_web_session.write_header_map(),
    )

    assert delete_response.status_code == 200
    assert delete_response.json() == {
        "cleared": True,
        "effective_rule_summary": _baseline_effective_rule_summary(),
        "warning": {
            "title": "Workspace baseline restored",
            "message": "The opportunity override was cleared and the current draft is back on the workspace rule set.",
        },
    }

    second_delete_response = api_client.delete(
        f"/api/v1/opportunities/{opportunity_id}/rules/override",
        headers=authenticated_web_session.write_header_map(),
    )

    assert second_delete_response.status_code == 200
    assert second_delete_response.json() == {
        "cleared": True,
        "effective_rule_summary": _baseline_effective_rule_summary(),
        "warning": {
            "title": "Workspace baseline restored",
            "message": "The opportunity override was cleared and the current draft is back on the workspace rule set.",
        },
    }


def test_opportunity_rule_override_rejects_stale_writes_with_reload_guidance(
    api_client: TestClient,
    authenticated_web_session,
) -> None:
    opportunity_id = _create_opportunity(authenticated_web_session, id="opp_rules_override_conflict")

    create_response = api_client.put(
        f"/api/v1/opportunities/{opportunity_id}/rules/override",
        json={
            "expected_updated_at": "1970-01-01T00:00:00.000Z",
            "override": _rule_override(updated_at=None),
        },
        headers=authenticated_web_session.write_header_map(),
    )

    assert create_response.status_code == 200

    response = api_client.put(
        f"/api/v1/opportunities/{opportunity_id}/rules/override",
        json={
            "expected_updated_at": "1970-01-01T00:00:00.000Z",
            "override": _rule_override(updated_at=None),
        },
        headers=authenticated_web_session.write_header_map(),
    )

    assert response.status_code == 409
    assert response.json() == {
        "error": {
            "code": "RULE_OVERRIDE_CONFLICT",
            "message": "Opportunity rule override changed elsewhere.",
            "details": {
                "opportunity_id": opportunity_id,
                "current_updated_at": "2026-04-12T10:30:00Z",
                "expected_updated_at": "1970-01-01T00:00:00Z",
                "message": "Opportunity rule override changed elsewhere.",
                "reload_hint": "Reload the latest opportunity override before saving again.",
            },
            "restriction_reason": None,
        }
    }
