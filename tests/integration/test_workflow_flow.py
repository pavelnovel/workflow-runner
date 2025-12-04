"""
INTEGRATION TESTS - Complete Workflow Flow

Tests the entire workflow from template creation to run completion.
"""

import pytest
from fastapi.testclient import TestClient


class TestCompleteWorkflowFlow:
    """End-to-end workflow flow tests."""

    def test_full_workflow_lifecycle(self, client: TestClient):
        """
        Test complete workflow lifecycle:
        1. Create template
        2. Add steps
        3. Add field definitions
        4. Create run
        5. Complete steps
        6. Verify completion
        """
        # 1. Create template
        template_response = client.post(
            "/api/v1/templates",
            json={
                "name": "Full Lifecycle Template",
                "description": "Testing complete workflow",
            },
        )
        assert template_response.status_code == 201
        template = template_response.json()
        template_id = template["id"]

        # 2. Add steps (order_index auto-increments, so don't specify)
        step1_response = client.post(
            f"/api/v1/templates/{template_id}/steps",
            json={
                "title": "Step 1: Setup",
                "description": "Initial setup for {{projectName}}",
            },
        )
        assert step1_response.status_code == 201
        step1_id = step1_response.json()["id"]

        step2_response = client.post(
            f"/api/v1/templates/{template_id}/steps",
            json={
                "title": "Step 2: Execute",
                "description": "Execute the main task",
            },
        )
        assert step2_response.status_code == 201

        step3_response = client.post(
            f"/api/v1/templates/{template_id}/steps",
            json={
                "title": "Step 3: Review",
                "description": "Review and finalize",
            },
        )
        assert step3_response.status_code == 201

        # 3. Add field definition to step 1 (use 'type' not 'field_type')
        field_response = client.post(
            f"/api/v1/template-steps/{step1_id}/fields",
            json={
                "name": "project_name",
                "label": "Project Name",
                "type": "text",
                "required": True,
            },
        )
        assert field_response.status_code == 201

        # 4. Create run from template (name is required, variables is a list)
        run_response = client.post(
            f"/api/v1/templates/{template_id}/runs",
            json={
                "name": "Test Project Alpha Run",
                "variables": [{"key": "projectName", "value": "Test Project Alpha"}],
            },
        )
        assert run_response.status_code == 201
        run = run_response.json()
        run_id = run["id"]

        # Get run details to find step IDs
        run_detail_response = client.get(f"/api/v1/runs/{run_id}")
        assert run_detail_response.status_code == 200
        run_detail = run_detail_response.json()

        # Verify run has 3 steps
        assert len(run_detail.get("steps", [])) == 3

        # 5. Complete steps one by one
        for step in run_detail["steps"]:
            step_update_response = client.patch(
                f"/api/v1/runs/{run_id}/steps/{step['id']}",
                json={"status": "done"},
            )
            assert step_update_response.status_code == 200

        # 6. Mark run as completed
        run_update_response = client.patch(
            f"/api/v1/runs/{run_id}",
            json={"status": "done"},
        )
        assert run_update_response.status_code == 200

        # Verify final state
        final_run = client.get(f"/api/v1/runs/{run_id}").json()
        assert final_run["status"] == "done"

    def test_template_with_multiple_variables(self, client: TestClient):
        """Test creating and running a template with multiple variables."""
        # Create template
        template_response = client.post(
            "/api/v1/templates",
            json={
                "name": "Multi-Variable Template",
                "description": "Template with multiple variables",
            },
        )
        template_id = template_response.json()["id"]

        # Add a step
        client.post(
            f"/api/v1/templates/{template_id}/steps",
            json={
                "title": "Use Variables",
                "description": "Work with {{var1}}, {{var2}}, and {{var3}}",
            },
        )

        # Create run with multiple variables (as list of dicts)
        run_response = client.post(
            f"/api/v1/templates/{template_id}/runs",
            json={
                "name": "Multi-Variable Run",
                "variables": [
                    {"key": "var1", "value": "Value One"},
                    {"key": "var2", "value": "Value Two"},
                    {"key": "var3", "value": "Value Three"},
                ],
            },
        )
        assert run_response.status_code == 201
        run = run_response.json()

        # Verify variables are stored (as list)
        assert len(run["variables"]) == 3

    def test_recurring_template_workflow(self, client: TestClient):
        """Test workflow with recurring template settings."""
        # Create recurring template (use camelCase aliases)
        template_response = client.post(
            "/api/v1/templates",
            json={
                "name": "Weekly Review",
                "description": "Recurring weekly review process",
                "isRecurring": True,
                "recurrenceInterval": "weekly",
            },
        )
        assert template_response.status_code == 201
        template = template_response.json()

        # Check for camelCase keys (API returns with aliases)
        assert template.get("isRecurring") is True or template.get("is_recurring") is True
        assert template.get("recurrenceInterval") == "weekly" or template.get("recurrence_interval") == "weekly"

        # Add steps
        client.post(
            f"/api/v1/templates/{template['id']}/steps",
            json={"title": "Review Metrics", "description": "Check weekly metrics"},
        )

        # Create multiple runs (simulating recurring usage)
        for i in range(3):
            run_response = client.post(
                f"/api/v1/templates/{template['id']}/runs",
                json={
                    "name": f"Week {i + 1} Review",
                    "variables": [{"key": "weekNumber", "value": str(i + 1)}],
                },
            )
            assert run_response.status_code == 201

        # Verify multiple runs exist
        runs_response = client.get("/api/v1/runs")
        assert runs_response.status_code == 200


