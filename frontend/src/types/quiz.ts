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
  answer_index: number;
  question: string;
  options: string[];
  correct_feedback?: string;
  incorrect_feedback?: string;
  trigger_time?: number;
  segment_range?: [number, number];
}

export interface StoredRetryQuizSession {
  sessionId: string;
  quizzes: RetryQuizItem[];
  updatedAt: number;
}

export interface RetryQuizResponseData {
  session_id: number;
  quizzes: RetryQuizItem[];
}

export type RetryQuizResponse = ApiResponse<RetryQuizResponseData>;
