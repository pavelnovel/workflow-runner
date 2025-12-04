#!/usr/bin/env python3
"""Import a template JSON file into the Process Ave database."""

import json
import sys
from pathlib import Path

import httpx


def import_template(json_file: str, api_url: str = "http://localhost:8003/api/v1"):
    """Import a template from a JSON file."""
    
    # Read the template file
    template_path = Path(json_file)
    if not template_path.exists():
        print(f"❌ Error: File not found: {json_file}")
        sys.exit(1)
    
    with open(template_path) as f:
        template_data = json.load(f)
    
    print(f"📋 Importing template: {template_data['name']}")
    print(f"   Description: {template_data['description']}")
    print(f"   Variables: {len(template_data.get('defaultVariables', []))}")
    print(f"   Steps: {len(template_data.get('steps', []))}")
    
    # Create the template (metadata + variables)
    create_payload = {
        "name": template_data["name"],
        "description": template_data["description"],
        "variables": template_data.get("defaultVariables", [])
    }
    
    try:
        response = httpx.post(f"{api_url}/templates", json=create_payload, timeout=10.0)
        response.raise_for_status()
        template = response.json()
        template_id = template["id"]
        print(f"✅ Template created with ID: {template_id}")
    except httpx.RequestError as e:
        print(f"❌ Error connecting to API: {e}")
        print(f"   Make sure the backend is running at {api_url}")
        sys.exit(1)
    except httpx.HTTPStatusError as e:
        print(f"❌ Error creating template: {e.response.status_code}")
        print(f"   Response: {e.response.text}")
        sys.exit(1)
    
    # Create each step
    steps_created = 0
    for i, step in enumerate(template_data.get("steps", []), start=1):
        step_payload = {
            "title": step["title"],
            "description": step["description"],
            "is_required": True,
            "order_index": i
        }
        
        try:
            response = httpx.post(
                f"{api_url}/templates/{template_id}/steps",
                json=step_payload,
                timeout=10.0
            )
            response.raise_for_status()
            steps_created += 1
            print(f"  ✓ Step {i}: {step['title']}")
        except httpx.HTTPStatusError as e:
            print(f"  ✗ Failed to create step {i}: {e.response.status_code}")
    
    print(f"\n✨ Success! Created template with {steps_created} steps")
    print(f"   View at: http://localhost:3003")
    print(f"   API endpoint: {api_url}/templates/{template_id}")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python import_template.py <template.json> [api_url]")
        print("\nExample:")
        print("  python import_template.py templates/post-webinar-conversion-template.json")
        sys.exit(1)
    
    json_file = sys.argv[1]
    api_url = sys.argv[2] if len(sys.argv) > 2 else "http://localhost:8003/api/v1"
    
    import_template(json_file, api_url)

