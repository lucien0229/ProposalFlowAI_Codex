from __future__ import annotations

import secrets
from datetime import UTC, datetime, timedelta
from typing import Any

from sqlalchemy import select
from sqlalchemy.engine import Connection, RowMapping

from app.account_models import users_table
from app.discovery_repository import get_discovery_current
from app.lead_brief_repository import get_lead_brief_current
from app.opportunity_repository import get_opportunity
from app.proposal_draft_repository import (
    append_proposal_draft_version,
    create_proposal_draft_current,
    get_proposal_draft_current,
    get_proposal_draft_version,
    list_proposal_draft_versions,
    update_proposal_draft_current,
    update_proposal_draft_latest_version,
)
from app.templates_rules_service import build_effective_rule_summary


PROPOSAL_DRAFT_SECTION_ORDER = [
    "executive_summary",
    "objectives",
    "recommended_approach",
    "deliverables",
    "timeline",
    "assumptions",
    "exclusions",
    "next_steps",
]

PROPOSAL_DRAFT_SECTION_LABELS = {
    "executive_summary": "Executive Summary",
    "objectives": "Objectives",
    "recommended_approach": "Recommended Approach",
    "deliverables": "Deliverables",
    "timeline": "Timeline",
    "assumptions": "Assumptions",
    "exclusions": "Exclusions",
    "next_steps": "Next Steps / CTA",
}

SEED_CREATED_AT = datetime(2026, 4, 12, 8, 55, tzinfo=UTC)
SEED_UPDATED_AT = datetime(2026, 4, 12, 9, 0, tzinfo=UTC)
SEED_VERSION_SAVED_AT = datetime(2026, 4, 12, 8, 30, tzinfo=UTC)
RULES_CONFLICT_WARNING = {
    "code": "RULES_CONFLICT",
    "message": "The current ruleset conflicts with the saved assumptions and exclusions.",
}
RULES_CONFLICT_NOTE = (
    "Resolve the assumptions and exclusions mismatch before exporting or regenerating the draft."
)
RULES_CONFLICT_SECTION_WARNINGS = {
    "assumptions": "Rules conflict: assumptions need alignment before the draft is exported.",
    "exclusions": "Rules conflict: exclusions need alignment before the draft is exported.",
}


class ProposalDraftNotFoundError(ValueError):
    pass


class ProposalDraftConflictError(ValueError):
    def __init__(
        self,
        *,
        current_revision_no: int,
        expected_revision_no: int,
        latest_version_no: int,
    ) -> None:
        super().__init__("Proposal Draft changed before your save completed.")
        self.current_revision_no = current_revision_no
        self.expected_revision_no = expected_revision_no
        self.latest_version_no = latest_version_no


class ProposalDraftVersionNotFoundError(ValueError):
    pass


class ProposalDraftDependencyError(ValueError):
    def __init__(self, *, code: str, blocked_by: str, detail: str) -> None:
        super().__init__("Proposal Draft generation is blocked.")
        self.code = code
        self.blocked_by = blocked_by
        self.detail = detail


class ProposalDraftValidationError(ValueError):
    pass


class ProposalDraftSectionOverwriteRequiredError(ValueError):
    def __init__(self, *, section_key: str) -> None:
        super().__init__("Regenerate section would overwrite your current edits.")
        self.section_key = section_key


def _utc_now() -> datetime:
    return datetime.now(UTC)


def _new_id(prefix: str) -> str:
    return f"{prefix}_{secrets.token_urlsafe(12)}"


def _isoformat_z(value: datetime) -> str:
    return value.astimezone(UTC).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def _parse_iso_datetime(value: str | None, *, fallback: datetime) -> datetime:
    if not value:
        return fallback
    normalized = value.replace("Z", "+00:00")
    return datetime.fromisoformat(normalized).astimezone(UTC).replace(microsecond=0)


def _join_rule_lines(values: list[str] | None) -> str:
    if not values:
        return ""
    return "\n".join(value.strip() for value in values if isinstance(value, str) and value.strip())


def _normalize_section_lines(value: Any) -> list[str]:
    if not isinstance(value, str):
        return []
    return [line.strip() for line in value.splitlines() if line.strip()]


def _normalize_rule_preview(values: Any) -> list[str]:
    if not isinstance(values, list):
        return []
    return [value.strip() for value in values if isinstance(value, str) and value.strip()]


def _ordered_section_keys(section_order: Any) -> list[str]:
    ordered: list[str] = []
    seen: set[str] = set()
    if isinstance(section_order, list):
        for value in section_order:
            if value in PROPOSAL_DRAFT_SECTION_LABELS and value not in seen:
                ordered.append(value)
                seen.add(value)
    for value in PROPOSAL_DRAFT_SECTION_ORDER:
        if value not in seen:
            ordered.append(value)
    return ordered


