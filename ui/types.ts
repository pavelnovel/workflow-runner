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
  sectionId?: string; // Optional section this step belongs to
}

export interface Section {
  id: string;
  title: string;
  isCollapsed: boolean;
}

export type RecurrenceInterval = 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'quarterly';

export interface Template {
  id: string;
  name: string;
  description: string;
  defaultVariables: Variable[]; // Variables that must be initialized at start
  steps: Step[];
  sections?: Section[]; // Optional sections to organize steps
  isRecurring?: boolean; // Whether this is a recurring process
  recurrenceInterval?: RecurrenceInterval; // How often it should run
}

// Helper to strip emojis from text
export const stripEmojis = (text: string): string => {
  return text.replace(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{FE00}-\u{FE0F}]|[\u{1F900}-\u{1F9FF}]|[\u{1FA00}-\u{1FA6F}]|[\u{1FA70}-\u{1FAFF}]|[\u{231A}-\u{231B}]|[\u{23E9}-\u{23F3}]|[\u{23F8}-\u{23FA}]|[\u{25AA}-\u{25AB}]|[\u{25B6}]|[\u{25C0}]|[\u{25FB}-\u{25FE}]|[\u{2614}-\u{2615}]|[\u{2648}-\u{2653}]|[\u{267F}]|[\u{2693}]|[\u{26A1}]|[\u{26AA}-\u{26AB}]|[\u{26BD}-\u{26BE}]|[\u{26C4}-\u{26C5}]|[\u{26CE}]|[\u{26D4}]|[\u{26EA}]|[\u{26F2}-\u{26F3}]|[\u{26F5}]|[\u{26FA}]|[\u{26FD}]|[\u{2702}]|[\u{2705}]|[\u{2708}-\u{270D}]|[\u{270F}]|[\u{2712}]|[\u{2714}]|[\u{2716}]|[\u{271D}]|[\u{2721}]|[\u{2728}]|[\u{2733}-\u{2734}]|[\u{2744}]|[\u{2747}]|[\u{274C}]|[\u{274E}]|[\u{2753}-\u{2755}]|[\u{2757}]|[\u{2763}-\u{2764}]|[\u{2795}-\u{2797}]|[\u{27A1}]|[\u{27B0}]|[\u{27BF}]|[\u{2934}-\u{2935}]|[\u{2B05}-\u{2B07}]|[\u{2B1B}-\u{2B1C}]|[\u{2B50}]|[\u{2B55}]|[\u{3030}]|[\u{303D}]|[\u{3297}]|[\u{3299}]/gu, '').trim();
};

export interface Workflow {
  id: string;
  templateId: string;
  templateName: string;
  currentStepIndex: number;
  variables: Variable[]; // The live state of variables for this run
  steps: Step[]; // Cloned from template to allow individual checklist progress
  completed: boolean;
  startedAt: Date;
  completedAt?: Date; // When the workflow was completed (for recurring process tracking)
  isRecurring?: boolean; // Inherited from template
  recurrenceInterval?: RecurrenceInterval; // Inherited from template
}

export type ViewState = 'DASHBOARD' | 'ACTIVE_PROCESSES' | 'TEMPLATES' | 'RUNNER' | 'CREATE_TEMPLATE' | 'EDIT_TEMPLATE' | 'SETTINGS';

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