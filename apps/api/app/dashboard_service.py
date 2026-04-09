from __future__ import annotations

from typing import Any

from sqlalchemy.engine import Connection

from app.account_service import SessionRecord
from app.opportunity_repository import (
    list_needs_attention_opportunities,
    list_recent_opportunities,
)
from app.opportunity_service import (
    get_workspace_snapshot,
    is_workspace_restricted,
    resolve_attention_reason,
    serialize_opportunity,
    summarize_workspace_counts,
)


def build_dashboard_summary(
    connection: Connection,
    *,
    session: SessionRecord,
) -> dict[str, Any]:
    workspace = get_workspace_snapshot(connection, session.workspace_id or "")
    recent_rows = list_recent_opportunities(
        connection,
        workspace_id=session.workspace_id or "",
        limit=5,
    )
    recent = [serialize_opportunity(row, workspace) for row in recent_rows]
    restricted, restriction_reason = is_workspace_restricted(workspace)
    attention_rows = list_needs_attention_opportunities(
        connection,
        workspace_id=session.workspace_id or "",
        restricted=restricted,
        limit=5,
    )
    needs_attention = []
    for row in attention_rows:
        reason = resolve_attention_reason(row, workspace)
        if reason is None:
            continue
        item = serialize_opportunity(row, workspace)
        needs_attention.append(
            {
                **item,
                "attention_title": "Action needed",
                "attention_body": reason.replace("_", " "),
            }
        )

    billing_snapshot = {
        "trial_status": None if workspace is None else workspace["trial_status"],
        "billing_status": None if workspace is None else workspace["billing_status"],
        "plan_type": None if workspace is None else workspace["plan_type"],
        "current_period_end": None
        if workspace is None or workspace["current_period_end"] is None
        else workspace["current_period_end"].isoformat(),
        "is_restricted": restricted,
        "restriction_reason": restriction_reason,
    }

    return {
        "summary_counts": summarize_workspace_counts(connection, session=session),
        "recent_opportunities": recent,
        "needs_attention": needs_attention,
        "billing_snapshot": billing_snapshot,
    }
