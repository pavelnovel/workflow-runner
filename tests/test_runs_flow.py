from __future__ import annotations

from fastapi.testclient import TestClient


def test_template_to_run_flow(client: TestClient):
    template_resp = client.post(
        "/api/v1/templates",
        json={"name": "Client Onboarding", "description": "Steps to onboard"},
    )
    assert template_resp.status_code == 201
    template = template_resp.json()
    template_id = template["id"]

    step_resp = client.post(
        f"/api/v1/templates/{template_id}/steps",
        json={"title": "Collect domain", "description": "Need client URL"},
    )
    assert step_resp.status_code == 201
    step = step_resp.json()
    assert step["order_index"] == 1

    field_resp = client.post(
        f"/api/v1/template-steps/{step['id']}/fields",
        json={
            "name": "client_domain",
            "label": "Client Domain",
            "type": "text",
            "required": True,
        },
    )
    assert field_resp.status_code == 201
    field_def = field_resp.json()

    run_resp = client.post(
        f"/api/v1/templates/{template_id}/runs",
        json={"name": "Onboard Alice"},
    )
    assert run_resp.status_code == 201
    run = run_resp.json()
    assert run["name"] == "Onboard Alice"
    assert len(run["steps"]) == 1
    run_id = run["id"]
    run_step_id = run["steps"][0]["id"]

    patch_resp = client.patch(
        f"/api/v1/runs/{run_id}/steps/{run_step_id}",
        json={"status": "in_progress", "notes": "Waiting on IT"},
    )
    assert patch_resp.status_code == 200
    assert patch_resp.json()["status"] == "in_progress"

    upsert_resp = client.post(
        f"/api/v1/runs/{run_id}/steps/{run_step_id}/fields",
        json={"values": [{"field_def_id": field_def["id"], "value": "example.com"}]},
    )
    assert upsert_resp.status_code == 200
    value_payload = upsert_resp.json()["field_values"][0]
    assert value_payload["value"] == "example.com"

    run_update = client.patch(
        f"/api/v1/runs/{run_id}",
        json={"status": "in_progress"},
    )
    assert run_update.status_code == 200
    assert run_update.json()["status"] == "in_progress"

    detail_resp = client.get(f"/api/v1/runs/{run_id}")
    assert detail_resp.status_code == 200
    detail = detail_resp.json()
    assert detail["steps"][0]["field_values"][0]["value"] == "example.com"

    list_resp = client.get("/api/v1/runs", params={"status": "in_progress"})
    assert list_resp.status_code == 200
    assert len(list_resp.json()) == 1
