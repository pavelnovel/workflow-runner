"""Schemas for runs and run steps."""

from __future__ import annotations

from datetime import datetime
from typing import Any, Optional

from pydantic import Field

from app.schemas.base import ORMModel, TimestampedModel
from app.schemas.templates import TemplateRead, TemplateStepRead


RUN_STATUSES = ["not_started", "in_progress", "done", "archived"]
RUN_STEP_STATUSES = ["not_started", "in_progress", "blocked", "done"]


class RunCreate(ORMModel):
    name: str
    variables: Optional[list[dict[str, Any]]] = None  # Initial variable values


STATUS_REGEX = "^(" + "|".join(RUN_STATUSES) + ")$"
STEP_STATUS_REGEX = "^(" + "|".join(RUN_STEP_STATUSES) + ")$"


class RunUpdate(ORMModel):
    name: Optional[str] = None
    status: Optional[str] = Field(default=None, pattern=STATUS_REGEX)
    variables: Optional[list[dict[str, Any]]] = None  # Update variable values
    current_step_index: Optional[int] = None  # Update current step
    completed: Optional[bool] = None  # Mark workflow as completed
    completed_at: Optional[datetime] = None  # When the workflow was completed


class RunRead(TimestampedModel):
    template_id: int
    name: str
    status: str
    variables: Optional[list[dict[str, Any]]] = None
    current_step_index: Optional[int] = 0
    completed: bool = False
    completed_at: Optional[datetime] = None


class RunWithTemplate(RunRead):
    template: Optional[TemplateRead] = None


class RunStepUpdate(ORMModel):
    status: Optional[str] = Field(default=None, pattern=STEP_STATUS_REGEX)
    notes: Optional[str] = None
    completed_at: Optional[datetime] = None


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
    notes: Optional[str] = None
    completed_at: Optional[datetime] = None
    template_step: Optional[TemplateStepRead] = None
    field_values: list[StepFieldValueRead] = Field(default_factory=list)


class RunDetail(RunRead):
    steps: list[RunStepRead] = Field(default_factory=list)
