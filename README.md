# Process Ave / FlowState

Self-hosted workflow template and run manager with **template-level variables**. This repo includes:
- **FastAPI backend** with PostgreSQL database
- **FlowState UI** - Modern React frontend with variable support and AI template generation
- **Web frontend** - Original React scaffold for API integration

## 🎉 FlowState UI + Backend Integration

The `ui/` folder contains a fully integrated React app that works with the backend! Features:
- ✅ **Template-level variables** - Define variables once, use across all steps
- ✅ **AI-powered template generation** using Google Gemini
- ✅ **PostgreSQL persistence** - No more localStorage
- ✅ **Multi-user support** - Share templates and workflows with your team
- ✅ **Modern UI** with variable interpolation (`{{variableName}}` syntax)

**Quick Start:** See [GETTING_STARTED.md](GETTING_STARTED.md) for setup instructions.

## Quick start

1. Create a Python 3.11+ virtual environment.
2. Install dependencies:

   ```bash
   pip install -e .[dev]
   ```

3. Configure environment variables (copy `.env.example`).
4. Run migrations:

   ```bash
   alembic upgrade head
   ```

5. Start the API:

   ```bash
   uvicorn app.main:app --reload
   ```

The service exposes `/api/v1` endpoints covering templates, steps, fields, runs, and run steps.

## Docker Compose

Spin up Postgres and the API with migrations applied:

```bash
docker compose up --build
```

The API becomes available on `http://localhost:8003`, Postgres on `localhost:5432`.

## Frontend (Vite + React)

The `web/` directory contains a React + TypeScript scaffold that talks to the API under `/api/v1`.

```bash
cd web
cp .env.example .env.local   # adjust API base URL if needed
npm install                  # or pnpm/yarn
npm run dev                  # launches Vite dev server on http://localhost:5173
```

The Vite dev server proxies `/api` requests to `VITE_API_BASE_URL`, so run the FastAPI backend (via `uvicorn` or docker compose) alongside the frontend.

## Testing & smoke checks

- Run tests locally with `pip install -e .[dev] && pytest` or `make test`.
- Execute the dockerized smoke test via `make smoke`, which builds the images, brings the compose stack up, executes `pytest` inside the API container, and then tears everything down.
- GitHub Actions (`.github/workflows/ci.yml`) runs both the Python tests and the smoke script on every push and pull request.

## Launch FlowState

### Quick Start (Recommended)
```bash
# Terminal 1: Start backend + database
docker compose up --build

# Terminal 2: Start UI
cd ui
npm install
npm run dev
```

Access FlowState at **http://localhost:3003**

### Port Configuration
- **Port 3003** - FlowState UI
- **Port 8003** - FastAPI Backend
- **Port 5432** - PostgreSQL

See [GETTING_STARTED.md](GETTING_STARTED.md) for detailed setup and [INTEGRATION_GUIDE.md](INTEGRATION_GUIDE.md) for technical details.
