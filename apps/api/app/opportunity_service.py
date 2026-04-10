from __future__ import annotations

import re
import secrets
from datetime import UTC, datetime
from typing import Any

from sqlalchemy.engine import Connection, RowMapping

from app.account_models import workspaces_table
from app.account_service import SessionRecord
from app.file_processing_runtime import ObjectStore, extract_text_from_pdf_bytes
from app.opportunity_repository import (
    InvalidOpportunityCursor,
    count_opportunities,
    count_needs_attention_opportunities,
    create_opportunity as create_opportunity_record,
    create_file_asset as create_file_asset_record,
    create_file_processing_job as create_file_processing_job_record,
    create_opportunity_input as create_opportunity_input_record,
    get_file_asset,
    get_latest_file_asset,
    get_latest_file_processing_job,
    get_opportunity,
    get_latest_input_by_type,
    get_opportunity_input,
    list_needs_attention_opportunities,
    list_opportunity_inputs,
    list_pending_file_processing_jobs,
    update_file_asset as update_file_asset_record,
    update_file_processing_job as update_file_processing_job_record,
    list_recent_opportunities,
    list_opportunities as list_opportunity_rows,
    set_archive_state,
    update_opportunity_context,
    update_opportunity_input as update_opportunity_input_record,
)


class WorkspaceRestrictionError(PermissionError):
    pass


class OpportunityCursorError(ValueError):
    pass


class OpportunityValidationError(ValueError):
    pass


STEP_LABELS = {
    "overview": "Lead Intake",
    "lead_brief": "Lead Brief",
    "discovery": "Discovery",
    "proposal_draft": "Proposal Draft",
    "follow_up": "Follow-up",
}
WORKFLOW_STEPS = [
    "Lead Intake",
    "Lead Brief",
    "Discovery",
    "Proposal Draft",
    "Follow-up",
]
EMAIL_PATTERN = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
DEFAULT_SAVE_STATE = {
    "status": "saved",
    "label": "Saved just now",
}


def _utc_now() -> datetime:
    return datetime.now(UTC)


def _new_id(prefix: str) -> str:
    return f"{prefix}_{secrets.token_urlsafe(12)}"


def _has_meaningful_text(value: str | None) -> bool:
    return bool(value and value.strip())


def _serialize_input(row: RowMapping[str, Any] | None) -> dict[str, Any] | None:
    if row is None:
        return None
    return {
        "id": row["id"],
        "opportunity_id": row["opportunity_id"],
        "input_type": row["input_type"],
        "content": row["content"],
        "source_label": row["source_label"],
        "created_at": row["created_at"].isoformat(),
        "updated_at": row["updated_at"].isoformat(),
    }


def _serialize_file_summary(row: RowMapping[str, Any] | None) -> dict[str, Any] | None:
    if row is None or row["file_status"] is None:
        return None
    return {
        "id": row["id"],
        "status": row["file_status"],
        "source_label": row["source_label"],
        "extracted_text": row["content"] if _has_meaningful_text(row["content"]) else None,
        "updated_at": row["updated_at"].isoformat(),
    }


def _build_generation_gate(
    row: RowMapping[str, Any],
    *,
    primary_input: RowMapping[str, Any] | None,
    extracted_input: RowMapping[str, Any] | None,
    save_state: dict[str, str] | None = None,
) -> dict[str, Any]:
    if save_state is not None and save_state.get("status") == "failed":
        return {
            "can_generate": False,
            "reason": "save_failed",
            "detail": "We couldn't save the latest intake changes. Retry save before generating the lead brief.",
        }

    required_fields = (
        row["title"],
        row["company_name"],
        row["requested_service"],
    )
    if any(not _has_meaningful_text(value) for value in required_fields):
        return {
            "can_generate": False,
            "reason": "missing_fields",
            "detail": "Add the core opportunity details before generating the lead brief.",
        }

    has_manual_source = _has_meaningful_text(primary_input["content"] if primary_input else None)
    file_status = extracted_input["file_status"] if extracted_input else None
    has_file_source = (
        extracted_input is not None
        and file_status == "ready"
        and _has_meaningful_text(extracted_input["content"])
    )

    if has_manual_source or has_file_source:
        return {
            "can_generate": True,
            "reason": None,
            "detail": "Ready to generate the lead brief.",
        }

    if file_status in {"uploaded", "processing"}:
        return {
            "can_generate": False,
            "reason": "file_processing",
            "detail": "Your PDF is still processing. You can wait for extraction or add manual source notes now.",
        }

    return {
        "can_generate": False,
        "reason": "missing_source",
        "detail": "Add raw source notes or wait for extracted text before generating the lead brief.",
    }