def _live_effective_rule_summary(
    connection: Connection,
    *,
    workspace_id: str,
    opportunity_id: str,
    user_id: str | None,
    selected_template_key: str | None = None,
    include_opportunity_override: bool = True,
) -> tuple[dict[str, Any], bool]:
    return build_effective_rule_summary(
        connection,
        workspace_id=workspace_id,
        opportunity_id=opportunity_id,
        updated_by_user_id=user_id,
        include_opportunity_override=include_opportunity_override,
        selected_template_key=selected_template_key,
    )


def _timeline_warning() -> dict[str, str]:
    return {
        "code": "MISSING_TIMELINE_CONFIDENCE",
        "message": "Timeline remains a low-confidence section until discovery confirms launch timing.",
    }


def _confidence_notes() -> list[str]:
    return [
        "Timeline remains low confidence until launch timing is confirmed.",
    ]


def _build_payload_state(
    *,
    sections: dict[str, dict[str, Any]],
    base_confidence_notes: list[str],
    base_warnings: list[dict[str, Any]],
    effective_rule_summary: dict[str, Any],
    has_override: bool,
) -> dict[str, Any]:
    next_sections = {key: dict(value) for key, value in sections.items()}
    warnings = [
        dict(item)
        for item in base_warnings
        if isinstance(item, dict) and item.get("code") != "RULES_CONFLICT"
    ]
    confidence_notes = [note for note in base_confidence_notes if note != RULES_CONFLICT_NOTE]

    assumptions_conflict = _normalize_section_lines(next_sections.get("assumptions", {}).get("content")) != _normalize_rule_preview(
        effective_rule_summary.get("assumptions_preview")
    )
    exclusions_conflict = _normalize_section_lines(next_sections.get("exclusions", {}).get("content")) != _normalize_rule_preview(
        effective_rule_summary.get("exclusions_preview")
    )
    rules_conflict = assumptions_conflict or exclusions_conflict

    if rules_conflict and not any(item.get("code") == "RULES_CONFLICT" for item in warnings):
        warnings.append(dict(RULES_CONFLICT_WARNING))
    if rules_conflict and RULES_CONFLICT_NOTE not in confidence_notes:
        confidence_notes.append(RULES_CONFLICT_NOTE)

    for section_key in ("assumptions", "exclusions"):
        if section_key not in next_sections:
            continue
        if (section_key == "assumptions" and assumptions_conflict) or (
            section_key == "exclusions" and exclusions_conflict
        ):
            next_sections[section_key]["warning"] = RULES_CONFLICT_SECTION_WARNINGS[section_key]
            continue
        if next_sections[section_key].get("warning") == RULES_CONFLICT_SECTION_WARNINGS[section_key]:
            next_sections[section_key]["warning"] = None

    return {
        "sections": next_sections,
        "confidence_notes": confidence_notes,
        "warnings": warnings,
        "effective_rule_summary": effective_rule_summary,
        "has_override": has_override,
    }


def _build_sections(
    *,
    assumption_text: str,
    exclusion_text: str,
    edited_at: datetime,
    generated_at: datetime,
    force_low_confidence: bool = False,
) -> dict[str, dict[str, Any]]:
    timeline_warning = "Timeline depends on feedback turnaround." if force_low_confidence else None
    return {
        "executive_summary": {
            "key": "executive_summary",
            "label": PROPOSAL_DRAFT_SECTION_LABELS["executive_summary"],
            "content": "North Star Studio needs a staged redesign and migration plan.",
            "last_edited_at": _isoformat_z(edited_at),
            "last_generated_at": _isoformat_z(generated_at),
            "is_user_edited": False,
            "confidence": "medium",
            "warning": None,
        },
        "objectives": {
            "key": "objectives",
            "label": PROPOSAL_DRAFT_SECTION_LABELS["objectives"],
            "content": "Clarify goals, decision-makers, and launch dependencies.",
            "last_edited_at": _isoformat_z(edited_at),
            "last_generated_at": _isoformat_z(generated_at),
            "is_user_edited": False,
            "confidence": "high",
            "warning": None,
        },
        "recommended_approach": {
            "key": "recommended_approach",
            "label": PROPOSAL_DRAFT_SECTION_LABELS["recommended_approach"],
            "content": "Run a short discovery workshop, then phase delivery in milestones.",
            "last_edited_at": _isoformat_z(edited_at),
            "last_generated_at": _isoformat_z(generated_at),
            "is_user_edited": False,
            "confidence": "medium",
            "warning": None,
        },
        "deliverables": {
            "key": "deliverables",
            "label": PROPOSAL_DRAFT_SECTION_LABELS["deliverables"],
            "content": "Discovery summary, sitemap, design concepts, and migration plan.",
            "last_edited_at": _isoformat_z(edited_at),
            "last_generated_at": _isoformat_z(generated_at),
            "is_user_edited": False,
            "confidence": "high",
            "warning": None,
        },
        "timeline": {
            "key": "timeline",
            "label": PROPOSAL_DRAFT_SECTION_LABELS["timeline"],
            "content": "Discovery in week 1, design in weeks 2-3, delivery in weeks 4-8.",
            "last_edited_at": _isoformat_z(edited_at),
            "last_generated_at": _isoformat_z(generated_at),
            "is_user_edited": False,
            "confidence": "low" if force_low_confidence else "medium",
            "warning": timeline_warning,
        },
        "assumptions": {
            "key": "assumptions",
            "label": PROPOSAL_DRAFT_SECTION_LABELS["assumptions"],
            "content": assumption_text,
            "last_edited_at": _isoformat_z(edited_at),
            "last_generated_at": _isoformat_z(generated_at),
            "is_user_edited": False,
            "confidence": "medium",
            "warning": None,
        },
        "exclusions": {
            "key": "exclusions",
            "label": PROPOSAL_DRAFT_SECTION_LABELS["exclusions"],
            "content": exclusion_text,
            "last_edited_at": _isoformat_z(edited_at),
            "last_generated_at": _isoformat_z(generated_at),
            "is_user_edited": False,
            "confidence": "medium",
            "warning": None,
        },
        "next_steps": {
            "key": "next_steps",
            "label": PROPOSAL_DRAFT_SECTION_LABELS["next_steps"],
            "content": "Confirm scope priorities and book the discovery workshop.",
            "last_edited_at": _isoformat_z(edited_at),
            "last_generated_at": _isoformat_z(generated_at),
            "is_user_edited": False,
            "confidence": "high",
            "warning": None,
        },
    }


