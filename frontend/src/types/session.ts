import type { AiStatus, ApiResponse, SessionMode } from './common';

export type SessionSourceType = 'youtube_url' | 'file' | 'private_url';

export interface SessionListItem {
  session_id?: number;
  id?: number;
  title: string;
  thumbnail_url: string | null;
  video_title?: string | null;
  videoTitle?: string | null;
  thumbnail?: string | null;
  thumbnailUrl?: string | null;
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
  session_id?: number;
  id?: number;
  title: string;
  video_title?: string | null;
  videoTitle?: string | null;
  thumbnail_url?: string | null;
  thumbnail?: string | null;
  thumbnailUrl?: string | null;
  presigned_url?: string | null;
  s3_key?: string | null;
  ai_status: AiStatus;
  mode: SessionMode;
}

export type CreateSessionResponse = ApiResponse<CreateSessionResponseData>;

export interface SessionDetailData {
  session_id?: number;
  id?: number;
  title: string;
  video_title?: string | null;
  videoTitle?: string | null;
  source_type: SessionSourceType;
  source_url: string | null;
  video_url: string | null;
  thumbnail_url: string | null;
  thumbnail?: string | null;
  thumbnailUrl?: string | null;
  duration_sec: number | null;
  mode: SessionMode;
  ai_status: AiStatus;
  created_at: string;
}

export type SessionDetailResponse = ApiResponse<SessionDetailData>;

export interface SessionThumbnailPresignRequest {
  file_type?: string;
}

export interface SessionThumbnailPresignResponseData {
  presigned_url: string;
  s3_key: string;
  thumbnail_url: string | null;
}

export type SessionThumbnailPresignResponse = ApiResponse<SessionThumbnailPresignResponseData>;

export interface UpdateSessionTitleRequest {
  title: string;
}

export interface UpdateSessionTitleResponseData {
  session_id?: number;
  id?: number;
  title: string;
}

export type UpdateSessionTitleResponse = ApiResponse<UpdateSessionTitleResponseData>;

export type DeleteSessionResponse = ApiResponse<Record<string, never>>;

export interface SessionStatusData {
  session_id?: number;
  id?: number;
  ai_status: AiStatus;
  error_message?: string;
}

export type SessionStatusResponse = ApiResponse<SessionStatusData>;

export interface RunSessionProcessResponse {
  // TODO: API 명세 상세 확정 후 필드 정의
}
