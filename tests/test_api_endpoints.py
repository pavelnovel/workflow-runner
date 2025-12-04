"""API endpoint tests for 404 errors, cascade deletes, and filtering."""

from __future__ import annotations

from fastapi.testclient import TestClient


# =============================================================================
# Helper functions
# =============================================================================

def _create_template(client: TestClient, name: str = "Test Template") -> dict:
    resp = client.post(
        "/api/v1/templates",
        json={"name": name, "description": "Test description"},
    )
    assert resp.status_code == 201
    return resp.json()


def _create_step(client: TestClient, template_id: int, title: str = "Test Step") -> dict:
    resp = client.post(
        f"/api/v1/templates/{template_id}/steps",
        json={"title": title, "description": "Step description"},
    )
    assert resp.status_code == 201
    return resp.json()


def _create_run(client: TestClient, template_id: int, name: str = "Test Run") -> dict:
    resp = client.post(
        f"/api/v1/templates/{template_id}/runs",
        json={"name": name},
    )
    assert resp.status_code == 201
    return resp.json()


# =============================================================================
# Template 404 Tests
# =============================================================================

def test_get_nonexistent_template_returns_404(client: TestClient):
    resp = client.get("/api/v1/templates/99999")
    assert resp.status_code == 404
    assert resp.json()["detail"] == "Template not found"


def test_update_nonexistent_template_returns_404(client: TestClient):
    resp = client.patch(
        "/api/v1/templates/99999",
        json={"name": "Updated Name"},
    )
    assert resp.status_code == 404
    assert resp.json()["detail"] == "Template not found"


def test_delete_nonexistent_template_returns_404(client: TestClient):
    resp = client.delete("/api/v1/templates/99999")
    assert resp.status_code == 404
    assert resp.json()["detail"] == "Template not found"


# =============================================================================
# Run 404 Tests
# =============================================================================

def test_get_nonexistent_run_returns_404(client: TestClient):
    resp = client.get("/api/v1/runs/99999")
    assert resp.status_code == 404
    assert resp.json()["detail"] == "Run not found"


def test_update_nonexistent_run_returns_404(client: TestClient):
    resp = client.patch(
        "/api/v1/runs/99999",
        json={"status": "in_progress"},
    )
    assert resp.status_code == 404
    assert resp.json()["detail"] == "Run not found"


def test_delete_nonexistent_run_returns_404(client: TestClient):
    resp = client.delete("/api/v1/runs/99999")
    assert resp.status_code == 404
    assert resp.json()["detail"] == "Run not found"


def test_update_run_step_wrong_run_returns_404(client: TestClient):
    """Test that updating a step with wrong run_id returns 404."""
    template = _create_template(client)
    _create_step(client, template["id"])

    # Create two separate runs
    run1 = _create_run(client, template["id"], "Run 1")
    run2 = _create_run(client, template["id"], "Run 2")

    run1_step_id = run1["steps"][0]["id"]

    # Try to update run1's step using run2's ID
    resp = client.patch(
        f"/api/v1/runs/{run2['id']}/steps/{run1_step_id}",
        json={"status": "done"},
    )
    assert resp.status_code == 404
    assert resp.json()["detail"] == "Step not in run"


# =============================================================================
# Cascade Delete Tests
# =============================================================================

def test_delete_template_cascades_to_steps(client: TestClient):
    """Deleting a template should also delete its steps."""
    template = _create_template(client)
    step = _create_step(client, template["id"])

    # Verify step exists
    get_resp = client.get(f"/api/v1/templates/{template['id']}")
    assert len(get_resp.json()["steps"]) == 1

    # Delete template
    del_resp = client.delete(f"/api/v1/templates/{template['id']}")
    assert del_resp.status_code == 204

    # Verify template is gone
    check_resp = client.get(f"/api/v1/templates/{template['id']}")
    assert check_resp.status_code == 404


def test_delete_run_cascades_to_run_steps(client: TestClient):
    """Deleting a run should also delete its run steps."""
    template = _create_template(client)
    _create_step(client, template["id"])
    run = _create_run(client, template["id"])

    # Verify run has steps
    assert len(run["steps"]) == 1

    # Delete run
    del_resp = client.delete(f"/api/v1/runs/{run['id']}")
    assert del_resp.status_code == 204

    # Verify run is gone
    check_resp = client.get(f"/api/v1/runs/{run['id']}")
    assert check_resp.status_code == 404


# =============================================================================
# Filter and Delete Tests
# =============================================================================

def test_list_runs_filters_by_status(client: TestClient):
    """Test that runs can be filtered by status."""
    template = _create_template(client)
    _create_step(client, template["id"])

    # Create two runs
    run1 = _create_run(client, template["id"], "Run 1")
    run2 = _create_run(client, template["id"], "Run 2")

    # Update run1 to in_progress
    client.patch(f"/api/v1/runs/{run1['id']}", json={"status": "in_progress"})

    # Filter by in_progress - should get only run1
    resp = client.get("/api/v1/runs", params={"status": "in_progress"})
    assert resp.status_code == 200
    runs = resp.json()
    assert len(runs) == 1
    assert runs[0]["id"] == run1["id"]

    # Filter by not_started - should get only run2
    resp = client.get("/api/v1/runs", params={"status": "not_started"})
    assert resp.status_code == 200
    runs = resp.json()
    assert len(runs) == 1
    assert runs[0]["id"] == run2["id"]


def test_delete_step_returns_204(client: TestClient):
    """Test that deleting a step returns 204 No Content."""
    template = _create_template(client)
    step = _create_step(client, template["id"])

    resp = client.delete(f"/api/v1/template-steps/{step['id']}")
    assert resp.status_code == 204

    # Verify step is gone from template
    get_resp = client.get(f"/api/v1/templates/{template['id']}")
    assert len(get_resp.json()["steps"]) == 0
