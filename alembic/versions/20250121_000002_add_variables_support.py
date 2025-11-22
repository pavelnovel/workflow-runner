"""Add variables support to templates and runs for UI integration."""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision = "20250121_000002"
down_revision = "20240301_000001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add variables column to templates table
    op.add_column(
        "templates",
        sa.Column("variables", postgresql.JSON(astext_type=sa.Text()), nullable=True)
    )

    # Add variables, current_step_index, and completed columns to runs table
    op.add_column(
        "runs",
        sa.Column("variables", postgresql.JSON(astext_type=sa.Text()), nullable=True)
    )
    op.add_column(
        "runs",
        sa.Column("current_step_index", sa.Integer(), nullable=True, server_default="0")
    )
    op.add_column(
        "runs",
        sa.Column("completed", sa.Boolean(), nullable=False, server_default=sa.false())
    )


def downgrade() -> None:
    # Remove columns from runs table
    op.drop_column("runs", "completed")
    op.drop_column("runs", "current_step_index")
    op.drop_column("runs", "variables")

    # Remove column from templates table
    op.drop_column("templates", "variables")
