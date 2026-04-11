from __future__ import annotations

import secrets
from datetime import UTC, datetime
from typing import Any

from sqlalchemy import select
from sqlalchemy.engine import Connection, RowMapping

from app.account_models import users_table
from app.lead_brief_repository import (
    append_lead_brief_version,
    create_lead_brief_current,
    get_lead_brief_current,
    get_lead_brief_version,
    list_lead_brief_versions,
    update_lead_brief_current,
    update_lead_brief_latest_version,
)
from app.opportunity_repository import get_latest_input_by_type, get_opportunity


class LeadBriefNotFoundError(ValueError):
    pass


class LeadBriefConflictError(ValueError):
    def __init__(
        self,
        *,
        current_revision_no: int,
        expected_revision_no: int,
        latest_version_no: int | None,
    ) -> None:
        super().__init__("Lead brief changed elsewhere.")
        self.current_revision_no = current_revision_no
        self.expected_revision_no = expected_revision_no
        self.latest_version_no = latest_version_no


class LeadBriefVersionNotFoundError(ValueError):
    pass


def _utc_now() -> datetime:
    return datetime.now(UTC)


def _new_id(prefix: str) -> str:
    return f"{prefix}_{secrets.token_urlsafe(12)}"


def _has_meaningful_text(value: str | None) -> bool:
    return bool(value and value.strip())


def _excerpt(value: str | None, limit: int = 180) -> str | None:
    if not _has_meaningful_text(value):
        return None
    normalized = " ".join(value.strip().split())
    return normalized[:limit]


def _build_contact_value(opportunity: RowMapping[str, Any]) -> str | None:
    contact_name = opportunity["contact_name"]
    contact_email = opportunity["contact_email"]
    if _has_meaningful_text(contact_name) and _has_meaningful_text(contact_email):
        return f"{contact_name} <{contact_email}>"
    if _has_meaningful_text(contact_name):
        return str(contact_name)
    if _has_meaningful_text(contact_email):
        return str(contact_email)
    return None


def _build_initial_fields(
    opportunity: RowMapping[str, Any],
    *,
    primary_input: RowMapping[str, Any] | None,
    extracted_input: RowMapping[str, Any] | None,
) -> dict[str, dict[str, str | None]]:
    source_excerpt = _excerpt(primary_input["content"] if primary_input else None)
    if source_excerpt is None:
        source_excerpt = _excerpt(extracted_input["content"] if extracted_input else None)

    client_company = opportunity["company_name"]
    requested_service = opportunity["requested_service"]
    contact_value = _build_contact_value(opportunity)
    business_context_value = source_excerpt or f"Lead intake for {client_company} is ready for structuring."
    fit_value = (
        "Appears well suited for a redesign-led engagement."
        if _has_meaningful_text(requested_service)
        else "Needs more context before a fit judgment is final."
    )
    missing_value = "Timeline, budget signal, and decision process remain unconfirmed."

    return {
        "client_company": {
            "value": str(client_company) if _has_meaningful_text(client_company) else None,
            "state": "confirmed" if _has_meaningful_text(client_company) else "missing",
            "source_excerpt": _excerpt(str(client_company)) if _has_meaningful_text(client_company) else None,
        },
        "contact": {
            "value": contact_value,
            "state": "confirmed"
            if _has_meaningful_text(opportunity["contact_name"]) and _has_meaningful_text(opportunity["contact_email"])
            else "inferred"
            if contact_value
            else "missing",
            "source_excerpt": contact_value,
        },
        "requested_service": {
            "value": str(requested_service) if _has_meaningful_text(requested_service) else None,
            "state": "confirmed" if _has_meaningful_text(requested_service) else "missing",
            "source_excerpt": _excerpt(str(requested_service)) if _has_meaningful_text(requested_service) else None,
        },
        "business_context": {
            "value": business_context_value,
            "state": "inferred" if source_excerpt else "needs_review",
            "source_excerpt": source_excerpt,
        },
        "urgency_timeline": {
            "value": None,
            "state": "missing",
            "source_excerpt": None,
        },
        "budget_signal": {
            "value": None,
            "state": "missing",
            "source_excerpt": None,
        },
        "fit_assessment": {
            "value": fit_value,
            "state": "inferred",
            "source_excerpt": source_excerpt,
        },
        "missing_information": {
            "value": missing_value,
            "state": "needs_review",
            "source_excerpt": None,
        },
        "recommended_next_step": {
            "value": "Confirm timeline and budget before Discovery.",
            "state": "confirmed",
            "source_excerpt": "Workflow rule.",
        },
    }


def _serialize_current_resource(row: RowMapping[str, Any] | None) -> dict[str, Any] | None:
    if row is None:
        return None
    payload = row["current_payload"] or {}
    return {
        "id": row["id"],
        "opportunity_id": row["opportunity_id"],
        "workspace_id": row["workspace_id"],
        "current_revision_no": row["current_revision_no"],
        "fields": payload.get("fields", {}),
        "created_at": row["created_at"].isoformat(),
        "updated_at": row["updated_at"].isoformat(),
    }


