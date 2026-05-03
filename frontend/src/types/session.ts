import type { AiStatus, ApiResponse, SessionMode } from './common';

export type SessionSourceType = 'youtube_url' | 'file' | 'private_url';

export interface SessionListItem {
  session_id: number;
  title: string;
  thumbnail_url: string;
  mode: SessionMode;
  ai_status: AiStatus;
  created_at: string;
}

export type SessionListResponse = ApiResponse<SessionListItem[]>;

export interface CreateSessionFromUrlRequest {
  source_type: Exclude<SessionSourceType, 'file'>;
  source_url: string;
  mode: SessionMode;
}

export interface CreateSessionFromFileRequest {
  source_type: 'file';
  file: File;
  mode: SessionMode;
}

export interface CreateSessionResponseData {
  session_id: number;
  title: string;
  ai_status: AiStatus;
  mode: SessionMode;
}

export type CreateSessionResponse = ApiResponse<CreateSessionResponseData>;

export interface SessionDetailData {
  session_id: number;
  title: string;
  source_type: SessionSourceType;
  source_url: string;
  thumbnail_url: string;
  duration_sec: number;
  mode: SessionMode;
  ai_status: AiStatus;
  created_at: string;
}

export type SessionDetailResponse = ApiResponse<SessionDetailData>;

export interface UpdateSessionTitleRequest {
  title: string;
}

export interface UpdateSessionTitleResponseData {
  session_id: number;
  title: string;
}

export type UpdateSessionTitleResponse = ApiResponse<UpdateSessionTitleResponseData>;

export type DeleteSessionResponse = ApiResponse<Record<string, never>>;

export interface SessionStatusData {
  session_id: number;
  ai_status: AiStatus;
  error_message?: string;
}

export type SessionStatusResponse = ApiResponse<SessionStatusData>;

export interface RunSessionProcessResponse {
  // TODO: API 명세 상세 확정 후 필드 정의
}
