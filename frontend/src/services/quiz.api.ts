import { apiClient } from './apiClient';
import type {
  ResourceId,
  RetryQuizResponse,
  SubmitQuizAnswerRequest,
  SubmitQuizAnswerResponse,
} from '../types';

export async function submitQuizAnswer(
  id: ResourceId,
  qid: ResourceId,
  payload: SubmitQuizAnswerRequest,
) {
  const response = await apiClient.post<SubmitQuizAnswerResponse>(
    `/api/sessions/${id}/quiz/${qid}/answer/`,
    payload,
  );
  return response.data;
}

export async function retryQuiz(id: ResourceId) {
  const response = await apiClient.get<RetryQuizResponse>(`/api/sessions/${id}/quiz/retry/`);
  return response.data;
}
