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
    // Step 1: Create template with metadata only
    const createPayload = {
      name: template.name,
      description: template.description,
      variables: template.defaultVariables || []
    };

    const response = await fetch(`${API_BASE_URL}/templates`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(createPayload)
    });
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Create failed:', errorText);
      throw new Error(`Failed to create template: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    const templateId = data.id;

    // Step 2: Create all steps
    for (let i = 0; i < template.steps.length; i++) {
      const step = template.steps[i];
      const stepPayload = {
        title: step.title,
        description: step.description,
        is_required: true,
        order_index: i + 1
      };

      await fetch(`${API_BASE_URL}/templates/${templateId}/steps`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(stepPayload)
      });
    }

    // Fetch the complete template with all steps
    return this.getTemplate(templateId.toString());
  },

  async updateTemplate(id: string, template: Template): Promise<Template> {
    // Step 1: Update template metadata (name, description, variables)
    const updatePayload = {
      name: template.name,
      description: template.description,
      variables: template.defaultVariables || []
    };

    const response = await fetch(`${API_BASE_URL}/templates/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatePayload)
    });
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Update failed:', errorText);
      throw new Error(`Failed to update template: ${response.status} ${errorText}`);
    }

    const data = await response.json();

    // Step 2: Sync steps with backend
    const existingStepIds = new Set(data.steps.map((s: any) => s.id.toString()));
    const newStepIds = new Set(template.steps.filter(s => !s.id.startsWith('step_')).map(s => s.id));

    // Delete removed steps
    for (const existingStep of data.steps) {
      if (!template.steps.find(s => s.id === existingStep.id.toString())) {
        await fetch(`${API_BASE_URL}/template-steps/${existingStep.id}`, {
          method: 'DELETE'
        });
      }
    }

    // Update existing steps and create new ones
    for (let i = 0; i < template.steps.length; i++) {
      const step = template.steps[i];
      const stepPayload = {
        title: step.title,
        description: step.description,
        is_required: true,
        order_index: i + 1
      };

      if (step.id.startsWith('step_')) {
        // New step - create it
        await fetch(`${API_BASE_URL}/templates/${id}/steps`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(stepPayload)
        });
      } else {
        // Existing step - update it
        await fetch(`${API_BASE_URL}/template-steps/${step.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(stepPayload)
        });
      }
    }

    // Fetch the fully updated template
    return this.getTemplate(id);
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
