export type StepFieldDef = {
  id: number;
  template_step_id: number;
  name: string;
  label: string;
  type: string;
  required: boolean;
  order_index: number;
};

export type TemplateStep = {
  id: number;
  template_id: number;
  title: string;
  description?: string | null;
  is_required: boolean;
  order_index: number;
  field_defs: StepFieldDef[];
};

export type Template = {
  id: number;
  name: string;
  description?: string | null;
  steps: TemplateStep[];
};

export type RunStep = {
  id: number;
  run_id: number;
  template_step_id: number;
  order_index: number;
  status: string;
  notes?: string | null;
  field_values: Array<{
    id: number;
    field_def_id: number;
    value: unknown;
  }>;
};

export type Run = {
  id: number;
  template_id: number;
  name: string;
  status: string;
  steps?: RunStep[];
};