def _has_meaningful_text(value: Any) -> bool:
    return isinstance(value, str) and bool(value.strip())


def _current_fields(row: RowMapping[str, Any] | None) -> dict[str, Any]:
    if row is None:
        return {}
    payload = row["current_payload"] or {}
    fields = payload.get("fields", {})
    return fields if isinstance(fields, dict) else {}


def _field_value(fields: dict[str, Any], key: str) -> str | None:
    field = fields.get(key, {})
    if isinstance(field, dict):
        value = field.get("value")
        if _has_meaningful_text(value):
            return str(value).strip()
    return None


def _field_state(fields: dict[str, Any], key: str) -> str | None:
    field = fields.get(key, {})
    if isinstance(field, dict):
        state = field.get("state")
        if isinstance(state, str):
            return state
    return None


def _has_ready_discovery_fields(discovery: RowMapping[str, Any] | None) -> bool:
    discovery_fields = _current_fields(discovery)
    if not discovery_fields:
        return False

    return all(
        _field_state(discovery_fields, key) in {"confirmed", "inferred"}
        for key in discovery_fields
    )


def _build_generated_payload_from_context(
    *,
    opportunity: RowMapping[str, Any],
    lead_brief: RowMapping[str, Any] | None,
    discovery: RowMapping[str, Any] | None,
    effective_rule_summary: dict[str, Any],
    has_override: bool,
    force_low_confidence: bool,
) -> dict[str, Any]:
    lead_fields = _current_fields(lead_brief)
    discovery_fields = _current_fields(discovery)
    executive_summary = _field_value(lead_fields, "business_context") or (
        f"{opportunity['company_name']} needs {str(opportunity['requested_service']).lower()}."
        if _has_meaningful_text(opportunity["requested_service"])
        else "Use the current brief and discovery to shape the next proposal draft."
    )
    objectives = _field_value(discovery_fields, "goals") or "Clarify goals, decision-makers, and launch dependencies."
    recommended_approach = _field_value(discovery_fields, "constraints") or (
        "Run a short discovery workshop, then phase delivery in milestones."
    )
    timeline_value = _field_value(lead_fields, "urgency_timeline")
    timeline_warning = force_low_confidence or not _has_meaningful_text(timeline_value)
    timeline_content = timeline_value or "Discovery in week 1, design in weeks 2-3, delivery in weeks 4-8."
    next_steps = _field_value(lead_fields, "recommended_next_step") or (
        "Confirm scope priorities and book the discovery workshop."
    )
    warnings = [_timeline_warning()] if timeline_warning else []
    confidence_notes = _confidence_notes() if timeline_warning else []
    assumption_text = _join_rule_lines(effective_rule_summary.get("assumptions_preview"))
    exclusion_text = _join_rule_lines(effective_rule_summary.get("exclusions_preview"))
    base_sections = _build_sections(
        assumption_text=assumption_text,
        exclusion_text=exclusion_text,
        edited_at=SEED_UPDATED_AT,
        generated_at=SEED_CREATED_AT,
        force_low_confidence=timeline_warning,
    )
    sections = {
        **base_sections,
        "executive_summary": {
            **base_sections["executive_summary"],
            "content": executive_summary,
        },
        "objectives": {
            **base_sections["objectives"],
            "content": objectives,
        },
        "recommended_approach": {
            **base_sections["recommended_approach"],
            "content": recommended_approach,
        },
        "timeline": {
            **base_sections["timeline"],
            "content": timeline_content,
            "confidence": "low" if timeline_warning else "medium",
            "warning": "Timeline depends on feedback turnaround." if timeline_warning else None,
        },
        "next_steps": {
            **base_sections["next_steps"],
            "content": next_steps,
        },
    }
    return _build_payload_state(
        sections=sections,
        base_confidence_notes=confidence_notes,
        base_warnings=warnings,
        effective_rule_summary=effective_rule_summary,
        has_override=has_override,
    )


