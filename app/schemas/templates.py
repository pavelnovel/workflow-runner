"""Schemas for templates, steps, and fields."""

from __future__ import annotations

from typing import Any, Optional, Union

from pydantic import Field

from app.schemas.base import ORMModel, TimestampedModel


class StepFieldDefBase(ORMModel):
    name: str = Field(..., pattern=r"^[a-zA-Z0-9_]+$")
    label: str
    type: str
    required: bool = False
    options_json: Optional[Union[dict[str, Any], list[Any]]] = None
    order_index: int = 1


class StepFieldDefCreate(StepFieldDefBase):
    pass


class StepFieldDefUpdate(ORMModel):
    label: Optional[str] = None
    type: Optional[str] = None
    required: Optional[bool] = None
    options_json: Optional[Union[dict[str, Any], list[Any]]] = None
    order_index: Optional[int] = None


class StepFieldDefRead(TimestampedModel, StepFieldDefBase):
    order_index: int
    template_step_id: int


class TemplateStepBase(ORMModel):
    title: str
    description: Optional[str] = None
    is_required: bool = True
    order_index: Optional[int] = None


class TemplateStepCreate(TemplateStepBase):
    pass


class TemplateStepUpdate(ORMModel):
    title: Optional[str] = None
    description: Optional[str] = None
    is_required: Optional[bool] = None
    order_index: Optional[int] = None


class TemplateStepRead(TimestampedModel, TemplateStepBase):
    order_index: int
    template_id: int
    field_defs: list[StepFieldDefRead] = Field(default_factory=list)


class TemplateBase(ORMModel):
    name: str
    description: Optional[str] = None
    variables: Optional[list[dict[str, Any]]] = None  # Template-level variables for UI
    icon: Optional[str] = None  # Emoji icon for the template
    # Use snake_case for ORM compatibility, with camelCase aliases for frontend
    is_recurring: bool = Field(default=False, alias="isRecurring")  # Whether this is a recurring process
    recurrence_interval: Optional[str] = Field(default=None, alias="recurrenceInterval")  # How often it should run

    model_config = {"populate_by_name": True}  # Allow both snake_case and camelCase


class TemplateCreate(TemplateBase):
    pass


class TemplateUpdate(ORMModel):
    name: Optional[str] = None
    description: Optional[str] = None
    variables: Optional[list[dict[str, Any]]] = None
    icon: Optional[str] = None
    is_recurring: Optional[bool] = Field(default=None, alias="isRecurring")
    recurrence_interval: Optional[str] = Field(default=None, alias="recurrenceInterval")

    model_config = {"populate_by_name": True}  # Allow both snake_case and camelCase


class TemplateRead(TimestampedModel, TemplateBase):
    variables: Optional[list[dict[str, Any]]] = None
    icon: Optional[str] = None
    # Inherited from TemplateBase with aliases, but explicitly declare for serialization
    is_recurring: bool = Field(default=False, alias="isRecurring", serialization_alias="isRecurring")
    recurrence_interval: Optional[str] = Field(default=None, alias="recurrenceInterval", serialization_alias="recurrenceInterval")
    steps: list[TemplateStepRead] = Field(default_factory=list)

    model_config = {"populate_by_name": True, "by_alias": True}  # Serialize using camelCase aliases