def _serialize_workflow(
    row: RowMapping[str, Any],
    workspace: RowMapping[str, Any] | None,
) -> dict[str, Any]:
    current_step = resolve_current_step(row["status"])
    restricted, restriction_reason = is_workspace_restricted(workspace)
    return {
        "current_step": {
            "key": current_step,
            "label": STEP_LABELS[current_step],
        },
        "steps": WORKFLOW_STEPS,
        "step_readiness": resolve_step_readiness(row, workspace),
        "restriction_context": {
            "is_restricted": restricted,
            "restriction_reason": restriction_reason,
        },
    }


def _serialize_minimum_context(row: RowMapping[str, Any]) -> dict[str, Any]:
    return {
        "owner": {
            "user_id": row["owner_user_id"],
            "name": row["owner_name"],
        },
        "fields": {
            "title": row["title"],
            "company_name": row["company_name"],
            "contact_name": row["contact_name"],
            "contact_email": row["contact_email"],
            "requested_service": row["requested_service"],
            "source_type": row["source_type"],
        },
    }


def _serialize_workspace(row: RowMapping[str, Any]) -> dict[str, Any]:
    return {
        "eyebrow": "Opportunity intake",
        "opportunity_id": row["id"],
    }


def _build_detail_payload(
    row: RowMapping[str, Any],
    workspace: RowMapping[str, Any] | None,
    *,
    primary_input: RowMapping[str, Any] | None,
    extracted_input: RowMapping[str, Any] | None,
    latest_file_asset: RowMapping[str, Any] | None,
    latest_file_job: RowMapping[str, Any] | None,
    save_state: dict[str, str] | None = None,
) -> dict[str, Any]:
    return {
        "opportunity": serialize_opportunity(row, workspace),
        "workspace": _serialize_workspace(row),
        "workflow": _serialize_workflow(row, workspace),
        "minimum_context": _serialize_minimum_context(row),
        "intake": {
            "primary_input": _serialize_input(primary_input),
            "latest_file": _serialize_file_asset(latest_file_asset, latest_file_job),
            "generation_gate": _build_generation_gate(
                row,
                primary_input=primary_input,
                extracted_input=extracted_input,
                save_state=save_state,
            ),
        },
        "save_state": save_state or DEFAULT_SAVE_STATE,
    }


def _get_intake_rows(
    connection: Connection,
    *,
    workspace_id: str,
    opportunity_id: str,
) -> tuple[RowMapping[str, Any] | None, RowMapping[str, Any] | None]:
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
    return primary_input, extracted_input


def _get_latest_file_context(
    connection: Connection,
    *,
    workspace_id: str,
    opportunity_id: str,
) -> tuple[RowMapping[str, Any] | None, RowMapping[str, Any] | None]:
    latest_file = get_latest_file_asset(
        connection,
        workspace_id=workspace_id,
        opportunity_id=opportunity_id,
    )
    if latest_file is None:
        return None, None
    latest_job = get_latest_file_processing_job(
        connection,
        workspace_id=workspace_id,
        opportunity_id=opportunity_id,
        file_asset_id=latest_file["id"],
    )
    return latest_file, latest_job


def _normalize_optional_text(value: str | None) -> str | None:
    if value is None:
        return None
    stripped = value.strip()
    return stripped or None


def _validate_contact_email(contact_email: str | None) -> str | None:
    normalized = _normalize_optional_text(contact_email)
    if normalized is None:
        return None
    if not EMAIL_PATTERN.match(normalized):
        raise OpportunityValidationError("Contact email must be a valid email address when provided.")
    return normalized


def get_workspace_snapshot(connection: Connection, workspace_id: str) -> RowMapping[str, Any] | None:
    return connection.execute(
        workspaces_table.select().where(workspaces_table.c.id == workspace_id)
    ).mappings().first()


def is_workspace_restricted(workspace: RowMapping[str, Any] | None) -> tuple[bool, str | None]:
    if workspace is None:
        return True, "workspace_missing"
    if workspace["trial_status"] == "trial_expired":
        return True, "trial_expired"
    if workspace["billing_status"] in {"past_due", "canceled", "inactive"}:
        return True, workspace["billing_status"]
    return False, None


def resolve_current_step(status: str) -> str:
    if status in {"lead_brief_generated"}:
        return "lead_brief"
    if status in {"discovery_added", "discovery_reviewed"}:
        return "discovery"
    if status in {"proposal_draft_generated", "proposal_in_review", "proposal_ready"}:
        return "proposal_draft"
    if status == "follow_up_drafted":
        return "follow_up"
    return "overview"


def build_current_step_url(opportunity_id: str, current_step: str) -> str:
    return f"/opportunities/{opportunity_id}/{current_step}"


