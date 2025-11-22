import { apiClient } from './client';
import type { Template } from './types';

export function fetchTemplates(): Promise<Template[]> {
  return apiClient.get<Template[]>('/templates');
}

export function fetchTemplate(id: number): Promise<Template> {
  return apiClient.get<Template>(`/templates/${id}`);
}

export interface CreateTemplatePayload {
  name: string;
  description?: string;
}

export function createTemplate(payload: CreateTemplatePayload): Promise<Template> {
  return apiClient.post<Template>('/templates', payload);
}

