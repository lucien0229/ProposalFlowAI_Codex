"""Add proposal draft current and version tables.

Revision ID: 0010_phase7_proposal_draft
Revises: 0009_phase7_templates_rules
Create Date: 2026-04-13 00:00:00.000000
"""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "0010_phase7_proposal_draft"
down_revision = "0009_phase7_templates_rules"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "proposal_drafts",
        sa.Column("id", sa.String(length=64), primary_key=True),
        sa.Column("workspace_id", sa.String(length=64), nullable=False),
        sa.Column("opportunity_id", sa.String(length=64), nullable=False),
        sa.Column("template_key", sa.String(length=64), nullable=False),
        sa.Column("current_payload", sa.JSON(), nullable=False),
        sa.Column("current_revision_no", sa.Integer(), nullable=False),
        sa.Column("latest_version_no", sa.Integer(), nullable=False),
        sa.Column("last_ai_call_id", sa.String(length=128), nullable=True),
        sa.Column("updated_by_user_id", sa.String(length=64), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["workspace_id"], ["workspaces.id"]),
        sa.ForeignKeyConstraint(["opportunity_id"], ["opportunities.id"]),
        sa.ForeignKeyConstraint(["updated_by_user_id"], ["users.id"]),
        sa.UniqueConstraint("opportunity_id", name="uq_proposal_drafts_opportunity_id"),
    )
    op.create_index(
        "idx_proposal_drafts_workspace_updated",
        "proposal_drafts",
        ["workspace_id", "updated_at"],
    )
    op.create_index(
        "idx_proposal_drafts_opportunity_updated",
        "proposal_drafts",
        ["opportunity_id", "updated_at"],
    )

    op.create_table(
        "proposal_draft_versions",
        sa.Column("id", sa.String(length=64), primary_key=True),
        sa.Column("proposal_draft_id", sa.String(length=64), nullable=False),
        sa.Column("workspace_id", sa.String(length=64), nullable=False),
        sa.Column("opportunity_id", sa.String(length=64), nullable=False),
        sa.Column("template_key", sa.String(length=64), nullable=False),
        sa.Column("version_no", sa.Integer(), nullable=False),
        sa.Column("current_revision_no", sa.Integer(), nullable=False),
        sa.Column("payload", sa.JSON(), nullable=False),
        sa.Column("version_origin", sa.String(length=32), nullable=False),
        sa.Column("version_note", sa.String(length=255), nullable=True),
        sa.Column("saved_by_user_id", sa.String(length=64), nullable=True),
        sa.Column("saved_by_name", sa.String(length=160), nullable=True),
        sa.Column("ai_call_id", sa.String(length=128), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("saved_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["proposal_draft_id"], ["proposal_drafts.id"]),
        sa.ForeignKeyConstraint(["workspace_id"], ["workspaces.id"]),
        sa.ForeignKeyConstraint(["opportunity_id"], ["opportunities.id"]),
        sa.ForeignKeyConstraint(["saved_by_user_id"], ["users.id"]),
        sa.UniqueConstraint(
            "proposal_draft_id",
            "version_no",
            name="uq_proposal_draft_versions_proposal_draft_version_no",
        ),
    )
    op.create_index(
        "idx_proposal_draft_versions_workspace_version",
        "proposal_draft_versions",
        ["workspace_id", "version_no"],
    )
    op.create_index(
        "idx_proposal_draft_versions_opportunity_version",
        "proposal_draft_versions",
        ["opportunity_id", "version_no"],
    )


def downgrade() -> None:
    op.drop_index("idx_proposal_draft_versions_opportunity_version", table_name="proposal_draft_versions")
    op.drop_index("idx_proposal_draft_versions_workspace_version", table_name="proposal_draft_versions")
    op.drop_table("proposal_draft_versions")
    op.drop_index("idx_proposal_drafts_opportunity_updated", table_name="proposal_drafts")
    op.drop_index("idx_proposal_drafts_workspace_updated", table_name="proposal_drafts")
    op.drop_table("proposal_drafts")
