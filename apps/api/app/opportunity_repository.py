from __future__ import annotations

import base64
import binascii
from datetime import UTC, datetime
from typing import Any

from sqlalchemy import and_, func, insert, or_, select, update
from sqlalchemy.engine import Connection, RowMapping

from app.account_models import users_table
from app.opportunity_models import (
    opportunity_file_assets_table,
    opportunity_file_processing_jobs_table,
    opportunity_inputs_table,
    opportunities_table,
)


class InvalidOpportunityCursor(ValueError):
    pass


def _encode_cursor(updated_at: datetime, opportunity_id: str) -> str:
    raw = f"{updated_at.astimezone(UTC).isoformat()}|{opportunity_id}"
    return base64.urlsafe_b64encode(raw.encode()).decode()


def _decode_cursor(cursor: str) -> tuple[datetime, str]:
    try:
        decoded = base64.urlsafe_b64decode(cursor.encode()).decode()
        updated_at_raw, opportunity_id = decoded.split("|", maxsplit=1)
        return datetime.fromisoformat(updated_at_raw), opportunity_id
    except (ValueError, binascii.Error) as error:
        raise InvalidOpportunityCursor("Invalid opportunity cursor.") from error


def _base_opportunity_query(*, workspace_id: str):
    return (
        select(
            opportunities_table,
            users_table.c.full_name.label("owner_name"),
        )
        .select_from(
            opportunities_table.join(
                users_table,
                users_table.c.id == opportunities_table.c.owner_user_id,
            )
        )
        .where(opportunities_table.c.workspace_id == workspace_id)
    )


def _needs_attention_clause():
    return or_(
        opportunities_table.c.status == "proposal_in_review",
        opportunities_table.c.requested_service.is_(None),
        func.trim(opportunities_table.c.requested_service) == "",
    )


def _apply_default_ordering(query, *, order_by: str = "updated_at", order_direction: str = "desc"):
    ordering_column = (
        opportunities_table.c.created_at if order_by == "created_at" else opportunities_table.c.updated_at
    )

    if order_direction == "asc":
        return query.order_by(ordering_column.asc(), opportunities_table.c.id.asc())
    return query.order_by(ordering_column.desc(), opportunities_table.c.id.desc())


def create_opportunity(
    connection: Connection,
    *,
    record: dict[str, Any],
) -> RowMapping[str, Any]:
    connection.execute(insert(opportunities_table).values(**record))
    return get_opportunity(
        connection,
        workspace_id=record["workspace_id"],
        opportunity_id=record["id"],
    )


def update_opportunity_context(
    connection: Connection,
    *,
    workspace_id: str,
    opportunity_id: str,
    values: dict[str, Any],
) -> RowMapping[str, Any] | None:
    connection.execute(
        update(opportunities_table)
        .where(
            and_(
                opportunities_table.c.workspace_id == workspace_id,
                opportunities_table.c.id == opportunity_id,
            )
        )
        .values(**values)
    )
    return get_opportunity(connection, workspace_id=workspace_id, opportunity_id=opportunity_id)


def get_opportunity(
    connection: Connection,
    *,
    workspace_id: str,
    opportunity_id: str,
) -> RowMapping[str, Any] | None:
    result = connection.execute(
        select(
            opportunities_table,
            users_table.c.full_name.label("owner_name"),
        )
        .select_from(
            opportunities_table.join(
                users_table,
                users_table.c.id == opportunities_table.c.owner_user_id,
            )
        )
        .where(
            and_(
                opportunities_table.c.workspace_id == workspace_id,
                opportunities_table.c.id == opportunity_id,
            )
        )
    )
    return result.mappings().first()


