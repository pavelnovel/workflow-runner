from __future__ import annotations

from fastapi.testclient import TestClient


def _create_template(client: TestClient) -> dict:
    resp = client.post(
        "/api/v1/templates",
        json={"name": "Quality Check", "description": "QA steps"},
    )
    assert resp.status_code == 201
    return resp.json()


def _create_step(client: TestClient, template_id: int, **payload) -> dict:
    resp = client.post(
        f"/api/v1/templates/{template_id}/steps",
        json={"title": "Step", "description": "Do work", **payload},
    )
    assert resp.status_code == 201
    return resp.json()


def _create_field(client: TestClient, step_id: int, **payload) -> dict:
    base = {
        "name": "field_one",
        "label": "Field One",
        "type": "text",
    }
    base.update(payload)
    resp = client.post(
        f"/api/v1/template-steps/{step_id}/fields",
        json=base,
    )
    return resp


def test_step_order_auto_increment(client: TestClient):
    template = _create_template(client)
    first = _create_step(client, template["id"])
    second = _create_step(client, template["id"])

    assert first["order_index"] == 1
    assert second["order_index"] == 2


def test_step_order_conflict_returns_409(client: TestClient):
    template = _create_template(client)
    existing = _create_step(client, template["id"], order_index=5)
    assert existing["order_index"] == 5

    resp = client.post(
        f"/api/v1/templates/{template['id']}/steps",
        json={"title": "Dup", "description": "", "order_index": 5},
    )

    assert resp.status_code == 409
    assert resp.json()["detail"] == "Order index already used for this template"


def test_invalid_field_name_rejected(client: TestClient):
    template = _create_template(client)
    step = _create_step(client, template["id"])

    resp = client.post(
        f"/api/v1/template-steps/{step['id']}/fields",
        json={
            "name": "invalid-name",
            "label": "Label",
            "type": "text",
        },
    )

    assert resp.status_code == 422


def test_duplicate_field_name_returns_409(client: TestClient):
    template = _create_template(client)
    step = _create_step(client, template["id"])

    first = _create_field(client, step["id"], name="client_id")
    assert first.status_code == 201

    duplicate = _create_field(client, step["id"], name="client_id")
    assert duplicate.status_code == 409
    assert duplicate.json()["detail"] == "Field name already exists for this step"
