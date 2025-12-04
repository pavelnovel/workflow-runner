"""Comprehensive template CRUD and edge case tests."""

from __future__ import annotations

from fastapi.testclient import TestClient


def test_create_template_with_variables(client: TestClient):
    """Test creating a template with variables."""
    resp = client.post(
        "/api/v1/templates",
        json={
            "name": "Webinar Template",
            "description": "Webinar process",
            "variables": [
                {"key": "title", "label": "Title", "value": "My Webinar"},
                {"key": "date", "label": "Date", "value": "2024-01-15"},
            ],
        },
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["name"] == "Webinar Template"
    assert len(data["variables"]) == 2
    assert data["variables"][0]["key"] == "title"


def test_update_template_variables(client: TestClient):
    """Test updating template variables."""
    # Create template
    create_resp = client.post(
        "/api/v1/templates",
        json={"name": "Test", "description": "Test"},
    )
    template_id = create_resp.json()["id"]

    # Update with variables
    update_resp = client.patch(
        f"/api/v1/templates/{template_id}",
        json={
            "variables": [{"key": "newVar", "label": "New Variable", "value": ""}]
        },
    )
    assert update_resp.status_code == 200
    assert len(update_resp.json()["variables"]) == 1


def test_create_template_minimal(client: TestClient):
    """Test creating template with only required fields."""
    resp = client.post(
        "/api/v1/templates",
        json={"name": "Minimal"},
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["name"] == "Minimal"
    assert data["description"] is None or data["description"] == ""


def test_list_templates_returns_steps(client: TestClient):
    """Test that listing templates includes their steps."""
    # Create template with steps
    create_resp = client.post(
        "/api/v1/templates",
        json={"name": "With Steps", "description": "Has steps"},
    )
    template_id = create_resp.json()["id"]

    client.post(
        f"/api/v1/templates/{template_id}/steps",
        json={"title": "First Step", "description": "Do this first"},
    )
    client.post(
        f"/api/v1/templates/{template_id}/steps",
        json={"title": "Second Step", "description": "Do this second"},
    )

    # List templates
    list_resp = client.get("/api/v1/templates")
    assert list_resp.status_code == 200
    templates = list_resp.json()

    # Find our template
    template = next(t for t in templates if t["id"] == template_id)
    assert len(template["steps"]) == 2


def test_step_with_field_definitions(client: TestClient):
    """Test creating steps with form field definitions."""
    # Create template and step
    template = client.post(
        "/api/v1/templates",
        json={"name": "Form Template", "description": "Has form fields"},
    ).json()

    step = client.post(
        f"/api/v1/templates/{template['id']}/steps",
        json={"title": "Data Entry", "description": "Fill out form"},
    ).json()

    # Add fields
    field1 = client.post(
        f"/api/v1/template-steps/{step['id']}/fields",
        json={
            "name": "email",
            "label": "Email Address",
            "type": "text",
            "required": True,
        },
    )
    assert field1.status_code == 201

    field2 = client.post(
        f"/api/v1/template-steps/{step['id']}/fields",
        json={
            "name": "priority",
            "label": "Priority",
            "type": "select",
            "required": False,
            "options": ["low", "medium", "high"],
        },
    )
    assert field2.status_code == 201

    # Verify fields are returned with template
    template_detail = client.get(f"/api/v1/templates/{template['id']}").json()
    step_detail = template_detail["steps"][0]
    assert len(step_detail["field_defs"]) == 2


def test_update_step_title_and_description(client: TestClient):
    """Test updating step properties."""
    template = client.post(
        "/api/v1/templates",
        json={"name": "Test", "description": ""},
    ).json()

    step = client.post(
        f"/api/v1/templates/{template['id']}/steps",
        json={"title": "Original", "description": "Original description"},
    ).json()

    # Update step
    update_resp = client.patch(
        f"/api/v1/template-steps/{step['id']}",
        json={"title": "Updated Title", "description": "New description"},
    )
    assert update_resp.status_code == 200
    assert update_resp.json()["title"] == "Updated Title"
    assert update_resp.json()["description"] == "New description"


def test_reorder_steps(client: TestClient):
    """Test that step order can be updated."""
    template = client.post(
        "/api/v1/templates",
        json={"name": "Reorder Test", "description": ""},
    ).json()

    # Create steps
    step1 = client.post(
        f"/api/v1/templates/{template['id']}/steps",
        json={"title": "Step 1", "description": ""},
    ).json()

    step2 = client.post(
        f"/api/v1/templates/{template['id']}/steps",
        json={"title": "Step 2", "description": ""},
    ).json()

    assert step1["order_index"] == 1
    assert step2["order_index"] == 2

    # Move step2 to position 10
    client.patch(
        f"/api/v1/template-steps/{step2['id']}",
        json={"order_index": 10},
    )

    # Verify
    updated = client.get(f"/api/v1/templates/{template['id']}").json()
    steps = sorted(updated["steps"], key=lambda s: s["order_index"])
    assert steps[0]["order_index"] == 1
    assert steps[1]["order_index"] == 10


def test_delete_step_field(client: TestClient):
    """Test deleting a field definition."""
    template = client.post(
        "/api/v1/templates",
        json={"name": "Field Delete Test", "description": ""},
    ).json()

    step = client.post(
        f"/api/v1/templates/{template['id']}/steps",
        json={"title": "Step", "description": ""},
    ).json()

    field = client.post(
        f"/api/v1/template-steps/{step['id']}/fields",
        json={"name": "to_delete", "label": "Delete Me", "type": "text"},
    ).json()

    # Delete field
    del_resp = client.delete(f"/api/v1/step-fields/{field['id']}")
    assert del_resp.status_code == 204

    # Verify field is gone
    template_detail = client.get(f"/api/v1/templates/{template['id']}").json()
    assert len(template_detail["steps"][0]["field_defs"]) == 0


def test_template_update_partial(client: TestClient):
    """Test that PATCH only updates provided fields."""
    resp = client.post(
        "/api/v1/templates",
        json={"name": "Original Name", "description": "Original desc"},
    )
    template_id = resp.json()["id"]

    # Update only name
    update_resp = client.patch(
        f"/api/v1/templates/{template_id}",
        json={"name": "New Name"},
    )
    assert update_resp.status_code == 200
    assert update_resp.json()["name"] == "New Name"
    assert update_resp.json()["description"] == "Original desc"