def _serialize_current_resource(row: RowMapping[str, Any] | None) -> dict[str, Any] | None:
    if row is None:
        return None
    payload = row["current_payload"] or {}
    return {
        "id": row["id"],
        "opportunity_id": row["opportunity_id"],
        "workspace_id": row["workspace_id"],
        "template_key": row["template_key"],
        "current_revision_no": row["current_revision_no"],
        "latest_version_no": row["latest_version_no"],
        "sections": payload.get("sections", {}),
        "confidence_notes": payload.get("confidence_notes", []),
        "warnings": payload.get("warnings", []),
        "effective_rule_summary": payload.get("effective_rule_summary", {}),
        "has_override": payload.get("has_override", False),
        "created_at": _isoformat_z(row["created_at"]),
        "updated_at": _isoformat_z(row["updated_at"]),
    }


def _serialize_version_summary(row: RowMapping[str, Any]) -> dict[str, Any]:
    payload = row["payload"] or {}
    return {
        "version_no": row["version_no"],
        "version_origin": row["version_origin"],
        "version_note": row["version_note"],
        "saved_at": _isoformat_z(row["saved_at"]),
        "saved_by_user_id": row["saved_by_user_id"],
        "saved_by_name": row["saved_by_name"],
        "template_key": row["template_key"],
        "sections": payload.get("sections", {}),
    }


def _serialize_version_detail(
    row: RowMapping[str, Any],
    *,
    latest_version_no: int,
) -> dict[str, Any]:
    payload = row["payload"] or {}
    return {
        "id": row["id"],
        "opportunity_id": row["opportunity_id"],
        "workspace_id": row["workspace_id"],
        "template_key": row["template_key"],
        "current_revision_no": row["current_revision_no"],
        "latest_version_no": latest_version_no,
        "sections": payload.get("sections", {}),
        "confidence_notes": payload.get("confidence_notes", []),
        "warnings": payload.get("warnings", []),
        "effective_rule_summary": payload.get("effective_rule_summary", {}),
        "has_override": payload.get("has_override", False),
        "created_at": _isoformat_z(row["created_at"]),
        "updated_at": _isoformat_z(row["updated_at"]),
        "version_no": row["version_no"],
        "version_origin": row["version_origin"],
        "version_note": row["version_note"],
        "saved_at": _isoformat_z(row["saved_at"]),
        "saved_by_user_id": row["saved_by_user_id"],
        "saved_by_name": row["saved_by_name"],
    }


def _workspace_payload(
    current: RowMapping[str, Any] | None,
    versions: list[RowMapping[str, Any]],
) -> dict[str, Any]:
    return {
        "proposal_draft": _serialize_current_resource(current),
        "versions": [_serialize_version_summary(row) for row in versions],
    }


def _get_saved_by_name(connection: Connection, user_id: str | None) -> str | None:
    if user_id is None:
        return None
    result = connection.execute(select(users_table.c.full_name).where(users_table.c.id == user_id))
    row = result.mappings().first()
    if row is None:
        return None
    return row["full_name"]


def _validate_sections(sections: dict[str, Any]) -> None:
    if set(sections.keys()) != set(PROPOSAL_DRAFT_SECTION_ORDER):
        raise ProposalDraftValidationError("Proposal Draft sections are missing or invalid.")
    for section_key in PROPOSAL_DRAFT_SECTION_ORDER:
        section = sections.get(section_key)
        if not isinstance(section, dict):
            raise ProposalDraftValidationError("Proposal Draft sections are missing or invalid.")
        if section.get("key") != section_key:
            raise ProposalDraftValidationError("Proposal Draft section key mismatch.")
        if not section.get("label"):
            raise ProposalDraftValidationError("Proposal Draft section label is required.")
        if not isinstance(section.get("content"), str):
            raise ProposalDraftValidationError("Proposal Draft section content must be text.")


def _max_section_edited_at(sections: dict[str, Any], *, fallback: datetime) -> datetime:
    values = [
        _parse_iso_datetime(section.get("last_edited_at"), fallback=fallback)
        for section in sections.values()
        if isinstance(section, dict)
    ]
    return max(values) if values else fallback