def resolve_attention_reason(
    row: RowMapping[str, Any],
    workspace: RowMapping[str, Any] | None,
) -> str | None:
    restricted, _ = is_workspace_restricted(workspace)
    if restricted:
        return "billing_restricted"
    if row["status"] == "proposal_in_review":
        return "review_required"
    if not row["requested_service"]:
        return "missing_input"
    return None


def resolve_workflow_state(status: str, attention_reason: str | None) -> str:
    if status == "archived":
        return "completed"
    if attention_reason is not None:
        return "needs_attention"
    if status == "new":
        return "not_started"
    if status in {"proposal_ready", "follow_up_drafted"}:
        return "completed"
    return "in_progress"


def resolve_step_readiness(
    row: RowMapping[str, Any],
    workspace: RowMapping[str, Any] | None,
) -> str:
    restricted, _ = is_workspace_restricted(workspace)
    if row["archived_at"] is not None or row["status"] in {"proposal_ready", "follow_up_drafted"}:
        return "completed"
    if restricted:
        return "blocked"
    if row["status"] == "new":
        return "not_started"
    return "ready"


def serialize_opportunity(
    row: RowMapping[str, Any],
    workspace: RowMapping[str, Any] | None,
) -> dict[str, Any]:
    current_step = resolve_current_step(row["status"])
    attention_reason = resolve_attention_reason(row, workspace)
    restricted, restriction_reason = is_workspace_restricted(workspace)
    return {
        "id": row["id"],
        "workspace_id": row["workspace_id"],
        "owner_user_id": row["owner_user_id"],
        "owner_name": row["owner_name"],
        "title": row["title"],
        "company_name": row["company_name"],
        "requested_service": row["requested_service"],
        "source_type": row["source_type"],
        "status": row["status"],
        "current_step": current_step,
        "current_step_url": build_current_step_url(row["id"], current_step),
        "workflow_state": resolve_workflow_state(row["status"], attention_reason),
        "needs_attention_reason": attention_reason,
        "restriction_reason": restriction_reason,
        "archived_at": row["archived_at"].isoformat() if row["archived_at"] else None,
        "created_at": row["created_at"].isoformat(),
        "updated_at": row["updated_at"].isoformat(),
        "step_readiness": resolve_step_readiness(row, workspace),
    }


def create_opportunity(
    connection: Connection,
    *,
    session: SessionRecord,
    payload: dict[str, Any],
) -> dict[str, Any]:
    workspace = get_workspace_snapshot(connection, session.workspace_id or "")
    restricted, _ = is_workspace_restricted(workspace)
    if restricted:
        raise WorkspaceRestrictionError("Workspace billing is restricted. Review billing to create new work.")

    now = _utc_now()
    record = {
        "id": _new_id("opp"),
        "workspace_id": session.workspace_id,
        "owner_user_id": session.user_id,
        "title": payload["title"],
        "source_type": payload.get("source_type", "manual"),
        "company_name": payload["company_name"],
        "contact_name": None,
        "contact_email": None,
        "requested_service": payload.get("requested_service") or None,
        "status": "new",
        "status_before_archive": None,
        "archived_at": None,
        "created_at": now,
        "updated_at": now,
    }
    row = create_opportunity_record(connection, record=record)
    serialized = serialize_opportunity(row, workspace)
    return {
        "opportunity": serialized,
        "redirect_to": serialized["current_step_url"],
    }


def list_opportunities(
    connection: Connection,
    *,
    session: SessionRecord,
    q: str | None,
    status: str | None,
    archived: bool | None,
    limit: int,
    cursor: str | None,
    order_by: str,
    order_direction: str,
) -> dict[str, Any]:
    workspace = get_workspace_snapshot(connection, session.workspace_id or "")
    try:
        rows, next_cursor = list_opportunity_rows(
            connection,
            workspace_id=session.workspace_id or "",
            q=q,
            status=status,
            archived=archived,
            limit=limit,
            cursor=cursor,
            order_by=order_by,
            order_direction=order_direction,
        )
    except InvalidOpportunityCursor as error:
        raise OpportunityCursorError("Invalid opportunity cursor.") from error
    return {
        "items": [serialize_opportunity(row, workspace) for row in rows],
        "next_cursor": next_cursor,
    }


