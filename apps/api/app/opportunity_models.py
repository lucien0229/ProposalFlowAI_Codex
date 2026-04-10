from __future__ import annotations

from sqlalchemy import Column, DateTime, ForeignKey, Index, Integer, String, Table, Text

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

opportunity_inputs_table = Table(
    "opportunity_inputs",
    metadata,
    Column("id", String(64), primary_key=True),
    Column("workspace_id", String(64), nullable=False),
    Column("opportunity_id", String(64), ForeignKey("opportunities.id"), nullable=False),
    Column("input_type", String(32), nullable=False),
    Column("content", Text, nullable=False),
    Column("source_label", String(160), nullable=True),
    Column("file_status", String(32), nullable=True),
    Column("created_at", DateTime(timezone=True), nullable=False),
    Column("updated_at", DateTime(timezone=True), nullable=False),
)

Index(
    "idx_opportunity_inputs_opportunity_updated",
    opportunity_inputs_table.c.opportunity_id,
    opportunity_inputs_table.c.updated_at,
)
Index(
    "idx_opportunity_inputs_workspace_updated",
    opportunity_inputs_table.c.workspace_id,
    opportunity_inputs_table.c.updated_at,
)

opportunity_file_assets_table = Table(
    "opportunity_file_assets",
    metadata,
    Column("id", String(64), primary_key=True),
    Column("workspace_id", String(64), nullable=False),
    Column("opportunity_id", String(64), ForeignKey("opportunities.id"), nullable=False),
    Column("file_name", String(255), nullable=False),
    Column("mime_type", String(255), nullable=False),
    Column("storage_key", String(512), nullable=False),
    Column("file_status", String(32), nullable=False),
    Column("extracted_text", Text, nullable=True),
    Column("error_message", Text, nullable=True),
    Column("uploaded_at", DateTime(timezone=True), nullable=True),
    Column("created_at", DateTime(timezone=True), nullable=False),
    Column("updated_at", DateTime(timezone=True), nullable=False),
)

Index(
    "idx_opportunity_file_assets_opportunity_updated",
    opportunity_file_assets_table.c.opportunity_id,
    opportunity_file_assets_table.c.updated_at,
)
Index(
    "idx_opportunity_file_assets_workspace_updated",
    opportunity_file_assets_table.c.workspace_id,
    opportunity_file_assets_table.c.updated_at,
)

opportunity_file_processing_jobs_table = Table(
    "opportunity_file_processing_jobs",
    metadata,
    Column("id", String(64), primary_key=True),
    Column("workspace_id", String(64), nullable=False),
    Column("opportunity_id", String(64), ForeignKey("opportunities.id"), nullable=False),
    Column("file_asset_id", String(64), ForeignKey("opportunity_file_assets.id"), nullable=False),
    Column("attempt_number", Integer, nullable=False),
    Column("status", String(32), nullable=False),
    Column("error_message", Text, nullable=True),
    Column("queued_at", DateTime(timezone=True), nullable=True),
    Column("started_at", DateTime(timezone=True), nullable=True),
    Column("completed_at", DateTime(timezone=True), nullable=True),
    Column("created_at", DateTime(timezone=True), nullable=False),
    Column("updated_at", DateTime(timezone=True), nullable=False),
)

Index(
    "idx_opportunity_file_jobs_file_attempt",
    opportunity_file_processing_jobs_table.c.file_asset_id,
    opportunity_file_processing_jobs_table.c.attempt_number,
)