def _current_or_conflict(
    connection: Connection,
    *,
    workspace_id: str,
    opportunity_id: str,
    expected_revision_no: int,
) -> RowMapping[str, Any]:
    current = get_proposal_draft_current(
        connection,
        workspace_id=workspace_id,
        opportunity_id=opportunity_id,
    )
    if current is None:
        raise ProposalDraftNotFoundError("Proposal Draft not found.")
    if current["current_revision_no"] != expected_revision_no:
        raise ProposalDraftConflictError(
            current_revision_no=current["current_revision_no"],
            expected_revision_no=expected_revision_no,
            latest_version_no=current["latest_version_no"],
        )
    return current


def ensure_proposal_draft_current(
    connection: Connection,
    *,
    workspace_id: str,
    opportunity_id: str,
    user_id: str | None,
) -> RowMapping[str, Any]:
    current = get_proposal_draft_current(
        connection,
        workspace_id=workspace_id,
        opportunity_id=opportunity_id,
    )
    if current is None:
        raise ProposalDraftNotFoundError("Proposal Draft not found.")
    return current


def _serialize_current_resource_with_live_rules(
    connection: Connection,
    *,
    current: RowMapping[str, Any],
    workspace_id: str,
    opportunity_id: str,
    user_id: str | None,
) -> dict[str, Any]:
    resource = _serialize_current_resource(current)
    assert resource is not None
    payload = current["current_payload"] or {}
    effective_rule_summary, has_override = _live_effective_rule_summary(
        connection,
        workspace_id=workspace_id,
        opportunity_id=opportunity_id,
        user_id=user_id,
    )
    resource.update(
        _build_payload_state(
            sections=resource["sections"],
            base_confidence_notes=payload.get("confidence_notes", []),
            base_warnings=payload.get("warnings", []),
            effective_rule_summary=effective_rule_summary,
            has_override=has_override,
        )
    )
    return resource


def get_proposal_draft_workspace(
    connection: Connection,
    *,
    workspace_id: str,
    opportunity_id: str,
    user_id: str | None,
) -> dict[str, Any]:
    current = get_proposal_draft_current(
        connection,
        workspace_id=workspace_id,
        opportunity_id=opportunity_id,
    )
    versions = list_proposal_draft_versions(
        connection,
        workspace_id=workspace_id,
        opportunity_id=opportunity_id,
    )
    return {
        "proposal_draft": (
            _serialize_current_resource_with_live_rules(
                connection,
                current=current,
                workspace_id=workspace_id,
                opportunity_id=opportunity_id,
                user_id=user_id,
            )
            if current is not None
            else None
        ),
        "versions": [_serialize_version_summary(row) for row in versions],
    }


def generate_proposal_draft(
    connection: Connection,
    *,
    workspace_id: str,
    opportunity_id: str,
    template_key: str,
    user_id: str | None,
    use_opportunity_overrides: bool,
    force_low_confidence: bool,
) -> dict[str, Any]:
    current = get_proposal_draft_current(
        connection,
        workspace_id=workspace_id,
        opportunity_id=opportunity_id,
    )
    opportunity = get_opportunity(
        connection,
        workspace_id=workspace_id,
        opportunity_id=opportunity_id,
    )
    if opportunity is None:
        raise ProposalDraftNotFoundError("Proposal Draft not found.")
    lead_brief = get_lead_brief_current(
        connection,
        workspace_id=workspace_id,
        opportunity_id=opportunity_id,
    )
    discovery = get_discovery_current(
        connection,
        workspace_id=workspace_id,
        opportunity_id=opportunity_id,
    )
    if current is None:
        if lead_brief is None:
            raise ProposalDraftDependencyError(
                code="LEAD_BRIEF_REQUIRED",
                blocked_by="lead_brief",
                detail="Generate Lead Brief before creating a proposal draft.",
            )
        if not _has_ready_discovery_fields(discovery):
            raise ProposalDraftDependencyError(
                code="DISCOVERY_REQUIRED",
                blocked_by="discovery",
                detail="Complete Discovery before generating a proposal draft.",
            )
        effective_rule_summary, has_override = _live_effective_rule_summary(
            connection,
            workspace_id=workspace_id,
            opportunity_id=opportunity_id,
            user_id=user_id,
            selected_template_key=template_key,
            include_opportunity_override=use_opportunity_overrides,
        )
        generated_payload = _build_generated_payload_from_context(
            opportunity=opportunity,
            lead_brief=lead_brief,
            discovery=discovery,
            effective_rule_summary=effective_rule_summary,
            has_override=has_override,
            force_low_confidence=force_low_confidence,
        )
        created = create_proposal_draft_current(
            connection,
            record={
                "id": f"proposal_draft_{opportunity_id}",
                "workspace_id": workspace_id,
                "opportunity_id": opportunity_id,
                "template_key": template_key,
                "current_payload": generated_payload,
                "current_revision_no": 1,
                "latest_version_no": 0,
                "last_ai_call_id": None,
                "updated_by_user_id": user_id,
                "created_at": SEED_CREATED_AT,
                "updated_at": SEED_UPDATED_AT,
            },
        )
        current_resource = _serialize_current_resource(created)
    else:
        effective_rule_summary, has_override = _live_effective_rule_summary(
            connection,
            workspace_id=workspace_id,
            opportunity_id=opportunity_id,
            user_id=user_id,
            selected_template_key=template_key,
            include_opportunity_override=use_opportunity_overrides,
        )
        preview_payload = (
            _build_generated_payload_from_context(
                opportunity=opportunity,
                lead_brief=lead_brief,
                discovery=discovery,
                effective_rule_summary=effective_rule_summary,
                has_override=has_override,
                force_low_confidence=force_low_confidence,
            )
            if lead_brief is not None and _has_ready_discovery_fields(discovery)
            else _build_payload_state(
                sections=_serialize_current_resource(current)["sections"],
                base_confidence_notes=(current["current_payload"] or {}).get("confidence_notes", []),
                base_warnings=(current["current_payload"] or {}).get("warnings", []),
                effective_rule_summary=effective_rule_summary,
                has_override=has_override,
            )
        )
        current_resource = {
            **_serialize_current_resource(current),
            "template_key": template_key,
            "sections": preview_payload["sections"],
            "confidence_notes": preview_payload["confidence_notes"],
            "warnings": preview_payload["warnings"],
            "effective_rule_summary": preview_payload["effective_rule_summary"],
            "has_override": preview_payload["has_override"],
        }
    return {
        "status": "queued",
        "redirect_to": f"/opportunities/{opportunity_id}/proposal-draft",
        "proposal_draft": current_resource,
    }