def get_opportunity_detail(
    connection: Connection,
    *,
    session: SessionRecord,
    opportunity_id: str,
) -> dict[str, Any] | None:
    row = get_opportunity(
        connection,
        workspace_id=session.workspace_id or "",
        opportunity_id=opportunity_id,
    )
    if row is None:
        return None
    workspace = get_workspace_snapshot(connection, session.workspace_id or "")
    primary_input, extracted_input = _get_intake_rows(
        connection,
        workspace_id=session.workspace_id or "",
        opportunity_id=opportunity_id,
    )
    latest_file_asset, latest_file_job = _get_latest_file_context(
        connection,
        workspace_id=session.workspace_id or "",
        opportunity_id=opportunity_id,
    )
    return _build_detail_payload(
        row,
        workspace,
        primary_input=primary_input,
        extracted_input=extracted_input,
        latest_file_asset=latest_file_asset,
        latest_file_job=latest_file_job,
    )


def update_archive_state(
    connection: Connection,
    *,
    session: SessionRecord,
    opportunity_id: str,
    archived: bool,
) -> dict[str, Any] | None:
    now = _utc_now()
    current = get_opportunity(
        connection,
        workspace_id=session.workspace_id or "",
        opportunity_id=opportunity_id,
    )
    if current is None:
        return None
    if archived == (current["archived_at"] is not None):
        workspace = get_workspace_snapshot(connection, session.workspace_id or "")
        return serialize_opportunity(current, workspace)

    next_status = "archived" if archived else current["status_before_archive"] or "new"
    next_status_before_archive = current["status"] if archived else None
    row = set_archive_state(
        connection,
        workspace_id=session.workspace_id or "",
        opportunity_id=opportunity_id,
        status=next_status,
        status_before_archive=next_status_before_archive,
        archived_at=now if archived else None,
        updated_at=now,
    )
    if row is None:
        return None
    workspace = get_workspace_snapshot(connection, session.workspace_id or "")
    return serialize_opportunity(row, workspace)


def summarize_workspace_counts(connection: Connection, *, session: SessionRecord) -> dict[str, int]:
    workspace = get_workspace_snapshot(connection, session.workspace_id or "")
    restricted, _ = is_workspace_restricted(workspace)
    attention_count = count_needs_attention_opportunities(
        connection,
        workspace_id=session.workspace_id or "",
        restricted=restricted,
    )
    counts = count_opportunities(connection, workspace_id=session.workspace_id or "")
    counts["needs_attention"] = attention_count
    return counts


def update_opportunity_overview(
    connection: Connection,
    *,
    session: SessionRecord,
    opportunity_id: str,
    payload: dict[str, Any],
) -> dict[str, Any] | None:
    current = get_opportunity(
        connection,
        workspace_id=session.workspace_id or "",
        opportunity_id=opportunity_id,
    )
    if current is None:
        return None

    now = _utc_now()
    values = {
        "title": payload["title"].strip(),
        "company_name": payload["company_name"].strip(),
        "contact_name": _normalize_optional_text(payload.get("contact_name")),
        "contact_email": _validate_contact_email(payload.get("contact_email")),
        "requested_service": _normalize_optional_text(payload.get("requested_service")),
        "source_type": payload.get("source_type") or current["source_type"],
        "updated_at": now,
    }
    row = update_opportunity_context(
        connection,
        workspace_id=session.workspace_id or "",
        opportunity_id=opportunity_id,
        values=values,
    )
    if row is None:
        return None

    raw_input = payload.get("raw_input")
    if raw_input is not None:
        existing_primary = get_latest_input_by_type(
            connection,
            workspace_id=session.workspace_id or "",
            opportunity_id=opportunity_id,
            input_type="raw_input",
        )
        raw_values = {
            "content": raw_input,
            "source_label": "overview notes",
            "file_status": None,
            "updated_at": now,
        }
        if existing_primary is None:
            create_opportunity_input_record(
                connection,
                record={
                    "id": _new_id("input"),
                    "workspace_id": session.workspace_id or "",
                    "opportunity_id": opportunity_id,
                    "input_type": "raw_input",
                    "content": raw_input,
                    "source_label": "overview notes",
                    "file_status": None,
                    "created_at": now,
                    "updated_at": now,
                },
            )
        else:
            update_opportunity_input_record(
                connection,
                workspace_id=session.workspace_id or "",
                opportunity_id=opportunity_id,
                input_id=existing_primary["id"],
                values=raw_values,
            )

    file_gate = payload.get("file_gate")
    if file_gate is not None:
        existing_extracted = get_latest_input_by_type(
            connection,
            workspace_id=session.workspace_id or "",
            opportunity_id=opportunity_id,
            input_type="extracted_text",
        )
        extracted_content = file_gate.get("content") or ""
        extracted_values = {
            "content": extracted_content,
            "source_label": "pdf extraction",
            "file_status": file_gate.get("file_status"),
            "updated_at": now,
        }
        if existing_extracted is None:
            create_opportunity_input_record(
                connection,
                record={
                    "id": _new_id("input"),
                    "workspace_id": session.workspace_id or "",
                    "opportunity_id": opportunity_id,
                    "input_type": "extracted_text",
                    "content": extracted_content,
                    "source_label": "pdf extraction",
                    "file_status": file_gate.get("file_status"),
                    "created_at": now,
                    "updated_at": now,
                },
            )
        else:
            update_opportunity_input_record(
                connection,
                workspace_id=session.workspace_id or "",
                opportunity_id=opportunity_id,
                input_id=existing_extracted["id"],
                values=extracted_values,
            )

    workspace = get_workspace_snapshot(connection, session.workspace_id or "")
    primary_input, extracted_input = _get_intake_rows(
        connection,
        workspace_id=session.workspace_id or "",
        opportunity_id=opportunity_id,
    )
    latest_file_asset, latest_file_job = _get_latest_file_context(
        connection,
        workspace_id=session.workspace_id or "",
        opportunity_id=opportunity_id,
    )
    refreshed = get_opportunity(
        connection,
        workspace_id=session.workspace_id or "",
        opportunity_id=opportunity_id,
    )
    if refreshed is None:
        return None
    return _build_detail_payload(
        refreshed,
        workspace,
        primary_input=primary_input,
        extracted_input=extracted_input,
        latest_file_asset=latest_file_asset,
        latest_file_job=latest_file_job,
        save_state=DEFAULT_SAVE_STATE,
    )


