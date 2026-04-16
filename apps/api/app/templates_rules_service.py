from __future__ import annotations

from datetime import UTC, datetime, timedelta
from typing import Any

from sqlalchemy import select
from sqlalchemy.engine import Connection, RowMapping

from app.account_models import workspaces_table
from app.templates_rules_repository import (
    create_opportunity_rule_override,
    create_template_definition,
    create_workspace_rule_set,
    get_opportunity_rule_override,
    get_template_definition,
    get_workspace_rule_set,
    list_template_definitions,
    update_opportunity_rule_override,
    update_workspace_rule_set,
)

FROZEN_TEMPLATE_DEFINITIONS = [
    {
        "template_key": "development_agency",
        "name": "Development Agency Template",
        "industry_scope": "web_development_agency",
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
        "default_service_modules": ["strategy", "design", "delivery"],
        "is_active": True,
    },
    {
        "template_key": "product_ux_agency",
        "name": "Product / UX Agency Template",
        "industry_scope": "product_ux_agency",
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
            "objectives",
            "recommended_approach",
            "assumptions",
            "exclusions",
        ],
        "default_service_modules": ["research", "product_strategy", "ux_design"],
        "is_active": True,
    },
    {
        "template_key": "web_delivery_proposal",
        "name": "Web Delivery Proposal Template",
        "industry_scope": "web_development_agency",
        "section_order": [
            "executive_summary",
            "deliverables",
            "timeline",
            "assumptions",
            "exclusions",
            "next_steps",
        ],
        "required_sections": [
            "executive_summary",
            "deliverables",
            "timeline",
            "assumptions",
            "exclusions",
            "next_steps",
        ],
        "default_service_modules": ["strategy", "delivery"],
        "is_active": True,
    },
]

DEFAULT_WORKSPACE_RULE_SET = {
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
}

DEFAULT_RULE_OVERRIDE = {
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
}

DEFAULT_WORKSPACE_UPDATED_AT = datetime(2026, 4, 12, 10, 0, tzinfo=UTC)
DEFAULT_OVERRIDE_UPDATED_AT = datetime(2026, 4, 12, 10, 30, tzinfo=UTC)


class WorkspaceRulesConflictError(ValueError):
    def __init__(self, *, current_updated_at: datetime, expected_updated_at: datetime) -> None:
        super().__init__("Workspace rules changed elsewhere.")
        self.current_updated_at = current_updated_at
        self.expected_updated_at = expected_updated_at


class OpportunityRuleOverrideConflictError(ValueError):
    def __init__(
        self,
        *,
        opportunity_id: str,
        current_updated_at: datetime,
        expected_updated_at: datetime,
    ) -> None:
        super().__init__("Opportunity rule override changed elsewhere.")
        self.opportunity_id = opportunity_id
        self.current_updated_at = current_updated_at
        self.expected_updated_at = expected_updated_at


class RuleValidationError(ValueError):
    def __init__(self, *, code: str, details: dict[str, Any]) -> None:
        super().__init__("Rules validation failed.")
        self.code = code
        self.details = details


def _isoformat_z(value: datetime) -> str:
    return value.astimezone(UTC).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def _parse_iso_datetime(value: str) -> datetime:
    normalized = value.replace("Z", "+00:00")
    return datetime.fromisoformat(normalized).astimezone(UTC).replace(microsecond=0)


def _base_timestamp(offset_minutes: int = 0) -> datetime:
    return DEFAULT_WORKSPACE_UPDATED_AT + timedelta(minutes=offset_minutes)


def _workspace_record(
    connection: Connection,
    *,
    workspace_id: str,
) -> RowMapping[str, Any] | None:
    result = connection.execute(select(workspaces_table).where(workspaces_table.c.id == workspace_id))
    return result.mappings().first()


def _normalize_string_list(values: list[str] | None) -> list[str]:
    if not values:
        return []
    normalized: list[str] = []
    for value in values:
        cleaned = value.strip()
        if cleaned:
            normalized.append(cleaned)
    return normalized


def _dedupe_preserve_order(values: list[str]) -> list[str]:
    seen: set[str] = set()
    result: list[str] = []
    for value in values:
        if value not in seen:
            seen.add(value)
            result.append(value)
    return result


