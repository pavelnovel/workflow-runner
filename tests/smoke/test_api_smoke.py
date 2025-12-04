"""
SMOKE TESTS - Backend API Critical Paths

These tests verify that the most critical API endpoints work correctly.
If any of these fail, the backend is fundamentally broken.
"""

import pytest
from fastapi.testclient import TestClient


class TestHealthCheck:
    """Verify the API is running and healthy."""

    def test_health_endpoint_returns_200(self, client: TestClient):
        """Health check should return 200 OK."""
        response = client.get("/healthz")
        assert response.status_code == 200

    def test_health_endpoint_returns_healthy_status(self, client: TestClient):
        """Health check should return healthy status."""
        response = client.get("/healthz")
        data = response.json()
        assert data.get("status") == "healthy"


class TestTemplatesCRUD:
    """Verify template CRUD operations work."""

    def test_create_template(self, client: TestClient):
        """Should create a new template."""
        response = client.post(
            "/api/v1/templates",
            json={
                "name": "Smoke Test Template",
                "description": "Created by smoke test",
            },
        )
        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "Smoke Test Template"
        assert "id" in data

    def test_list_templates(self, client: TestClient):
        """Should list all templates."""
        # Create a template first
        client.post(
            "/api/v1/templates",
            json={"name": "List Test Template", "description": "Test"},
        )

        response = client.get("/api/v1/templates")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)

    def test_get_template_by_id(self, client: TestClient):
        """Should get a specific template."""
        # Create a template
        create_response = client.post(
            "/api/v1/templates",
            json={"name": "Get Test Template", "description": "Test"},
        )
        template_id = create_response.json()["id"]

        # Get it back
        response = client.get(f"/api/v1/templates/{template_id}")
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == template_id
        assert data["name"] == "Get Test Template"

    def test_update_template(self, client: TestClient):
        """Should update an existing template."""
        # Create a template
        create_response = client.post(
            "/api/v1/templates",
            json={"name": "Update Test Template", "description": "Original"},
        )
        template_id = create_response.json()["id"]

        # Update it
        response = client.patch(
            f"/api/v1/templates/{template_id}",
            json={"name": "Updated Template Name"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Updated Template Name"

    def test_delete_template(self, client: TestClient):
        """Should delete a template."""
        # Create a template
        create_response = client.post(
            "/api/v1/templates",
            json={"name": "Delete Test Template", "description": "To be deleted"},
        )
        template_id = create_response.json()["id"]

        # Delete it
        response = client.delete(f"/api/v1/templates/{template_id}")
        assert response.status_code == 204

        # Verify it's gone
        get_response = client.get(f"/api/v1/templates/{template_id}")
        assert get_response.status_code == 404


class TestRunsCRUD:
    """Verify run CRUD operations work."""

    def test_create_run_from_template(self, client: TestClient):
        """Should create a run from a template."""
        # Create a template first
        template_response = client.post(
            "/api/v1/templates",
            json={"name": "Run Test Template", "description": "For runs"},
        )
        template_id = template_response.json()["id"]

        # Create a run
        response = client.post(
            f"/api/v1/templates/{template_id}/runs",
            json={"variables": {"testVar": "testValue"}},
        )
        assert response.status_code == 201
        data = response.json()
        assert "id" in data
        assert data["template_id"] == template_id

    def test_list_runs(self, client: TestClient):
        """Should list all runs."""
        response = client.get("/api/v1/runs")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)

    def test_get_run_by_id(self, client: TestClient):
        """Should get a specific run with full details."""
        # Create template and run
        template_response = client.post(
            "/api/v1/templates",
            json={"name": "Get Run Template", "description": "Test"},
        )
        template_id = template_response.json()["id"]

        run_response = client.post(
            f"/api/v1/templates/{template_id}/runs",
            json={"variables": {}},
        )
        run_id = run_response.json()["id"]

        # Get run details
        response = client.get(f"/api/v1/runs/{run_id}")
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == run_id

    def test_delete_run(self, client: TestClient):
        """Should delete a run."""
        # Create template and run
        template_response = client.post(
            "/api/v1/templates",
            json={"name": "Delete Run Template", "description": "Test"},
        )
        template_id = template_response.json()["id"]

        run_response = client.post(
            f"/api/v1/templates/{template_id}/runs",
            json={"variables": {}},
        )
        run_id = run_response.json()["id"]

        # Delete run
        response = client.delete(f"/api/v1/runs/{run_id}")
        assert response.status_code == 204


class TestStepOperations:
    """Verify step operations work."""

    def test_create_step_for_template(self, client: TestClient):
        """Should create a step for a template."""
        # Create template
        template_response = client.post(
            "/api/v1/templates",
            json={"name": "Step Test Template", "description": "Test"},
        )
        template_id = template_response.json()["id"]

        # Create step
        response = client.post(
            f"/api/v1/templates/{template_id}/steps",
            json={"title": "Test Step", "description": "Do something"},
        )
        assert response.status_code == 201
        data = response.json()
        assert data["title"] == "Test Step"

    def test_update_run_step_status(self, client: TestClient):
        """Should update a run step's status."""
        # Create template with step
        template_response = client.post(
            "/api/v1/templates",
            json={"name": "Step Status Template", "description": "Test"},
        )
        template_id = template_response.json()["id"]

        client.post(
            f"/api/v1/templates/{template_id}/steps",
            json={"title": "Step 1", "description": "First step"},
        )

        # Create run
        run_response = client.post(
            f"/api/v1/templates/{template_id}/runs",
            json={"variables": {}},
        )
        run_id = run_response.json()["id"]

        # Get run to find step ID
        run_detail = client.get(f"/api/v1/runs/{run_id}").json()
        if run_detail.get("steps"):
            step_id = run_detail["steps"][0]["id"]

            # Update step status
            response = client.patch(
                f"/api/v1/runs/{run_id}/steps/{step_id}",
                json={"status": "done"},
            )
            assert response.status_code == 200
            assert response.json()["status"] == "done"


class TestErrorHandling:
    """Verify proper error responses."""

    def test_get_nonexistent_template_returns_404(self, client: TestClient):
        """Should return 404 for nonexistent template."""
        response = client.get("/api/v1/templates/nonexistent-id")
        assert response.status_code == 404

    def test_get_nonexistent_run_returns_404(self, client: TestClient):
        """Should return 404 for nonexistent run."""
        response = client.get("/api/v1/runs/nonexistent-id")
        assert response.status_code == 404

    def test_invalid_template_data_returns_422(self, client: TestClient):
        """Should return 422 for invalid data."""
        response = client.post(
            "/api/v1/templates",
            json={},  # Missing required fields
        )
        assert response.status_code == 422