def list_inputs(
    connection: Connection,
    *,
    session: SessionRecord,
    opportunity_id: str,
) -> dict[str, Any] | None:
    row = get_opportunity(
        connection,
        workspace_id=session.workspace_id or "",
        opportunity_id=opportunity_id,
    )
    if row is None:
        return None
    rows = list_opportunity_inputs(
        connection,
        workspace_id=session.workspace_id or "",
        opportunity_id=opportunity_id,
    )
    primary_input = next((item for item in reversed(rows) if item["input_type"] == "raw_input"), None)
    return {
        "items": [_serialize_input(item) for item in rows],
        "primary_input_id": primary_input["id"] if primary_input else None,
        "allowed_input_types": ["raw_input", "extracted_text"],
    }


def create_input(
    connection: Connection,
    *,
    session: SessionRecord,
    opportunity_id: str,
    payload: dict[str, Any],
) -> dict[str, Any] | None:
    row = get_opportunity(
        connection,
        workspace_id=session.workspace_id or "",
        opportunity_id=opportunity_id,
    )
    if row is None:
        return None

    now = _utc_now()
    created = create_opportunity_input_record(
        connection,
        record={
            "id": _new_id("input"),
            "workspace_id": session.workspace_id or "",
            "opportunity_id": opportunity_id,
            "input_type": payload["input_type"],
            "content": payload["content"],
            "source_label": _normalize_optional_text(payload.get("source_label")),
            "file_status": payload.get("file_status"),
            "created_at": now,
            "updated_at": now,
        },
    )
    if created is None:
        return None
    return {"input": _serialize_input(created)}


def update_input(
    connection: Connection,
    *,
    session: SessionRecord,
    opportunity_id: str,
    input_id: str,
    payload: dict[str, Any],
) -> dict[str, Any] | None:
    row = get_opportunity_input(
        connection,
        workspace_id=session.workspace_id or "",
        opportunity_id=opportunity_id,
        input_id=input_id,
    )
    if row is None:
        return None

    values = {
        "updated_at": _utc_now(),
    }
    if "content" in payload:
        values["content"] = payload["content"]
    if "source_label" in payload:
        values["source_label"] = _normalize_optional_text(payload.get("source_label"))
    updated = update_opportunity_input_record(
        connection,
        workspace_id=session.workspace_id or "",
        opportunity_id=opportunity_id,
        input_id=input_id,
        values=values,
    )
    if updated is None:
        return None
    return {"input": _serialize_input(updated)}