def list_opportunities(
    connection: Connection,
    *,
    workspace_id: str,
    q: str | None,
    status: str | None,
    archived: bool | None,
    limit: int,
    cursor: str | None,
    order_by: str,
    order_direction: str,
) -> tuple[list[RowMapping[str, Any]], str | None]:
    ordering_column = (
        opportunities_table.c.created_at if order_by == "created_at" else opportunities_table.c.updated_at
    )
    query = _base_opportunity_query(workspace_id=workspace_id)

    if q:
        query = query.where(
            or_(
                opportunities_table.c.title.ilike(f"%{q}%"),
                opportunities_table.c.company_name.ilike(f"%{q}%"),
            )
        )
    if status:
        query = query.where(opportunities_table.c.status == status)
    if archived is True:
        query = query.where(opportunities_table.c.archived_at.is_not(None))
    elif archived is False:
        query = query.where(opportunities_table.c.archived_at.is_(None))

    if cursor:
        cursor_updated_at, cursor_id = _decode_cursor(cursor)
        if order_direction == "asc":
            query = query.where(
                or_(
                    ordering_column > cursor_updated_at,
                    and_(
                        ordering_column == cursor_updated_at,
                        opportunities_table.c.id > cursor_id,
                    ),
                )
            )
        else:
            query = query.where(
                or_(
                    ordering_column < cursor_updated_at,
                    and_(
                        ordering_column == cursor_updated_at,
                        opportunities_table.c.id < cursor_id,
                    ),
                )
            )

    query = _apply_default_ordering(query, order_by=order_by, order_direction=order_direction)

    rows = connection.execute(query.limit(limit + 1)).mappings().all()
    next_cursor = None
    if len(rows) > limit:
        last_row = rows[limit - 1]
        next_cursor = _encode_cursor(last_row[order_by], last_row["id"])
        rows = rows[:limit]
    return rows, next_cursor


def list_recent_opportunities(
    connection: Connection,
    *,
    workspace_id: str,
    limit: int,
) -> list[RowMapping[str, Any]]:
    query = (
        _base_opportunity_query(workspace_id=workspace_id)
        .where(opportunities_table.c.archived_at.is_(None))
    )
    query = _apply_default_ordering(query)
    return connection.execute(query.limit(limit)).mappings().all()


def list_needs_attention_opportunities(
    connection: Connection,
    *,
    workspace_id: str,
    restricted: bool,
    limit: int,
) -> list[RowMapping[str, Any]]:
    query = (
        _base_opportunity_query(workspace_id=workspace_id)
        .where(opportunities_table.c.archived_at.is_(None))
    )
    if not restricted:
        query = query.where(_needs_attention_clause())
    query = _apply_default_ordering(query)
    return connection.execute(query.limit(limit)).mappings().all()


def set_archive_state(
    connection: Connection,
    *,
    workspace_id: str,
    opportunity_id: str,
    status: str,
    status_before_archive: str | None,
    archived_at: datetime | None,
    updated_at: datetime,
) -> RowMapping[str, Any] | None:
    connection.execute(
        update(opportunities_table)
        .where(
            and_(
                opportunities_table.c.workspace_id == workspace_id,
                opportunities_table.c.id == opportunity_id,
            )
        )
        .values(
            status=status,
            status_before_archive=status_before_archive,
            archived_at=archived_at,
            updated_at=updated_at,
        )
    )
    return get_opportunity(connection, workspace_id=workspace_id, opportunity_id=opportunity_id)


def count_opportunities(connection: Connection, *, workspace_id: str) -> dict[str, int]:
    active = connection.execute(
        select(func.count()).select_from(opportunities_table).where(
            and_(
                opportunities_table.c.workspace_id == workspace_id,
                opportunities_table.c.archived_at.is_(None),
            )
        )
    ).scalar_one()
    archived = connection.execute(
        select(func.count()).select_from(opportunities_table).where(
            and_(
                opportunities_table.c.workspace_id == workspace_id,
                opportunities_table.c.archived_at.is_not(None),
            )
        )
    ).scalar_one()
    proposal_ready = connection.execute(
        select(func.count()).select_from(opportunities_table).where(
            and_(
                opportunities_table.c.workspace_id == workspace_id,
                opportunities_table.c.archived_at.is_(None),
                opportunities_table.c.status == "proposal_ready",
            )
        )
    ).scalar_one()
    return {
        "active": active,
        "archived": archived,
        "proposal_ready": proposal_ready,
    }


def count_needs_attention_opportunities(
    connection: Connection,
    *,
    workspace_id: str,
    restricted: bool,
) -> int:
    query = select(func.count()).select_from(opportunities_table).where(
        and_(
            opportunities_table.c.workspace_id == workspace_id,
            opportunities_table.c.archived_at.is_(None),
        )
    )
    if not restricted:
        query = query.where(_needs_attention_clause())
    return connection.execute(query).scalar_one()


