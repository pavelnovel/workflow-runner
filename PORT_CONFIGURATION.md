# Port Configuration Summary

## Updated Port Allocation

All ports have been reconfigured for consistency and to avoid conflicts:

| Service | Port | Description |
|---------|------|-------------|
| **FlowState UI** | 3003 | Standalone React app (localStorage-based) |
| **Web Frontend** | 5173 | Vite dev server (connects to FastAPI backend) |
| **FastAPI Backend** | 8003 | REST API with PostgreSQL |
| **PostgreSQL** | 5432 | Database server |

## Files Updated

### Backend Configuration
- ✅ **docker-compose.yml:23** - Changed API port mapping from `8214:8214` to `8003:8003`
- ✅ **Dockerfile:19** - Changed EXPOSE from `8214` to `8003`
- ✅ **Dockerfile:21** - Changed uvicorn port from `8214` to `8003`

### Frontend Configuration
- ✅ **ui/vite.config.ts:9** - Changed dev server port from `3000` to `3003`
- ✅ **app/main.py:19** - Updated CORS to allow `http://localhost:3003`
- ✅ **web/.env:1** - Changed API base URL from `http://localhost:8000` to `http://localhost:8003`

### Documentation
- ✅ **README.md:37** - Updated API URL from port `8000` to `8003`
- ✅ **UI_SETUP.md:72** - Updated backend port from `8000` to `8003`
- ✅ **UI_SETUP.md:86** - Updated backend connection URL from `8000` to `8003`

## How to Run Each Service

### FlowState UI (Standalone)
```bash
cd ui
npm run dev
# Access at http://localhost:3003
```

### Web Frontend (Backend-Connected)
```bash
cd web
npm run dev
# Access at http://localhost:5173
```

### FastAPI Backend (Local Development)
```bash
uvicorn app.main:app --reload --port 8003
# Access at http://localhost:8003
# API docs at http://localhost:8003/docs
```

### Full Stack (Docker Compose)
```bash
docker compose up --build
# Backend API: http://localhost:8003
# PostgreSQL: localhost:5432
```

## Testing the Setup

### 1. Test Backend Only
```bash
docker compose up db -d
uvicorn app.main:app --reload --port 8003
curl http://localhost:8003/healthz
# Should return: {"status":"ok"}
```

### 2. Test Web Frontend → Backend
```bash
# Terminal 1: Start backend
uvicorn app.main:app --reload --port 8003

# Terminal 2: Start web frontend
cd web
npm run dev

# Access http://localhost:5173
```

### 3. Test Standalone UI
```bash
cd ui
npm run dev
# Access http://localhost:3003
# No backend needed - uses localStorage
```

## Port History

**Original Configuration:**
- Backend: Docker used 8214, docs mentioned 8000 (inconsistent)
- UI: Port 3000
- Web: Port 5173

**New Configuration:**
- Backend: Port 8003 (consistent everywhere)
- UI: Port 3003
- Web: Port 5173 (unchanged)

This eliminates confusion and provides a logical port numbering scheme!
