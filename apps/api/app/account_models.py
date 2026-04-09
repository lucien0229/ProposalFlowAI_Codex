from __future__ import annotations

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, String, Table, UniqueConstraint

from app import metadata

users_table = Table(
    "users",
    metadata,
    Column("id", String(64), primary_key=True),
    Column("email", String(320), nullable=False, unique=True),
    Column("full_name", String(160), nullable=False),
    Column("password_hash", String(512), nullable=False),
    Column("primary_auth_provider", String(32), nullable=False),
    Column("is_active", Boolean, nullable=False, default=True),
    Column("created_at", DateTime(timezone=True), nullable=False),
    Column("updated_at", DateTime(timezone=True), nullable=False),
)

workspaces_table = Table(
    "workspaces",
    metadata,
    Column("id", String(64), primary_key=True),
    Column("name", String(160), nullable=False),
    Column("industry_type", String(64), nullable=False),
    Column("default_template_key", String(64), nullable=False),
    Column("default_tone_preference", String(64), nullable=False),
    Column("trial_status", String(64), nullable=False),
    Column("trial_start_at", DateTime(timezone=True), nullable=True),
    Column("trial_end_at", DateTime(timezone=True), nullable=True),
    Column("billing_status", String(64), nullable=False),
    Column("plan_type", String(64), nullable=False),
    Column("stripe_customer_id", String(128), nullable=True),
    Column("stripe_subscription_id", String(128), nullable=True),
    Column("current_period_end", DateTime(timezone=True), nullable=True),
    Column("created_at", DateTime(timezone=True), nullable=False),
    Column("updated_at", DateTime(timezone=True), nullable=False),
)

workspace_members_table = Table(
    "workspace_members",
    metadata,
    Column("workspace_id", String(64), ForeignKey("workspaces.id"), nullable=False),
    Column("user_id", String(64), ForeignKey("users.id"), nullable=False),
    Column("role", String(32), nullable=False),
    Column("joined_at", DateTime(timezone=True), nullable=False),
    Column("is_active", Boolean, nullable=False, default=True),
    UniqueConstraint("workspace_id", "user_id", name="uq_workspace_members_workspace_user"),
)

user_sessions_table = Table(
    "user_sessions",
    metadata,
    Column("id", String(64), primary_key=True),
    Column("user_id", String(64), ForeignKey("users.id"), nullable=False),
    Column("session_type", String(16), nullable=False),
    Column("session_status", String(32), nullable=False),
    Column("csrf_secret", String(128), nullable=False),
    Column("issued_at", DateTime(timezone=True), nullable=False),
    Column("expires_at", DateTime(timezone=True), nullable=False),
    Column("revoked_at", DateTime(timezone=True), nullable=True),
    Column("last_seen_at", DateTime(timezone=True), nullable=False),
    Column("ip_address", String(128), nullable=True),
    Column("user_agent", String(512), nullable=True),
)
