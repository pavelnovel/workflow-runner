# FlowState UI + Backend Integration Guide

## Overview

The FlowState UI (`ui/` folder) is now fully integrated with the FastAPI backend! The app now uses:
- **PostgreSQL database** for persistent storage (instead of localStorage)
- **Template-level variables** supported in both UI and backend
- **RESTful API** for all CRUD operations
- **AI template generation** with Gemini (optional feature)

## Architecture

```
┌─────────────────┐         ┌──────────────────┐         ┌────────────────┐
│   FlowState UI  │────────▶│  FastAPI Backend │────────▶│   PostgreSQL   │
│   (Port 3003)   │  HTTP   │   (Port 8003)    │         │   (Port 5432)  │
└─────────────────┘         └──────────────────┘         └────────────────┘
```

## What's New

### Backend Changes
1. **Added `variables` JSON field** to `templates` table
2. **Added `variables`, `current_step_index`, and `completed` fields** to `runs` table
3. **Updated API schemas** to support variable arrays
4. **Database migration created** at `alembic/versions/20250121_000002_add_variables_support.py`

### UI Changes
1. **New API service layer** at `ui/services/apiService.ts`
2. **All localStorage calls replaced** with backend API calls
3. **Data now persists** to PostgreSQL database
4. **Multi-user capable** - multiple people can share the same database

## Quick Start

### Step 1: Start the Backend

#### Option A: Using Docker (Recommended)
```bash
# Start PostgreSQL + FastAPI
docker compose up --build

# The migration will run automatically
# Backend will be available at http://localhost:8003
```

#### Option B: Local Development
```bash
# Terminal 1: Start PostgreSQL
docker compose up db -d

# Terminal 2: Run migration and start backend
alembic upgrade head
uvicorn app.main:app --reload --port 8003
```

### Step 2: Start the UI

```bash
cd ui
npm install  # If you haven't already
npm run dev
```

The UI will be available at **http://localhost:3003**

### Step 3: Start Using It!

1. Open http://localhost:3003 in your browser
2. Create templates with variables
3. Start workflow runs
4. All data is automatically saved to the database!

## Features

### Template Management
- Create templates with **template-level variables**
- Variables defined as: `{key, label, value, description}`
- Steps can reference variables using `{{variableKey}}` syntax
- AI-powered template generation (requires Gemini API key)

### Workflow Execution
- Start workflows from templates
- Variables are copied to each workflow instance
- Track progress through steps
- Add new variables during execution
- Variables persist across steps within a workflow

### Data Persistence
- All templates stored in PostgreSQL `templates` table
- All workflows stored in `runs` table
- No more localStorage - data survives browser clearing
- Multi-user support - share database with team

## API Endpoints Used

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/v1/templates` | List all templates |
| POST | `/api/v1/templates` | Create new template |
| GET | `/api/v1/templates/{id}` | Get template details |
| PATCH | `/api/v1/templates/{id}` | Update template |
| DELETE | `/api/v1/templates/{id}` | Delete template |
| GET | `/api/v1/runs` | List all workflows |
| POST | `/api/v1/templates/{id}/runs` | Start new workflow |
| GET | `/api/v1/runs/{id}` | Get workflow details |
| PATCH | `/api/v1/runs/{id}` | Update workflow progress |
| DELETE | `/api/v1/runs/{id}` | Delete workflow |

## Database Schema

### Templates Table
```sql
CREATE TABLE templates (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    variables JSON,  -- NEW: Array of {key, label, value, description}
    created_by INTEGER,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### Runs Table
```sql
CREATE TABLE runs (
    id SERIAL PRIMARY KEY,
    template_id INTEGER REFERENCES templates(id),
    name TEXT NOT NULL,
    status VARCHAR,  -- 'not_started', 'in_progress', 'done', 'archived'
    variables JSON,  -- NEW: Live variable values for this run
    current_step_index INTEGER DEFAULT 0,  -- NEW: Track UI progress
    completed BOOLEAN DEFAULT FALSE,  -- NEW: Workflow completion
    created_by INTEGER,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

## Configuration

### Backend (.env or environment variables)
```bash
DATABASE_URL=postgresql+psycopg://postgres:postgres@localhost:5432/process_ave
API_PREFIX=/api/v1
```

### UI (ui/.env.local)
```bash
VITE_GEMINI_API_KEY=your_api_key_here  # Optional, for AI template generation
```

**Important Notes:**
- The `VITE_` prefix is required for Vite to expose the variable to the client
- Replace `PLACEHOLDER_API_KEY` with your actual Gemini API key
- Get a free key at: https://aistudio.google.com/app/apikey
- The API base URL is hardcoded in `ui/services/apiService.ts` as `http://localhost:8003/api/v1`

## Troubleshooting

### "Failed to fetch templates" error
- **Check backend is running**: Visit http://localhost:8003/healthz (should return `{"status":"ok"}`)
- **Check database is running**: `docker compose ps` should show db as healthy
- **Check CORS**: Backend allows `http://localhost:3003` in CORS settings

### "Failed to create template" error
- **Check database migration ran**: `alembic current` should show revision `20250121_000002`
- **Run migration manually**: `alembic upgrade head`
- **Check PostgreSQL logs**: `docker compose logs db`

### Backend won't start
- **Port already in use**: Make sure nothing else is on port 8003
- **Database connection failed**: Check `DATABASE_URL` environment variable
- **Migration failed**: Check `alembic/versions/*.py` files for syntax errors

### UI can't connect to backend
- **Check API URL**: `ui/services/apiService.ts` line 3 should match backend port
- **Check browser console**: Look for CORS or network errors
- **Check backend CORS**: `app/main.py` should include `http://localhost:3003` in allowed origins

### "Failed to generate template" or "API key is invalid" error
- **Check API key format**: Must be `VITE_GEMINI_API_KEY` (with `VITE_` prefix)
- **Restart dev server**: Environment variables are loaded at startup - run `npm run dev` again
- **Verify .env.local location**: File must be at `ui/.env.local` (not in project root)
- **Check key validity**: Test your key at https://aistudio.google.com/app/apikey
- **Browser console**: Check for "Gemini API key not configured" error message

### "Objects are not valid as a React child" error
- **Clear browser cache**: Corrupted data from old localStorage version
- **Check browser console**: Look for specific component causing the error
- **Reset application data**: Use the "Reset Application Data" button (now disabled for safety)
- This error has been fixed with stricter type validation in v1.1

## Migration from localStorage to Database

If you have existing data in localStorage:

1. **Export your templates**:
   - Open browser DevTools → Console
   - Run: `copy(localStorage.getItem('flowstate_templates'))`
   - Save to a file

2. **Import via API** (requires backend running):
   ```bash
   # Example using curl
   curl -X POST http://localhost:8003/api/v1/templates \
     -H "Content-Type: application/json" \
     -d @your-template.json
   ```

3. **Clear localStorage** (optional):
   - Run: `localStorage.clear()`

## Next Steps

- **Add authentication**: Implement user login and `created_by` tracking
- **Add permissions**: Control who can edit templates vs just run workflows
- **Add webhooks**: Notify external systems when workflows complete
- **Add analytics**: Track workflow completion rates and bottlenecks
- **Add comments**: Allow team collaboration on workflow runs

## Support

For issues or questions:
1. Check backend logs: `docker compose logs api`
2. Check browser console for frontend errors
3. Verify database state: `docker compose exec db psql -U postgres -d process_ave`

Enjoy your integrated FlowState system! 🚀