def generate_lead_brief(
    connection: Connection,
    *,
    session: SessionRecord,
    opportunity_id: str,
) -> tuple[dict[str, Any], int] | None:
    row = get_opportunity(
        connection,
        workspace_id=session.workspace_id or "",
        opportunity_id=opportunity_id,
    )
    if row is None:
        return None

    primary_input, extracted_input = _get_intake_rows(
        connection,
        workspace_id=session.workspace_id or "",
        opportunity_id=opportunity_id,
    )
    gate = _build_generation_gate(
        row,
        primary_input=primary_input,
        extracted_input=extracted_input,
    )
    if not gate["can_generate"]:
        return {
            "error": {
                "code": "LEAD_BRIEF_REQUIRED",
                "message": "Lead brief generation is blocked.",
                "details": {
                    "reason": gate["reason"],
                    "detail": gate["detail"],
                },
                "restriction_reason": None,
            }
        }, 409

    now = _utc_now()
    updated = update_opportunity_context(
        connection,
        workspace_id=session.workspace_id or "",
        opportunity_id=opportunity_id,
        values={
            "status": "lead_brief_generated",
            "updated_at": now,
        },
    )
    if updated is None:
        return None
    return {
        "status": "queued",
        "redirect_to": f"/opportunities/{opportunity_id}/lead-brief",
        "lead_brief": {
            "opportunity_id": opportunity_id,
            "generation_started_at": now.isoformat(),
        },
        "gate": gate,
    }, 202


def _serialize_file_job(row: RowMapping[str, Any] | None) -> dict[str, Any] | None:
    if row is None:
        return None
    return {
        "id": row["id"],
        "file_asset_id": row["file_asset_id"],
        "status": row["status"],
        "attempt_number": row["attempt_number"],
        "error_message": row["error_message"],
        "queued_at": row["queued_at"].isoformat() if row["queued_at"] else None,
        "started_at": row["started_at"].isoformat() if row["started_at"] else None,
        "completed_at": row["completed_at"].isoformat() if row["completed_at"] else None,
    }


def _serialize_file_asset(
    row: RowMapping[str, Any] | None,
    latest_job: RowMapping[str, Any] | None,
) -> dict[str, Any] | None:
    if row is None:
        return None
    return {
        "id": row["id"],
        "opportunity_id": row["opportunity_id"],
        "file_name": row["file_name"],
        "mime_type": row["mime_type"],
        "storage_key": row["storage_key"],
        "file_status": row["file_status"],
        "latest_job_status": latest_job["status"] if latest_job is not None else None,
        "uploaded_at": row["uploaded_at"].isoformat() if row["uploaded_at"] else None,
        "extracted_text": row["extracted_text"],
        "latest_job": _serialize_file_job(latest_job),
        "created_at": row["created_at"].isoformat(),
        "updated_at": row["updated_at"].isoformat(),
    }


def _build_file_detail_response(
    file_asset: RowMapping[str, Any] | None,
    latest_job: RowMapping[str, Any] | None,
) -> dict[str, Any] | None:
    if file_asset is None:
        return None

    next_action_label = None
    if file_asset["file_status"] == "failed" or (
        latest_job is not None and latest_job["status"] == "failed"
    ):
        next_action_label = "Retry extraction"
    elif file_asset["file_status"] == "processing":
        next_action_label = "Processing your PDF. Keep editing raw input while extraction runs."

    return {
        "file": _serialize_file_asset(file_asset, latest_job),
        "latest_job": _serialize_file_job(latest_job),
        "next_action_label": next_action_label,
    }


def _next_file_attempt_number(
    connection: Connection,
    *,
    workspace_id: str,
    opportunity_id: str,
    file_asset_id: str,
) -> int:
    jobs = get_latest_file_processing_job(
        connection,
        workspace_id=workspace_id,
        opportunity_id=opportunity_id,
        file_asset_id=file_asset_id,
    )
    if jobs is None:
        return 1
    return int(jobs["attempt_number"]) + 1


def _sync_extracted_input(
    connection: Connection,
    *,
    workspace_id: str,
    opportunity_id: str,
    content: str | None,
    file_status: str,
    updated_at: datetime,
) -> None:
    existing_extracted = get_latest_input_by_type(
        connection,
        workspace_id=workspace_id,
        opportunity_id=opportunity_id,
        input_type="extracted_text",
    )
    values = {
        "content": content or "",
        "source_label": "pdf extraction",
        "file_status": file_status,
        "updated_at": updated_at,
    }
    if existing_extracted is None:
        create_opportunity_input_record(
            connection,
            record={
                "id": _new_id("input"),
                "workspace_id": workspace_id,
                "opportunity_id": opportunity_id,
                "input_type": "extracted_text",
                "content": content or "",
                "source_label": "pdf extraction",
                "file_status": file_status,
                "created_at": updated_at,
                "updated_at": updated_at,
            },
        )
        return

    update_opportunity_input_record(
        connection,
        workspace_id=workspace_id,
        opportunity_id=opportunity_id,
        input_id=existing_extracted["id"],
        values=values,
    )


