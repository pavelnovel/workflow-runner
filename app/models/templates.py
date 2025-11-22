"""Core checklist domain models."""

from __future__ import annotations

from datetime import datetime
from typing import Any

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    DateTime,
    Enum,
    ForeignKey,
    Integer,
    JSON,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


template_status_enum = Enum(
    "not_started",
    "in_progress",
    "done",
    "archived",
    name="run_status",
)

run_step_status_enum = Enum(
    "not_started",
    "in_progress",
    "blocked",
    "done",
    name="run_step_status",
)


class TimestampMixin:
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )


class Template(Base, TimestampMixin):
    __tablename__ = "templates"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(Text, nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    created_by: Mapped[int | None] = mapped_column(Integer)
    variables: Mapped[Any | None] = mapped_column(JSON)  # Template-level variables for UI integration

    steps: Mapped[list["TemplateStep"]] = relationship(
        back_populates="template", cascade="all, delete-orphan", order_by="TemplateStep.order_index"
    )
    runs: Mapped[list["Run"]] = relationship(back_populates="template")


class TemplateStep(Base, TimestampMixin):
    __tablename__ = "template_steps"
    __table_args__ = (
        CheckConstraint("order_index > 0", name="template_steps_order_positive"),
        UniqueConstraint("template_id", "order_index", name="template_step_order_unique"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    template_id: Mapped[int] = mapped_column(ForeignKey("templates.id", ondelete="CASCADE"), nullable=False)
    order_index: Mapped[int] = mapped_column(Integer, nullable=False)
    title: Mapped[str] = mapped_column(Text, nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    is_required: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    template: Mapped[Template] = relationship(back_populates="steps")
    field_defs: Mapped[list["StepFieldDef"]] = relationship(
        back_populates="template_step", cascade="all, delete-orphan", order_by="StepFieldDef.order_index"
    )
    run_steps: Mapped[list["RunStep"]] = relationship(back_populates="template_step")


class Run(Base, TimestampMixin):
    __tablename__ = "runs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    template_id: Mapped[int] = mapped_column(ForeignKey("templates.id"), nullable=False)
    name: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(template_status_enum, nullable=False, default="not_started")
    created_by: Mapped[int | None] = mapped_column(Integer)
    variables: Mapped[Any | None] = mapped_column(JSON)  # Live variable values for this workflow run
    current_step_index: Mapped[int | None] = mapped_column(Integer, default=0)  # Track current step for UI
    completed: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)  # Workflow completion status

    template: Mapped[Template] = relationship(back_populates="runs")
    steps: Mapped[list["RunStep"]] = relationship(
        back_populates="run", cascade="all, delete-orphan", order_by="RunStep.order_index"
    )


class RunStep(Base, TimestampMixin):
    __tablename__ = "run_steps"
    __table_args__ = (
        CheckConstraint("order_index > 0", name="run_steps_order_positive"),
        UniqueConstraint("run_id", "order_index", name="run_step_order_unique"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    run_id: Mapped[int] = mapped_column(ForeignKey("runs.id", ondelete="CASCADE"), nullable=False)
    template_step_id: Mapped[int] = mapped_column(ForeignKey("template_steps.id"), nullable=False)
    order_index: Mapped[int] = mapped_column(Integer, nullable=False)
    status: Mapped[str] = mapped_column(run_step_status_enum, nullable=False, default="not_started")
    notes: Mapped[str | None] = mapped_column(Text)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime)

    run: Mapped[Run] = relationship(back_populates="steps")
    template_step: Mapped[TemplateStep] = relationship(back_populates="run_steps")
    field_values: Mapped[list["StepFieldValue"]] = relationship(
        back_populates="run_step", cascade="all, delete-orphan"
    )


class StepFieldDef(Base, TimestampMixin):
    __tablename__ = "step_field_defs"
    __table_args__ = (
        UniqueConstraint("template_step_id", "name", name="step_field_unique_name"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    template_step_id: Mapped[int] = mapped_column(
        ForeignKey("template_steps.id", ondelete="CASCADE"), nullable=False
    )
    name: Mapped[str] = mapped_column(Text, nullable=False)
    label: Mapped[str] = mapped_column(Text, nullable=False)
    type: Mapped[str] = mapped_column(Text, nullable=False)
    required: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    options_json: Mapped[Any | None] = mapped_column(JSON)
    order_index: Mapped[int] = mapped_column(Integer, nullable=False, default=1)

    template_step: Mapped[TemplateStep] = relationship(back_populates="field_defs")
    values: Mapped[list["StepFieldValue"]] = relationship(back_populates="field_def")


class StepFieldValue(Base, TimestampMixin):
    __tablename__ = "step_field_values"
    __table_args__ = (
        UniqueConstraint("run_step_id", "field_def_id", name="run_step_field_unique"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    run_step_id: Mapped[int] = mapped_column(
        ForeignKey("run_steps.id", ondelete="CASCADE"), nullable=False
    )
    field_def_id: Mapped[int] = mapped_column(
        ForeignKey("step_field_defs.id", ondelete="CASCADE"), nullable=False
    )
    value: Mapped[Any | None] = mapped_column(JSON)

    run_step: Mapped[RunStep] = relationship(back_populates="field_values")
    field_def: Mapped[StepFieldDef] = relationship(back_populates="values")