class TestFieldValueCapture:
    """Tests for field value capture during runs."""

    def test_capture_field_values(self, client: TestClient):
        """Test capturing field values during a run."""
        # Create template with step
        template_response = client.post(
            "/api/v1/templates",
            json={"name": "Field Capture Template", "description": "Test"},
        )
        template_id = template_response.json()["id"]

        step_response = client.post(
            f"/api/v1/templates/{template_id}/steps",
            json={"title": "Capture Data", "description": "Enter values"},
        )
        step_id = step_response.json()["id"]

        # Add field definitions (use 'type' not 'field_type')
        field1_resp = client.post(
            f"/api/v1/template-steps/{step_id}/fields",
            json={"name": "email", "label": "Email", "type": "text"},
        )
        field2_resp = client.post(
            f"/api/v1/template-steps/{step_id}/fields",
            json={"name": "priority", "label": "Priority", "type": "text"},
        )

        # Create run (name is required)
        run_response = client.post(
            f"/api/v1/templates/{template_id}/runs",
            json={"name": "Field Capture Run"},
        )
        assert run_response.status_code == 201
        run_id = run_response.json()["id"]

        # Get run step ID
        run_detail = client.get(f"/api/v1/runs/{run_id}").json()
        assert len(run_detail.get("steps", [])) > 0
        run_step_id = run_detail["steps"][0]["id"]

        # Get field def IDs
        field1_id = field1_resp.json()["id"]
        field2_id = field2_resp.json()["id"]

        # Capture field values using the correct endpoint and format
        field_response = client.post(
            f"/api/v1/runs/{run_id}/steps/{run_step_id}/fields",
            json={
                "values": [
                    {"field_def_id": field1_id, "value": "test@example.com"},
                    {"field_def_id": field2_id, "value": "high"},
                ]
            },
        )
        assert field_response.status_code in [200, 201]


class TestStepOrdering:
    """Tests for step ordering functionality."""

    def test_steps_maintain_order(self, client: TestClient):
        """Test that steps maintain their specified order."""
        # Create template
        template_response = client.post(
            "/api/v1/templates",
            json={"name": "Ordered Steps Template", "description": "Test"},
        )
        template_id = template_response.json()["id"]

        # Add steps in order (let order_index auto-increment)
        client.post(
            f"/api/v1/templates/{template_id}/steps",
            json={"title": "First", "description": "Step 1"},
        )
        client.post(
            f"/api/v1/templates/{template_id}/steps",
            json={"title": "Second", "description": "Step 2"},
        )
        client.post(
            f"/api/v1/templates/{template_id}/steps",
            json={"title": "Third", "description": "Step 3"},
        )

        # Get template and verify order
        template = client.get(f"/api/v1/templates/{template_id}").json()
        steps = sorted(template["steps"], key=lambda s: s["order_index"])

        assert steps[0]["title"] == "First"
        assert steps[1]["title"] == "Second"
        assert steps[2]["title"] == "Third"