def list_opportunity_inputs(
    connection: Connection,
    *,
    workspace_id: str,
    opportunity_id: str,
) -> list[RowMapping[str, Any]]:
    query = (
        select(opportunity_inputs_table)
        .select_from(
            opportunity_inputs_table.join(
                opportunities_table,
                opportunities_table.c.id == opportunity_inputs_table.c.opportunity_id,
            )
        )
        .where(
            and_(
                opportunities_table.c.workspace_id == workspace_id,
                opportunities_table.c.id == opportunity_id,
            )
        )
        .order_by(opportunity_inputs_table.c.created_at.asc(), opportunity_inputs_table.c.id.asc())
    )
    return connection.execute(query).mappings().all()


def get_opportunity_input(
    connection: Connection,
    *,
    workspace_id: str,
    opportunity_id: str,
    input_id: str,
) -> RowMapping[str, Any] | None:
    query = (
        select(opportunity_inputs_table)
        .select_from(
            opportunity_inputs_table.join(
                opportunities_table,
                opportunities_table.c.id == opportunity_inputs_table.c.opportunity_id,
            )
        )
        .where(
            and_(
                opportunities_table.c.workspace_id == workspace_id,
                opportunities_table.c.id == opportunity_id,
                opportunity_inputs_table.c.id == input_id,
            )
        )
    )
    return connection.execute(query).mappings().first()


def create_opportunity_input(
    connection: Connection,
    *,
    record: dict[str, Any],
) -> RowMapping[str, Any] | None:
    connection.execute(insert(opportunity_inputs_table).values(**record))
    return get_opportunity_input(
        connection,
        workspace_id=record["workspace_id"],
        opportunity_id=record["opportunity_id"],
        input_id=record["id"],
    )


def update_opportunity_input(
    connection: Connection,
    *,
    workspace_id: str,
    opportunity_id: str,
    input_id: str,
    values: dict[str, Any],
) -> RowMapping[str, Any] | None:
    connection.execute(
        update(opportunity_inputs_table)
        .where(
            opportunity_inputs_table.c.id.in_(
                select(opportunity_inputs_table.c.id)
                .select_from(
                    opportunity_inputs_table.join(
                        opportunities_table,
                        opportunities_table.c.id == opportunity_inputs_table.c.opportunity_id,
                    )
                )
                .where(
                    and_(
                        opportunities_table.c.workspace_id == workspace_id,
                        opportunities_table.c.id == opportunity_id,
                        opportunity_inputs_table.c.id == input_id,
                    )
                )
            )
        )
        .values(**values)
    )
    return get_opportunity_input(
        connection,
        workspace_id=workspace_id,
        opportunity_id=opportunity_id,
        input_id=input_id,
    )


def get_latest_input_by_type(
    connection: Connection,
    *,
    workspace_id: str,
    opportunity_id: str,
    input_type: str,
) -> RowMapping[str, Any] | None:
    query = (
        select(opportunity_inputs_table)
        .select_from(
            opportunity_inputs_table.join(
                opportunities_table,
                opportunities_table.c.id == opportunity_inputs_table.c.opportunity_id,
            )
        )
        .where(
            and_(
                opportunities_table.c.workspace_id == workspace_id,
                opportunities_table.c.id == opportunity_id,
                opportunity_inputs_table.c.input_type == input_type,
            )
        )
        .order_by(opportunity_inputs_table.c.updated_at.desc(), opportunity_inputs_table.c.id.desc())
    )
    return connection.execute(query.limit(1)).mappings().first()


def create_file_asset(
    connection: Connection,
    *,
    record: dict[str, Any],
) -> RowMapping[str, Any] | None:
    connection.execute(insert(opportunity_file_assets_table).values(**record))
    return get_file_asset(
        connection,
        workspace_id=record["workspace_id"],
        opportunity_id=record["opportunity_id"],
        file_asset_id=record["id"],
    )


def get_file_asset(
    connection: Connection,
    *,
    workspace_id: str,
    opportunity_id: str,
    file_asset_id: str,
) -> RowMapping[str, Any] | None:
    query = (
        select(opportunity_file_assets_table)
        .where(
            and_(
                opportunity_file_assets_table.c.workspace_id == workspace_id,
                opportunity_file_assets_table.c.opportunity_id == opportunity_id,
                opportunity_file_assets_table.c.id == file_asset_id,
            )
        )
    )
    return connection.execute(query).mappings().first()


