import { apiClient } from './client';
import type { Run } from './types';

export function fetchRuns(params?: { status?: string; template_id?: number }): Promise<Run[]> {
  const search = new URLSearchParams();
  if (params?.status) search.set('status', params.status);
  if (params?.template_id) search.set('template_id', String(params.template_id));
  const query = search.toString();
  return apiClient.get<Run[]>(`/runs${query ? `?${query}` : ''}`);
}

export function fetchRun(runId: number): Promise<Run> {
  return apiClient.get<Run>(`/runs/${runId}`);
}

