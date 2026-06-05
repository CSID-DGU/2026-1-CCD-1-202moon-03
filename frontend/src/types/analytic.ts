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
  tab_leave_count?: number;
  study_duration_seconds?: number;
  ai_summary: string;
  completed_at: string;
}

export type SessionResultResponse = ApiResponse<SessionResultData>;

export interface LearningHistoryItem {
  session_id: number;
  title: string;
  mode: SessionMode;
  thumbnail_url?: string | null;
  completed_at: string;
  watch_rate: number;
  total_score?: number;
  typing_accuracy?: number;
  quiz_correct: number;
  quiz_total: number;
  tab_leave_count?: number;
  study_duration_seconds?: number;
}

export type LearningHistoryResponse = ApiResponse<LearningHistoryItem[]>;

export interface LearningDashboardSummary {
  total_study_duration_seconds: number;
  average_quiz_accuracy: number;
  average_typing_accuracy: number;
  average_tab_leave_count: number;
}

export interface StudyTimeTrendPoint {
  date: string;
  seconds: number;
}

export interface AccuracyTrendPoint {
  week: string;
  accuracy: number;
}

export interface LearningDashboardTrends {
  study_time: StudyTimeTrendPoint[];
  quiz_accuracy: AccuracyTrendPoint[];
  typing_accuracy: AccuracyTrendPoint[];
}

export interface LearningDashboardFocusStats {
  this_week_tab_leave_count: number;
  tab_leave_change_rate: number;
}

export interface LearningDashboardDailyResult {
  date: string;
  session_count: number;
  total_study_duration_seconds: number;
  average_quiz_accuracy: number;
  average_typing_accuracy: number;
  total_tab_leave_count: number;
}

export interface LearningDashboardSession extends LearningHistoryItem {
  tab_leave_count: number;
  study_duration_seconds: number;
}

export interface LearningDashboardData {
  summary: LearningDashboardSummary;
  trends: LearningDashboardTrends;
  focus_stats: LearningDashboardFocusStats;
  daily_results: LearningDashboardDailyResult[];
  sessions: LearningDashboardSession[];
}

export type LearningDashboardResponse = LearningDashboardData | ApiResponse<LearningDashboardData>;

export interface SessionSummaryData {
  session_id: number;
  summary: string;
}

export type SessionSummaryResponse = ApiResponse<SessionSummaryData>;
