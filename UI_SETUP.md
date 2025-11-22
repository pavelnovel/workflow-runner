# UI Folder Setup Guide

## Overview
The `ui/` folder contains a **standalone** FlowState app built with React + TypeScript that uses:
- **localStorage** for data persistence (no backend required)
- **Gemini AI** for template generation
- **CDN imports** for dependencies in production
- **Vite** for development and building

This is separate from the FastAPI backend in `app/` and the web frontend in `web/`.

## Fixed Issues
1. ✅ **Missing `index.css` file** - Created the required stylesheet
2. ✅ **TypeScript errors** - Fixed ErrorBoundary component props declaration
3. ✅ **Build errors** - App now builds successfully

## Quick Start

### 1. Install Dependencies
```bash
cd ui
npm install
```

### 2. Configure API Key
Edit `ui/.env.local` and add your Gemini API key (must use `VITE_` prefix):
```
VITE_GEMINI_API_KEY=your_actual_api_key_here
```

**Important:** Replace `PLACEHOLDER_API_KEY` with your actual key from https://aistudio.google.com/app/apikey

### 3. Run Development Server
```bash
npm run dev
```
The app will run on `http://localhost:3003`

### 4. Build for Production
```bash
npm run build
npm run preview
```

## How Variables Work

### Template Variables
- Variables are defined at the template level in `defaultVariables`
- Each variable has:  - `key` - machine-readable identifier (e.g., "webinarTitle")
  - `label` - human-readable name (e.g., "Webinar Title")
  - `value` - the actual data
  - `description` - helper text for users

### Variable Usage in Steps
- Reference variables in step descriptions using `{{variableKey}}` syntax
- Example: "Create landing page for {{webinarTitle}} on {{date}}"
- Variables are automatically highlighted and replaced during workflow runs

### Variable Management During Runs
- Users can add new variables on-the-fly during workflow execution
- Variables persist across steps in the same workflow run
- Each workflow run has its own copy of variables (isolated from template)

### Data Storage
All data is stored in browser localStorage with keys:
- `flowstate_templates` - Template definitions
- `flowstate_workflows` - Active workflow runs

## Architecture Notes

### Standalone vs Backend Integration
The UI is currently **standalone** and does NOT connect to the FastAPI backend:
- **UI (`ui/`)**: Uses localStorage, runs on port 3003
- **Backend (`app/`)**: SQL database with FastAPI, runs on port 8003
- **Web (`web/`)**: Original frontend that DOES connect to backend

### Data Models
The UI uses a different data model than the backend:
- **UI**: Template-level variables shared across all steps
- **Backend**: Step-level field definitions (per-step form fields)

## Next Steps

If you want to integrate the UI with the backend:
1. Create API endpoints in `app/api/v1/` for template-level variables
2. Add a `variables` JSON field to the Template model
3. Update UI to use fetch/axios instead of localStorage
4. Connect to backend on `http://localhost:8003/api/v1`

Or keep it standalone as a lightweight alternative to the main app!