def get_latest_file_asset(
    connection: Connection,
    *,
    workspace_id: str,
    opportunity_id: str,
) -> RowMapping[str, Any] | None:
    query = (
        select(opportunity_file_assets_table)
        .where(
            and_(
                opportunity_file_assets_table.c.workspace_id == workspace_id,
                opportunity_file_assets_table.c.opportunity_id == opportunity_id,
            )
        )
        .order_by(
            opportunity_file_assets_table.c.updated_at.desc(),
            opportunity_file_assets_table.c.created_at.desc(),
            opportunity_file_assets_table.c.id.desc(),
        )
    )
    return connection.execute(query.limit(1)).mappings().first()


def update_file_asset(
    connection: Connection,
    *,
    workspace_id: str,
    opportunity_id: str,
    file_asset_id: str,
    values: dict[str, Any],
) -> RowMapping[str, Any] | None:
    connection.execute(
        update(opportunity_file_assets_table)
        .where(
            and_(
                opportunity_file_assets_table.c.workspace_id == workspace_id,
                opportunity_file_assets_table.c.opportunity_id == opportunity_id,
                opportunity_file_assets_table.c.id == file_asset_id,
            )
        )
        .values(**values)
    )
    return get_file_asset(
        connection,
        workspace_id=workspace_id,
        opportunity_id=opportunity_id,
        file_asset_id=file_asset_id,
    )


def create_file_processing_job(
    connection: Connection,
    *,
    record: dict[str, Any],
) -> RowMapping[str, Any] | None:
    connection.execute(insert(opportunity_file_processing_jobs_table).values(**record))
    return get_latest_file_processing_job(
        connection,
        workspace_id=record["workspace_id"],
        opportunity_id=record["opportunity_id"],
        file_asset_id=record["file_asset_id"],
    )


def update_file_processing_job(
    connection: Connection,
    *,
    workspace_id: str,
    opportunity_id: str,
    file_asset_id: str,
    attempt_number: int,
    values: dict[str, Any],
) -> RowMapping[str, Any] | None:
    connection.execute(
        update(opportunity_file_processing_jobs_table)
        .where(
            and_(
                opportunity_file_processing_jobs_table.c.workspace_id == workspace_id,
                opportunity_file_processing_jobs_table.c.opportunity_id == opportunity_id,
                opportunity_file_processing_jobs_table.c.file_asset_id == file_asset_id,
                opportunity_file_processing_jobs_table.c.attempt_number == attempt_number,
            )
        )
        .values(**values)
    )
    return get_latest_file_processing_job(
        connection,
        workspace_id=workspace_id,
        opportunity_id=opportunity_id,
        file_asset_id=file_asset_id,
    )


def list_file_processing_jobs(
    connection: Connection,
    *,
    workspace_id: str,
    opportunity_id: str,
    file_asset_id: str,
) -> list[RowMapping[str, Any]]:
    query = (
        select(opportunity_file_processing_jobs_table)
        .where(
            and_(
                opportunity_file_processing_jobs_table.c.workspace_id == workspace_id,
                opportunity_file_processing_jobs_table.c.opportunity_id == opportunity_id,
                opportunity_file_processing_jobs_table.c.file_asset_id == file_asset_id,
            )
        )
        .order_by(
            opportunity_file_processing_jobs_table.c.attempt_number.desc(),
            opportunity_file_processing_jobs_table.c.created_at.desc(),
        )
    )
    return connection.execute(query).mappings().all()


def get_latest_file_processing_job(
    connection: Connection,
    *,
    workspace_id: str,
    opportunity_id: str,
    file_asset_id: str,
) -> RowMapping[str, Any] | None:
    jobs = list_file_processing_jobs(
        connection,
        workspace_id=workspace_id,
        opportunity_id=opportunity_id,
        file_asset_id=file_asset_id,
    )
    return jobs[0] if jobs else None


def list_pending_file_processing_jobs(
    connection: Connection,
    *,
    limit: int = 10,
) -> list[RowMapping[str, Any]]:
    query = (
        select(opportunity_file_processing_jobs_table)
        .where(opportunity_file_processing_jobs_table.c.status == "pending")
        .order_by(
            opportunity_file_processing_jobs_table.c.queued_at.asc().nullslast(),
            opportunity_file_processing_jobs_table.c.created_at.asc(),
        )
        .limit(limit)
    )
    return connection.execute(query).mappings().all()
