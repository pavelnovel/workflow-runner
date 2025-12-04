# Bug Fixes - Template Icons & Recurrence Features

## Summary

Fixed three critical bugs that were causing template icons, recurrence settings, and progress calculations to be lost or incorrect.

---

## Bug 1: Template Fields Not Sent to Backend ✅ FIXED

### Problem
The `templateToBackend` helper function in `apiService.ts` was not including the new `icon`, `isRecurring`, and `recurrenceInterval` fields when creating or updating templates. This caused these UI-specific settings to be silently dropped when saving to the backend.

### Fix
Updated `templateToBackend` function to include all three fields:

```typescript
// ui/services/apiService.ts
const templateToBackend = (template: Template) => {
  return {
    name: template.name,
    description: template.description,
    icon: template.icon || '📋',
    isRecurring: template.isRecurring || false,
    recurrenceInterval: template.recurrenceInterval || 'biweekly',
    variables: template.defaultVariables || [],
    steps: ...
  };
};
```

---

## Bug 2: Template Fields Not Read from Backend ✅ FIXED

### Problem
The `templateFromBackend` helper function was not extracting `icon`, `isRecurring`, or `recurrenceInterval` fields when converting backend templates to UI format. This caused all templates loaded from the database to lose these settings and fall back to defaults.

### Fix
Updated `templateFromBackend` function to extract all fields:

```typescript
// ui/services/apiService.ts
const templateFromBackend = (backendTemplate: any): Template => {
  return {
    id: backendTemplate.id.toString(),
    name: backendTemplate.name || '',
    description: backendTemplate.description || '',
    icon: backendTemplate.icon || '📋',
    isRecurring: backendTemplate.isRecurring || false,
    recurrenceInterval: backendTemplate.recurrenceInterval || 'biweekly',
    defaultVariables: backendTemplate.variables || [],
    steps: ...
  };
};
```

Also updated `workflowFromBackend` to include template icon and recurrence settings in workflows.

---

## Bug 3: Inconsistent Progress Calculation ✅ FIXED

### Problem
The `HomePage` component was calculating progress using `currentStepIndex / steps.length`, but the `WorkflowRun` component was refactored to count completed steps using `steps.filter(s => s.completed).length`. This inconsistency caused incorrect progress percentages on the dashboard.

**Example:** A workflow at step 5 of 10 would show 50% progress even if only 2 steps were actually completed.

### Fix
Updated HomePage's `getProgress` function to match WorkflowRun's logic:

```typescript
// ui/components/HomePage.tsx
const getProgress = (workflow: Workflow): number => {
  if (workflow.steps.length === 0) return 0;
  const completedCount = workflow.steps.filter(s => s.completed).length;
  return Math.round((completedCount / workflow.steps.length) * 100);
};
```

---

## Backend Changes

Added database migration and model updates to support the new fields:

### 1. Database Migration
**File:** `alembic/versions/20250104_000003_add_template_recurrence.py`

Added columns:
- `templates.icon` - TEXT (nullable)
- `templates.is_recurring` - BOOLEAN (default false)
- `templates.recurrence_interval` - TEXT (nullable)
- `runs.completed_at` - DATETIME (nullable)

### 2. Model Updates
**File:** `app/models/templates.py`

Updated Template model:
```python
class Template(Base, TimestampMixin):
    ...
    icon: Mapped[str | None] = mapped_column(Text)
    is_recurring: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    recurrence_interval: Mapped[str | None] = mapped_column(Text)
```

Updated Run model:
```python
class Run(Base, TimestampMixin):
    ...
    completed_at: Mapped[datetime | None] = mapped_column(DateTime)
```

### 3. Schema Updates
**Files:** `app/schemas/templates.py`, `app/schemas/runs.py`

Updated Pydantic schemas to include new fields in:
- `TemplateBase`
- `TemplateCreate`
- `TemplateUpdate`
- `TemplateRead`
- `RunUpdate`
- `RunRead`

---

## Testing

To test these fixes:

### 1. Run the Migration
```bash
alembic upgrade head
```

### 2. Restart the Backend
```bash
docker compose restart api
# or
uvicorn app.main:app --reload --port 8003
```

### 3. Restart the UI
```bash
cd ui
npm run dev
```

### 4. Verify Template Icons
1. Create a new template
2. Select a custom icon (e.g., 🎥)
3. Enable recurring
4. Save and reload the page
5. ✅ Icon should persist

### 5. Verify Progress Calculation
1. Start a workflow
2. Complete steps 1, 3, and 5 (non-sequential)
3. Check the dashboard
4. ✅ Should show 30% (3/10), not 50%

---

## Impact

### Before Fixes
❌ Template icons always showed as 📋 after reload  
❌ Recurrence settings were lost after save  
❌ Dashboard showed incorrect progress percentages  
❌ Users couldn't track recurring processes  

### After Fixes
✅ Template icons persist correctly  
✅ Recurrence settings are saved and loaded  
✅ Dashboard shows accurate progress  
✅ Recurring processes can be tracked with overdue indicators  

---

## Files Changed

### Frontend
- `ui/services/apiService.ts` - Fixed template/workflow conversion functions
- `ui/components/HomePage.tsx` - Fixed progress calculation

### Backend
- `app/models/templates.py` - Added new columns to Template and Run models
- `app/schemas/templates.py` - Added fields to Template schemas
- `app/schemas/runs.py` - Added completed_at to Run schemas
- `alembic/versions/20250104_000003_add_template_recurrence.py` - Database migration

---

## Next Steps

1. ✅ Run the migration: `alembic upgrade head`
2. ✅ Restart all services
3. ✅ Test template creation with custom icons
4. ✅ Test recurring process workflows
5. ✅ Verify progress calculations on dashboard

---

**All bugs are now fixed and ready to commit!** 🎉

