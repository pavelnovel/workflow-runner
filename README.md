# Workflow Runner

A self-hosted workflow management system for creating reusable process templates and tracking runs.

## Quick Start

```bash
# Terminal 1: Start backend + database
docker compose up --build

# Terminal 2: Start UI
cd ui && npm install && npm run dev
```

Open **http://localhost:3003**

## Features

- Create workflow templates with reusable steps
- Define variables once, use across all steps (`{{variableName}}` syntax)
- Track progress through multi-step workflows
- AI-powered template generation (Gemini)
- Recurring workflow support (daily, weekly, monthly)

## Architecture

```
UI (React)          →  Backend (FastAPI)  →  Database (PostgreSQL)
localhost:3003         localhost:8003        localhost:5432
```

## Testing

```bash
# Frontend tests (43 tests)
cd ui && npm test

# Backend tests (requires Python 3.11+)
pytest
```

## API

| Endpoint | Description |
|----------|-------------|
| `GET /api/v1/templates` | List workflows |
| `POST /api/v1/templates` | Create workflow |
| `POST /api/v1/templates/{id}/runs` | Start a run |
| `GET /api/v1/runs` | List runs |
| `PATCH /api/v1/runs/{id}/steps/{stepId}` | Complete a step |

Full API docs: http://localhost:8003/docs

## Configuration

```bash
# Backend (.env)
DATABASE_URL=postgresql+psycopg://postgres:postgres@localhost:5432/process_ave

# UI (ui/.env.local) - optional, for AI generation
VITE_GEMINI_API_KEY=your_key_here
```

Get a Gemini API key: https://aistudio.google.com/app/apikey

## Troubleshooting

**Backend not responding:**
```bash
curl http://localhost:8003/healthz  # Should return {"status":"healthy"}
```

**Port in use:**
```bash
lsof -ti:8003 | xargs kill -9  # Kill process on port 8003
lsof -ti:3003 | xargs kill -9  # Kill process on port 3003
```

**Reset everything:**
```bash
docker compose down -v && docker compose up --build
```
