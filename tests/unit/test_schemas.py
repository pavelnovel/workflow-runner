"""
UNIT TESTS - Pydantic Schemas

Tests for schema validation and data transformation.
"""

import pytest
from pydantic import ValidationError

from app.schemas.templates import (
    TemplateCreate,
    TemplateUpdate,
    StepCreate,
    StepFieldDefCreate,
)
from app.schemas.runs import RunCreate, RunStepUpdate


class TestTemplateSchemas:
    """Tests for template-related schemas."""

    def test_template_create_valid(self):
        """Should accept valid template data."""
        template = TemplateCreate(
            name="Test Template",
            description="A test template",
        )
        assert template.name == "Test Template"
        assert template.description == "A test template"

    def test_template_create_minimal(self):
        """Should accept minimal required fields."""
        template = TemplateCreate(name="Minimal Template")
        assert template.name == "Minimal Template"
        assert template.description is None

    def test_template_create_with_recurrence(self):
        """Should accept recurrence settings."""
        template = TemplateCreate(
            name="Recurring Template",
            is_recurring=True,
            recurrence_interval="weekly",
        )
        assert template.is_recurring is True
        assert template.recurrence_interval == "weekly"

    def test_template_update_partial(self):
        """Should allow partial updates."""
        update = TemplateUpdate(name="Updated Name")
        assert update.name == "Updated Name"
        assert update.description is None

    def test_template_update_empty(self):
        """Should allow empty update."""
        update = TemplateUpdate()
        assert update.name is None


class TestStepSchemas:
    """Tests for step-related schemas."""

    def test_step_create_valid(self):
        """Should accept valid step data."""
        step = StepCreate(
            title="Test Step",
            description="Do something important",
        )
        assert step.title == "Test Step"
        assert step.description == "Do something important"

    def test_step_create_with_order(self):
        """Should accept order index."""
        step = StepCreate(
            title="Ordered Step",
            description="With order",
            order_index=5,
        )
        assert step.order_index == 5


class TestFieldSchemas:
    """Tests for field definition schemas."""

    def test_field_create_valid(self):
        """Should accept valid field data."""
        field = StepFieldDefCreate(
            name="project_name",
            label="Project Name",
            field_type="text",
        )
        assert field.name == "project_name"
        assert field.label == "Project Name"

    def test_field_name_validation_alphanumeric(self):
        """Should accept alphanumeric field names."""
        field = StepFieldDefCreate(
            name="myField123",
            label="My Field",
            field_type="text",
        )
        assert field.name == "myField123"

    def test_field_name_validation_with_underscore(self):
        """Should accept underscores in field names."""
        field = StepFieldDefCreate(
            name="my_field_name",
            label="My Field",
            field_type="text",
        )
        assert field.name == "my_field_name"

    def test_field_name_validation_rejects_spaces(self):
        """Should reject field names with spaces."""
        with pytest.raises(ValidationError):
            StepFieldDefCreate(
                name="my field",
                label="My Field",
                field_type="text",
            )

    def test_field_name_validation_rejects_special_chars(self):
        """Should reject field names with special characters."""
        with pytest.raises(ValidationError):
            StepFieldDefCreate(
                name="my-field",
                label="My Field",
                field_type="text",
            )


class TestRunSchemas:
    """Tests for run-related schemas."""

    def test_run_create_with_variables(self):
        """Should accept variables dict."""
        run = RunCreate(
            variables={"projectName": "Test Project", "deadline": "2024-12-31"}
        )
        assert run.variables["projectName"] == "Test Project"

    def test_run_create_empty_variables(self):
        """Should allow empty variables."""
        run = RunCreate(variables={})
        assert run.variables == {}

    def test_run_create_default_variables(self):
        """Should default to empty variables."""
        run = RunCreate()
        assert run.variables == {}

    def test_run_step_update_status(self):
        """Should accept valid status."""
        update = RunStepUpdate(status="done")
        assert update.status == "done"

    def test_run_step_update_valid_statuses(self):
        """Should accept all valid status values."""
        valid_statuses = ["not_started", "in_progress", "blocked", "done"]
        for status in valid_statuses:
            update = RunStepUpdate(status=status)
            assert update.status == status

    def test_run_step_update_with_notes(self):
        """Should accept notes."""
        update = RunStepUpdate(notes="Some notes about this step")
        assert update.notes == "Some notes about this step"