def _finalize_file_processing(
    connection: Connection,
    *,
    workspace_id: str,
    opportunity_id: str,
    file_asset_id: str,
    latest_job: RowMapping[str, Any],
    extracted_text: str | None,
    status: str,
    error_message: str | None,
    started_at: datetime,
    completed_at: datetime,
) -> dict[str, Any] | None:
    updated_file = update_file_asset_record(
        connection,
        workspace_id=workspace_id,
        opportunity_id=opportunity_id,
        file_asset_id=file_asset_id,
        values={
            "file_status": status,
            "extracted_text": extracted_text,
            "error_message": error_message,
            "updated_at": completed_at,
        },
    )
    _sync_extracted_input(
        connection,
        workspace_id=workspace_id,
        opportunity_id=opportunity_id,
        content=extracted_text or "",
        file_status=status,
        updated_at=completed_at,
    )
    updated_job = update_file_processing_job_record(
        connection,
        workspace_id=workspace_id,
        opportunity_id=opportunity_id,
        file_asset_id=file_asset_id,
        attempt_number=int(latest_job["attempt_number"]),
        values={
            "status": status,
            "error_message": error_message,
            "queued_at": latest_job["queued_at"] or started_at,
            "started_at": latest_job["started_at"] or started_at,
            "completed_at": completed_at,
            "updated_at": completed_at,
        },
    )
    return _build_file_detail_response(updated_file, updated_job)


def process_file_upload(
    connection: Connection,
    *,
    workspace_id: str,
    opportunity_id: str,
    file_asset_id: str,
    object_store: ObjectStore,
) -> dict[str, Any] | None:
    file_asset = get_file_asset(
        connection,
        workspace_id=workspace_id,
        opportunity_id=opportunity_id,
        file_asset_id=file_asset_id,
    )
    if file_asset is None:
        return None

    latest_job = get_latest_file_processing_job(
        connection,
        workspace_id=workspace_id,
        opportunity_id=opportunity_id,
        file_asset_id=file_asset_id,
    )
    if latest_job is None:
        return None

    if latest_job["status"] in {"ready", "failed"}:
        return _build_file_detail_response(file_asset, latest_job)

    now = _utc_now()
    try:
        payload = object_store.get_bytes(file_asset["storage_key"])
        extracted_text = extract_text_from_pdf_bytes(payload)
    except Exception as error:
        return _finalize_file_processing(
            connection,
            workspace_id=workspace_id,
            opportunity_id=opportunity_id,
            file_asset_id=file_asset_id,
            latest_job=latest_job,
            extracted_text=None,
            status="failed",
            error_message=str(error),
            started_at=latest_job["started_at"] or now,
            completed_at=now,
        )

    return _finalize_file_processing(
        connection,
        workspace_id=workspace_id,
        opportunity_id=opportunity_id,
        file_asset_id=file_asset_id,
        latest_job=latest_job,
        extracted_text=extracted_text,
        status="ready",
        error_message=None,
        started_at=latest_job["started_at"] or now,
        completed_at=now,
    )


def create_file_upload_url(
    connection: Connection,
    *,
    session: SessionRecord,
    opportunity_id: str,
    payload: dict[str, Any],
) -> dict[str, Any] | None:
    row = get_opportunity(
        connection,
        workspace_id=session.workspace_id or "",
        opportunity_id=opportunity_id,
    )
    if row is None:
        return None

    now = _utc_now()
    file_asset_id = _new_id("file")
    storage_key = f"opportunities/{opportunity_id}/{file_asset_id}/{payload['file_name']}"
    file_asset = create_file_asset_record(
        connection,
        record={
            "id": file_asset_id,
            "workspace_id": session.workspace_id or "",
            "opportunity_id": opportunity_id,
            "file_name": payload["file_name"],
            "mime_type": payload["mime_type"],
            "storage_key": storage_key,
            "file_status": "uploaded",
            "extracted_text": None,
            "error_message": None,
            "uploaded_at": now,
            "created_at": now,
            "updated_at": now,
        },
    )
    if file_asset is None:
        return None

    return {
        "file": _serialize_file_asset(file_asset, None),
        "upload": {
            "method": "PUT",
            "upload_url": f"/api/v1/opportunities/{opportunity_id}/files/{file_asset_id}/upload",
            "object_key": storage_key,
        },
    }