def _require_template_definition(
    connection: Connection,
    *,
    template_key: str | None,
    field: str,
    ui_warning: str,
) -> RowMapping[str, Any]:
    if not template_key:
        raise RuleValidationError(
            code="RULE_VALIDATION_ERROR",
            details={
                "reason": "invalid_template_key",
                "field": field,
                "invalid_value": template_key,
                "ui_warning": ui_warning,
            },
        )

    template = get_template_definition(connection, template_key=template_key)
    if template is None:
        raise RuleValidationError(
            code="RULE_VALIDATION_ERROR",
            details={
                "reason": "invalid_template_key",
                "field": field,
                "invalid_value": template_key,
                "ui_warning": ui_warning,
            },
        )
    return template


def _serialize_template(row: RowMapping[str, Any]) -> dict[str, Any]:
    return {
        "key": row["template_key"],
        "name": row["name"],
        "industry_scope": row["industry_scope"],
        "is_active": row["is_active"],
        "required_sections": row["required_sections"],
    }


def _serialize_workspace_rule_set(row: RowMapping[str, Any]) -> dict[str, Any]:
    return {
        "workspace_id": row["workspace_id"],
        "template_key": row["template_key"],
        "tone_profile": row["tone_profile"],
        "preferred_terminology": row["preferred_terminology"],
        "banned_terminology": row["banned_terminology"],
        "default_assumptions": row["default_assumptions"],
        "default_exclusions": row["default_exclusions"],
        "service_modules": row["service_modules"],
        "section_order": row["section_order"],
        "required_sections": row["required_sections"],
        "default_cta_style": row["default_cta_style"],
        "updated_at": _isoformat_z(row["updated_at"]),
    }


def _serialize_override(row: RowMapping[str, Any]) -> dict[str, Any]:
    return {
        "opportunity_id": row["opportunity_id"],
        "template_key_override": row["template_key_override"],
        "tone_profile_override": row["tone_profile_override"],
        "assumptions_override": row["assumptions_override"],
        "exclusions_override": row["exclusions_override"],
        "service_modules_override": row["service_modules_override"],
        "preferred_terminology_additions": row["preferred_terminology_additions"],
        "banned_terminology_additions": row["banned_terminology_additions"],
        "default_cta_style_override": row["default_cta_style_override"],
        "updated_at": _isoformat_z(row["updated_at"]),
    }


def ensure_template_definitions(connection: Connection) -> list[RowMapping[str, Any]]:
    existing = list_template_definitions(connection)
    existing_keys = {row["template_key"] for row in existing}
    for index, definition in enumerate(FROZEN_TEMPLATE_DEFINITIONS):
        if definition["template_key"] in existing_keys:
            continue
        now = _base_timestamp(index)
        create_template_definition(
            connection,
            record={
                **definition,
                "created_at": now,
                "updated_at": now,
            },
        )
    return list_template_definitions(connection)


def ensure_workspace_rule_set(
    connection: Connection,
    *,
    workspace_id: str,
    updated_by_user_id: str | None,
) -> RowMapping[str, Any]:
    current = get_workspace_rule_set(connection, workspace_id=workspace_id)
    if current is not None:
        return current
    workspace = _workspace_record(connection, workspace_id=workspace_id)
    template_scope = workspace["industry_type"] if workspace is not None else "web_development_agency"
    return create_workspace_rule_set(
        connection,
        record={
            "workspace_id": workspace_id,
            "template_scope": template_scope,
            "updated_by_user_id": updated_by_user_id,
            "created_at": DEFAULT_WORKSPACE_UPDATED_AT,
            "updated_at": DEFAULT_WORKSPACE_UPDATED_AT,
            **DEFAULT_WORKSPACE_RULE_SET,
        },
    )


def ensure_opportunity_rule_override(
    connection: Connection,
    *,
    workspace_id: str,
    opportunity_id: str,
    updated_by_user_id: str | None,
) -> RowMapping[str, Any]:
    current = get_opportunity_rule_override(
        connection,
        workspace_id=workspace_id,
        opportunity_id=opportunity_id,
    )
    if current is not None:
        return current
    return create_opportunity_rule_override(
        connection,
        record={
            "workspace_id": workspace_id,
            "opportunity_id": opportunity_id,
            "is_active": True,
            "updated_by_user_id": updated_by_user_id,
            "created_at": DEFAULT_OVERRIDE_UPDATED_AT,
            "updated_at": DEFAULT_OVERRIDE_UPDATED_AT,
            **DEFAULT_RULE_OVERRIDE,
        },
    )


def _active_override(row: RowMapping[str, Any] | None) -> RowMapping[str, Any] | None:
    if row is None or not row["is_active"]:
        return None
    return row


