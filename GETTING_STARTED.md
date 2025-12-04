# 🚀 Getting Started with FlowState

## What is FlowState?

FlowState is a self-hosted workflow management system that helps you:
- Create reusable templates for recurring processes
- Track progress through multi-step workflows
- Use variables to customize each workflow run
- Share workflows with your team

## Prerequisites

- **Docker Desktop** (for database and backend)
- **Node.js 18+** and npm (for frontend)
- **Python 3.9+** (optional, for importing templates)

---

## Quick Start (5 minutes)

### Step 1: Start the Backend

```bash
cd /Users/pk/Desktop/WORKSTATION/dev/process-ave
docker compose up --build
```

Wait for: `INFO: Application startup complete.`

### Step 2: Start the UI (New Terminal)

```bash
cd /Users/pk/Desktop/WORKSTATION/dev/process-ave/ui
npm install  # First time only
npm run dev
```

Wait for: `Local: http://localhost:3003/`

### Step 3: Open FlowState

```
http://localhost:3003
```

**That's it!** You're ready to create templates and run workflows. 🎉

---

## Importing the Webinar Template

A complete post-webinar conversion template is included. To import it:

```bash
cd /Users/pk/Desktop/WORKSTATION/dev/process-ave

# Set up Python environment (first time only)
python3 -m venv venv
source venv/bin/activate
pip install httpx

# Import the template
python3 scripts/import_template.py templates/post-webinar-conversion-template.json
```

Refresh your browser and you'll see the "Post-Webinar: Convert Live to On-Demand" template!

---

## System Architecture

```
┌──────────────────┐
│   FlowState UI   │  http://localhost:3003
│   (React/Vite)   │
└────────┬─────────┘
         │ REST API
         ▼
┌──────────────────┐
│  FastAPI Backend │  http://localhost:8003
│                  │
└────────┬─────────┘
         │ SQL
         ▼
┌──────────────────┐
│   PostgreSQL DB  │  localhost:5432
│   (Docker Volume)│
└──────────────────┘
```

---

## Port Configuration

| Service | Port | URL |
|---------|------|-----|
| FlowState UI | 3003 | http://localhost:3003 |
| FastAPI Backend | 8003 | http://localhost:8003 |
| PostgreSQL | 5432 | localhost:5432 |
| API Docs | 8003 | http://localhost:8003/docs |

---

## Verify Everything Works

### Check Backend
```bash
curl http://localhost:8003/healthz
# Should return: {"status":"ok"}
```

### Check Database
```bash
docker compose ps
# Both 'db' and 'api' should show "Up"
```

### Check UI
Open http://localhost:3003 in your browser

---

## Common Issues

### "Docker daemon not running"
**Fix:** Open Docker Desktop application

### "Port 8003 already in use"
**Fix:**
```bash
lsof -ti:8003 | xargs kill -9
```

### "Port 3003 already in use"
**Fix:**
```bash
lsof -ti:3003 | xargs kill -9
```

### "Cannot connect to database"
**Fix:**
```bash
docker compose down
docker compose up --build
```

---

## Stopping Services

### Stop UI
Press `Ctrl+C` in the terminal running `npm run dev`

### Stop Backend & Database
```bash
docker compose down
```

---

## Next Steps

### 1. Explore the Dashboard
- View available templates
- Create your first workflow run

### 2. Create a Template
- Click "Create Template" or "New AI Template"
- Add steps and variables
- Save and start using it

### 3. Customize Your Workflow
- Edit the webinar template to fit your process
- Add your own templates for other workflows
- Share with your team

### 4. Optional: AI Template Generation
To use AI-powered template generation:

```bash
cd ui
echo 'VITE_GEMINI_API_KEY=your_api_key_here' > .env.local
npm run dev  # Restart dev server
```

Get a free API key at: https://aistudio.google.com/app/apikey

---

## Documentation

- **This file** - Quick start guide
- **README.md** - Project overview and features
- **INTEGRATION_GUIDE.md** - Detailed technical documentation
- **templates/README.md** - How to create and use templates

---

## Need Help?

1. Check backend logs: `docker compose logs api -f`
2. Check browser console for frontend errors
3. Verify database: `docker compose exec db psql -U postgres -d process_ave`

---

**Happy flowing!** 🚀

