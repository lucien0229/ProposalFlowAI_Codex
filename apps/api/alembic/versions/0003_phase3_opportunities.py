"""Add account, workspace, session, and opportunity tables.

Revision ID: 0003_phase3_opportunities
Revises: 0002_activity_logs_security
Create Date: 2026-04-09 00:00:02.000000
"""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "0003_phase3_opportunities"
down_revision = "0002_activity_logs_security"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.String(length=64), primary_key=True),
        sa.Column("email", sa.String(length=320), nullable=False, unique=True),
        sa.Column("full_name", sa.String(length=160), nullable=False),
        sa.Column("password_hash", sa.String(length=512), nullable=False),
        sa.Column("primary_auth_provider", sa.String(length=32), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_table(
        "workspaces",
        sa.Column("id", sa.String(length=64), primary_key=True),
        sa.Column("name", sa.String(length=160), nullable=False),
        sa.Column("industry_type", sa.String(length=64), nullable=False),
        sa.Column("default_template_key", sa.String(length=64), nullable=False),
        sa.Column("default_tone_preference", sa.String(length=64), nullable=False),
        sa.Column("trial_status", sa.String(length=64), nullable=False),
        sa.Column("trial_start_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("trial_end_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("billing_status", sa.String(length=64), nullable=False),
        sa.Column("plan_type", sa.String(length=64), nullable=False),
        sa.Column("stripe_customer_id", sa.String(length=128), nullable=True),
        sa.Column("stripe_subscription_id", sa.String(length=128), nullable=True),
        sa.Column("current_period_end", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_table(
        "workspace_members",
        sa.Column("workspace_id", sa.String(length=64), nullable=False),
        sa.Column("user_id", sa.String(length=64), nullable=False),
        sa.Column("role", sa.String(length=32), nullable=False),
        sa.Column("joined_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.ForeignKeyConstraint(["workspace_id"], ["workspaces.id"]),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.UniqueConstraint("workspace_id", "user_id", name="uq_workspace_members_workspace_user"),
    )
    op.create_index(
        "idx_workspace_members_user",
        "workspace_members",
        ["user_id"],
    )
    op.create_table(
        "user_sessions",
        sa.Column("id", sa.String(length=64), primary_key=True),
        sa.Column("user_id", sa.String(length=64), nullable=False),
        sa.Column("session_type", sa.String(length=16), nullable=False),
        sa.Column("session_status", sa.String(length=32), nullable=False),
        sa.Column("csrf_secret", sa.String(length=128), nullable=False),
        sa.Column("issued_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("revoked_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("last_seen_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("ip_address", sa.String(length=128), nullable=True),
        sa.Column("user_agent", sa.String(length=512), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
    )
    op.create_table(
        "opportunities",
        sa.Column("id", sa.String(length=64), primary_key=True),
        sa.Column("workspace_id", sa.String(length=64), nullable=False),
        sa.Column("owner_user_id", sa.String(length=64), nullable=False),
        sa.Column("title", sa.String(length=200), nullable=False),
        sa.Column("source_type", sa.String(length=64), nullable=True),
        sa.Column("company_name", sa.String(length=200), nullable=False),
        sa.Column("contact_name", sa.String(length=160), nullable=True),
        sa.Column("contact_email", sa.String(length=320), nullable=True),
        sa.Column("requested_service", sa.String(length=400), nullable=True),
        sa.Column("status", sa.String(length=64), nullable=False),
        sa.Column("archived_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index(
        "idx_opportunities_workspace_updated",
        "opportunities",
        ["workspace_id", "updated_at"],
    )
    op.create_index(
        "idx_opportunities_workspace_status",
        "opportunities",
        ["workspace_id", "status"],
    )
    op.create_index(
        "idx_opportunities_workspace_owner",
        "opportunities",
        ["workspace_id", "owner_user_id"],
    )


def downgrade() -> None:
    op.drop_index("idx_opportunities_workspace_owner", table_name="opportunities")
    op.drop_index("idx_opportunities_workspace_status", table_name="opportunities")
    op.drop_index("idx_opportunities_workspace_updated", table_name="opportunities")
    op.drop_table("opportunities")
    op.drop_table("user_sessions")
    op.drop_index("idx_workspace_members_user", table_name="workspace_members")
    op.drop_table("workspace_members")
    op.drop_table("workspaces")
    op.drop_table("users")