def build_effective_rule_summary(
    connection: Connection,
    *,
    workspace_id: str,
    opportunity_id: str,
    updated_by_user_id: str | None,
    include_opportunity_override: bool = True,
    selected_template_key: str | None = None,
) -> tuple[dict[str, Any], bool]:
    ensure_template_definitions(connection)
    workspace_rules = ensure_workspace_rule_set(
        connection,
        workspace_id=workspace_id,
        updated_by_user_id=updated_by_user_id,
    )
    override = _active_override(
        get_opportunity_rule_override(
            connection,
            workspace_id=workspace_id,
            opportunity_id=opportunity_id,
        )
    )
    if not include_opportunity_override:
        override = None
    template_key = selected_template_key or (
        override["template_key_override"] if override is not None else workspace_rules["template_key"]
    )
    template = _require_template_definition(
        connection,
        template_key=template_key,
        field="template_key_override" if override is not None and override["template_key_override"] else "template_key",
        ui_warning="Select a valid template before generating or reviewing proposal rules.",
    )
    return (
        {
            "template_key": template_key,
            "template_label": template["name"],
            "tone_profile": (
                override["tone_profile_override"] if override is not None and override["tone_profile_override"] else workspace_rules["tone_profile"]
            ),
            "section_order": workspace_rules["section_order"],
            "required_sections": workspace_rules["required_sections"],
            "assumptions_preview": (
                override["assumptions_override"] if override is not None and override["assumptions_override"] else workspace_rules["default_assumptions"]
            ),
            "exclusions_preview": (
                override["exclusions_override"] if override is not None and override["exclusions_override"] else workspace_rules["default_exclusions"]
            ),
            "preferred_terminology": _dedupe_preserve_order(
                _normalize_string_list(workspace_rules["preferred_terminology"])
                + _normalize_string_list(
                    override["preferred_terminology_additions"] if override is not None else []
                )
            ),
            "banned_terminology": _dedupe_preserve_order(
                _normalize_string_list(workspace_rules["banned_terminology"])
                + _normalize_string_list(
                    override["banned_terminology_additions"] if override is not None else []
                )
            ),
            "service_modules": (
                override["service_modules_override"] if override is not None and override["service_modules_override"] else workspace_rules["service_modules"]
            ),
            "rule_sources": {
                "template_definition": template_key,
                "workspace_rule_set": "workspace_rule_sets",
                "opportunity_override": "opportunity_rule_overrides" if override is not None else None,
            },
        },
        override is not None,
    )


def list_templates_payload(connection: Connection) -> dict[str, Any]:
    templates = ensure_template_definitions(connection)
    return {
        "data": [_serialize_template(template) for template in templates],
        "meta": {
            "source_of_truth": "template_definitions",
        },
    }


def get_workspace_rules_payload(
    connection: Connection,
    *,
    workspace_id: str,
    updated_by_user_id: str | None,
) -> dict[str, Any]:
    ensure_template_definitions(connection)
    rule_set = ensure_workspace_rule_set(
        connection,
        workspace_id=workspace_id,
        updated_by_user_id=updated_by_user_id,
    )
    return {
        "workspace_rule_set": _serialize_workspace_rule_set(rule_set),
        "meta": {
            "source_of_truth": "workspace_rule_sets",
        },
    }
def validate_workspace_rule_set_payload(
    connection: Connection,
    rule_set: dict[str, Any],
) -> dict[str, Any]:
    ensure_template_definitions(connection)
    _require_template_definition(
        connection,
        template_key=rule_set.get("template_key"),
        field="template_key",
        ui_warning="Select a valid template before saving workspace rules.",
    )
    required_sections = _normalize_string_list(rule_set.get("required_sections"))
    missing_sections = [
        section
        for section in ("assumptions", "exclusions")
        if section not in required_sections
    ]
    if missing_sections:
        raise RuleValidationError(
            code="RULE_VALIDATION_ERROR",
            details={
                "reason": "required_sections_missing",
                "missing_sections": missing_sections,
                "field": "required_sections",
                "ui_warning": "Assumptions and Exclusions must stay visible before Proposal Draft generation.",
            },
        )

    preferred = _normalize_string_list(rule_set.get("preferred_terminology"))
    banned = _normalize_string_list(rule_set.get("banned_terminology"))
    banned_lookup = {value.casefold() for value in banned}
    overlapping_terms = [value for value in preferred if value.casefold() in banned_lookup]
    if overlapping_terms:
        raise RuleValidationError(
            code="RULE_TERMINOLOGY_CONFLICT",
            details={
                "reason": "terminology_overlap",
                "overlapping_terms": overlapping_terms,
                "field": "preferred_terminology",
                "ui_warning": "Remove the overlap before saving so the drafting guidance stays unambiguous.",
            },
        )

    section_order = _normalize_string_list(rule_set.get("section_order"))
    if not section_order:
        raise RuleValidationError(
            code="RULE_VALIDATION_ERROR",
            details={
                "reason": "section_order_empty",
                "field": "section_order",
                "ui_warning": "Add at least one section so Proposal Draft keeps a stable chapter order.",
            },
        )
    return rule_set


