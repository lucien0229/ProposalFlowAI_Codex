from __future__ import annotations

from typing import Any

from sqlalchemy import and_, insert, select, update
from sqlalchemy.engine import Connection, RowMapping

from app.lead_brief_models import lead_briefs_table, lead_brief_versions_table


def get_lead_brief_current(
    connection: Connection,
    *,
    workspace_id: str,
    opportunity_id: str,
) -> RowMapping[str, Any] | None:
    result = connection.execute(
        select(lead_briefs_table).where(
            and_(
                lead_briefs_table.c.workspace_id == workspace_id,
                lead_briefs_table.c.opportunity_id == opportunity_id,
            )
        )
    )
    return result.mappings().first()


def create_lead_brief_current(
    connection: Connection,
    *,
    record: dict[str, Any],
) -> RowMapping[str, Any]:
    connection.execute(insert(lead_briefs_table).values(**record))
    return get_lead_brief_current(
        connection,
        workspace_id=record["workspace_id"],
        opportunity_id=record["opportunity_id"],
    )


def update_lead_brief_current(
    connection: Connection,
    *,
    workspace_id: str,
    opportunity_id: str,
    expected_revision_no: int,
    values: dict[str, Any],
) -> RowMapping[str, Any] | None:
    result = connection.execute(
        update(lead_briefs_table)
        .where(
            and_(
                lead_briefs_table.c.workspace_id == workspace_id,
                lead_briefs_table.c.opportunity_id == opportunity_id,
                lead_briefs_table.c.current_revision_no == expected_revision_no,
            )
        )
        .values(**values)
    )
    if result.rowcount == 0:
        return None
    return get_lead_brief_current(
        connection,
        workspace_id=workspace_id,
        opportunity_id=opportunity_id,
    )


def update_lead_brief_current_by_id(
    connection: Connection,
    *,
    lead_brief_id: str,
    values: dict[str, Any],
) -> RowMapping[str, Any] | None:
    connection.execute(
        update(lead_briefs_table).where(lead_briefs_table.c.id == lead_brief_id).values(**values)
    )
    return connection.execute(
        select(lead_briefs_table).where(lead_briefs_table.c.id == lead_brief_id)
    ).mappings().first()


def list_lead_brief_versions(
    connection: Connection,
    *,
    workspace_id: str,
    opportunity_id: str,
) -> list[RowMapping[str, Any]]:
    result = connection.execute(
        select(lead_brief_versions_table)
        .where(
            and_(
                lead_brief_versions_table.c.workspace_id == workspace_id,
                lead_brief_versions_table.c.opportunity_id == opportunity_id,
            )
        )
        .order_by(lead_brief_versions_table.c.version_no.desc())
    )
    return result.mappings().all()


def get_lead_brief_version(
    connection: Connection,
    *,
    workspace_id: str,
    opportunity_id: str,
    version_no: int,
) -> RowMapping[str, Any] | None:
    result = connection.execute(
        select(lead_brief_versions_table).where(
            and_(
                lead_brief_versions_table.c.workspace_id == workspace_id,
                lead_brief_versions_table.c.opportunity_id == opportunity_id,
                lead_brief_versions_table.c.version_no == version_no,
            )
        )
    )
    return result.mappings().first()


def append_lead_brief_version(
    connection: Connection,
    *,
    record: dict[str, Any],
) -> RowMapping[str, Any]:
    connection.execute(insert(lead_brief_versions_table).values(**record))
    return get_lead_brief_version(
        connection,
        workspace_id=record["workspace_id"],
        opportunity_id=record["opportunity_id"],
        version_no=record["version_no"],
    )


def update_lead_brief_latest_version(
    connection: Connection,
    *,
    workspace_id: str,
    opportunity_id: str,
    latest_version_no: int | None,
    updated_at: Any,
) -> RowMapping[str, Any] | None:
    connection.execute(
        update(lead_briefs_table)
        .where(
            and_(
                lead_briefs_table.c.workspace_id == workspace_id,
                lead_briefs_table.c.opportunity_id == opportunity_id,
            )
        )
        .values(
            latest_version_no=latest_version_no,
            updated_at=updated_at,
        )
    )
    return get_lead_brief_current(
        connection,
        workspace_id=workspace_id,
        opportunity_id=opportunity_id,
    )
