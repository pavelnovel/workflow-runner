"""Initial schema for templates, runs, and steps."""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa


revision = "20240301_000001"
down_revision = None
branch_labels = None
depends_on = None


run_status = sa.Enum(
    "not_started",
    "in_progress",
    "done",
    "archived",
    name="run_status",
)

run_step_status = sa.Enum(
    "not_started",
    "in_progress",
    "blocked",
    "done",
    name="run_step_status",
)


def upgrade() -> None:
    op.create_table(
        "templates",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("name", sa.Text(), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("created_by", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
    )

    op.create_table(
        "template_steps",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("template_id", sa.Integer(), nullable=False),
        sa.Column("order_index", sa.Integer(), nullable=False),
        sa.Column("title", sa.Text(), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("is_required", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(["template_id"], ["templates.id"], ondelete="CASCADE"),
        sa.CheckConstraint("order_index > 0", name="template_steps_order_positive"),
        sa.UniqueConstraint("template_id", "order_index", name="template_step_order_unique"),
    )

    op.create_table(
        "runs",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("template_id", sa.Integer(), nullable=False),
        sa.Column("name", sa.Text(), nullable=False),
        sa.Column("status", run_status, nullable=False, server_default="not_started"),
        sa.Column("created_by", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(["template_id"], ["templates.id"]),
    )

    op.create_index("idx_runs_template_status", "runs", ["template_id", "status"])

    op.create_table(
        "run_steps",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("run_id", sa.Integer(), nullable=False),
        sa.Column("template_step_id", sa.Integer(), nullable=False),
        sa.Column("order_index", sa.Integer(), nullable=False),
        sa.Column("status", run_step_status, nullable=False, server_default="not_started"),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("completed_at", sa.DateTime(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(["run_id"], ["runs.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["template_step_id"], ["template_steps.id"]),
        sa.CheckConstraint("order_index > 0", name="run_steps_order_positive"),
        sa.UniqueConstraint("run_id", "order_index", name="run_step_order_unique"),
    )

    op.create_table(
        "step_field_defs",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("template_step_id", sa.Integer(), nullable=False),
        sa.Column("name", sa.Text(), nullable=False),
        sa.Column("label", sa.Text(), nullable=False),
        sa.Column("type", sa.Text(), nullable=False),
        sa.Column("required", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("options_json", sa.JSON(), nullable=True),
        sa.Column("order_index", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(["template_step_id"], ["template_steps.id"], ondelete="CASCADE"),
        sa.UniqueConstraint("template_step_id", "name", name="step_field_unique_name"),
    )

    op.create_table(
        "step_field_values",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("run_step_id", sa.Integer(), nullable=False),
        sa.Column("field_def_id", sa.Integer(), nullable=False),
        sa.Column("value", sa.JSON(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(["run_step_id"], ["run_steps.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["field_def_id"], ["step_field_defs.id"], ondelete="CASCADE"),
        sa.UniqueConstraint("run_step_id", "field_def_id", name="run_step_field_unique"),
    )


def downgrade() -> None:
    op.drop_table("step_field_values")
    op.drop_table("step_field_defs")
    op.drop_table("run_steps")
    op.drop_index("idx_runs_template_status", table_name="runs")
    op.drop_table("runs")
    op.drop_table("template_steps")
    op.drop_table("templates")
    run_step_status.drop(op.get_bind(), checkfirst=False)
    run_status.drop(op.get_bind(), checkfirst=False)