def update_workspace_rules_payload(
    connection: Connection,
    *,
    workspace_id: str,
    updated_by_user_id: str | None,
    expected_updated_at: str,
    rule_set: dict[str, Any],
) -> dict[str, Any]:
    ensure_template_definitions(connection)
    current = ensure_workspace_rule_set(
        connection,
        workspace_id=workspace_id,
        updated_by_user_id=updated_by_user_id,
    )
    validate_workspace_rule_set_payload(connection, rule_set)
    expected = _parse_iso_datetime(expected_updated_at)
    if current["updated_at"].astimezone(UTC).replace(microsecond=0) != expected:
        raise WorkspaceRulesConflictError(
            current_updated_at=current["updated_at"],
            expected_updated_at=expected,
        )
    next_updated_at = current["updated_at"].astimezone(UTC).replace(microsecond=0) + timedelta(hours=1)
    updated = update_workspace_rule_set(
        connection,
        workspace_id=workspace_id,
        expected_updated_at=current["updated_at"],
        values={
            "template_key": rule_set["template_key"],
            "template_scope": rule_set.get("template_scope") or current["template_scope"],
            "tone_profile": rule_set["tone_profile"],
            "default_assumptions": rule_set["default_assumptions"],
            "default_exclusions": rule_set["default_exclusions"],
            "preferred_terminology": rule_set["preferred_terminology"],
            "banned_terminology": rule_set["banned_terminology"],
            "service_modules": rule_set["service_modules"],
            "section_order": rule_set["section_order"],
            "required_sections": rule_set["required_sections"],
            "default_cta_style": rule_set["default_cta_style"],
            "updated_by_user_id": updated_by_user_id,
            "updated_at": next_updated_at,
        },
    )
    assert updated is not None
    return {
        "workspace_rule_set": _serialize_workspace_rule_set(updated),
        "meta": {
            "source_of_truth": "workspace_rule_sets",
        },
    }


def get_effective_rules_payload(
    connection: Connection,
    *,
    workspace_id: str,
    opportunity_id: str,
    updated_by_user_id: str | None,
) -> dict[str, Any]:
    effective_summary, has_override = build_effective_rule_summary(
        connection,
        workspace_id=workspace_id,
        opportunity_id=opportunity_id,
        updated_by_user_id=updated_by_user_id,
    )
    return {
        "opportunity_id": opportunity_id,
        "has_override": has_override,
        "effective_rule_summary": effective_summary,
    }


def get_opportunity_override_payload(
    connection: Connection,
    *,
    workspace_id: str,
    opportunity_id: str,
    updated_by_user_id: str | None,
) -> dict[str, Any]:
    override = _active_override(
        get_opportunity_rule_override(
            connection,
            workspace_id=workspace_id,
            opportunity_id=opportunity_id,
        )
    )
    effective_rule_summary, has_override = build_effective_rule_summary(
        connection,
        workspace_id=workspace_id,
        opportunity_id=opportunity_id,
        updated_by_user_id=updated_by_user_id,
    )
    return {
        "override": _serialize_override(override) if override is not None else None,
        "effective_rule_summary": effective_rule_summary,
        "warning": (
            {
                "title": "Override active",
                "message": "This opportunity is using local rule changes that do not rewrite the workspace baseline.",
            }
            if has_override
            else None
        ),
        "meta": {
            "source_of_truth": "opportunity_rule_overrides",
        },
    }


