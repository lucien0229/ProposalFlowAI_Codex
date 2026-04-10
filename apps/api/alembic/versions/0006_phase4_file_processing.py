"""Add opportunity file assets and processing jobs tables.

Revision ID: 0006_phase4_file_processing
Revises: 0005_phase4_opportunity_intake
Create Date: 2026-04-10 00:00:00.000000
"""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "0006_phase4_file_processing"
down_revision = "0005_phase4_opportunity_intake"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "opportunity_file_assets",
        sa.Column("id", sa.String(length=64), primary_key=True),
        sa.Column("workspace_id", sa.String(length=64), nullable=False),
        sa.Column("opportunity_id", sa.String(length=64), nullable=False),
        sa.Column("file_name", sa.String(length=255), nullable=False),
        sa.Column("mime_type", sa.String(length=255), nullable=False),
        sa.Column("storage_key", sa.String(length=512), nullable=False),
        sa.Column("file_status", sa.String(length=32), nullable=False),
        sa.Column("extracted_text", sa.Text(), nullable=True),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.Column("uploaded_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["workspace_id"], ["workspaces.id"]),
        sa.ForeignKeyConstraint(["opportunity_id"], ["opportunities.id"]),
    )
    op.create_index(
        "idx_opportunity_file_assets_opportunity_updated",
        "opportunity_file_assets",
        ["opportunity_id", "updated_at"],
    )
    op.create_index(
        "idx_opportunity_file_assets_workspace_updated",
        "opportunity_file_assets",
        ["workspace_id", "updated_at"],
    )

    op.create_table(
        "opportunity_file_processing_jobs",
        sa.Column("id", sa.String(length=64), primary_key=True),
        sa.Column("workspace_id", sa.String(length=64), nullable=False),
        sa.Column("opportunity_id", sa.String(length=64), nullable=False),
        sa.Column("file_asset_id", sa.String(length=64), nullable=False),
        sa.Column("attempt_number", sa.Integer(), nullable=False),
        sa.Column("status", sa.String(length=32), nullable=False),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.Column("queued_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["workspace_id"], ["workspaces.id"]),
        sa.ForeignKeyConstraint(["opportunity_id"], ["opportunities.id"]),
        sa.ForeignKeyConstraint(["file_asset_id"], ["opportunity_file_assets.id"]),
    )
    op.create_index(
        "idx_opportunity_file_jobs_file_attempt",
        "opportunity_file_processing_jobs",
        ["file_asset_id", "attempt_number"],
    )


def downgrade() -> None:
    op.drop_index(
        "idx_opportunity_file_jobs_file_attempt",
        table_name="opportunity_file_processing_jobs",
    )
    op.drop_table("opportunity_file_processing_jobs")

    op.drop_index(
        "idx_opportunity_file_assets_workspace_updated",
        table_name="opportunity_file_assets",
    )
    op.drop_index(
        "idx_opportunity_file_assets_opportunity_updated",
        table_name="opportunity_file_assets",
    )
    op.drop_table("opportunity_file_assets")
