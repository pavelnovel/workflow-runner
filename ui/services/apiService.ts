import { Template, Workflow, Variable } from '../types';

const API_BASE_URL = 'http://localhost:8003/api/v1';

// Helper to convert UI Template to Backend format
const _templateToBackend = (template: Template) => {
  const isRecurring = template.isRecurring || false;
  return {
    name: template.name,
    description: template.description,
    icon: template.icon || '📋',
    isRecurring,
    // Only set recurrenceInterval when isRecurring is true to maintain data consistency
    recurrenceInterval: isRecurring ? (template.recurrenceInterval || 'biweekly') : null,
    variables: template.defaultVariables || [],
    steps: (template.steps || []).map((step, index) => ({
      title: step.title,
      description: step.description,
      is_required: true,
      order_index: index + 1
    }))
  };
};

// Helper to safely convert any value to string (prevents React Error #31)
const safeString = (val: any): string => {
  if (val === null || val === undefined) return '';
  if (typeof val === 'object') return ''; // Empty objects {} should become ''
  return String(val);
};

// Helper to convert Backend Template to UI format
const templateFromBackend = (backendTemplate: any): Template => {
  // Sanitize variables to ensure all properties are strings, not objects
  const sanitizedVariables = Array.isArray(backendTemplate.variables)
    ? backendTemplate.variables.map((v: any) => ({
        key: safeString(v?.key),
        label: safeString(v?.label),
        value: safeString(v?.value),
        description: safeString(v?.description)
      }))
    : [];

  const isRecurring = Boolean(backendTemplate.isRecurring);
  return {
    id: backendTemplate.id.toString(),
    name: safeString(backendTemplate.name),
    description: safeString(backendTemplate.description),
    icon: safeString(backendTemplate.icon) || '📋',
    isRecurring,
    // Only set recurrenceInterval when isRecurring is true to maintain data consistency
    recurrenceInterval: isRecurring ? (backendTemplate.recurrenceInterval || 'biweekly') : undefined,
    defaultVariables: sanitizedVariables,
    steps: (backendTemplate.steps || []).map((step: any) => ({
      id: step.id.toString(),
      title: safeString(step.title),
      description: safeString(step.description),
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
    // Only send completed_at if we have a timestamp - don't use fallback to avoid overwriting original completion time
    completed_at: workflow.completedAt?.toISOString() || null,
    status: workflow.completed ? 'done' : 'in_progress'
  };
};

// Helper to convert Backend Run to UI Workflow format
const workflowFromBackend = (backendRun: any, template?: any): Workflow => {
  const runSteps = backendRun.steps || [];
  const templateSteps = template?.steps || [];

  // Use run steps if available (they have status), otherwise fallback to template steps
  const steps = runSteps.length > 0 ? runSteps : templateSteps;

  // Sanitize variables to ensure all properties are strings
  const sanitizedVariables = Array.isArray(backendRun.variables)
    ? backendRun.variables.map((v: any) => ({
        key: safeString(v?.key),
        label: safeString(v?.label),
        value: safeString(v?.value),
        description: safeString(v?.description)
      }))
    : [];

  return {
    id: backendRun.id.toString(),
    templateId: backendRun.template_id.toString(),
    templateName: safeString(backendRun.name) || safeString(template?.name) || '',
    currentStepIndex: backendRun.current_step_index || 0,
    variables: sanitizedVariables,
    steps: steps.map((step: any) => ({
      id: step.template_step_id?.toString() || step.id?.toString() || Math.random().toString(),
      runStepId: step.run_id ? step.id.toString() : undefined, // Track backend run step ID
      title: safeString(step.template_step?.title) || safeString(step.title),
      description: safeString(step.template_step?.description) || safeString(step.description),
      completed: step.status === 'done' || step.completed || false
    })),
    completed: backendRun.completed || backendRun.status === 'done',
    completedAt: backendRun.completed_at ? new Date(backendRun.completed_at) : undefined,
    startedAt: new Date(backendRun.created_at),
    isRecurring: template?.isRecurring || false,
    // Only set recurrenceInterval when isRecurring is true to maintain data consistency
    recurrenceInterval: template?.isRecurring ? (template?.recurrenceInterval || 'biweekly') : undefined
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
    const isRecurring = template.isRecurring || false;
    const createPayload = {
      name: template.name,
      description: template.description,
      icon: template.icon || '📋',
      isRecurring,
      // Only set recurrenceInterval when isRecurring is true to maintain data consistency
      recurrenceInterval: isRecurring ? (template.recurrenceInterval || 'biweekly') : null,
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
    // Step 1: Update template metadata (name, description, variables, recurrence, icon)
    const isRecurring = template.isRecurring || false;
    const updatePayload = {
      name: template.name,
      description: template.description,
      icon: template.icon || '📋',
      isRecurring,
      // Only set recurrenceInterval when isRecurring is true to maintain data consistency
      recurrenceInterval: isRecurring ? (template.recurrenceInterval || 'biweekly') : null,
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
    const _existingStepIds = new Set(data.steps.map((s: any) => s.id.toString()));
    const _newStepIds = new Set(template.steps.filter(s => !s.id.startsWith('step_')).map(s => s.id));

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
    // Pass data.template to preserve template-specific fields (icon, isRecurring, recurrenceInterval)
    return workflowFromBackend(data, data.template);
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
    // Pass data.template to preserve template-specific fields (icon, isRecurring, recurrenceInterval)
    return workflowFromBackend(data, data.template);
  },

  async deleteWorkflow(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/runs/${id}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error('Failed to delete workflow');
  },

  async completeStep(workflowId: string, runStepId: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/runs/${workflowId}/steps/${runStepId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'done' })
    });
    if (!response.ok) throw new Error('Failed to complete step');
  }
};
