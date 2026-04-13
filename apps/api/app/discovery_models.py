from __future__ import annotations

from sqlalchemy import Column, DateTime, ForeignKey, Index, Integer, JSON, String, Table, UniqueConstraint

from app import metadata

discoveries_table = Table(
    "discoveries",
    metadata,
    Column("id", String(64), primary_key=True),
    Column("workspace_id", String(64), ForeignKey("workspaces.id"), nullable=False),
    Column("opportunity_id", String(64), ForeignKey("opportunities.id"), nullable=False, unique=True),
    Column("current_payload", JSON, nullable=False),
    Column("current_revision_no", Integer, nullable=False),
    Column("latest_version_no", Integer, nullable=True),
    Column("last_ai_call_id", String(128), nullable=True),
    Column("updated_by_user_id", String(64), ForeignKey("users.id"), nullable=True),
    Column("created_at", DateTime(timezone=True), nullable=False),
    Column("updated_at", DateTime(timezone=True), nullable=False),
)

Index(
    "idx_discoveries_workspace_updated",
    discoveries_table.c.workspace_id,
    discoveries_table.c.updated_at,
)
Index(
    "idx_discoveries_opportunity_updated",
    discoveries_table.c.opportunity_id,
    discoveries_table.c.updated_at,
)

discovery_versions_table = Table(
    "discovery_versions",
    metadata,
    Column("id", String(64), primary_key=True),
    Column("discovery_id", String(64), ForeignKey("discoveries.id"), nullable=False),
    Column("workspace_id", String(64), ForeignKey("workspaces.id"), nullable=False),
    Column("opportunity_id", String(64), ForeignKey("opportunities.id"), nullable=False),
    Column("version_no", Integer, nullable=False),
    Column("current_revision_no", Integer, nullable=False),
    Column("payload", JSON, nullable=False),
    Column("version_origin", String(32), nullable=False),
    Column("saved_by_user_id", String(64), ForeignKey("users.id"), nullable=True),
    Column("saved_by_name", String(160), nullable=True),
    Column("ai_call_id", String(128), nullable=True),
    Column("created_at", DateTime(timezone=True), nullable=False),
    Column("updated_at", DateTime(timezone=True), nullable=False),
    Column("saved_at", DateTime(timezone=True), nullable=False),
    UniqueConstraint("discovery_id", "version_no", name="uq_discovery_versions_discovery_version_no"),
)

Index(
    "idx_discovery_versions_workspace_version",
    discovery_versions_table.c.workspace_id,
    discovery_versions_table.c.version_no,
)
Index(
    "idx_discovery_versions_opportunity_version",
    discovery_versions_table.c.opportunity_id,
    discovery_versions_table.c.version_no,
)
