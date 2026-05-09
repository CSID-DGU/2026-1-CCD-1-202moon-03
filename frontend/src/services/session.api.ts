import { apiClient } from './apiClient';
import type {
  CreateSessionFromFileRequest,
  CreateSessionFromUrlRequest,
  CreateSessionResponse,
  DeleteSessionResponse,
  ResourceId,
  RunSessionProcessResponse,
  SessionDetailResponse,
  SessionListResponse,
  SessionStatusResponse,
  UpdateSessionTitleRequest,
  UpdateSessionTitleResponse,
} from '../types';

export async function getSessionList() {
  const response = await apiClient.get<SessionListResponse>('/api/sessions/');
  return response.data;
}

export async function createSessionFromUrl(payload: CreateSessionFromUrlRequest) {
  const response = await apiClient.post<CreateSessionResponse>('/api/sessions/', payload);
  return response.data;
}

export async function createSessionFromFile(payload: CreateSessionFromFileRequest) {
  const formData = new FormData();
  formData.append('source_type', payload.source_type);
  formData.append('file', payload.file);
  formData.append('mode', payload.mode);

  const response = await apiClient.post<CreateSessionResponse>('/api/sessions/', formData);
  return response.data;
}

export async function getSessionDetail(id: ResourceId) {
  const response = await apiClient.get<SessionDetailResponse>(`/api/sessions/${id}/`);
  return response.data;
}

export async function updateSessionTitle(id: ResourceId, payload: UpdateSessionTitleRequest) {
  const response = await apiClient.patch<UpdateSessionTitleResponse>(
    `/api/sessions/${id}/`,
    payload,
  );
  return response.data;
}

export async function deleteSession(id: ResourceId) {
  const response = await apiClient.delete<DeleteSessionResponse>(`/api/sessions/${id}/`);
  return response.data;
}

export async function getSessionStatus(id: ResourceId) {
  const response = await apiClient.get<SessionStatusResponse>(`/api/sessions/${id}/status/`);
  return response.data;
}

export async function runSessionProcess(id: ResourceId) {
  const response = await apiClient.post<RunSessionProcessResponse>(`/api/sessions/${id}/process/`);
  return response.data;
}
