from __future__ import annotations

from sqlalchemy import Column, DateTime, ForeignKey, Index, Integer, JSON, String, Table, UniqueConstraint

from app import metadata

proposal_drafts_table = Table(
    "proposal_drafts",
    metadata,
    Column("id", String(64), primary_key=True),
    Column("workspace_id", String(64), ForeignKey("workspaces.id"), nullable=False),
    Column("opportunity_id", String(64), ForeignKey("opportunities.id"), nullable=False, unique=True),
    Column("template_key", String(64), nullable=False),
    Column("current_payload", JSON, nullable=False),
    Column("current_revision_no", Integer, nullable=False),
    Column("latest_version_no", Integer, nullable=False),
    Column("last_ai_call_id", String(128), nullable=True),
    Column("updated_by_user_id", String(64), ForeignKey("users.id"), nullable=True),
    Column("created_at", DateTime(timezone=True), nullable=False),
    Column("updated_at", DateTime(timezone=True), nullable=False),
)

Index(
    "idx_proposal_drafts_workspace_updated",
    proposal_drafts_table.c.workspace_id,
    proposal_drafts_table.c.updated_at,
)
Index(
    "idx_proposal_drafts_opportunity_updated",
    proposal_drafts_table.c.opportunity_id,
    proposal_drafts_table.c.updated_at,
)

proposal_draft_versions_table = Table(
    "proposal_draft_versions",
    metadata,
    Column("id", String(64), primary_key=True),
    Column("proposal_draft_id", String(64), ForeignKey("proposal_drafts.id"), nullable=False),
    Column("workspace_id", String(64), ForeignKey("workspaces.id"), nullable=False),
    Column("opportunity_id", String(64), ForeignKey("opportunities.id"), nullable=False),
    Column("template_key", String(64), nullable=False),
    Column("version_no", Integer, nullable=False),
    Column("current_revision_no", Integer, nullable=False),
    Column("payload", JSON, nullable=False),
    Column("version_origin", String(32), nullable=False),
    Column("version_note", String(255), nullable=True),
    Column("saved_by_user_id", String(64), ForeignKey("users.id"), nullable=True),
    Column("saved_by_name", String(160), nullable=True),
    Column("ai_call_id", String(128), nullable=True),
    Column("created_at", DateTime(timezone=True), nullable=False),
    Column("updated_at", DateTime(timezone=True), nullable=False),
    Column("saved_at", DateTime(timezone=True), nullable=False),
    UniqueConstraint(
        "proposal_draft_id",
        "version_no",
        name="uq_proposal_draft_versions_proposal_draft_version_no",
    ),
)

Index(
    "idx_proposal_draft_versions_workspace_version",
    proposal_draft_versions_table.c.workspace_id,
    proposal_draft_versions_table.c.version_no,
)
Index(
    "idx_proposal_draft_versions_opportunity_version",
    proposal_draft_versions_table.c.opportunity_id,
    proposal_draft_versions_table.c.version_no,
)
