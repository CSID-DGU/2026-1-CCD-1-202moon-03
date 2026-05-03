export interface ApiErrorResponse {
  message?: string;
  detail?: string;
  code?: string;
  data?: Record<string, unknown>;
}

export interface ApiResponse<T> {
  message: string;
  data: T;
}

export type ApiFieldErrors = Record<string, string[]>;

export type ResourceId = number | string;

export type AiStatus = 'pending' | 'processing' | 'done' | 'failed';

export type SessionMode = 'fidget' | 'rain';

export type EmptyObject = Record<string, never>;