def save_current_proposal_draft(
    connection: Connection,
    *,
    workspace_id: str,
    opportunity_id: str,
    expected_revision_no: int,
    sections: dict[str, Any],
    user_id: str | None,
) -> dict[str, Any]:
    _validate_sections(sections)
    current = ensure_proposal_draft_current(
        connection,
        workspace_id=workspace_id,
        opportunity_id=opportunity_id,
        user_id=user_id,
    )
    effective_rule_summary, has_override = _live_effective_rule_summary(
        connection,
        workspace_id=workspace_id,
        opportunity_id=opportunity_id,
        user_id=user_id,
    )
    _current_or_conflict(
        connection,
        workspace_id=workspace_id,
        opportunity_id=opportunity_id,
        expected_revision_no=expected_revision_no,
    )
    now = _max_section_edited_at(sections, fallback=current["updated_at"])
    current_payload = _build_payload_state(
        sections=sections,
        base_confidence_notes=(current["current_payload"] or {}).get("confidence_notes", []),
        base_warnings=(current["current_payload"] or {}).get("warnings", []),
        effective_rule_summary=effective_rule_summary,
        has_override=has_override,
    )
    updated = update_proposal_draft_current(
        connection,
        workspace_id=workspace_id,
        opportunity_id=opportunity_id,
        expected_revision_no=expected_revision_no,
        values={
            "current_payload": current_payload,
            "current_revision_no": expected_revision_no + 1,
            "updated_at": now,
            "updated_by_user_id": user_id,
        },
    )
    if updated is None:
        latest = get_proposal_draft_current(
            connection,
            workspace_id=workspace_id,
            opportunity_id=opportunity_id,
        ) or current
        raise ProposalDraftConflictError(
            current_revision_no=latest["current_revision_no"],
            expected_revision_no=expected_revision_no,
            latest_version_no=latest["latest_version_no"],
        )
    versions = list_proposal_draft_versions(
        connection,
        workspace_id=workspace_id,
        opportunity_id=opportunity_id,
    )
    return _workspace_payload(updated, versions)