def _serialize_version(row: RowMapping[str, Any] | None) -> dict[str, Any] | None:
    if row is None:
        return None
    payload = row["payload"] or {}
    return {
        "id": row["id"],
        "opportunity_id": row["opportunity_id"],
        "workspace_id": row["workspace_id"],
        "current_revision_no": row["current_revision_no"],
        "fields": payload.get("fields", {}),
        "created_at": row["created_at"].isoformat(),
        "updated_at": row["updated_at"].isoformat(),
        "version_no": row["version_no"],
        "saved_at": row["saved_at"].isoformat(),
        "saved_by_user_id": row["saved_by_user_id"],
        "saved_by_name": row["saved_by_name"],
    }


def _workspace_payload(
    current: RowMapping[str, Any] | None,
    versions: list[RowMapping[str, Any]],
) -> dict[str, Any]:
    return {
        "lead_brief": _serialize_current_resource(current),
        "versions": [_serialize_version(row) for row in versions],
    }


def _current_or_conflict(
    connection: Connection,
    *,
    workspace_id: str,
    opportunity_id: str,
    expected_revision_no: int,
) -> RowMapping[str, Any]:
    current = get_lead_brief_current(
        connection,
        workspace_id=workspace_id,
        opportunity_id=opportunity_id,
    )
    if current is None:
        raise LeadBriefNotFoundError("Lead brief not found.")
    if current["current_revision_no"] != expected_revision_no:
        raise LeadBriefConflictError(
            current_revision_no=current["current_revision_no"],
            expected_revision_no=expected_revision_no,
            latest_version_no=current["latest_version_no"],
        )
    return current


def _get_saved_by_name(connection: Connection, user_id: str | None) -> str | None:
    if user_id is None:
        return None
    result = connection.execute(select(users_table.c.full_name).where(users_table.c.id == user_id))
    row = result.mappings().first()
    if row is None:
        return None
    return row["full_name"]


def ensure_lead_brief_current(
    connection: Connection,
    *,
    workspace_id: str,
    opportunity: RowMapping[str, Any],
    primary_input: RowMapping[str, Any] | None,
    extracted_input: RowMapping[str, Any] | None,
    user_id: str | None,
) -> RowMapping[str, Any]:
    current = get_lead_brief_current(
        connection,
        workspace_id=workspace_id,
        opportunity_id=opportunity["id"],
    )
    if current is not None:
        return current

    now = _utc_now()
    record = {
        "id": _new_id("lead_brief"),
        "workspace_id": workspace_id,
        "opportunity_id": opportunity["id"],
        "current_payload": {
            "fields": _build_initial_fields(
                opportunity,
                primary_input=primary_input,
                extracted_input=extracted_input,
            )
        },
        "current_revision_no": 1,
        "latest_version_no": None,
        "last_ai_call_id": None,
        "updated_by_user_id": user_id,
        "created_at": now,
        "updated_at": now,
    }
    created = create_lead_brief_current(connection, record=record)
    if created is None:
        raise LeadBriefNotFoundError("Lead brief not found.")
    return created


def bootstrap_lead_brief(
    connection: Connection,
    *,
    workspace_id: str,
    opportunity: RowMapping[str, Any],
    primary_input: RowMapping[str, Any] | None,
    extracted_input: RowMapping[str, Any] | None,
    user_id: str | None,
) -> dict[str, Any]:
    ensure_lead_brief_current(
        connection,
        workspace_id=workspace_id,
        opportunity=opportunity,
        primary_input=primary_input,
        extracted_input=extracted_input,
        user_id=user_id,
    )
    return get_lead_brief_workspace(
        connection,
        workspace_id=workspace_id,
        opportunity_id=opportunity["id"],
    )


def get_lead_brief_workspace(
    connection: Connection,
    *,
    workspace_id: str,
    opportunity_id: str,
) -> dict[str, Any]:
    current = get_lead_brief_current(
        connection,
        workspace_id=workspace_id,
        opportunity_id=opportunity_id,
    )
    versions = list_lead_brief_versions(
        connection,
        workspace_id=workspace_id,
        opportunity_id=opportunity_id,
    )
    return _workspace_payload(current, versions)


def save_current_lead_brief(
    connection: Connection,
    *,
    workspace_id: str,
    opportunity_id: str,
    expected_revision_no: int,
    fields: dict[str, Any],
    user_id: str | None,
) -> dict[str, Any]:
    current = _current_or_conflict(
        connection,
        workspace_id=workspace_id,
        opportunity_id=opportunity_id,
        expected_revision_no=expected_revision_no,
    )
    now = _utc_now()
    updated = update_lead_brief_current(
        connection,
        workspace_id=workspace_id,
        opportunity_id=opportunity_id,
        expected_revision_no=expected_revision_no,
        values={
            "current_payload": {"fields": fields},
            "current_revision_no": expected_revision_no + 1,
            "updated_at": now,
            "updated_by_user_id": user_id,
        },
    )
    if updated is None:
        raise LeadBriefConflictError(
            current_revision_no=current["current_revision_no"],
            expected_revision_no=expected_revision_no,
            latest_version_no=current["latest_version_no"],
        )
    versions = list_lead_brief_versions(
        connection,
        workspace_id=workspace_id,
        opportunity_id=opportunity_id,
    )
    return _workspace_payload(updated, versions)


