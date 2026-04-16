"""Add template definitions, workspace rule sets, and opportunity rule overrides.

Revision ID: 0009_phase7_templates_rules
Revises: 0008_phase6_discovery_workspace
Create Date: 2026-04-13 00:00:00.000000
"""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "0009_phase7_templates_rules"
down_revision = "0008_phase6_discovery_workspace"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "template_definitions",
        sa.Column("template_key", sa.String(length=64), primary_key=True),
        sa.Column("name", sa.String(length=160), nullable=False),
        sa.Column("industry_scope", sa.String(length=64), nullable=False),
        sa.Column("section_order", sa.JSON(), nullable=False),
        sa.Column("required_sections", sa.JSON(), nullable=False),
        sa.Column("default_service_modules", sa.JSON(), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )

    op.create_table(
        "workspace_rule_sets",
        sa.Column("workspace_id", sa.String(length=64), primary_key=True),
        sa.Column("template_key", sa.String(length=64), nullable=False),
        sa.Column("template_scope", sa.String(length=64), nullable=False),
        sa.Column("tone_profile", sa.String(length=64), nullable=False),
        sa.Column("default_assumptions", sa.JSON(), nullable=False),
        sa.Column("default_exclusions", sa.JSON(), nullable=False),
        sa.Column("preferred_terminology", sa.JSON(), nullable=False),
        sa.Column("banned_terminology", sa.JSON(), nullable=False),
        sa.Column("service_modules", sa.JSON(), nullable=False),
        sa.Column("section_order", sa.JSON(), nullable=False),
        sa.Column("required_sections", sa.JSON(), nullable=False),
        sa.Column("default_cta_style", sa.String(length=64), nullable=False),
        sa.Column("updated_by_user_id", sa.String(length=64), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["workspace_id"], ["workspaces.id"]),
        sa.ForeignKeyConstraint(["template_key"], ["template_definitions.template_key"]),
        sa.ForeignKeyConstraint(["updated_by_user_id"], ["users.id"]),
    )

    op.create_table(
        "opportunity_rule_overrides",
        sa.Column("workspace_id", sa.String(length=64), nullable=False),
        sa.Column("opportunity_id", sa.String(length=64), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.Column("template_key_override", sa.String(length=64), nullable=True),
        sa.Column("tone_profile_override", sa.String(length=64), nullable=True),
        sa.Column("assumptions_override", sa.JSON(), nullable=True),
        sa.Column("exclusions_override", sa.JSON(), nullable=True),
        sa.Column("service_modules_override", sa.JSON(), nullable=True),
        sa.Column("preferred_terminology_additions", sa.JSON(), nullable=True),
        sa.Column("banned_terminology_additions", sa.JSON(), nullable=True),
        sa.Column("default_cta_style_override", sa.String(length=64), nullable=True),
        sa.Column("updated_by_user_id", sa.String(length=64), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["workspace_id"], ["workspaces.id"]),
        sa.ForeignKeyConstraint(["opportunity_id"], ["opportunities.id"]),
        sa.ForeignKeyConstraint(["template_key_override"], ["template_definitions.template_key"]),
        sa.ForeignKeyConstraint(["updated_by_user_id"], ["users.id"]),
        sa.UniqueConstraint("opportunity_id", name="uq_opportunity_rule_overrides_opportunity_id"),
    )


def downgrade() -> None:
    op.drop_table("opportunity_rule_overrides")
    op.drop_table("workspace_rule_sets")
    op.drop_table("template_definitions")