def save_version_proposal_draft(
    connection: Connection,
    *,
    workspace_id: str,
    opportunity_id: str,
    expected_revision_no: int,
    sections: dict[str, Any],
    version_note: str | None,
    user_id: str | None,
) -> dict[str, Any]:
    _validate_sections(sections)
    current = ensure_proposal_draft_current(
        connection,
        workspace_id=workspace_id,
        opportunity_id=opportunity_id,
        user_id=user_id,
    )
    current = _current_or_conflict(
        connection,
        workspace_id=workspace_id,
        opportunity_id=opportunity_id,
        expected_revision_no=expected_revision_no,
    )
    effective_rule_summary, has_override = _live_effective_rule_summary(
        connection,
        workspace_id=workspace_id,
        opportunity_id=opportunity_id,
        user_id=user_id,
    )
    version_payload = _build_payload_state(
        sections=sections,
        base_confidence_notes=(current["current_payload"] or {}).get("confidence_notes", []),
        base_warnings=(current["current_payload"] or {}).get("warnings", []),
        effective_rule_summary=effective_rule_summary,
        has_override=has_override,
    )
    saved_at = current["updated_at"].astimezone(UTC).replace(microsecond=0) + timedelta(minutes=2)
    version_no = current["latest_version_no"] + 1
    version = append_proposal_draft_version(
        connection,
        record={
            "id": f"proposal_draft_version_{opportunity_id}_{version_no}",
            "proposal_draft_id": current["id"],
            "workspace_id": workspace_id,
            "opportunity_id": opportunity_id,
            "template_key": current["template_key"],
            "version_no": version_no,
            "current_revision_no": current["current_revision_no"],
            "payload": version_payload,
            "version_origin": "save_version",
            "version_note": version_note,
            "saved_by_user_id": user_id,
            "saved_by_name": _get_saved_by_name(connection, user_id),
            "ai_call_id": current["last_ai_call_id"],
            "created_at": current["created_at"],
            "updated_at": current["updated_at"],
            "saved_at": saved_at,
        },
    )
    if version is None:
        raise ProposalDraftNotFoundError("Proposal Draft not found.")
    updated = update_proposal_draft_latest_version(
        connection,
        workspace_id=workspace_id,
        opportunity_id=opportunity_id,
        latest_version_no=version_no,
        updated_at=saved_at,
    )
    if updated is None:
        raise ProposalDraftNotFoundError("Proposal Draft not found.")
    versions = list_proposal_draft_versions(
        connection,
        workspace_id=workspace_id,
        opportunity_id=opportunity_id,
    )
    return _workspace_payload(updated, versions)


def get_proposal_draft_version_detail(
    connection: Connection,
    *,
    workspace_id: str,
    opportunity_id: str,
    version_no: int,
    user_id: str | None,
) -> dict[str, Any]:
    current = ensure_proposal_draft_current(
        connection,
        workspace_id=workspace_id,
        opportunity_id=opportunity_id,
        user_id=user_id,
    )
    version = get_proposal_draft_version(
        connection,
        workspace_id=workspace_id,
        opportunity_id=opportunity_id,
        version_no=version_no,
    )
    if version is None:
        raise ProposalDraftVersionNotFoundError("Proposal Draft version not found.")
    return {
        "version": _serialize_version_detail(version, latest_version_no=current["latest_version_no"]),
    }


def restore_proposal_draft_version(
    connection: Connection,
    *,
    workspace_id: str,
    opportunity_id: str,
    version_no: int,
    expected_revision_no: int,
    user_id: str | None,
) -> dict[str, Any]:
    current = ensure_proposal_draft_current(
        connection,
        workspace_id=workspace_id,
        opportunity_id=opportunity_id,
        user_id=user_id,
    )
    current = _current_or_conflict(
        connection,
        workspace_id=workspace_id,
        opportunity_id=opportunity_id,
        expected_revision_no=expected_revision_no,
    )
    version = get_proposal_draft_version(
        connection,
        workspace_id=workspace_id,
        opportunity_id=opportunity_id,
        version_no=version_no,
    )
    if version is None:
        raise ProposalDraftVersionNotFoundError("Proposal Draft version not found.")
    restored = update_proposal_draft_current(
        connection,
        workspace_id=workspace_id,
        opportunity_id=opportunity_id,
        expected_revision_no=expected_revision_no,
        values={
            "current_payload": _build_payload_state(
                sections=(version["payload"] or {}).get("sections", {}),
                base_confidence_notes=(version["payload"] or {}).get("confidence_notes", []),
                base_warnings=(version["payload"] or {}).get("warnings", []),
                effective_rule_summary=_live_effective_rule_summary(
                    connection,
                    workspace_id=workspace_id,
                    opportunity_id=opportunity_id,
                    user_id=user_id,
                )[0],
                has_override=_live_effective_rule_summary(
                    connection,
                    workspace_id=workspace_id,
                    opportunity_id=opportunity_id,
                    user_id=user_id,
                )[1],
            ),
            "current_revision_no": expected_revision_no + 1,
            "latest_version_no": max(current["latest_version_no"], version_no),
            "updated_at": current["updated_at"].astimezone(UTC).replace(microsecond=0) + timedelta(minutes=1),
            "updated_by_user_id": user_id,
        },
    )
    if restored is None:
        latest = get_proposal_draft_current(
            connection,
            workspace_id=workspace_id,
            opportunity_id=opportunity_id,
        ) or current
        raise ProposalDraftConflictError(
            current_revision_no=latest["current_revision_no"],
            expected_revision_no=expected_revision_no,
            latest_version_no=latest["latest_version_no"],
        )
    versions = list_proposal_draft_versions(
        connection,
        workspace_id=workspace_id,
        opportunity_id=opportunity_id,
    )
    return _workspace_payload(restored, versions)