def save_version_lead_brief(
    connection: Connection,
    *,
    workspace_id: str,
    opportunity_id: str,
    expected_revision_no: int,
    fields: dict[str, Any],
    user_id: str | None,
) -> dict[str, Any]:
    current = _current_or_conflict(
        connection,
        workspace_id=workspace_id,
        opportunity_id=opportunity_id,
        expected_revision_no=expected_revision_no,
    )
    now = _utc_now()
    version_no = (current["latest_version_no"] or 0) + 1
    version = append_lead_brief_version(
        connection,
        record={
            "id": _new_id("lead_brief_version"),
            "lead_brief_id": current["id"],
            "workspace_id": workspace_id,
            "opportunity_id": opportunity_id,
            "version_no": version_no,
            "current_revision_no": current["current_revision_no"],
            "payload": {"fields": fields},
            "version_origin": "save_version",
            "saved_by_user_id": user_id,
            "saved_by_name": _get_saved_by_name(connection, user_id),
            "ai_call_id": current["last_ai_call_id"],
            "created_at": current["created_at"],
            "updated_at": current["updated_at"],
            "saved_at": now,
        },
    )
    if version is None:
        raise LeadBriefNotFoundError("Lead brief not found.")
    updated = update_lead_brief_latest_version(
        connection,
        workspace_id=workspace_id,
        opportunity_id=opportunity_id,
        latest_version_no=version_no,
        updated_at=now,
    )
    if updated is None:
        raise LeadBriefNotFoundError("Lead brief not found.")
    versions = list_lead_brief_versions(
        connection,
        workspace_id=workspace_id,
        opportunity_id=opportunity_id,
    )
    return _workspace_payload(updated, versions)


def get_lead_brief_version_detail(
    connection: Connection,
    *,
    workspace_id: str,
    opportunity_id: str,
    version_no: int,
) -> dict[str, Any]:
    version = get_lead_brief_version(
        connection,
        workspace_id=workspace_id,
        opportunity_id=opportunity_id,
        version_no=version_no,
    )
    if version is None:
        raise LeadBriefVersionNotFoundError("Lead brief version not found.")
    return {
        "version": _serialize_version(version),
    }


def restore_lead_brief_version(
    connection: Connection,
    *,
    workspace_id: str,
    opportunity_id: str,
    version_no: int,
    expected_revision_no: int,
    user_id: str | None,
) -> dict[str, Any]:
    current = _current_or_conflict(
        connection,
        workspace_id=workspace_id,
        opportunity_id=opportunity_id,
        expected_revision_no=expected_revision_no,
    )
    version = get_lead_brief_version(
        connection,
        workspace_id=workspace_id,
        opportunity_id=opportunity_id,
        version_no=version_no,
    )
    if version is None:
        raise LeadBriefVersionNotFoundError("Lead brief version not found.")
    now = _utc_now()
    restored = update_lead_brief_current(
        connection,
        workspace_id=workspace_id,
        opportunity_id=opportunity_id,
        expected_revision_no=expected_revision_no,
        values={
            "current_payload": version["payload"],
            "current_revision_no": expected_revision_no + 1,
            "latest_version_no": current["latest_version_no"] or version_no,
            "updated_at": now,
            "updated_by_user_id": user_id,
        },
    )
    if restored is None:
        raise LeadBriefConflictError(
            current_revision_no=current["current_revision_no"],
            expected_revision_no=expected_revision_no,
            latest_version_no=current["latest_version_no"],
        )
    versions = list_lead_brief_versions(
        connection,
        workspace_id=workspace_id,
        opportunity_id=opportunity_id,
    )
    return _workspace_payload(restored, versions)


def build_generate_handoff_payload(
    current: RowMapping[str, Any] | None,
) -> dict[str, Any]:
    if current is None:
        return {
            "opportunity_id": None,
            "current_resource_id": None,
            "current_revision_no": None,
            "latest_version_no": None,
        }
    return {
        "opportunity_id": current["opportunity_id"],
        "current_resource_id": current["id"],
        "current_revision_no": current["current_revision_no"],
        "latest_version_no": current["latest_version_no"],
    }


def get_opportunity_lead_brief(
    connection: Connection,
    *,
    workspace_id: str,
    opportunity_id: str,
) -> dict[str, Any]:
    opportunity = get_opportunity(
        connection,
        workspace_id=workspace_id,
        opportunity_id=opportunity_id,
    )
    if opportunity is None:
        raise LeadBriefNotFoundError("Lead brief not found.")
    return get_lead_brief_workspace(
        connection,
        workspace_id=workspace_id,
        opportunity_id=opportunity_id,
    )