def complete_file_upload(
    connection: Connection,
    *,
    session: SessionRecord,
    opportunity_id: str,
    file_asset_id: str,
    payload: dict[str, Any],
) -> dict[str, Any] | None:
    file_asset = get_file_asset(
        connection,
        workspace_id=session.workspace_id or "",
        opportunity_id=opportunity_id,
        file_asset_id=file_asset_id,
    )
    if file_asset is None:
        return None

    now = _utc_now()
    simulate_failure = bool(payload.get("simulate_failure"))
    if simulate_failure:
        job = create_file_processing_job_record(
            connection,
            record={
                "id": _new_id("job"),
                "workspace_id": session.workspace_id or "",
                "opportunity_id": opportunity_id,
                "file_asset_id": file_asset_id,
                "attempt_number": _next_file_attempt_number(
                    connection,
                    workspace_id=session.workspace_id or "",
                    opportunity_id=opportunity_id,
                    file_asset_id=file_asset_id,
                ),
                "status": "failed",
                "error_message": "Processing failed.",
                "queued_at": now,
                "started_at": now,
                "completed_at": now,
                "created_at": now,
                "updated_at": now,
            },
        )
        updated_file = update_file_asset_record(
            connection,
            workspace_id=session.workspace_id or "",
            opportunity_id=opportunity_id,
            file_asset_id=file_asset_id,
            values={
                "file_status": "failed",
                "error_message": "Processing failed.",
                "updated_at": now,
            },
        )
        _sync_extracted_input(
            connection,
            workspace_id=session.workspace_id or "",
            opportunity_id=opportunity_id,
            content="",
            file_status="failed",
            updated_at=now,
        )
        return _build_file_detail_response(updated_file, job)

    job = create_file_processing_job_record(
        connection,
        record={
            "id": _new_id("job"),
            "workspace_id": session.workspace_id or "",
            "opportunity_id": opportunity_id,
            "file_asset_id": file_asset_id,
            "attempt_number": _next_file_attempt_number(
                connection,
                workspace_id=session.workspace_id or "",
                opportunity_id=opportunity_id,
                file_asset_id=file_asset_id,
            ),
            "status": "pending",
            "error_message": None,
            "queued_at": now,
            "started_at": None,
            "completed_at": None,
            "created_at": now,
            "updated_at": now,
        },
    )
    updated_file = update_file_asset_record(
        connection,
        workspace_id=session.workspace_id or "",
        opportunity_id=opportunity_id,
        file_asset_id=file_asset_id,
        values={
            "file_status": "processing",
            "error_message": None,
            "updated_at": now,
        },
    )
    _sync_extracted_input(
        connection,
        workspace_id=session.workspace_id or "",
        opportunity_id=opportunity_id,
        content="",
        file_status="processing",
        updated_at=now,
    )
    return {
        **(_build_file_detail_response(updated_file, job) or {}),
        "poll_url": f"/api/v1/opportunities/{opportunity_id}/files/{file_asset_id}",
    }


def get_file_detail(
    connection: Connection,
    *,
    session: SessionRecord,
    opportunity_id: str,
    file_asset_id: str,
) -> dict[str, Any] | None:
    file_asset = get_file_asset(
        connection,
        workspace_id=session.workspace_id or "",
        opportunity_id=opportunity_id,
        file_asset_id=file_asset_id,
    )
    if file_asset is None:
        return None
    latest_job = get_latest_file_processing_job(
        connection,
        workspace_id=session.workspace_id or "",
        opportunity_id=opportunity_id,
        file_asset_id=file_asset_id,
    )
    return _build_file_detail_response(file_asset, latest_job)


def retry_file_processing(
    connection: Connection,
    *,
    session: SessionRecord,
    opportunity_id: str,
    file_asset_id: str,
) -> dict[str, Any] | None:
    file_asset = get_file_asset(
        connection,
        workspace_id=session.workspace_id or "",
        opportunity_id=opportunity_id,
        file_asset_id=file_asset_id,
    )
    if file_asset is None:
        return None

    now = _utc_now()
    job = create_file_processing_job_record(
        connection,
        record={
            "id": _new_id("job"),
            "workspace_id": session.workspace_id or "",
            "opportunity_id": opportunity_id,
            "file_asset_id": file_asset_id,
            "attempt_number": _next_file_attempt_number(
                connection,
                workspace_id=session.workspace_id or "",
                opportunity_id=opportunity_id,
                file_asset_id=file_asset_id,
            ),
            "status": "pending",
            "error_message": None,
            "queued_at": now,
            "started_at": None,
            "completed_at": None,
            "created_at": now,
            "updated_at": now,
        },
    )
    updated_file = update_file_asset_record(
        connection,
        workspace_id=session.workspace_id or "",
        opportunity_id=opportunity_id,
        file_asset_id=file_asset_id,
        values={
            "file_status": "processing",
            "error_message": None,
            "updated_at": now,
        },
    )
    _sync_extracted_input(
        connection,
        workspace_id=session.workspace_id or "",
        opportunity_id=opportunity_id,
        content="",
        file_status="processing",
        updated_at=now,
    )
    return {
        **(_build_file_detail_response(updated_file, job) or {}),
        "poll_url": f"/api/v1/opportunities/{opportunity_id}/files/{file_asset_id}",
    }