def regenerate_proposal_draft_section(
    connection: Connection,
    *,
    workspace_id: str,
    opportunity_id: str,
    section_key: str,
    expected_revision_no: int,
    overwrite_current_edit: bool,
    user_id: str | None,
) -> dict[str, Any]:
    current = ensure_proposal_draft_current(
        connection,
        workspace_id=workspace_id,
        opportunity_id=opportunity_id,
        user_id=user_id,
    )
    current = _current_or_conflict(
        connection,
        workspace_id=workspace_id,
        opportunity_id=opportunity_id,
        expected_revision_no=expected_revision_no,
    )
    payload = current["current_payload"] or {}
    sections = dict(payload.get("sections", {}))
    section = dict(sections.get(section_key, {}))
    if not section:
        raise ProposalDraftValidationError("Proposal Draft section is invalid.")
    if section.get("is_user_edited") and not overwrite_current_edit:
        raise ProposalDraftSectionOverwriteRequiredError(section_key=section_key)
    generated_at = current["updated_at"].astimezone(UTC).replace(microsecond=0) + timedelta(minutes=5)
    opportunity = get_opportunity(
        connection,
        workspace_id=workspace_id,
        opportunity_id=opportunity_id,
    )
    lead_brief = get_lead_brief_current(
        connection,
        workspace_id=workspace_id,
        opportunity_id=opportunity_id,
    )
    discovery = get_discovery_current(
        connection,
        workspace_id=workspace_id,
        opportunity_id=opportunity_id,
    )
    generated_payload = (
        _build_generated_payload_from_context(
            opportunity=opportunity,
            lead_brief=lead_brief,
            discovery=discovery,
            effective_rule_summary=_live_effective_rule_summary(
                connection,
                workspace_id=workspace_id,
                opportunity_id=opportunity_id,
                user_id=user_id,
            )[0],
            has_override=_live_effective_rule_summary(
                connection,
                workspace_id=workspace_id,
                opportunity_id=opportunity_id,
                user_id=user_id,
            )[1],
            force_low_confidence=False,
        )
        if opportunity is not None and lead_brief is not None and _has_ready_discovery_fields(discovery)
        else None
    )
    replacement_content = (
        generated_payload["sections"][section_key]["content"]
        if generated_payload is not None
        else f"Refined {PROPOSAL_DRAFT_SECTION_LABELS[section_key].lower()} for the current opportunity."
    )
    section.update(
        {
            "content": replacement_content,
            "last_generated_at": _isoformat_z(generated_at),
            "last_edited_at": _isoformat_z(generated_at),
            "is_user_edited": False,
        }
    )
    sections[section_key] = section
    effective_rule_summary, has_override = _live_effective_rule_summary(
        connection,
        workspace_id=workspace_id,
        opportunity_id=opportunity_id,
        user_id=user_id,
    )
    updated = update_proposal_draft_current(
        connection,
        workspace_id=workspace_id,
        opportunity_id=opportunity_id,
        expected_revision_no=expected_revision_no,
        values={
            "current_payload": _build_payload_state(
                sections=sections,
                base_confidence_notes=payload.get("confidence_notes", []),
                base_warnings=payload.get("warnings", []),
                effective_rule_summary=effective_rule_summary,
                has_override=has_override,
            ),
            "current_revision_no": expected_revision_no + 1,
            "updated_at": generated_at,
            "updated_by_user_id": user_id,
        },
    )
    if updated is None:
        raise ProposalDraftConflictError(
            current_revision_no=current["current_revision_no"],
            expected_revision_no=expected_revision_no,
            latest_version_no=current["latest_version_no"],
        )
    versions = list_proposal_draft_versions(
        connection,
        workspace_id=workspace_id,
        opportunity_id=opportunity_id,
    )
    return _workspace_payload(updated, versions)


def export_proposal_draft(
    connection: Connection,
    *,
    workspace_id: str,
    opportunity_id: str,
    user_id: str | None,
    export_format: str,
) -> str:
    current = ensure_proposal_draft_current(
        connection,
        workspace_id=workspace_id,
        opportunity_id=opportunity_id,
        user_id=user_id,
    )
    sections = (current["current_payload"] or {}).get("sections", {})
    effective_rule_summary, _ = _live_effective_rule_summary(
        connection,
        workspace_id=workspace_id,
        opportunity_id=opportunity_id,
        user_id=user_id,
    )
    chunks: list[str] = []
    for section_key in _ordered_section_keys(effective_rule_summary.get("section_order")):
        section = sections.get(section_key, {})
        heading = section.get("label", PROPOSAL_DRAFT_SECTION_LABELS[section_key])
        content = section.get("content", "")
        if export_format == "markdown":
            chunks.append(f"# {heading}\n\n{content}")
        else:
            chunks.append(f"{heading}\n\n{content}")
    return "\n\n".join(chunks)
