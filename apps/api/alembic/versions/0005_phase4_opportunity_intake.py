"""Add opportunity intake inputs table.

Revision ID: 0005_phase4_opportunity_intake
Revises: 0004_archive_restore_cursor_guards
Create Date: 2026-04-10 00:00:00.000000
"""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "0005_phase4_opportunity_intake"
down_revision = "0004_archive_restore_cursor_guards"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "opportunity_inputs",
        sa.Column("id", sa.String(length=64), primary_key=True),
        sa.Column("workspace_id", sa.String(length=64), nullable=False),
        sa.Column("opportunity_id", sa.String(length=64), nullable=False),
        sa.Column("input_type", sa.String(length=32), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("source_label", sa.String(length=160), nullable=True),
        sa.Column("file_status", sa.String(length=32), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["workspace_id"], ["workspaces.id"]),
        sa.ForeignKeyConstraint(["opportunity_id"], ["opportunities.id"]),
    )
    op.create_index(
        "idx_opportunity_inputs_opportunity_updated",
        "opportunity_inputs",
        ["opportunity_id", "updated_at"],
    )
    op.create_index(
        "idx_opportunity_inputs_workspace_updated",
        "opportunity_inputs",
        ["workspace_id", "updated_at"],
    )


def downgrade() -> None:
    op.drop_index(
        "idx_opportunity_inputs_opportunity_updated",
        table_name="opportunity_inputs",
    )
    op.drop_index(
        "idx_opportunity_inputs_workspace_updated",
        table_name="opportunity_inputs",
    )
    op.drop_table("opportunity_inputs")
