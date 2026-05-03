import type { ApiResponse } from './common';

export interface GameSubtitleItem {
  // TODO: API 명세 상세 확정 후 필드 정의
}

export interface GameFallEventItem {
  // TODO: API 명세 상세 확정 후 필드 정의
}

export interface GameQuizItem {
  // TODO: API 명세 상세 확정 후 필드 정의
}

export interface StartGameResponseData {
  session_id: number;
  subtitles: GameSubtitleItem[];
  fall_events?: GameFallEventItem[];
  quizzes: GameQuizItem[];
}

export type StartGameResponse = ApiResponse<StartGameResponseData>;

export interface EndGameRequest {
  watch_rate: number;
  total_score?: number;
  max_combo?: number;
  typing_accuracy?: number;
  quiz_correct: number;
  quiz_total: number;
}

export interface EndGameResponseData {
  session_id: number;
  watch_rate: number;
  total_score?: number;
  max_combo?: number;
  typing_accuracy?: number;
  quiz_correct: number;
  quiz_total: number;
}

export type EndGameResponse = ApiResponse<EndGameResponseData>;
