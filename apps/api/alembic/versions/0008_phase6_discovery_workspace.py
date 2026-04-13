"""Add discovery current and version snapshot tables.

Revision ID: 0008_phase6_discovery_workspace
Revises: 0007_phase5_lead_brief_workspace
Create Date: 2026-04-11 00:00:00.000000
"""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "0008_phase6_discovery_workspace"
down_revision = "0007_phase5_lead_brief_workspace"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "discoveries",
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
        sa.UniqueConstraint("opportunity_id", name="uq_discoveries_opportunity_id"),
    )
    op.create_index(
        "idx_discoveries_workspace_updated",
        "discoveries",
        ["workspace_id", "updated_at"],
    )
    op.create_index(
        "idx_discoveries_opportunity_updated",
        "discoveries",
        ["opportunity_id", "updated_at"],
    )

    op.create_table(
        "discovery_versions",
        sa.Column("id", sa.String(length=64), primary_key=True),
        sa.Column("discovery_id", sa.String(length=64), nullable=False),
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
        sa.ForeignKeyConstraint(["discovery_id"], ["discoveries.id"]),
        sa.ForeignKeyConstraint(["workspace_id"], ["workspaces.id"]),
        sa.ForeignKeyConstraint(["opportunity_id"], ["opportunities.id"]),
        sa.ForeignKeyConstraint(["saved_by_user_id"], ["users.id"]),
        sa.UniqueConstraint("discovery_id", "version_no", name="uq_discovery_versions_discovery_version_no"),
    )
    op.create_index(
        "idx_discovery_versions_workspace_version",
        "discovery_versions",
        ["workspace_id", "version_no"],
    )
    op.create_index(
        "idx_discovery_versions_opportunity_version",
        "discovery_versions",
        ["opportunity_id", "version_no"],
    )


def downgrade() -> None:
    op.drop_index(
        "idx_discovery_versions_opportunity_version",
        table_name="discovery_versions",
    )
    op.drop_index(
        "idx_discovery_versions_workspace_version",
        table_name="discovery_versions",
    )
    op.drop_table("discovery_versions")

    op.drop_index(
        "idx_discoveries_opportunity_updated",
        table_name="discoveries",
    )
    op.drop_index(
        "idx_discoveries_workspace_updated",
        table_name="discoveries",
    )
    op.drop_table("discoveries")
