from __future__ import annotations

import secrets
from datetime import UTC, datetime
from typing import Any

from sqlalchemy import select
from sqlalchemy.engine import Connection, RowMapping

from app.account_models import users_table
from app.discovery_repository import (
    append_discovery_version,
    create_discovery_current,
    get_discovery_current,
    get_discovery_version,
    list_discovery_versions,
    update_discovery_current,
    update_discovery_latest_version,
)
from app.lead_brief_repository import get_lead_brief_current
from app.opportunity_repository import get_latest_input_by_type, get_opportunity


class DiscoveryNotFoundError(ValueError):
    pass


class DiscoveryConflictError(ValueError):
    def __init__(
        self,
        *,
        current_revision_no: int,
        expected_revision_no: int,
        latest_version_no: int | None,
    ) -> None:
        super().__init__("Discovery changed elsewhere.")
        self.current_revision_no = current_revision_no
        self.expected_revision_no = expected_revision_no
        self.latest_version_no = latest_version_no


class DiscoveryValidationError(ValueError):
    def __init__(
        self,
        message: str,
        *,
        field_key: str | None = None,
        state: str | None = None,
    ) -> None:
        super().__init__(message)
        self.field_key = field_key
        self.state = state


class DiscoveryVersionNotFoundError(ValueError):
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
    lead_brief: RowMapping[str, Any] | None,
) -> dict[str, dict[str, str | None]]:
    primary_excerpt = _excerpt(primary_input["content"] if primary_input else None)
    extracted_excerpt = _excerpt(extracted_input["content"] if extracted_input else None)
    lead_brief_payload = lead_brief["current_payload"] if lead_brief else {}
    lead_brief_fields = lead_brief_payload.get("fields", {}) if isinstance(lead_brief_payload, dict) else {}

    source_excerpt = primary_excerpt or extracted_excerpt
    if source_excerpt is None and isinstance(lead_brief_fields, dict):
        for field_key in ("business_context", "fit_assessment", "requested_service"):
            candidate = lead_brief_fields.get(field_key, {})
            if isinstance(candidate, dict) and _has_meaningful_text(candidate.get("value")):
                source_excerpt = _excerpt(str(candidate.get("value")))
                if source_excerpt:
                    break

    requested_service = opportunity["requested_service"]
    contact_value = _build_contact_value(opportunity)
    goals_value = (
        f"Use discovery to shape the proposal around {requested_service}."
        if _has_meaningful_text(requested_service)
        else "Use the available source material to frame a proposal-ready discovery direction."
    )
    constraints_value = (
        primary_excerpt
        or extracted_excerpt
        or "Preserve the current source constraints and delivery assumptions."
    )
    ambiguities_value = (
        "Budget owner, launch timing, and approval path still need confirmation."
    )
    risk_flags_value = (
        "Thin evidence can lead to overconfident scope framing."
    )
    follow_up_value = (
        "Who approves scope, budget, and launch timing before proposal drafting?"
    )

    return {
        "goals": {
            "value": goals_value,
            "state": "needs_review" if source_excerpt is None else "inferred",
            "source_excerpt": source_excerpt,
        },
        "constraints": {
            "value": constraints_value,
            "state": "needs_review" if source_excerpt is None else "confirmed",
            "source_excerpt": primary_excerpt or extracted_excerpt or source_excerpt,
        },
        "ambiguities": {
            "value": ambiguities_value,
            "state": "needs_review",
            "source_excerpt": lead_brief_fields.get("missing_information", {}).get("source_excerpt")
            if isinstance(lead_brief_fields, dict)
            else None,
        },
        "risk_flags": {
            "value": risk_flags_value,
            "state": "needs_review" if source_excerpt is None else "inferred",
            "source_excerpt": source_excerpt,
        },
        "follow_up_questions": {
            "value": follow_up_value,
            "state": "confirmed" if contact_value else "needs_review",
            "source_excerpt": contact_value,
        },
    }


