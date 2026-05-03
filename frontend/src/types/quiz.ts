import type { ApiResponse } from './common';

export interface SubmitQuizAnswerRequest {
  selected_index: number;
}

export interface SubmitQuizAnswerResponseData {
  quiz_id: number;
  is_correct: boolean;
  answer_index: number;
  explanation?: string;
}

export type SubmitQuizAnswerResponse = ApiResponse<SubmitQuizAnswerResponseData>;

export interface RetryQuizItem {
  quiz_id: number;
  quiz_index: number;
  question: string;
  options: string[];
}

export interface RetryQuizResponseData {
  session_id: number;
  quizzes: RetryQuizItem[];
}

export type RetryQuizResponse = ApiResponse<RetryQuizResponseData>;
