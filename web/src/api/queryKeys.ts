export const queryKeys = {
  templates: ['templates'] as const,
  template: (id: number) => ['templates', id] as const,
  runs: (filters?: Record<string, unknown>) => ['runs', filters ?? {}] as const,
  run: (id: number) => ['runs', id] as const
};