def _build_placeholder_fields() -> dict[str, dict[str, str | None]]:
    placeholder_message = "Needs more evidence from the current source material."
    return {
        "goals": {
            "value": None,
            "state": "needs_review",
            "source_excerpt": None,
        },
        "constraints": {
            "value": None,
            "state": "needs_review",
            "source_excerpt": None,
        },
        "ambiguities": {
            "value": placeholder_message,
            "state": "needs_review",
            "source_excerpt": None,
        },
        "risk_flags": {
            "value": placeholder_message,
            "state": "needs_review",
            "source_excerpt": None,
        },
        "follow_up_questions": {
            "value": "What evidence is still missing to move this discovery forward?",
            "state": "needs_review",
            "source_excerpt": None,
        },
    }


def _build_source_profile(
    *,
    primary_input: RowMapping[str, Any] | None,
    extracted_input: RowMapping[str, Any] | None,
    lead_brief: RowMapping[str, Any] | None,
    source_notes: list[dict[str, Any]],
) -> tuple[int, list[str], str]:
    score = 0
    reasons: list[str] = []
    has_manual = False
    has_file = False

    if _has_meaningful_text(primary_input["content"] if primary_input else None):
        score += 1
        has_manual = True
        reasons.append("manual")

    if _has_meaningful_text(extracted_input["content"] if extracted_input else None):
        score += 1
        has_file = True
        reasons.append("file")

    if lead_brief is not None:
        payload = lead_brief["current_payload"] or {}
        fields = payload.get("fields", {}) if isinstance(payload, dict) else {}
        if any(
            isinstance(field_value, dict) and _has_meaningful_text(field_value.get("value"))
            for field_value in fields.values()
        ):
            score += 2
            has_manual = True
            reasons.append("manual")

    note_count = 0
    for note in source_notes:
        if _has_meaningful_text(note.get("content")):
            score += 1
            note_count += 1
            has_manual = True

    if has_manual and has_file:
        source_ready = "both"
    elif has_file:
        source_ready = "file"
    elif has_manual:
        source_ready = "manual"
    else:
        source_ready = "none"

    if note_count:
        reasons.extend(["manual"] * note_count)

    return score, reasons, source_ready


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
        "source_notes": payload.get("source_notes", []),
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
        "source_notes": payload.get("source_notes", []),
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
        "discovery": _serialize_current_resource(current),
        "versions": [_serialize_version(row) for row in versions],
    }


def _get_saved_by_name(connection: Connection, user_id: str | None) -> str | None:
    if user_id is None:
        return None
    result = connection.execute(select(users_table.c.full_name).where(users_table.c.id == user_id))
    row = result.mappings().first()
    if row is None:
        return None
    return row["full_name"]


def _current_or_conflict(
    connection: Connection,
    *,
    workspace_id: str,
    opportunity_id: str,
    expected_revision_no: int,
) -> RowMapping[str, Any]:
    current = get_discovery_current(
        connection,
        workspace_id=workspace_id,
        opportunity_id=opportunity_id,
    )
    if current is None:
        raise DiscoveryNotFoundError("Discovery not found.")
    if current["current_revision_no"] != expected_revision_no:
        raise DiscoveryConflictError(
            current_revision_no=current["current_revision_no"],
            expected_revision_no=expected_revision_no,
            latest_version_no=current["latest_version_no"],
        )
    return current


def _load_source_context(
    connection: Connection,
    *,
    workspace_id: str,
    opportunity_id: str,
) -> tuple[
    RowMapping[str, Any] | None,
    RowMapping[str, Any] | None,
    RowMapping[str, Any] | None,
    RowMapping[str, Any] | None,
]:
    opportunity = get_opportunity(
        connection,
        workspace_id=workspace_id,
        opportunity_id=opportunity_id,
    )
    if opportunity is None:
        return None, None, None, None
    primary_input = get_latest_input_by_type(
        connection,
        workspace_id=workspace_id,
        opportunity_id=opportunity_id,
        input_type="raw_input",
    )
    extracted_input = get_latest_input_by_type(
        connection,
        workspace_id=workspace_id,
        opportunity_id=opportunity_id,
        input_type="extracted_text",
    )
    lead_brief = get_lead_brief_current(
        connection,
        workspace_id=workspace_id,
        opportunity_id=opportunity_id,
    )
    return opportunity, primary_input, extracted_input, lead_brief


