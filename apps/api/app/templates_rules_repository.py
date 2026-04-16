from __future__ import annotations

from typing import Any

from sqlalchemy import and_, insert, select, update
from sqlalchemy.engine import Connection, RowMapping

from app.templates_rules_models import (
    opportunity_rule_overrides_table,
    template_definitions_table,
    workspace_rule_sets_table,
)


def list_template_definitions(connection: Connection) -> list[RowMapping[str, Any]]:
    result = connection.execute(
        select(template_definitions_table).order_by(template_definitions_table.c.created_at.asc())
    )
    return result.mappings().all()


def get_template_definition(
    connection: Connection,
    *,
    template_key: str,
) -> RowMapping[str, Any] | None:
    result = connection.execute(
        select(template_definitions_table).where(template_definitions_table.c.template_key == template_key)
    )
    return result.mappings().first()


def create_template_definition(
    connection: Connection,
    *,
    record: dict[str, Any],
) -> RowMapping[str, Any]:
    connection.execute(insert(template_definitions_table).values(**record))
    loaded = get_template_definition(connection, template_key=record["template_key"])
    assert loaded is not None
    return loaded


def get_workspace_rule_set(
    connection: Connection,
    *,
    workspace_id: str,
) -> RowMapping[str, Any] | None:
    result = connection.execute(
        select(workspace_rule_sets_table).where(workspace_rule_sets_table.c.workspace_id == workspace_id)
    )
    return result.mappings().first()


def create_workspace_rule_set(
    connection: Connection,
    *,
    record: dict[str, Any],
) -> RowMapping[str, Any]:
    connection.execute(insert(workspace_rule_sets_table).values(**record))
    loaded = get_workspace_rule_set(connection, workspace_id=record["workspace_id"])
    assert loaded is not None
    return loaded


def update_workspace_rule_set(
    connection: Connection,
    *,
    workspace_id: str,
    expected_updated_at: Any,
    values: dict[str, Any],
) -> RowMapping[str, Any] | None:
    result = connection.execute(
        update(workspace_rule_sets_table)
        .where(
            and_(
                workspace_rule_sets_table.c.workspace_id == workspace_id,
                workspace_rule_sets_table.c.updated_at == expected_updated_at,
            )
        )
        .values(**values)
    )
    if result.rowcount == 0:
        return None
    return get_workspace_rule_set(connection, workspace_id=workspace_id)


def get_opportunity_rule_override(
    connection: Connection,
    *,
    workspace_id: str,
    opportunity_id: str,
    active_only: bool = False,
) -> RowMapping[str, Any] | None:
    query = select(opportunity_rule_overrides_table).where(
        and_(
            opportunity_rule_overrides_table.c.workspace_id == workspace_id,
            opportunity_rule_overrides_table.c.opportunity_id == opportunity_id,
        )
    )
    if active_only:
        query = query.where(opportunity_rule_overrides_table.c.is_active.is_(True))
    result = connection.execute(query)
    return result.mappings().first()


def create_opportunity_rule_override(
    connection: Connection,
    *,
    record: dict[str, Any],
) -> RowMapping[str, Any]:
    connection.execute(insert(opportunity_rule_overrides_table).values(**record))
    loaded = get_opportunity_rule_override(
        connection,
        workspace_id=record["workspace_id"],
        opportunity_id=record["opportunity_id"],
    )
    assert loaded is not None
    return loaded


def update_opportunity_rule_override(
    connection: Connection,
    *,
    workspace_id: str,
    opportunity_id: str,
    expected_updated_at: Any,
    values: dict[str, Any],
) -> RowMapping[str, Any] | None:
    result = connection.execute(
        update(opportunity_rule_overrides_table)
        .where(
            and_(
                opportunity_rule_overrides_table.c.workspace_id == workspace_id,
                opportunity_rule_overrides_table.c.opportunity_id == opportunity_id,
                opportunity_rule_overrides_table.c.updated_at == expected_updated_at,
            )
        )
        .values(**values)
    )
    if result.rowcount == 0:
        return None
    return get_opportunity_rule_override(
        connection,
        workspace_id=workspace_id,
        opportunity_id=opportunity_id,
    )
