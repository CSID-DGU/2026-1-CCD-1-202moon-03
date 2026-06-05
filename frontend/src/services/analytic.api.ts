import { apiClient } from './apiClient';
import type {
  ApiResponse,
  LearningDashboardData,
  LearningDashboardResponse,
  LearningHistoryResponse,
  ResourceId,
  SessionResultResponse,
  SessionSummaryResponse,
} from '../types';

export async function getSessionResult(id: ResourceId) {
  const response = await apiClient.get<SessionResultResponse>(`/api/analytics/sessions/${id}/result/`);
  return response.data;
}

export async function getLearningHistory() {
  const response = await apiClient.get<LearningHistoryResponse>('/api/users/me/history/');
  return response.data;
}

export async function getLearningDashboard() {
  const response = await apiClient.get<LearningDashboardResponse>('/api/analytics/dashboard/');
  const payload = response.data;

  if ('data' in payload) {
    return (payload as ApiResponse<LearningDashboardData>).data;
  }

  return payload;
}

export async function getSessionSummary(id: ResourceId) {
  const response = await apiClient.get<SessionSummaryResponse>(`/api/sessions/${id}/summary/`);
  return response.data;
}
