export interface Variable {
  key: string;
  label: string;
  value: string;
  description?: string;
}

export interface Step {
  id: string;
  runStepId?: string; // Tracks the backend run step ID for completion API calls
  title: string;
  description: string; // Supports markdown-like syntax or variable injection {{VarName}}
  completed: boolean;
}

export type RecurrenceInterval = 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'quarterly';

export interface Template {
  id: string;
  name: string;
  description: string;
  icon?: string; // Emoji icon for the template
  defaultVariables: Variable[]; // Variables that must be initialized at start
  steps: Step[];
  isRecurring?: boolean; // Whether this is a recurring process
  recurrenceInterval?: RecurrenceInterval; // How often it should run
}

export interface Workflow {
  id: string;
  templateId: string;
  templateName: string;
  templateIcon?: string; // Emoji icon from template
  currentStepIndex: number;
  variables: Variable[]; // The live state of variables for this run
  steps: Step[]; // Cloned from template to allow individual checklist progress
  completed: boolean;
  startedAt: Date;
  completedAt?: Date; // When the workflow was completed (for recurring process tracking)
  isRecurring?: boolean; // Inherited from template
  recurrenceInterval?: RecurrenceInterval; // Inherited from template
}

export type ViewState = 'DASHBOARD' | 'ACTIVE_PROCESSES' | 'TEMPLATES' | 'RUNNER' | 'CREATE_TEMPLATE' | 'EDIT_TEMPLATE';

// Helper type for workflow status display
export type WorkflowStatus = 'running' | 'idle' | 'overdue' | 'completed';

// Helper to calculate days until overdue based on recurrence interval
export const getIntervalDays = (interval: RecurrenceInterval): number => {
  switch (interval) {
    case 'daily': return 1;
    case 'weekly': return 7;
    case 'biweekly': return 14;
    case 'monthly': return 30;
    case 'quarterly': return 90;
    default: return 14;
  }
};