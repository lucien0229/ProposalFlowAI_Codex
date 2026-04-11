"""Add lead brief current and version snapshot tables.

Revision ID: 0007_phase5_lead_brief_workspace
Revises: 0006_phase4_file_processing
Create Date: 2026-04-10 00:00:00.000000
"""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "0007_phase5_lead_brief_workspace"
down_revision = "0006_phase4_file_processing"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "lead_briefs",
        sa.Column("id", sa.String(length=64), primary_key=True),
        sa.Column("workspace_id", sa.String(length=64), nullable=False),
        sa.Column("opportunity_id", sa.String(length=64), nullable=False),
        sa.Column("current_payload", sa.JSON(), nullable=False),
        sa.Column("current_revision_no", sa.Integer(), nullable=False),
        sa.Column("latest_version_no", sa.Integer(), nullable=True),
        sa.Column("last_ai_call_id", sa.String(length=128), nullable=True),
        sa.Column("updated_by_user_id", sa.String(length=64), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["workspace_id"], ["workspaces.id"]),
        sa.ForeignKeyConstraint(["opportunity_id"], ["opportunities.id"]),
        sa.ForeignKeyConstraint(["updated_by_user_id"], ["users.id"]),
        sa.UniqueConstraint("opportunity_id", name="uq_lead_briefs_opportunity_id"),
    )
    op.create_index(
        "idx_lead_briefs_workspace_updated",
        "lead_briefs",
        ["workspace_id", "updated_at"],
    )
    op.create_index(
        "idx_lead_briefs_opportunity_updated",
        "lead_briefs",
        ["opportunity_id", "updated_at"],
    )

    op.create_table(
        "lead_brief_versions",
        sa.Column("id", sa.String(length=64), primary_key=True),
        sa.Column("lead_brief_id", sa.String(length=64), nullable=False),
        sa.Column("workspace_id", sa.String(length=64), nullable=False),
        sa.Column("opportunity_id", sa.String(length=64), nullable=False),
        sa.Column("version_no", sa.Integer(), nullable=False),
        sa.Column("current_revision_no", sa.Integer(), nullable=False),
        sa.Column("payload", sa.JSON(), nullable=False),
        sa.Column("version_origin", sa.String(length=32), nullable=False),
        sa.Column("saved_by_user_id", sa.String(length=64), nullable=True),
        sa.Column("saved_by_name", sa.String(length=160), nullable=True),
        sa.Column("ai_call_id", sa.String(length=128), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("saved_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["lead_brief_id"], ["lead_briefs.id"]),
        sa.ForeignKeyConstraint(["workspace_id"], ["workspaces.id"]),
        sa.ForeignKeyConstraint(["opportunity_id"], ["opportunities.id"]),
        sa.ForeignKeyConstraint(["saved_by_user_id"], ["users.id"]),
        sa.UniqueConstraint("lead_brief_id", "version_no", name="uq_lead_brief_versions_lead_brief_version_no"),
    )
    op.create_index(
        "idx_lead_brief_versions_workspace_version",
        "lead_brief_versions",
        ["workspace_id", "version_no"],
    )
    op.create_index(
        "idx_lead_brief_versions_opportunity_version",
        "lead_brief_versions",
        ["opportunity_id", "version_no"],
    )


def downgrade() -> None:
    op.drop_index(
        "idx_lead_brief_versions_opportunity_version",
        table_name="lead_brief_versions",
    )
    op.drop_index(
        "idx_lead_brief_versions_workspace_version",
        table_name="lead_brief_versions",
    )
    op.drop_table("lead_brief_versions")

    op.drop_index(
        "idx_lead_briefs_opportunity_updated",
        table_name="lead_briefs",
    )
    op.drop_index(
        "idx_lead_briefs_workspace_updated",
        table_name="lead_briefs",
    )
    op.drop_table("lead_briefs")
