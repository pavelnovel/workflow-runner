import { http, HttpResponse } from 'msw';

const API_BASE = 'http://localhost:8003/api/v1';

// Mock data
export const mockTemplates = [
  {
    id: 'template-1',
    name: 'Test Workflow',
    description: 'A test workflow for testing',
    icon: null,
    is_recurring: false,
    recurrence_interval: null,
    steps: [
      { id: 'step-1', template_id: 'template-1', title: 'Step 1', description: 'First step', order_index: 0 },
      { id: 'step-2', template_id: 'template-1', title: 'Step 2', description: 'Second step', order_index: 1 },
    ],
    default_variables: [
      { key: 'projectName', label: 'Project Name', value: '', description: 'Name of the project' },
    ],
  },
];

export const mockRuns = [
  {
    id: 'run-1',
    template_id: 'template-1',
    template_name: 'Test Workflow',
    status: 'in_progress',
    variables: { projectName: 'My Project' },
    started_at: new Date().toISOString(),
    completed_at: null,
    steps: [
      { id: 'run-step-1', run_id: 'run-1', template_step_id: 'step-1', title: 'Step 1', description: 'First step', status: 'done', order_index: 0 },
      { id: 'run-step-2', run_id: 'run-1', template_step_id: 'step-2', title: 'Step 2', description: 'Second step', status: 'not_started', order_index: 1 },
    ],
  },
];

export const handlers = [
  // Health check
  http.get(`${API_BASE.replace('/api/v1', '')}/healthz`, () => {
    return HttpResponse.json({ status: 'healthy' });
  }),

  // Templates
  http.get(`${API_BASE}/templates`, () => {
    return HttpResponse.json(mockTemplates);
  }),

  http.get(`${API_BASE}/templates/:id`, ({ params }) => {
    const template = mockTemplates.find(t => t.id === params.id);
    if (!template) {
      return new HttpResponse(null, { status: 404 });
    }
    return HttpResponse.json(template);
  }),

  http.post(`${API_BASE}/templates`, async ({ request }) => {
    const body = await request.json() as any;
    const newTemplate = {
      id: `template-${Date.now()}`,
      ...body,
      steps: [],
    };
    return HttpResponse.json(newTemplate, { status: 201 });
  }),

  http.patch(`${API_BASE}/templates/:id`, async ({ params, request }) => {
    const body = await request.json() as any;
    const template = mockTemplates.find(t => t.id === params.id);
    if (!template) {
      return new HttpResponse(null, { status: 404 });
    }
    return HttpResponse.json({ ...template, ...body });
  }),

  // Template steps
  http.patch(`${API_BASE}/template-steps/:id`, async ({ params, request }) => {
    const body = await request.json() as any;
    return HttpResponse.json({
      id: params.id,
      ...body,
    });
  }),

  http.delete(`${API_BASE}/templates/:id`, ({ params }) => {
    const index = mockTemplates.findIndex(t => t.id === params.id);
    if (index === -1) {
      return new HttpResponse(null, { status: 404 });
    }
    return new HttpResponse(null, { status: 204 });
  }),

  // Runs
  http.get(`${API_BASE}/runs`, () => {
    return HttpResponse.json(mockRuns);
  }),

  http.get(`${API_BASE}/runs/:id`, ({ params }) => {
    const run = mockRuns.find(r => r.id === params.id);
    if (!run) {
      return new HttpResponse(null, { status: 404 });
    }
    return HttpResponse.json(run);
  }),

  http.post(`${API_BASE}/templates/:templateId/runs`, async ({ params, request }) => {
    const body = await request.json() as any;
    const template = mockTemplates.find(t => t.id === params.templateId);
    if (!template) {
      return new HttpResponse(null, { status: 404 });
    }
    const newRun = {
      id: `run-${Date.now()}`,
      template_id: template.id,
      template_name: template.name,
      status: 'in_progress',
      variables: body.variables || {},
      started_at: new Date().toISOString(),
      completed_at: null,
      steps: template.steps.map((s, i) => ({
        id: `run-step-${Date.now()}-${i}`,
        run_id: `run-${Date.now()}`,
        template_step_id: s.id,
        title: s.title,
        description: s.description,
        status: 'not_started',
        order_index: s.order_index,
      })),
    };
    return HttpResponse.json(newRun, { status: 201 });
  }),

  http.patch(`${API_BASE}/runs/:id`, async ({ params, request }) => {
    const body = await request.json() as any;
    const run = mockRuns.find(r => r.id === params.id);
    if (!run) {
      return new HttpResponse(null, { status: 404 });
    }
    return HttpResponse.json({ ...run, ...body });
  }),

  http.patch(`${API_BASE}/runs/:runId/steps/:stepId`, async ({ params, request }) => {
    const body = await request.json() as any;
    return HttpResponse.json({
      id: params.stepId,
      run_id: params.runId,
      status: body.status || 'done',
      ...body,
    });
  }),

  http.delete(`${API_BASE}/runs/:id`, () => {
    return new HttpResponse(null, { status: 204 });
  }),
];
