"""Preserve opportunity status across archive restore.

Revision ID: 0004_archive_restore_cursor_guards
Revises: 0003_phase3_opportunities
Create Date: 2026-04-09 01:30:00.000000
"""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "0004_archive_restore_cursor_guards"
down_revision = "0003_phase3_opportunities"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "opportunities",
        sa.Column("status_before_archive", sa.String(length=64), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("opportunities", "status_before_archive")
