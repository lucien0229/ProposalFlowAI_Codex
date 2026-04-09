from __future__ import annotations

import secrets
from datetime import UTC, datetime
from typing import Any

from sqlalchemy.engine import Connection, RowMapping

from app.account_models import workspaces_table
from app.account_service import SessionRecord
from app.opportunity_repository import (
    InvalidOpportunityCursor,
    count_opportunities,
    count_needs_attention_opportunities,
    create_opportunity as create_opportunity_record,
    get_opportunity,
    list_needs_attention_opportunities,
    list_recent_opportunities,
    list_opportunities as list_opportunity_rows,
    set_archive_state,
)


class WorkspaceRestrictionError(PermissionError):
    pass


class OpportunityCursorError(ValueError):
    pass


def _utc_now() -> datetime:
    return datetime.now(UTC)


def _new_id(prefix: str) -> str:
    return f"{prefix}_{secrets.token_urlsafe(12)}"


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
    return serialize_opportunity(row, workspace)


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
