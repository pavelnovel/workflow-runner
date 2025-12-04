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
                "is_recurring": False,
            },
        )
        assert template_response.status_code == 201
        template = template_response.json()
        template_id = template["id"]

        # 2. Add steps
        step1_response = client.post(
            f"/api/v1/templates/{template_id}/steps",
            json={
                "title": "Step 1: Setup",
                "description": "Initial setup for {{projectName}}",
                "order_index": 0,
            },
        )
        assert step1_response.status_code == 201
        step1_id = step1_response.json()["id"]

        step2_response = client.post(
            f"/api/v1/templates/{template_id}/steps",
            json={
                "title": "Step 2: Execute",
                "description": "Execute the main task",
                "order_index": 1,
            },
        )
        assert step2_response.status_code == 201

        step3_response = client.post(
            f"/api/v1/templates/{template_id}/steps",
            json={
                "title": "Step 3: Review",
                "description": "Review and finalize",
                "order_index": 2,
            },
        )
        assert step3_response.status_code == 201

        # 3. Add field definition to step 1
        field_response = client.post(
            f"/api/v1/template-steps/{step1_id}/fields",
            json={
                "name": "project_name",
                "label": "Project Name",
                "field_type": "text",
                "required": True,
            },
        )
        assert field_response.status_code == 201

        # 4. Create run from template
        run_response = client.post(
            f"/api/v1/templates/{template_id}/runs",
            json={"variables": {"projectName": "Test Project Alpha"}},
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

        # Create run with multiple variables
        run_response = client.post(
            f"/api/v1/templates/{template_id}/runs",
            json={
                "variables": {
                    "var1": "Value One",
                    "var2": "Value Two",
                    "var3": "Value Three",
                }
            },
        )
        assert run_response.status_code == 201
        run = run_response.json()

        # Verify variables are stored
        assert run["variables"]["var1"] == "Value One"
        assert run["variables"]["var2"] == "Value Two"
        assert run["variables"]["var3"] == "Value Three"

    def test_recurring_template_workflow(self, client: TestClient):
        """Test workflow with recurring template settings."""
        # Create recurring template
        template_response = client.post(
            "/api/v1/templates",
            json={
                "name": "Weekly Review",
                "description": "Recurring weekly review process",
                "is_recurring": True,
                "recurrence_interval": "weekly",
            },
        )
        assert template_response.status_code == 201
        template = template_response.json()

        assert template["is_recurring"] is True
        assert template["recurrence_interval"] == "weekly"

        # Add steps
        client.post(
            f"/api/v1/templates/{template['id']}/steps",
            json={"title": "Review Metrics", "description": "Check weekly metrics"},
        )

        # Create multiple runs (simulating recurring usage)
        for i in range(3):
            run_response = client.post(
                f"/api/v1/templates/{template['id']}/runs",
                json={"variables": {"weekNumber": str(i + 1)}},
            )
            assert run_response.status_code == 201

        # Verify multiple runs exist
        runs_response = client.get(
            f"/api/v1/runs?template_id={template['id']}"
        )
        assert runs_response.status_code == 200
        runs = runs_response.json()
        assert len(runs) >= 3


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

        # Add field definitions
        client.post(
            f"/api/v1/template-steps/{step_id}/fields",
            json={"name": "email", "label": "Email", "field_type": "text"},
        )
        client.post(
            f"/api/v1/template-steps/{step_id}/fields",
            json={"name": "priority", "label": "Priority", "field_type": "text"},
        )

        # Create run
        run_response = client.post(
            f"/api/v1/templates/{template_id}/runs",
            json={"variables": {}},
        )
        run_id = run_response.json()["id"]

        # Get run step ID
        run_detail = client.get(f"/api/v1/runs/{run_id}").json()
        run_step_id = run_detail["steps"][0]["id"]

        # Capture field values
        field_response = client.post(
            f"/api/v1/runs/{run_id}/steps/{run_step_id}/fields",
            json=[
                {"field_name": "email", "value": "test@example.com"},
                {"field_name": "priority", "value": "high"},
            ],
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

        # Add steps in non-sequential order
        client.post(
            f"/api/v1/templates/{template_id}/steps",
            json={"title": "Third", "description": "Step 3", "order_index": 2},
        )
        client.post(
            f"/api/v1/templates/{template_id}/steps",
            json={"title": "First", "description": "Step 1", "order_index": 0},
        )
        client.post(
            f"/api/v1/templates/{template_id}/steps",
            json={"title": "Second", "description": "Step 2", "order_index": 1},
        )

        # Get template and verify order
        template = client.get(f"/api/v1/templates/{template_id}").json()
        steps = sorted(template["steps"], key=lambda s: s["order_index"])

        assert steps[0]["title"] == "First"
        assert steps[1]["title"] == "Second"
        assert steps[2]["title"] == "Third"
