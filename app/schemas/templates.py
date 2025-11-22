"""Schemas for templates, steps, and fields."""

from __future__ import annotations

from typing import Any

from pydantic import Field

from app.schemas.base import ORMModel, TimestampedModel


class StepFieldDefBase(ORMModel):
    name: str = Field(..., pattern=r"^[a-zA-Z0-9_]+$")
    label: str
    type: str
    required: bool = False
    options_json: dict[str, Any] | list[Any] | None = None
    order_index: int = 1


class StepFieldDefCreate(StepFieldDefBase):
    pass


class StepFieldDefUpdate(ORMModel):
    label: str | None = None
    type: str | None = None
    required: bool | None = None
    options_json: dict[str, Any] | list[Any] | None = None
    order_index: int | None = None


class StepFieldDefRead(TimestampedModel, StepFieldDefBase):
    order_index: int
    template_step_id: int


class TemplateStepBase(ORMModel):
    title: str
    description: str | None = None
    is_required: bool = True
    order_index: int | None = None


class TemplateStepCreate(TemplateStepBase):
    pass


class TemplateStepUpdate(ORMModel):
    title: str | None = None
    description: str | None = None
    is_required: bool | None = None
    order_index: int | None = None


class TemplateStepRead(TimestampedModel, TemplateStepBase):
    order_index: int
    template_id: int
    field_defs: list[StepFieldDefRead] = Field(default_factory=list)


class TemplateBase(ORMModel):
    name: str
    description: str | None = None
    variables: list[dict[str, Any]] | None = None  # Template-level variables for UI


class TemplateCreate(TemplateBase):
    pass


class TemplateUpdate(ORMModel):
    name: str | None = None
    description: str | None = None
    variables: list[dict[str, Any]] | None = None


class TemplateRead(TimestampedModel, TemplateBase):
    variables: list[dict[str, Any]] | None = None
    steps: list[TemplateStepRead] = Field(default_factory=list)
