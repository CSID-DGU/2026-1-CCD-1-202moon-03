import type { ApiResponse, SessionMode } from './common';

export interface SessionResultData {
  session_id: number;
  mode: SessionMode;
  title: string;
  watch_rate: number;
  total_score?: number;
  max_combo?: number;
  typing_accuracy?: number;
  quiz_correct: number;
  quiz_total: number;
  ai_summary: string;
  completed_at: string;
}

export type SessionResultResponse = ApiResponse<SessionResultData>;

export interface LearningHistoryItem {
  session_id: number;
  title: string;
  mode: SessionMode;
  completed_at: string;
  watch_rate: number;
  total_score?: number;
  typing_accuracy?: number;
  quiz_correct: number;
  quiz_total: number;
}

export type LearningHistoryResponse = ApiResponse<LearningHistoryItem[]>;

export interface SessionSummaryData {
  session_id: number;
  summary: string;
}

export type SessionSummaryResponse = ApiResponse<SessionSummaryData>;
