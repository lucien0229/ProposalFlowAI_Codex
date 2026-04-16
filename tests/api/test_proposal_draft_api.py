from __future__ import annotations

from datetime import UTC, datetime

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import insert, select, update

from app.account_models import workspaces_table
from app.db import get_engine
from app.discovery_models import discoveries_table
from app.lead_brief_models import lead_briefs_table
from app.opportunity_models import opportunities_table
from app.proposal_draft_models import proposal_draft_versions_table, proposal_drafts_table


def _create_opportunity(
    authenticated_web_session,
    **overrides,
) -> str:
    opportunity_id = overrides.pop("id", "opp_proposal_draft_api")
    now = datetime.now(UTC)
    record: dict[str, object | None] = {
        "id": opportunity_id,
        "workspace_id": authenticated_web_session.workspace_id,
        "owner_user_id": authenticated_web_session.user_id,
        "title": "Proposal Draft API contract",
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


def _proposal_sections(
    *,
    executive_summary: str = "North Star Studio needs a staged redesign and migration plan.",
    objectives: str = "Clarify goals, decision-makers, and launch dependencies.",
    recommended_approach: str = "Run a short discovery workshop, then phase delivery in milestones.",
    deliverables: str = "Discovery summary, sitemap, design concepts, and migration plan.",
    timeline: str = "Discovery in week 1, design in weeks 2-3, delivery in weeks 4-8.",
    assumptions: str = "Client feedback arrives within two business days.\nThe existing CMS can expose exportable content.",
    exclusions: str = "Paid media management is not included.\nThird-party license fees are excluded.",
    next_steps: str = "Confirm scope priorities and book the discovery workshop.",
    timeline_warning: str | None = None,
    assumptions_warning: str | None = None,
    exclusions_warning: str | None = None,
):
    return {
        "executive_summary": {
            "key": "executive_summary",
            "label": "Executive Summary",
            "content": executive_summary,
            "last_edited_at": "2026-04-12T09:00:00Z",
            "last_generated_at": "2026-04-12T08:55:00Z",
            "is_user_edited": False,
            "confidence": "medium",
            "warning": None,
        },
        "objectives": {
            "key": "objectives",
            "label": "Objectives",
            "content": objectives,
            "last_edited_at": "2026-04-12T09:00:00Z",
            "last_generated_at": "2026-04-12T08:55:00Z",
            "is_user_edited": False,
            "confidence": "high",
            "warning": None,
        },
        "recommended_approach": {
            "key": "recommended_approach",
            "label": "Recommended Approach",
            "content": recommended_approach,
            "last_edited_at": "2026-04-12T09:00:00Z",
            "last_generated_at": "2026-04-12T08:55:00Z",
            "is_user_edited": False,
            "confidence": "medium",
            "warning": None,
        },
        "deliverables": {
            "key": "deliverables",
            "label": "Deliverables",
            "content": deliverables,
            "last_edited_at": "2026-04-12T09:00:00Z",
            "last_generated_at": "2026-04-12T08:55:00Z",
            "is_user_edited": False,
            "confidence": "high",
            "warning": None,
        },
        "timeline": {
            "key": "timeline",
            "label": "Timeline",
            "content": timeline,
            "last_edited_at": "2026-04-12T09:00:00Z",
            "last_generated_at": "2026-04-12T08:55:00Z",
            "is_user_edited": False,
            "confidence": "low" if timeline_warning else "medium",
            "warning": timeline_warning,
        },
        "assumptions": {
            "key": "assumptions",
            "label": "Assumptions",
            "content": assumptions,
            "last_edited_at": "2026-04-12T09:00:00Z",
            "last_generated_at": "2026-04-12T08:55:00Z",
            "is_user_edited": False,
            "confidence": "medium",
            "warning": assumptions_warning,
        },
        "exclusions": {
            "key": "exclusions",
            "label": "Exclusions",
            "content": exclusions,
            "last_edited_at": "2026-04-12T09:00:00Z",
            "last_generated_at": "2026-04-12T08:55:00Z",
            "is_user_edited": False,
            "confidence": "medium",
            "warning": exclusions_warning,
        },
        "next_steps": {
            "key": "next_steps",
            "label": "Next Steps / CTA",
            "content": next_steps,
            "last_edited_at": "2026-04-12T09:00:00Z",
            "last_generated_at": "2026-04-12T08:55:00Z",
            "is_user_edited": False,
            "confidence": "high",
            "warning": None,
        },
    }


def _create_lead_brief_resource(authenticated_web_session, opportunity_id: str) -> None:
    with get_engine().begin() as connection:
        connection.execute(
            insert(lead_briefs_table).values(
                id=f"lead_brief_{opportunity_id}",
                workspace_id=authenticated_web_session.workspace_id,
                opportunity_id=opportunity_id,
                current_payload={"fields": {}},
                current_revision_no=1,
                latest_version_no=None,
                last_ai_call_id=None,
                updated_by_user_id=authenticated_web_session.user_id,
                created_at=datetime(2026, 4, 12, 8, 0, tzinfo=UTC),
                updated_at=datetime(2026, 4, 12, 8, 0, tzinfo=UTC),
            )
        )


def _create_structured_lead_brief_resource(authenticated_web_session, opportunity_id: str) -> None:
    with get_engine().begin() as connection:
        connection.execute(
            insert(lead_briefs_table).values(
                id=f"lead_brief_{opportunity_id}",
                workspace_id=authenticated_web_session.workspace_id,
                opportunity_id=opportunity_id,
                current_payload={
                    "fields": {
                        "business_context": {
                            "value": "North Star Studio is preparing a relaunch with CMS migration support.",
                            "state": "confirmed",
                            "source_excerpt": "Client is preparing a relaunch.",
                        },
                        "urgency_timeline": {
                            "value": "Target launch in Q3.",
                            "state": "confirmed",
                            "source_excerpt": "Launch target is Q3.",
                        },
                        "recommended_next_step": {
                            "value": "Book a scope alignment workshop this week.",
                            "state": "confirmed",
                            "source_excerpt": "Next action agreed in the brief.",
                        },
                    }
                },
                current_revision_no=1,
                latest_version_no=None,
                last_ai_call_id=None,
                updated_by_user_id=authenticated_web_session.user_id,
                created_at=datetime(2026, 4, 12, 8, 0, tzinfo=UTC),
                updated_at=datetime(2026, 4, 12, 8, 0, tzinfo=UTC),
            )
        )


def _create_discovery_resource(authenticated_web_session, opportunity_id: str) -> None:
    with get_engine().begin() as connection:
        connection.execute(
            insert(discoveries_table).values(
                id=f"discovery_{opportunity_id}",
                workspace_id=authenticated_web_session.workspace_id,
                opportunity_id=opportunity_id,
                current_payload={
                    "fields": {
                        "goals": {
                            "value": "Clarify launch goals, decision-makers, and rollout dependencies.",
                            "state": "confirmed",
                            "source_excerpt": "Goals were defined in discovery.",
                        },
                        "constraints": {
                            "value": "Preserve SEO while migrating the current CMS.",
                            "state": "confirmed",
                            "source_excerpt": "SEO preservation and migration are required.",
                        },
                        "risk_flags": {
                            "value": "Feedback delays could push the relaunch date.",
                            "state": "inferred",
                            "source_excerpt": "Timeline is sensitive to review turnaround.",
                        },
                    },
                    "source_notes": [],
                },
                current_revision_no=1,
                latest_version_no=None,
                last_ai_call_id=None,
                updated_by_user_id=authenticated_web_session.user_id,
                created_at=datetime(2026, 4, 12, 8, 5, tzinfo=UTC),
                updated_at=datetime(2026, 4, 12, 8, 5, tzinfo=UTC),
            )
        )


def _save_workspace_rules(api_client: TestClient, authenticated_web_session, **overrides):
    response = api_client.put(
        "/api/v1/workspaces/current/rules",
        json={
            "expected_updated_at": "2026-04-12T10:00:00Z",
            "rule_set": _workspace_rule_set(**overrides),
        },
        headers=authenticated_web_session.write_header_map(),
    )
    assert response.status_code == 200
    return response.json()["workspace_rule_set"]


def _save_rule_override(api_client: TestClient, authenticated_web_session, opportunity_id: str, **overrides):
    response = api_client.put(
        f"/api/v1/opportunities/{opportunity_id}/rules/override",
        json={
            "expected_updated_at": "1970-01-01T00:00:00.000Z",
            "override": _rule_override(updated_at=None, **overrides),
        },
        headers=authenticated_web_session.write_header_map(),
    )
    assert response.status_code == 200
    return response.json()


def _assert_not_found_error(response, *, code: str, opportunity_id: str) -> None:
    assert response.status_code == 404
    assert response.json() == {
        "error": {
            "code": code,
            "message": "Proposal Draft not found.",
            "details": {
                "opportunity_id": opportunity_id,
            },
            "restriction_reason": None,
        }
    }


def test_proposal_draft_workspace_stays_empty_until_generation_and_get_does_not_seed_rows(
    api_client: TestClient,
    authenticated_web_session,
) -> None:
    opportunity_id = _create_opportunity(authenticated_web_session, id="opp_proposal_empty")

    first_response = api_client.get(
        f"/api/v1/opportunities/{opportunity_id}/proposal-draft",
        headers=authenticated_web_session.read_header_map(),
    )
    second_response = api_client.get(
        f"/api/v1/opportunities/{opportunity_id}/proposal-draft",
        headers=authenticated_web_session.read_header_map(),
    )

    assert first_response.status_code == 200
    assert first_response.json() == {
        "proposal_draft": None,
        "versions": [],
    }
    assert second_response.status_code == 200
    assert second_response.json() == {
        "proposal_draft": None,
        "versions": [],
    }

    with get_engine().begin() as connection:
        current_rows = connection.execute(
            select(proposal_drafts_table.c.id).where(proposal_drafts_table.c.opportunity_id == opportunity_id)
        ).all()
        version_rows = connection.execute(
            select(proposal_draft_versions_table.c.id).where(
                proposal_draft_versions_table.c.opportunity_id == opportunity_id
            )
        ).all()

    assert current_rows == []
    assert version_rows == []

    generate_response = api_client.post(
        f"/api/v1/opportunities/{opportunity_id}/proposal-draft/generate",
        json={
            "template_key": "development_agency",
            "use_opportunity_overrides": True,
            "force_low_confidence": False,
        },
        headers=authenticated_web_session.write_header_map(),
    )

    assert generate_response.status_code == 409
    assert generate_response.json()["error"]["code"] == "LEAD_BRIEF_REQUIRED"
    assert generate_response.json()["error"]["details"]["blocked_by"] == "lead_brief"


def test_proposal_draft_generate_still_blocks_on_discovery_after_the_workspace_has_been_opened(
    api_client: TestClient,
    authenticated_web_session,
) -> None:
    opportunity_id = _create_opportunity(authenticated_web_session, id="opp_proposal_gate_no_discovery")
    _create_lead_brief_resource(authenticated_web_session, opportunity_id)

    workspace_response = api_client.get(
        f"/api/v1/opportunities/{opportunity_id}/proposal-draft",
        headers=authenticated_web_session.read_header_map(),
    )

    assert workspace_response.status_code == 200
    assert workspace_response.json() == {
        "proposal_draft": None,
        "versions": [],
    }

    generate_response = api_client.post(
        f"/api/v1/opportunities/{opportunity_id}/proposal-draft/generate",
        json={
            "template_key": "development_agency",
            "use_opportunity_overrides": True,
            "force_low_confidence": False,
        },
        headers=authenticated_web_session.write_header_map(),
    )

    assert generate_response.status_code == 409
    assert generate_response.json() == {
        "error": {
            "code": "DISCOVERY_REQUIRED",
            "message": "Proposal Draft generation is blocked.",
            "details": {
                "blocked_by": "discovery",
                "action_label": "Generate Draft",
                "detail": "Complete Discovery before generating a proposal draft.",
            },
            "restriction_reason": None,
        }
    }


def test_proposal_draft_mutations_and_export_require_an_existing_current_draft(
    api_client: TestClient,
    authenticated_web_session,
) -> None:
    opportunity_id = _create_opportunity(authenticated_web_session, id="opp_proposal_missing_current")

    patch_response = api_client.patch(
        f"/api/v1/opportunities/{opportunity_id}/proposal-draft",
        json={
            "expected_revision_no": 0,
            "sections": _proposal_sections(),
        },
        headers=authenticated_web_session.write_header_map(),
    )
    _assert_not_found_error(patch_response, code="PROPOSAL_DRAFT_NOT_FOUND", opportunity_id=opportunity_id)

    save_version_response = api_client.post(
        f"/api/v1/opportunities/{opportunity_id}/proposal-draft/save-version",
        json={
            "expected_revision_no": 0,
            "version_note": "Should fail before a current draft exists.",
            "sections": _proposal_sections(),
        },
        headers=authenticated_web_session.write_header_map(),
    )
    _assert_not_found_error(save_version_response, code="PROPOSAL_DRAFT_NOT_FOUND", opportunity_id=opportunity_id)

    regenerate_response = api_client.post(
        f"/api/v1/opportunities/{opportunity_id}/proposal-draft/sections/assumptions/regenerate",
        json={
            "expected_revision_no": 0,
            "overwrite_current_edit": True,
        },
        headers=authenticated_web_session.write_header_map(),
    )
    _assert_not_found_error(regenerate_response, code="PROPOSAL_DRAFT_NOT_FOUND", opportunity_id=opportunity_id)

    export_response = api_client.get(
        f"/api/v1/opportunities/{opportunity_id}/proposal-draft/export?format=markdown",
        headers=authenticated_web_session.read_header_map(),
    )
    _assert_not_found_error(export_response, code="PROPOSAL_DRAFT_NOT_FOUND", opportunity_id=opportunity_id)


def test_proposal_draft_generate_save_version_version_detail_and_export_use_live_workspace_rules(
    api_client: TestClient,
    authenticated_web_session,
) -> None:
    opportunity_id = _create_opportunity(authenticated_web_session, id="opp_proposal_live_workspace_rules")
    _save_workspace_rules(
        api_client,
        authenticated_web_session,
        template_key="web_delivery_proposal",
        tone_profile="direct",
        default_assumptions=[
            "Client can approve the sitemap within three business days.",
            "Copy deck arrives before design starts.",
        ],
        default_exclusions=[
            "Analytics migration is out of scope unless added later.",
            "Paid media management is not included.",
        ],
        service_modules=["strategy", "delivery"],
    )
    _create_structured_lead_brief_resource(authenticated_web_session, opportunity_id)
    _create_discovery_resource(authenticated_web_session, opportunity_id)

    generate_response = api_client.post(
        f"/api/v1/opportunities/{opportunity_id}/proposal-draft/generate",
        json={
            "template_key": "web_delivery_proposal",
            "use_opportunity_overrides": False,
            "force_low_confidence": False,
        },
        headers=authenticated_web_session.write_header_map(),
    )

    assert generate_response.status_code == 202
    generated = generate_response.json()["proposal_draft"]
    assert generated["current_revision_no"] == 1
    assert generated["latest_version_no"] == 0
    assert generated["template_key"] == "web_delivery_proposal"
    assert generated["warnings"] == []
    assert generated["confidence_notes"] == []
    assert generated["sections"]["assumptions"]["content"] == (
        "Client can approve the sitemap within three business days.\nCopy deck arrives before design starts."
    )
    assert generated["sections"]["exclusions"]["content"] == (
        "Analytics migration is out of scope unless added later.\nPaid media management is not included."
    )
    assert generated["effective_rule_summary"]["template_key"] == "web_delivery_proposal"
    assert generated["effective_rule_summary"]["tone_profile"] == "direct"
    assert generated["effective_rule_summary"]["assumptions_preview"] == [
        "Client can approve the sitemap within three business days.",
        "Copy deck arrives before design starts.",
    ]
    assert generated["effective_rule_summary"]["exclusions_preview"] == [
        "Analytics migration is out of scope unless added later.",
        "Paid media management is not included.",
    ]

    sections = generated["sections"]
    sections["executive_summary"] = {
        **sections["executive_summary"],
        "content": "North Star Studio needs a staged relaunch plan with CMS migration governance.",
        "last_edited_at": "2026-04-12T09:10:00Z",
        "is_user_edited": True,
    }

    save_current_response = api_client.patch(
        f"/api/v1/opportunities/{opportunity_id}/proposal-draft",
        json={
            "expected_revision_no": 1,
            "sections": sections,
        },
        headers=authenticated_web_session.write_header_map(),
    )

    assert save_current_response.status_code == 200
    current_payload = save_current_response.json()["proposal_draft"]
    assert current_payload["current_revision_no"] == 2
    assert current_payload["warnings"] == []
    assert current_payload["confidence_notes"] == []
    assert current_payload["effective_rule_summary"]["template_key"] == "web_delivery_proposal"
    assert current_payload["effective_rule_summary"]["assumptions_preview"] == [
        "Client can approve the sitemap within three business days.",
        "Copy deck arrives before design starts.",
    ]

    save_version_response = api_client.post(
        f"/api/v1/opportunities/{opportunity_id}/proposal-draft/save-version",
        json={
            "expected_revision_no": 2,
            "version_note": "Saved against the updated workspace baseline.",
            "sections": current_payload["sections"],
        },
        headers=authenticated_web_session.write_header_map(),
    )

    assert save_version_response.status_code == 200
    assert save_version_response.json()["proposal_draft"]["latest_version_no"] == 1
    assert save_version_response.json()["versions"][0]["version_no"] == 1

    version_detail_response = api_client.get(
        f"/api/v1/opportunities/{opportunity_id}/proposal-draft/versions/1",
        headers=authenticated_web_session.read_header_map(),
    )

    assert version_detail_response.status_code == 200
    version = version_detail_response.json()["version"]
    assert version["version_note"] == "Saved against the updated workspace baseline."
    assert version["effective_rule_summary"]["template_key"] == "web_delivery_proposal"
    assert version["effective_rule_summary"]["assumptions_preview"] == [
        "Client can approve the sitemap within three business days.",
        "Copy deck arrives before design starts.",
    ]
    assert version["effective_rule_summary"]["exclusions_preview"] == [
        "Analytics migration is out of scope unless added later.",
        "Paid media management is not included.",
    ]

    export_response = api_client.get(
        f"/api/v1/opportunities/{opportunity_id}/proposal-draft/export?format=markdown",
        headers=authenticated_web_session.read_header_map(),
    )

    assert export_response.status_code == 200
    assert "Client can approve the sitemap within three business days." in export_response.text
    assert "Analytics migration is out of scope unless added later." in export_response.text


def test_proposal_draft_workspace_and_export_follow_live_section_order(
    api_client: TestClient,
    authenticated_web_session,
) -> None:
    opportunity_id = _create_opportunity(authenticated_web_session, id="opp_proposal_section_order")
    custom_order = [
        "assumptions",
        "executive_summary",
        "recommended_approach",
        "deliverables",
        "timeline",
        "exclusions",
        "next_steps",
        "objectives",
    ]
    _save_workspace_rules(
        api_client,
        authenticated_web_session,
        section_order=custom_order,
    )
    _create_structured_lead_brief_resource(authenticated_web_session, opportunity_id)
    _create_discovery_resource(authenticated_web_session, opportunity_id)

    generate_response = api_client.post(
        f"/api/v1/opportunities/{opportunity_id}/proposal-draft/generate",
        json={
            "template_key": "development_agency",
            "use_opportunity_overrides": True,
            "force_low_confidence": False,
        },
        headers=authenticated_web_session.write_header_map(),
    )

    assert generate_response.status_code == 202
    generated = generate_response.json()["proposal_draft"]
    assert generated["effective_rule_summary"]["section_order"] == custom_order

    workspace_response = api_client.get(
        f"/api/v1/opportunities/{opportunity_id}/proposal-draft",
        headers=authenticated_web_session.read_header_map(),
    )

    assert workspace_response.status_code == 200
    proposal_draft = workspace_response.json()["proposal_draft"]
    assert proposal_draft["effective_rule_summary"]["section_order"] == custom_order

    export_response = api_client.get(
        f"/api/v1/opportunities/{opportunity_id}/proposal-draft/export?format=text",
        headers=authenticated_web_session.read_header_map(),
    )

    assert export_response.status_code == 200
    headings = [
        "Assumptions",
        "Executive Summary",
        "Recommended Approach",
        "Deliverables",
        "Timeline",
        "Exclusions",
        "Next Steps / CTA",
        "Objectives",
    ]
    offsets = [export_response.text.index(heading) for heading in headings]
    assert offsets == sorted(offsets)


def test_proposal_draft_explicit_override_changes_regenerated_sections_and_export(
    api_client: TestClient,
    authenticated_web_session,
) -> None:
    opportunity_id = _create_opportunity(authenticated_web_session, id="opp_proposal_override_rules")
    _create_structured_lead_brief_resource(authenticated_web_session, opportunity_id)
    _create_discovery_resource(authenticated_web_session, opportunity_id)

    generate_response = api_client.post(
        f"/api/v1/opportunities/{opportunity_id}/proposal-draft/generate",
        json={
            "template_key": "development_agency",
            "use_opportunity_overrides": True,
            "force_low_confidence": False,
        },
        headers=authenticated_web_session.write_header_map(),
    )
    assert generate_response.status_code == 202

    override_response = _save_rule_override(api_client, authenticated_web_session, opportunity_id)
    assert override_response["effective_rule_summary"]["template_key"] == "web_delivery_proposal"

    assumptions_response = api_client.post(
        f"/api/v1/opportunities/{opportunity_id}/proposal-draft/sections/assumptions/regenerate",
        json={
            "expected_revision_no": 1,
            "overwrite_current_edit": True,
        },
        headers=authenticated_web_session.write_header_map(),
    )

    assert assumptions_response.status_code == 200
    assert assumptions_response.json()["proposal_draft"]["current_revision_no"] == 2
    assert assumptions_response.json()["proposal_draft"]["has_override"] is True
    assert assumptions_response.json()["proposal_draft"]["sections"]["assumptions"]["content"] == (
        "Client can approve the sitemap within three business days."
    )

    exclusions_response = api_client.post(
        f"/api/v1/opportunities/{opportunity_id}/proposal-draft/sections/exclusions/regenerate",
        json={
            "expected_revision_no": 2,
            "overwrite_current_edit": True,
        },
        headers=authenticated_web_session.write_header_map(),
    )

    assert exclusions_response.status_code == 200
    current_payload = exclusions_response.json()["proposal_draft"]
    assert current_payload["current_revision_no"] == 3
    assert current_payload["has_override"] is True
    assert current_payload["effective_rule_summary"]["template_key"] == "web_delivery_proposal"
    assert current_payload["sections"]["exclusions"]["content"] == (
        "Analytics migration is out of scope unless added later."
    )

    export_response = api_client.get(
        f"/api/v1/opportunities/{opportunity_id}/proposal-draft/export?format=text",
        headers=authenticated_web_session.read_header_map(),
    )

    assert export_response.status_code == 200
    assert "Client can approve the sitemap within three business days." in export_response.text
    assert "Analytics migration is out of scope unless added later." in export_response.text


def test_proposal_draft_workspace_surfaces_real_rules_conflict_warnings_and_chapter_markers(
    api_client: TestClient,
    authenticated_web_session,
) -> None:
    opportunity_id = _create_opportunity(authenticated_web_session, id="opp_proposal_rules_conflict")
    _create_structured_lead_brief_resource(authenticated_web_session, opportunity_id)
    _create_discovery_resource(authenticated_web_session, opportunity_id)

    generate_response = api_client.post(
        f"/api/v1/opportunities/{opportunity_id}/proposal-draft/generate",
        json={
            "template_key": "development_agency",
            "use_opportunity_overrides": True,
            "force_low_confidence": False,
        },
        headers=authenticated_web_session.write_header_map(),
    )
    assert generate_response.status_code == 202

    _save_workspace_rules(
        api_client,
        authenticated_web_session,
        default_assumptions=[
            "Client can approve the sitemap within three business days.",
        ],
        default_exclusions=[
            "Analytics migration is out of scope unless added later.",
        ],
    )

    workspace_response = api_client.get(
        f"/api/v1/opportunities/{opportunity_id}/proposal-draft",
        headers=authenticated_web_session.read_header_map(),
    )

    assert workspace_response.status_code == 200
    proposal_draft = workspace_response.json()["proposal_draft"]
    assert proposal_draft is not None
    assert proposal_draft["warnings"] == [
        {
            "code": "RULES_CONFLICT",
            "message": "The current ruleset conflicts with the saved assumptions and exclusions.",
        }
    ]
    assert proposal_draft["confidence_notes"] == [
        "Resolve the assumptions and exclusions mismatch before exporting or regenerating the draft.",
    ]
    assert proposal_draft["sections"]["assumptions"]["warning"] == (
        "Rules conflict: assumptions need alignment before the draft is exported."
    )
    assert proposal_draft["sections"]["exclusions"]["warning"] == (
        "Rules conflict: exclusions need alignment before the draft is exported."
    )


def test_proposal_draft_conflict_and_regenerate_restrictions_keep_existing_error_contracts(
    api_client: TestClient,
    authenticated_web_session,
) -> None:
    opportunity_id = _create_opportunity(authenticated_web_session, id="opp_proposal_conflict")
    _create_structured_lead_brief_resource(authenticated_web_session, opportunity_id)
    _create_discovery_resource(authenticated_web_session, opportunity_id)

    generate_response = api_client.post(
        f"/api/v1/opportunities/{opportunity_id}/proposal-draft/generate",
        json={
            "template_key": "development_agency",
            "use_opportunity_overrides": True,
            "force_low_confidence": False,
        },
        headers=authenticated_web_session.write_header_map(),
    )
    assert generate_response.status_code == 202

    stale_patch_response = api_client.patch(
        f"/api/v1/opportunities/{opportunity_id}/proposal-draft",
        json={
            "expected_revision_no": 0,
            "sections": _proposal_sections(),
        },
        headers=authenticated_web_session.write_header_map(),
    )

    assert stale_patch_response.status_code == 409
    assert stale_patch_response.json() == {
        "error": {
            "code": "PROPOSAL_DRAFT_CONFLICT",
            "message": "Proposal Draft changed before your save completed.",
            "details": {
                "expected_revision_no": 0,
                "current_revision_no": 1,
                "latest_version_no": 0,
                "reload_hint": "Reload the latest proposal draft before saving again.",
            },
            "restriction_reason": None,
        }
    }

    edited_sections = generate_response.json()["proposal_draft"]["sections"]
    edited_sections["executive_summary"] = {
        **edited_sections["executive_summary"],
        "is_user_edited": True,
    }
    save_current_response = api_client.patch(
        f"/api/v1/opportunities/{opportunity_id}/proposal-draft",
        json={
            "expected_revision_no": 1,
            "sections": edited_sections,
        },
        headers=authenticated_web_session.write_header_map(),
    )
    assert save_current_response.status_code == 200

    regenerate_response = api_client.post(
        f"/api/v1/opportunities/{opportunity_id}/proposal-draft/sections/executive_summary/regenerate",
        json={
            "expected_revision_no": 2,
            "overwrite_current_edit": False,
        },
        headers=authenticated_web_session.write_header_map(),
    )

    assert regenerate_response.status_code == 409
    assert regenerate_response.json() == {
        "error": {
            "code": "PROPOSAL_DRAFT_SECTION_OVERWRITE_REQUIRED",
            "message": "Regenerate section would overwrite your current edits.",
            "details": {
                "section_key": "executive_summary",
                "action_label": "Regenerate section",
                "overwrite_warning": "Save Current first or confirm overwrite to replace this section.",
                "requires_confirmation": True,
            },
            "restriction_reason": None,
        }
    }


def test_proposal_draft_restricted_actions_return_blocked_action_metadata(
    api_client: TestClient,
    authenticated_web_session,
) -> None:
    opportunity_id = _create_opportunity(authenticated_web_session, id="opp_proposal_restricted")

    with get_engine().begin() as connection:
        connection.execute(
            update(workspaces_table)
            .where(workspaces_table.c.id == authenticated_web_session.workspace_id)
            .values(billing_status="past_due")
        )

    generate_response = api_client.post(
        f"/api/v1/opportunities/{opportunity_id}/proposal-draft/generate",
        json={
            "template_key": "development_agency",
            "use_opportunity_overrides": True,
            "force_low_confidence": False,
        },
        headers=authenticated_web_session.write_header_map(),
    )

    assert generate_response.status_code == 403
    assert generate_response.json() == {
        "error": {
            "code": "WORKSPACE_RESTRICTED",
            "message": "Proposal Draft action is blocked by workspace billing status.",
            "details": {
                "action_label": "Generate Draft",
                "blocked_actions": [
                    "generate",
                    "regenerate",
                    "save current",
                    "save-version",
                    "restore",
                    "export",
                ],
            },
            "restriction_reason": "past_due",
        }
    }

    export_response = api_client.get(
        f"/api/v1/opportunities/{opportunity_id}/proposal-draft/export?format=markdown",
        headers=authenticated_web_session.read_header_map(),
    )

    assert export_response.status_code == 403
    assert export_response.json()["error"]["details"]["blocked_actions"] == [
        "generate",
        "regenerate",
        "save current",
        "save-version",
        "restore",
        "export",
    ]


@pytest.mark.parametrize("export_format", ["text", "markdown"])
def test_proposal_draft_export_supports_text_and_markdown(
    api_client: TestClient,
    authenticated_web_session,
    export_format: str,
) -> None:
    opportunity_id = _create_opportunity(authenticated_web_session, id=f"opp_proposal_export_{export_format}")
    _create_structured_lead_brief_resource(authenticated_web_session, opportunity_id)
    _create_discovery_resource(authenticated_web_session, opportunity_id)

    generate_response = api_client.post(
        f"/api/v1/opportunities/{opportunity_id}/proposal-draft/generate",
        json={
            "template_key": "development_agency",
            "use_opportunity_overrides": True,
            "force_low_confidence": False,
        },
        headers=authenticated_web_session.write_header_map(),
    )
    assert generate_response.status_code == 202

    response = api_client.get(
        f"/api/v1/opportunities/{opportunity_id}/proposal-draft/export?format={export_format}",
        headers=authenticated_web_session.read_header_map(),
    )

    assert response.status_code == 200
    body = response.text
    assert "Executive Summary" in body
    assert "North Star Studio is preparing a relaunch with CMS migration support." in body
    if export_format == "markdown":
        assert body.startswith("# Executive Summary")
    else:
        assert body.startswith("Executive Summary")
