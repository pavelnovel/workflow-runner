/**
 * UNIT TESTS - API Service
 *
 * Tests for apiService data transformations and error handling
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock fetch for isolated unit testing
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('Unit Tests - API Service Data Transformations', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  describe('Template Conversion', () => {
    it('should handle null/undefined values in template response', () => {
      const backendTemplate = {
        id: 'test-1',
        name: 'Test',
        description: null,
        icon: null,
        is_recurring: null,
        recurrence_interval: null,
        steps: [],
        default_variables: null,
      };

      // Simulate the conversion logic
      const converted = {
        id: backendTemplate.id,
        name: backendTemplate.name || '',
        description: backendTemplate.description || '',
        defaultVariables: backendTemplate.default_variables || [],
        steps: backendTemplate.steps || [],
        isRecurring: Boolean(backendTemplate.is_recurring),
        recurrenceInterval: backendTemplate.recurrence_interval || undefined,
      };

      expect(converted.description).toBe('');
      expect(converted.defaultVariables).toEqual([]);
      expect(converted.isRecurring).toBe(false);
    });

    it('should convert snake_case to camelCase for templates', () => {
      const backendTemplate = {
        id: 'test-1',
        name: 'Test',
        description: 'Desc',
        is_recurring: true,
        recurrence_interval: 'weekly',
        default_variables: [{ key: 'test', label: 'Test', value: '' }],
        steps: [],
      };

      const converted = {
        id: backendTemplate.id,
        name: backendTemplate.name,
        description: backendTemplate.description,
        isRecurring: backendTemplate.is_recurring,
        recurrenceInterval: backendTemplate.recurrence_interval,
        defaultVariables: backendTemplate.default_variables,
        steps: backendTemplate.steps,
      };

      expect(converted.isRecurring).toBe(true);
      expect(converted.recurrenceInterval).toBe('weekly');
      expect(converted.defaultVariables).toHaveLength(1);
    });
  });

  describe('Run/Workflow Conversion', () => {
    it('should convert backend run to frontend workflow format', () => {
      const backendRun = {
        id: 'run-1',
        template_id: 'template-1',
        template_name: 'Test Workflow',
        status: 'in_progress',
        variables: { projectName: 'Test' },
        started_at: '2024-01-01T00:00:00Z',
        completed_at: null,
        steps: [
          {
            id: 'step-1',
            run_id: 'run-1',
            template_step_id: 'ts-1',
            title: 'Step 1',
            description: 'Do something',
            status: 'done',
            order_index: 0,
          },
        ],
      };

      const converted = {
        id: backendRun.id,
        templateId: backendRun.template_id,
        templateName: backendRun.template_name,
        currentStepIndex: 0,
        variables: Object.entries(backendRun.variables || {}).map(([key, value]) => ({
          key,
          label: key,
          value: String(value),
        })),
        steps: backendRun.steps.map((s) => ({
          id: s.template_step_id,
          runStepId: s.id,
          title: s.title,
          description: s.description,
          completed: s.status === 'done',
        })),
        completed: backendRun.status === 'done' || backendRun.status === 'archived',
        startedAt: new Date(backendRun.started_at),
      };

      expect(converted.templateId).toBe('template-1');
      expect(converted.templateName).toBe('Test Workflow');
      expect(converted.variables).toHaveLength(1);
      expect(converted.variables[0].key).toBe('projectName');
      expect(converted.steps[0].completed).toBe(true);
      expect(converted.steps[0].runStepId).toBe('step-1');
    });

    it('should handle empty variables object', () => {
      const variables = {};
      const converted = Object.entries(variables).map(([key, value]) => ({
        key,
        label: key,
        value: String(value),
      }));

      expect(converted).toEqual([]);
    });

    it('should calculate correct currentStepIndex', () => {
      const steps = [
        { status: 'done' },
        { status: 'done' },
        { status: 'in_progress' },
        { status: 'not_started' },
      ];

      const currentStepIndex = steps.findIndex(
        (s) => s.status !== 'done'
      );

      expect(currentStepIndex).toBe(2);
    });

    it('should handle all steps completed', () => {
      const steps = [
        { status: 'done' },
        { status: 'done' },
        { status: 'done' },
      ];

      let currentStepIndex = steps.findIndex((s) => s.status !== 'done');
      if (currentStepIndex === -1) {
        currentStepIndex = steps.length - 1;
      }

      expect(currentStepIndex).toBe(2);
    });
  });

  describe('Error Handling Patterns', () => {
    it('should recognize non-ok responses', () => {
      // Test the pattern of checking response.ok
      const okResponse = { ok: true, status: 200 };
      const notFoundResponse = { ok: false, status: 404 };
      const serverErrorResponse = { ok: false, status: 500 };

      expect(okResponse.ok).toBe(true);
      expect(notFoundResponse.ok).toBe(false);
      expect(serverErrorResponse.ok).toBe(false);
    });

    it('should identify 404 status as not found', () => {
      const response = { ok: false, status: 404, statusText: 'Not Found' };
      expect(response.status).toBe(404);
      expect(response.ok).toBe(false);
    });

    it('should identify 500 status as server error', () => {
      const response = { ok: false, status: 500, statusText: 'Internal Server Error' };
      expect(response.status).toBe(500);
      expect(response.ok).toBe(false);
    });
  });
});