def update_opportunity_override_payload(
    connection: Connection,
    *,
    workspace_id: str,
    opportunity_id: str,
    updated_by_user_id: str | None,
    expected_updated_at: str,
    override: dict[str, Any],
) -> dict[str, Any]:
    ensure_template_definitions(connection)
    current = get_opportunity_rule_override(
        connection,
        workspace_id=workspace_id,
        opportunity_id=opportunity_id,
    )
    _require_template_definition(
        connection,
        template_key=override.get("template_key_override"),
        field="template_key_override",
        ui_warning="Select a valid template before saving the opportunity override.",
    )
    expected = _parse_iso_datetime(expected_updated_at)
    if current is None:
        updated = create_opportunity_rule_override(
            connection,
            record={
                "workspace_id": workspace_id,
                "opportunity_id": opportunity_id,
                "is_active": True,
                "updated_by_user_id": updated_by_user_id,
                "created_at": DEFAULT_OVERRIDE_UPDATED_AT,
                "updated_at": DEFAULT_OVERRIDE_UPDATED_AT,
                "template_key_override": override["template_key_override"],
                "tone_profile_override": override["tone_profile_override"],
                "assumptions_override": override["assumptions_override"],
                "exclusions_override": override["exclusions_override"],
                "service_modules_override": override["service_modules_override"],
                "preferred_terminology_additions": override["preferred_terminology_additions"],
                "banned_terminology_additions": override["banned_terminology_additions"],
                "default_cta_style_override": override["default_cta_style_override"],
            },
        )
    else:
        if current["updated_at"].astimezone(UTC).replace(microsecond=0) != expected:
            raise OpportunityRuleOverrideConflictError(
                opportunity_id=opportunity_id,
                current_updated_at=current["updated_at"],
                expected_updated_at=expected,
            )
        next_updated_at = current["updated_at"].astimezone(UTC).replace(microsecond=0) + timedelta(hours=1)
        updated = update_opportunity_rule_override(
            connection,
            workspace_id=workspace_id,
            opportunity_id=opportunity_id,
            expected_updated_at=current["updated_at"],
            values={
                "is_active": True,
                "template_key_override": override["template_key_override"],
                "tone_profile_override": override["tone_profile_override"],
                "assumptions_override": override["assumptions_override"],
                "exclusions_override": override["exclusions_override"],
                "service_modules_override": override["service_modules_override"],
                "preferred_terminology_additions": override["preferred_terminology_additions"],
                "banned_terminology_additions": override["banned_terminology_additions"],
                "default_cta_style_override": override["default_cta_style_override"],
                "updated_by_user_id": updated_by_user_id,
                "updated_at": next_updated_at,
            },
        )
        assert updated is not None
    effective_rule_summary, _ = build_effective_rule_summary(
        connection,
        workspace_id=workspace_id,
        opportunity_id=opportunity_id,
        updated_by_user_id=updated_by_user_id,
    )
    return {
        "override": _serialize_override(updated),
        "effective_rule_summary": effective_rule_summary,
        "warning": {
            "title": "Override active",
            "message": "This opportunity is using local rule changes that do not rewrite the workspace baseline.",
        },
    }


def clear_opportunity_override_payload(
    connection: Connection,
    *,
    workspace_id: str,
    opportunity_id: str,
    updated_by_user_id: str | None,
) -> dict[str, Any]:
    current = get_opportunity_rule_override(
        connection,
        workspace_id=workspace_id,
        opportunity_id=opportunity_id,
    )
    if current is not None and current["is_active"]:
        next_updated_at = current["updated_at"].astimezone(UTC).replace(microsecond=0) + timedelta(hours=1)
        cleared = update_opportunity_rule_override(
            connection,
            workspace_id=workspace_id,
            opportunity_id=opportunity_id,
            expected_updated_at=current["updated_at"],
            values={
                "is_active": False,
                "template_key_override": None,
                "tone_profile_override": None,
                "assumptions_override": None,
                "exclusions_override": None,
                "service_modules_override": None,
                "preferred_terminology_additions": None,
                "banned_terminology_additions": None,
                "default_cta_style_override": None,
                "updated_by_user_id": updated_by_user_id,
                "updated_at": next_updated_at,
            },
        )
        assert cleared is not None
    effective_rule_summary, _ = build_effective_rule_summary(
        connection,
        workspace_id=workspace_id,
        opportunity_id=opportunity_id,
        updated_by_user_id=updated_by_user_id,
    )
    return {
        "cleared": True,
        "effective_rule_summary": effective_rule_summary,
        "warning": {
            "title": "Workspace baseline restored",
            "message": "The opportunity override was cleared and the current draft is back on the workspace rule set.",
        },
    }
