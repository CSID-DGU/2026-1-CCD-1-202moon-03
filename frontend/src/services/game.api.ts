import { apiClient } from './apiClient';
import type { EndGameRequest, EndGameResponse, ResourceId, StartGameResponse } from '../types';

export async function startGame(id: ResourceId) {
  const response = await apiClient.post<StartGameResponse>(`/api/sessions/${id}/game/start/`);
  return response.data;
}

export async function endGame(id: ResourceId, payload: EndGameRequest) {
  const response = await apiClient.post<EndGameResponse>(`/api/sessions/${id}/game/end/`, payload);
  return response.data;
}