def _build_initial_source_notes(
    primary_input: RowMapping[str, Any] | None,
    extracted_input: RowMapping[str, Any] | None,
) -> list[dict[str, Any]]:
    notes: list[dict[str, Any]] = []
    if _has_meaningful_text(primary_input["content"] if primary_input else None):
        notes.append(
            {
                "content": str(primary_input["content"]),
                "source_label": primary_input["source_label"],
            }
        )
    if _has_meaningful_text(extracted_input["content"] if extracted_input else None):
        notes.append(
            {
                "content": str(extracted_input["content"]),
                "source_label": extracted_input["source_label"],
            }
        )
    return notes


def ensure_discovery_current(
    connection: Connection,
    *,
    workspace_id: str,
    opportunity_id: str,
    user_id: str | None,
) -> RowMapping[str, Any]:
    current = get_discovery_current(
        connection,
        workspace_id=workspace_id,
        opportunity_id=opportunity_id,
    )
    if current is not None:
        return current

    opportunity, primary_input, extracted_input, lead_brief = _load_source_context(
        connection,
        workspace_id=workspace_id,
        opportunity_id=opportunity_id,
    )
    if opportunity is None:
        raise DiscoveryNotFoundError("Discovery not found.")

    now = _utc_now()
    record = {
        "id": _new_id("discovery"),
        "workspace_id": workspace_id,
        "opportunity_id": opportunity_id,
        "current_payload": {
            "fields": _build_placeholder_fields(),
            "source_notes": _build_initial_source_notes(primary_input, extracted_input),
        },
        "current_revision_no": 1,
        "latest_version_no": None,
        "last_ai_call_id": None,
        "updated_by_user_id": user_id,
        "created_at": now,
        "updated_at": now,
    }
    created = create_discovery_current(connection, record=record)
    if created is None:
        raise DiscoveryNotFoundError("Discovery not found.")
    return created


def get_discovery_workspace(
    connection: Connection,
    *,
    workspace_id: str,
    opportunity_id: str,
    user_id: str | None = None,
) -> dict[str, Any]:
    ensure_discovery_current(
        connection,
        workspace_id=workspace_id,
        opportunity_id=opportunity_id,
        user_id=user_id,
    )
    current = get_discovery_current(
        connection,
        workspace_id=workspace_id,
        opportunity_id=opportunity_id,
    )
    versions = list_discovery_versions(
        connection,
        workspace_id=workspace_id,
        opportunity_id=opportunity_id,
    )
    return _workspace_payload(current, versions)


def _merge_source_notes(
    current: RowMapping[str, Any],
    source_notes: list[dict[str, Any]] | None,
) -> list[dict[str, Any]]:
    if source_notes is None:
        payload = current["current_payload"] or {}
        return list(payload.get("source_notes", []))
    return source_notes


def _validate_discovery_fields(fields: dict[str, Any]) -> None:
    for field_key in ("goals", "constraints", "ambiguities", "risk_flags", "follow_up_questions"):
        field = fields.get(field_key)
        if not isinstance(field, dict):
            raise DiscoveryValidationError(
                f"Discovery field '{field_key}' is missing or invalid.",
                field_key=field_key,
            )

        state = field.get("state")
        value = field.get("value")
        source_excerpt = field.get("source_excerpt")

        if state in {"confirmed", "inferred"}:
            if not _has_meaningful_text(value):
                raise DiscoveryValidationError(
                    f"Discovery field '{field_key}' must include a value when marked {state}.",
                    field_key=field_key,
                    state=state,
                )
            if not _has_meaningful_text(source_excerpt):
                raise DiscoveryValidationError(
                    f"Discovery field '{field_key}' must include source evidence when marked {state}.",
                    field_key=field_key,
                    state=state,
                )
        elif state == "missing":
            if _has_meaningful_text(value):
                raise DiscoveryValidationError(
                    f"Discovery field '{field_key}' cannot keep a value when marked missing.",
                    field_key=field_key,
                    state=state,
                )
        elif state == "needs_review":
            continue
        else:
            raise DiscoveryValidationError(
                f"Discovery field '{field_key}' has an unsupported state.",
                field_key=field_key,
                state=str(state) if state is not None else None,
            )


