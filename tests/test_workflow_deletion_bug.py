from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models import Run


def test_delete_template_with_runs_fails(client: TestClient, session: Session):
    """
    Test that deleting a template with associated runs fails (reproducing the bug).
    """
    # 1. Create a template
    template_resp = client.post(
        "/api/v1/templates",
        json={"name": "Template to Delete", "description": "Will have runs"},
    )
    assert template_resp.status_code == 201
    template_id = template_resp.json()["id"]

    # 2. Create a run for this template
    run_resp = client.post(
        f"/api/v1/templates/{template_id}/runs",
        json={"name": "Test Run"},
    )
    assert run_resp.status_code == 201

    # 3. Try to delete the template
    # This is expected to fail with a 500 or 400 error due to foreign key constraint
    # But for the purpose of "reproducing the bug", we want to see what happens.
    # If the user wants us to FIX it, we should assert that it currently FAILS,
    # or just run it and see the failure.

    delete_resp = client.delete(f"/api/v1/templates/{template_id}")

    # If the bug exists, this will likely be 500 (Internal Server Error) due to unhandled IntegrityError
    # or 409 if handled but not allowed.
    # The user said "I got an error", implying it didn't work.

    # If the fix works, this should be 204 (No Content)
    assert delete_resp.status_code == 204

    # Verify runs are deleted
    runs = session.query(Run).filter(Run.template_id == template_id).all()
    assert len(runs) == 0
