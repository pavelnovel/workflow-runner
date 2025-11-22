import { Template, Workflow, Variable } from '../types';

const API_BASE_URL = 'http://localhost:8003/api/v1';

// Helper to convert UI Template to Backend format
const templateToBackend = (template: Template) => {
  return {
    name: template.name,
    description: template.description,
    variables: template.defaultVariables || [],
    steps: (template.steps || []).map((step, index) => ({
      title: step.title,
      description: step.description,
      is_required: true,
      order_index: index + 1
    }))
  };
};

// Helper to convert Backend Template to UI format
const templateFromBackend = (backendTemplate: any): Template => {
  return {
    id: backendTemplate.id.toString(),
    name: backendTemplate.name || '',
    description: backendTemplate.description || '',
    defaultVariables: backendTemplate.variables || [],
    steps: (backendTemplate.steps || []).map((step: any) => ({
      id: step.id.toString(),
      title: step.title || '',
      description: step.description || '',
      completed: false
    }))
  };
};

// Helper to convert UI Workflow to Backend Run format
const workflowToBackend = (workflow: Workflow) => {
  return {
    name: workflow.templateName,
    variables: workflow.variables || [],
    current_step_index: workflow.currentStepIndex || 0,
    completed: workflow.completed || false,
    status: workflow.completed ? 'done' : 'in_progress'
  };
};

// Helper to convert Backend Run to UI Workflow format
const workflowFromBackend = (backendRun: any, template?: any): Workflow => {
  const steps = template?.steps || backendRun.steps || [];
  return {
    id: backendRun.id.toString(),
    templateId: backendRun.template_id.toString(),
    templateName: backendRun.name || template?.name || '',
    currentStepIndex: backendRun.current_step_index || 0,
    variables: backendRun.variables || [],
    steps: steps.map((step: any) => ({
      id: step.id?.toString() || step.template_step_id?.toString() || Math.random().toString(),
      title: step.title || step.template_step?.title || '',
      description: step.description || step.template_step?.description || '',
      completed: step.status === 'done' || step.completed || false
    })),
    completed: backendRun.completed || backendRun.status === 'done',
    startedAt: new Date(backendRun.created_at)
  };
};

export const apiService = {
  // Templates
  async getTemplates(): Promise<Template[]> {
    const response = await fetch(`${API_BASE_URL}/templates`);
    if (!response.ok) throw new Error('Failed to fetch templates');
    const data = await response.json();
    return data.map(templateFromBackend);
  },

  async getTemplate(id: string): Promise<Template> {
    const response = await fetch(`${API_BASE_URL}/templates/${id}`);
    if (!response.ok) throw new Error('Failed to fetch template');
    const data = await response.json();
    return templateFromBackend(data);
  },

  async createTemplate(template: Template): Promise<Template> {
    const response = await fetch(`${API_BASE_URL}/templates`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(templateToBackend(template))
    });
    if (!response.ok) throw new Error('Failed to create template');
    const data = await response.json();
    return templateFromBackend(data);
  },

  async updateTemplate(id: string, template: Template): Promise<Template> {
    const response = await fetch(`${API_BASE_URL}/templates/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(templateToBackend(template))
    });
    if (!response.ok) throw new Error('Failed to update template');
    const data = await response.json();
    return templateFromBackend(data);
  },

  async deleteTemplate(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/templates/${id}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error('Failed to delete template');
  },

  // Workflows (Runs)
  async getWorkflows(): Promise<Workflow[]> {
    const response = await fetch(`${API_BASE_URL}/runs`);
    if (!response.ok) throw new Error('Failed to fetch workflows');
    const data = await response.json();
    return data.map((run: any) => workflowFromBackend(run, run.template));
  },

  async getWorkflow(id: string): Promise<Workflow> {
    const response = await fetch(`${API_BASE_URL}/runs/${id}`);
    if (!response.ok) throw new Error('Failed to fetch workflow');
    const data = await response.json();
    return workflowFromBackend(data);
  },

  async createWorkflow(templateId: string, initialVariables?: Variable[]): Promise<Workflow> {
    // First create the run
    const template = await this.getTemplate(templateId);
    const response = await fetch(`${API_BASE_URL}/templates/${templateId}/runs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: template.name,
        variables: initialVariables || template.defaultVariables || []
      })
    });
    if (!response.ok) throw new Error('Failed to create workflow');
    const data = await response.json();
    return workflowFromBackend(data, template);
  },

  async updateWorkflow(id: string, workflow: Workflow): Promise<Workflow> {
    const response = await fetch(`${API_BASE_URL}/runs/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(workflowToBackend(workflow))
    });
    if (!response.ok) throw new Error('Failed to update workflow');
    const data = await response.json();
    return workflowFromBackend(data);
  },

  async deleteWorkflow(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/runs/${id}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error('Failed to delete workflow');
  }
};
