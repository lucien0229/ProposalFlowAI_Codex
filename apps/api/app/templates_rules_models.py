from __future__ import annotations

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, JSON, String, Table, UniqueConstraint

from app import metadata

template_definitions_table = Table(
    "template_definitions",
    metadata,
    Column("template_key", String(64), primary_key=True),
    Column("name", String(160), nullable=False),
    Column("industry_scope", String(64), nullable=False),
    Column("section_order", JSON, nullable=False),
    Column("required_sections", JSON, nullable=False),
    Column("default_service_modules", JSON, nullable=False),
    Column("is_active", Boolean, nullable=False, default=True),
    Column("created_at", DateTime(timezone=True), nullable=False),
    Column("updated_at", DateTime(timezone=True), nullable=False),
)

workspace_rule_sets_table = Table(
    "workspace_rule_sets",
    metadata,
    Column("workspace_id", String(64), ForeignKey("workspaces.id"), primary_key=True),
    Column("template_key", String(64), ForeignKey("template_definitions.template_key"), nullable=False),
    Column("template_scope", String(64), nullable=False),
    Column("tone_profile", String(64), nullable=False),
    Column("default_assumptions", JSON, nullable=False),
    Column("default_exclusions", JSON, nullable=False),
    Column("preferred_terminology", JSON, nullable=False),
    Column("banned_terminology", JSON, nullable=False),
    Column("service_modules", JSON, nullable=False),
    Column("section_order", JSON, nullable=False),
    Column("required_sections", JSON, nullable=False),
    Column("default_cta_style", String(64), nullable=False),
    Column("updated_by_user_id", String(64), ForeignKey("users.id"), nullable=True),
    Column("created_at", DateTime(timezone=True), nullable=False),
    Column("updated_at", DateTime(timezone=True), nullable=False),
)

opportunity_rule_overrides_table = Table(
    "opportunity_rule_overrides",
    metadata,
    Column("workspace_id", String(64), ForeignKey("workspaces.id"), nullable=False),
    Column("opportunity_id", String(64), ForeignKey("opportunities.id"), nullable=False),
    Column("is_active", Boolean, nullable=False, default=True),
    Column("template_key_override", String(64), ForeignKey("template_definitions.template_key"), nullable=True),
    Column("tone_profile_override", String(64), nullable=True),
    Column("assumptions_override", JSON, nullable=True),
    Column("exclusions_override", JSON, nullable=True),
    Column("service_modules_override", JSON, nullable=True),
    Column("preferred_terminology_additions", JSON, nullable=True),
    Column("banned_terminology_additions", JSON, nullable=True),
    Column("default_cta_style_override", String(64), nullable=True),
    Column("updated_by_user_id", String(64), ForeignKey("users.id"), nullable=True),
    Column("created_at", DateTime(timezone=True), nullable=False),
    Column("updated_at", DateTime(timezone=True), nullable=False),
    UniqueConstraint("opportunity_id", name="uq_opportunity_rule_overrides_opportunity_id"),
)
