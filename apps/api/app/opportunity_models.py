from __future__ import annotations

from sqlalchemy import Column, DateTime, Index, String, Table

from app import metadata

opportunities_table = Table(
    "opportunities",
    metadata,
    Column("id", String(64), primary_key=True),
    Column("workspace_id", String(64), nullable=False),
    Column("owner_user_id", String(64), nullable=False),
    Column("title", String(200), nullable=False),
    Column("source_type", String(64), nullable=True),
    Column("company_name", String(200), nullable=False),
    Column("contact_name", String(160), nullable=True),
    Column("contact_email", String(320), nullable=True),
    Column("requested_service", String(400), nullable=True),
    Column("status", String(64), nullable=False),
    Column("status_before_archive", String(64), nullable=True),
    Column("archived_at", DateTime(timezone=True), nullable=True),
    Column("created_at", DateTime(timezone=True), nullable=False),
    Column("updated_at", DateTime(timezone=True), nullable=False),
)

Index(
    "idx_opportunities_workspace_updated",
    opportunities_table.c.workspace_id,
    opportunities_table.c.updated_at,
)
Index(
    "idx_opportunities_workspace_status",
    opportunities_table.c.workspace_id,
    opportunities_table.c.status,
)
Index(
    "idx_opportunities_workspace_owner",
    opportunities_table.c.workspace_id,
    opportunities_table.c.owner_user_id,
)
