import { apiClient } from './apiClient';
import type {
  LearningHistoryResponse,
  ResourceId,
  SessionResultResponse,
  SessionSummaryResponse,
} from '../types';

export async function getSessionResult(id: ResourceId) {
  const response = await apiClient.get<SessionResultResponse>(`/api/sessions/${id}/result/`);
  return response.data;
}

export async function getLearningHistory() {
  const response = await apiClient.get<LearningHistoryResponse>('/api/users/me/history/');
  return response.data;
}

export async function getSessionSummary(id: ResourceId) {
  const response = await apiClient.get<SessionSummaryResponse>(`/api/sessions/${id}/summary/`);
  return response.data;
}
