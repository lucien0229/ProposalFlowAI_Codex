from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone
from typing import TypedDict

from sqlalchemy import JSON, Column, DateTime, String, Table, insert
from sqlalchemy.engine import Connection

from app import metadata


class ActivityLogPayload(TypedDict):
    workspace_id: str
    user_id: str | None
    opportunity_id: str | None
    entity_type: str
    entity_id: str
    action_type: str
    metadata: dict[str, str | int | float | bool | None]
    created_at: str


@dataclass(frozen=True)
class ActivityLogRecord:
    workspace_id: str
    user_id: str | None
    opportunity_id: str | None
    entity_type: str
    entity_id: str
    action_type: str
    metadata: dict[str, str | int | float | bool | None]
    created_at: datetime


activity_logs_table = Table(
    "activity_logs",
    metadata,
    Column("workspace_id", String(64), nullable=False),
    Column("user_id", String(64), nullable=True),
    Column("opportunity_id", String(64), nullable=True),
    Column("entity_type", String(64), nullable=False),
    Column("entity_id", String(64), nullable=False),
    Column("action_type", String(64), nullable=False),
    Column("metadata", JSON, nullable=False, default=dict),
    Column("created_at", DateTime(timezone=True), nullable=False),
)


def _parse_created_at(value: str) -> datetime:
    created_at = datetime.fromisoformat(value)
    if created_at.tzinfo is None:
        return created_at.replace(tzinfo=timezone.utc)
    return created_at.astimezone(timezone.utc)


def to_activity_log_record(payload: ActivityLogPayload) -> ActivityLogRecord:
    return ActivityLogRecord(
        workspace_id=payload["workspace_id"],
        user_id=payload["user_id"],
        opportunity_id=payload["opportunity_id"],
        entity_type=payload["entity_type"],
        entity_id=payload["entity_id"],
        action_type=payload["action_type"],
        metadata=payload["metadata"],
        created_at=_parse_created_at(payload["created_at"]),
    )


def record_activity_log(connection: Connection, payload: ActivityLogPayload) -> None:
    record = to_activity_log_record(payload)
    connection.execute(
        insert(activity_logs_table).values(
            workspace_id=record.workspace_id,
            user_id=record.user_id,
            opportunity_id=record.opportunity_id,
            entity_type=record.entity_type,
            entity_id=record.entity_id,
            action_type=record.action_type,
            metadata=record.metadata,
            created_at=record.created_at,
        )
    )