def save_current_discovery(
    connection: Connection,
    *,
    workspace_id: str,
    opportunity_id: str,
    expected_revision_no: int,
    fields: dict[str, Any],
    source_notes: list[dict[str, Any]] | None,
    user_id: str | None,
) -> dict[str, Any]:
    _validate_discovery_fields(fields)
    current = ensure_discovery_current(
        connection,
        workspace_id=workspace_id,
        opportunity_id=opportunity_id,
        user_id=user_id,
    )
    conflict_checked = _current_or_conflict(
        connection,
        workspace_id=workspace_id,
        opportunity_id=opportunity_id,
        expected_revision_no=expected_revision_no,
    )
    now = _utc_now()
    updated = update_discovery_current(
        connection,
        workspace_id=workspace_id,
        opportunity_id=opportunity_id,
        expected_revision_no=expected_revision_no,
        values={
            "current_payload": {
                "fields": fields,
                "source_notes": _merge_source_notes(conflict_checked, source_notes),
            },
            "current_revision_no": expected_revision_no + 1,
            "updated_at": now,
            "updated_by_user_id": user_id,
        },
    )
    if updated is None:
        latest = get_discovery_current(
            connection,
            workspace_id=workspace_id,
            opportunity_id=opportunity_id,
        )
        conflict_snapshot = latest or current
        raise DiscoveryConflictError(
            current_revision_no=conflict_snapshot["current_revision_no"],
            expected_revision_no=expected_revision_no,
            latest_version_no=conflict_snapshot["latest_version_no"],
        )
    versions = list_discovery_versions(
        connection,
        workspace_id=workspace_id,
        opportunity_id=opportunity_id,
    )
    return _workspace_payload(updated, versions)


