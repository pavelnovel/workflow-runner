"""Schemas for runs and run steps."""

from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import Field

from app.schemas.base import ORMModel, TimestampedModel
from app.schemas.templates import TemplateRead, TemplateStepRead


RUN_STATUSES = ["not_started", "in_progress", "done", "archived"]
RUN_STEP_STATUSES = ["not_started", "in_progress", "blocked", "done"]


class RunCreate(ORMModel):
    name: str
    variables: list[dict[str, Any]] | None = None  # Initial variable values


STATUS_REGEX = "^(" + "|".join(RUN_STATUSES) + ")$"
STEP_STATUS_REGEX = "^(" + "|".join(RUN_STEP_STATUSES) + ")$"


class RunUpdate(ORMModel):
    name: str | None = None
    status: str | None = Field(default=None, pattern=STATUS_REGEX)
    variables: list[dict[str, Any]] | None = None  # Update variable values
    current_step_index: int | None = None  # Update current step
    completed: bool | None = None  # Mark workflow as completed
    completed_at: datetime | None = None  # When the workflow was completed


class RunRead(TimestampedModel):
    template_id: int
    name: str
    status: str
    variables: list[dict[str, Any]] | None = None
    current_step_index: int | None = 0
    completed: bool = False
    completed_at: datetime | None = None


class RunWithTemplate(RunRead):
    template: TemplateRead | None = None


class RunStepUpdate(ORMModel):
    status: str | None = Field(default=None, pattern=STEP_STATUS_REGEX)
    notes: str | None = None
    completed_at: datetime | None = None


class FieldValuePayload(ORMModel):
    field_def_id: int
    value: Any


class FieldValueUpsertRequest(ORMModel):
    values: list[FieldValuePayload] = Field(default_factory=list)


class StepFieldValueRead(TimestampedModel):
    run_step_id: int
    field_def_id: int
    value: Any


class RunStepRead(TimestampedModel):
    run_id: int
    template_step_id: int
    order_index: int
    status: str
    notes: str | None = None
    completed_at: datetime | None = None
    template_step: TemplateStepRead | None = None
    field_values: list[StepFieldValueRead] = Field(default_factory=list)


class RunDetail(RunRead):
    steps: list[RunStepRead] = Field(default_factory=list)
