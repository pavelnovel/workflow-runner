export interface Variable {
  key: string;
  label: string;
  value: string;
  description?: string;
}

export interface Step {
  id: string;
  title: string;
  description: string; // Supports markdown-like syntax or variable injection {{VarName}}
  completed: boolean;
}

export interface Template {
  id: string;
  name: string;
  description: string;
  defaultVariables: Variable[]; // Variables that must be initialized at start
  steps: Step[];
}

export interface Workflow {
  id: string;
  templateId: string;
  templateName: string;
  currentStepIndex: number;
  variables: Variable[]; // The live state of variables for this run
  steps: Step[]; // Cloned from template to allow individual checklist progress
  completed: boolean;
  startedAt: Date;
}

export type ViewState = 'DASHBOARD' | 'RUNNER' | 'CREATE_TEMPLATE' | 'EDIT_TEMPLATE';