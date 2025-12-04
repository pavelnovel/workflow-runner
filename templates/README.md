# FlowState Templates

Pre-built workflow templates you can import into FlowState.

---

## 📺 Post-Webinar Conversion Template

**File:** `post-webinar-conversion-template.json`

A complete 9-step workflow for converting live webinar recordings into on-demand assets with automated email follow-ups.

### What's Included
- **9 steps:** From Zoom download to final archiving
- **6 variables:** Webinar title, date, URLs, form IDs
- **Integrations:** Zoom, YouTube, HubSpot, WordPress CMS
- **Time estimate:** 1-2 hours total

### Quick Import

```bash
python3 scripts/import_template.py templates/post-webinar-conversion-template.json
```

---

## Creating Your Own Templates

### 1. Start with JSON Structure

```json
{
  "name": "Template Name",
  "description": "What this template helps you accomplish",
  "defaultVariables": [
    {
      "key": "variable_name",
      "label": "Human Readable Name",
      "value": "",
      "description": "What this variable is used for"
    }
  ],
  "steps": [
    {
      "title": "Step Title",
      "description": "Instructions. Use {{variable_name}} syntax."
    }
  ]
}
```

### 2. Use Variables in Steps

Reference variables using `{{variableName}}` syntax:

```
"Upload to {{platform_name}} using {{api_key}}"
```

### 3. Import the Template

```bash
python3 scripts/import_template.py templates/your-template.json
```

---

## Template Best Practices

### ✅ Do This
- Keep steps focused (one main action per step)
- Use specific, action-oriented titles
- Include links and examples in descriptions
- Add quality check steps at the end
- Use emojis for visual scanning (📥 ✂️ 📺)
- Define 5-8 key variables maximum

### ❌ Avoid This
- Making steps too generic ("Do the thing")
- Creating too many variables
- Skipping validation/testing steps
- Forgetting time estimates

---

## Import Script Usage

```bash
# Basic usage
python3 scripts/import_template.py <template.json>

# With custom API URL
python3 scripts/import_template.py <template.json> http://localhost:8003/api/v1
```

### Requirements
- Backend must be running on port 8003
- Python 3.9+ with `httpx` package installed

```bash
pip install httpx
```

---

## Troubleshooting

**"Failed to connect to API"**
- Make sure backend is running: `curl http://localhost:8003/healthz`

**"Template created but no steps"**
- Check JSON format: `python3 -m json.tool your-template.json`
- Verify `steps` array exists

**"Variables not showing up"**
- Ensure variables are in `defaultVariables` array
- Check variable keys don't have spaces (use underscores)

---

## Available Templates

| Template | Steps | Variables | Use Case |
|----------|-------|-----------|----------|
| Post-Webinar Conversion | 9 | 6 | Converting live webinars to on-demand |

More templates coming soon! 🚀
