import type { ApiResponse } from './common';
import type { SessionMode } from './common';

export interface GameBlankItem {
  keyword: string;
  position: number;
  answer_length: number;
}

export interface GameSubtitleItem {
  segment_id: number;
  start?: number;
  end?: number;
  start_sec?: number;
  end_sec?: number;
  original_text: string;
  blank_text: string;
  blanks: GameBlankItem[];
}

export interface GameFallEventItem {
  keyword: string;
  target_time: number;
  fall_window: number;
  segment_id: number;
}

export interface GameQuizItem {
  quiz_id?: number;
  quiz_index?: number;
  trigger_time: number;
  segment_range?: [number, number];
  question: string;
  options: string[];
  answer_index: number;
  correct_feedback?: string;
  incorrect_feedback?: string;
  explanation?: string;
}

export interface GameConfig {
  max_blanks_per_sentence: number;
  total_blanks: number;
  total_segments: number;
}

export interface GameStats {
  transcript_source: 'whisper' | 'youtube_manual' | string;
  total_words: number;
  language: string;
  gpt_refined: boolean;
  total_quizzes?: number;
}

export interface StartGameResponseData {
  session_id: number;
  mode?: SessionMode;
  duration_sec?: number;
  subtitles?: GameSubtitleItem[];
  segments?: GameSubtitleItem[];
  fall_events?: GameFallEventItem[];
  quizzes: GameQuizItem[];
  config?: GameConfig;
  stats?: GameStats;
}

export type StartGameResponse = ApiResponse<StartGameResponseData>;

export interface StreamingChapterMeta {
  title: string;
  start_sec: number;
  end_sec: number;
}

export interface StreamingInitEvent {
  type: 'init';
  session_id?: number;
  total_duration: number;
  chapters: StreamingChapterMeta[];
}

export interface StreamingChapterReadyEvent {
  type: 'chapter_ready';
  session_id?: number;
  chapter_index: number;
  segments?: GameSubtitleItem[];
  subtitles?: GameSubtitleItem[];
  corrected_subtitles?: Array<{
    segment_id: number;
    start?: number;
    end?: number;
    start_sec?: number;
    end_sec?: number;
    text?: string;
    original_text?: string;
    blank_text?: string;
    blanks?: GameBlankItem[];
  }>;
  fall_events?: GameFallEventItem[];
  quizzes?: GameQuizItem[];
}

export interface StreamingCompleteEvent {
  type: 'complete';
  session_id?: number;
  stats?: {
    total_segments?: number;
    total_quizzes?: number;
  };
}

export interface StreamingErrorEvent {
  type: 'error';
  session_id?: number;
  message: string;
}

export type StreamingSessionEvent =
  | StreamingInitEvent
  | StreamingChapterReadyEvent
  | StreamingCompleteEvent
  | StreamingErrorEvent;

export interface NormalizedSegment {
  segmentId: number;
  start: number;
  end: number;
  originalText: string;
  blankText: string;
  blanks: GameBlankItem[];
  chapterIndex?: number;
}

export interface NormalizedFallEvent {
  keyword: string;
  targetTime: number;
  fallWindow: number;
  segmentId: number;
  chapterIndex?: number;
}

export interface NormalizedQuiz {
  quizId: number | null;
  quizIndex: number;
  triggerTime: number;
  segmentRange?: [number, number];
  question: string;
  options: string[];
  answerIndex: number;
  correctFeedback: string;
  incorrectFeedback: string;
  chapterIndex?: number;
}

export interface NormalizedGameChunk {
  chapterIndex: number;
  segments: NormalizedSegment[];
  fallEvents: NormalizedFallEvent[];
  quizzes: NormalizedQuiz[];
}

export interface NormalizedGameData {
  sessionId: number | null;
  mode: SessionMode | null;
  durationSec: number;
  segments: NormalizedSegment[];
  fallEvents: NormalizedFallEvent[];
  quizzes: NormalizedQuiz[];
  chapters: StreamingChapterMeta[];
  loadedChapterIndexes: number[];
  isComplete: boolean;
}

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