def save_version_discovery(
    connection: Connection,
    *,
    workspace_id: str,
    opportunity_id: str,
    expected_revision_no: int,
    fields: dict[str, Any],
    source_notes: list[dict[str, Any]] | None,
    user_id: str | None,
) -> dict[str, Any]:
    _validate_discovery_fields(fields)
    current = ensure_discovery_current(
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
    now = _utc_now()
    version_no = (current["latest_version_no"] or 0) + 1
    version = append_discovery_version(
        connection,
        record={
            "id": _new_id("discovery_version"),
            "discovery_id": current["id"],
            "workspace_id": workspace_id,
            "opportunity_id": opportunity_id,
            "version_no": version_no,
            "current_revision_no": current["current_revision_no"],
            "payload": {
                "fields": fields,
                "source_notes": _merge_source_notes(current, source_notes),
            },
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
        raise DiscoveryNotFoundError("Discovery not found.")
    updated = update_discovery_latest_version(
        connection,
        workspace_id=workspace_id,
        opportunity_id=opportunity_id,
        latest_version_no=version_no,
        updated_at=now,
    )
    if updated is None:
        latest = get_discovery_current(
            connection,
            workspace_id=workspace_id,
            opportunity_id=opportunity_id,
        )
        conflict_snapshot = latest or current
        raise DiscoveryConflictError(
            current_revision_no=conflict_snapshot["current_revision_no"],
            expected_revision_no=expected_revision_no,
            latest_version_no=conflict_snapshot["latest_version_no"],
        )
    versions = list_discovery_versions(
        connection,
        workspace_id=workspace_id,
        opportunity_id=opportunity_id,
    )
    return _workspace_payload(updated, versions)


def get_discovery_version_detail(
    connection: Connection,
    *,
    workspace_id: str,
    opportunity_id: str,
    version_no: int,
) -> dict[str, Any]:
    version = get_discovery_version(
        connection,
        workspace_id=workspace_id,
        opportunity_id=opportunity_id,
        version_no=version_no,
    )
    if version is None:
        raise DiscoveryVersionNotFoundError("Discovery version not found.")
    return {
        "version": _serialize_version(version),
    }


def restore_discovery_version(
    connection: Connection,
    *,
    workspace_id: str,
    opportunity_id: str,
    version_no: int,
    expected_revision_no: int,
    user_id: str | None,
) -> dict[str, Any]:
    current = ensure_discovery_current(
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
    version = get_discovery_version(
        connection,
        workspace_id=workspace_id,
        opportunity_id=opportunity_id,
        version_no=version_no,
    )
    if version is None:
        raise DiscoveryVersionNotFoundError("Discovery version not found.")
    now = _utc_now()
    restored = update_discovery_current(
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
        latest = get_discovery_current(
            connection,
            workspace_id=workspace_id,
            opportunity_id=opportunity_id,
        )
        conflict_snapshot = latest or current
        raise DiscoveryConflictError(
            current_revision_no=conflict_snapshot["current_revision_no"],
            expected_revision_no=expected_revision_no,
            latest_version_no=conflict_snapshot["latest_version_no"],
        )
    versions = list_discovery_versions(
        connection,
        workspace_id=workspace_id,
        opportunity_id=opportunity_id,
    )
    return _workspace_payload(restored, versions)


def build_discovery_generation_gate(
    connection: Connection,
    *,
    workspace_id: str,
    opportunity_id: str,
    source_notes: list[dict[str, Any]] | None = None,
) -> dict[str, Any]:
    current = ensure_discovery_current(
        connection,
        workspace_id=workspace_id,
        opportunity_id=opportunity_id,
        user_id=None,
    )
    opportunity, primary_input, extracted_input, lead_brief = _load_source_context(
        connection,
        workspace_id=workspace_id,
        opportunity_id=opportunity_id,
    )
    if opportunity is None:
        return {
            "can_generate": False,
            "reasons": ["missing_source"],
            "primary_reason": "missing_source",
            "message": "Needs more evidence",
            "source_ready": "none",
        }

    payload = current["current_payload"] or {}
    current_source_notes = payload.get("source_notes", []) if isinstance(payload, dict) else []
    effective_source_notes = source_notes if source_notes is not None else list(current_source_notes)
    score, reasons, source_ready = _build_source_profile(
        primary_input=primary_input,
        extracted_input=extracted_input,
        lead_brief=lead_brief,
        source_notes=list(effective_source_notes),
    )

    if score < 2:
        primary_reason = "missing_source" if score == 0 else "missing_fields"
        return {
            "can_generate": False,
            "reasons": [primary_reason],
            "primary_reason": primary_reason,
            "message": "Needs more evidence",
            "source_ready": source_ready,
        }

    return {
        "can_generate": True,
        "reasons": [],
        "primary_reason": None,
        "message": "Ready to generate discovery.",
        "source_ready": source_ready,
    }


def generate_discovery(
    connection: Connection,
    *,
    workspace_id: str,
    opportunity_id: str,
    user_id: str | None,
    source_notes: list[dict[str, Any]] | None = None,
) -> dict[str, Any]:
    current = ensure_discovery_current(
        connection,
        workspace_id=workspace_id,
        opportunity_id=opportunity_id,
        user_id=user_id,
    )
    gate = build_discovery_generation_gate(
        connection,
        workspace_id=workspace_id,
        opportunity_id=opportunity_id,
        source_notes=source_notes,
    )
    if gate["can_generate"]:
        opportunity, primary_input, extracted_input, lead_brief = _load_source_context(
            connection,
            workspace_id=workspace_id,
            opportunity_id=opportunity_id,
        )
        payload = current["current_payload"] or {}
        current_source_notes = payload.get("source_notes", []) if isinstance(payload, dict) else []
        effective_source_notes = source_notes if source_notes is not None else list(current_source_notes)
        generated_fields = _build_initial_fields(
            opportunity,
            primary_input=primary_input,
            extracted_input=extracted_input,
            lead_brief=lead_brief,
        )
        generated_source_notes = _merge_source_notes(current, list(effective_source_notes))
        save_current_discovery(
            connection,
            workspace_id=workspace_id,
            opportunity_id=opportunity_id,
            expected_revision_no=current["current_revision_no"],
            fields=generated_fields,
            source_notes=generated_source_notes,
            user_id=user_id,
        )
    return {
        "opportunity_id": opportunity_id,
        "redirect_to": f"/opportunities/{opportunity_id}/discovery",
        "generation_started_at": _utc_now().isoformat(),
        "gate": gate,
    }
