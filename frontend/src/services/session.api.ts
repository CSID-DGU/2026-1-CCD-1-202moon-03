import { apiClient } from './apiClient';
import type {
  CreateSessionFromFileRequest,
  CreateSessionFromUrlRequest,
  CreateSessionResponse,
  CreateSessionResponseData,
  DeleteSessionResponse,
  ResourceId,
  RunSessionProcessResponse,
  SessionDetailData,
  SessionDetailResponse,
  SessionListItem,
  SessionListResponse,
  SessionThumbnailPresignRequest,
  SessionThumbnailPresignResponse,
  SessionStatusResponse,
  UpdateSessionTitleRequest,
  UpdateSessionTitleResponse,
} from '../types';

const DEFAULT_FILE_TYPE = 'application/octet-stream';

type SessionMediaShape = {
  title?: string | null;
  video_title?: string | null;
  videoTitle?: string | null;
  thumbnail_url?: string | null;
  thumbnail?: string | null;
  thumbnailUrl?: string | null;
};

function resolveMediaUrl(url?: string | null) {
  const normalizedUrl = url?.trim() ?? '';

  if (!normalizedUrl) {
    return null;
  }

  if (/^(https?:)?\/\//i.test(normalizedUrl) || normalizedUrl.startsWith('blob:')) {
    if (normalizedUrl.startsWith('//')) {
      return `https:${normalizedUrl}`;
    }

    return normalizedUrl;
  }

  const baseUrl = import.meta.env.VITE_API_BASE_URL ?? '';

  try {
    return new URL(normalizedUrl, baseUrl).toString();
  } catch {
    return normalizedUrl;
  }
}

function resolveSessionTitle<T extends SessionMediaShape>(session: T, fallbackTitle = '') {
  return session.title?.trim() || session.video_title?.trim() || session.videoTitle?.trim() || fallbackTitle;
}

function resolveSessionThumbnailUrl<T extends SessionMediaShape>(session: T) {
  return resolveMediaUrl(session.thumbnail_url ?? session.thumbnail ?? session.thumbnailUrl ?? null);
}

function normalizeSessionListItem(session: SessionListItem): SessionListItem {
  return {
    ...session,
    title: resolveSessionTitle(session, ''),
    thumbnail_url: resolveSessionThumbnailUrl(session),
  };
}

function normalizeCreateSessionData(
  session: CreateSessionResponseData,
  fallbackTitle = '',
): CreateSessionResponseData {
  return {
    ...session,
    title: resolveSessionTitle(session, fallbackTitle),
    thumbnail_url: resolveSessionThumbnailUrl(session),
  };
}

function normalizeSessionDetailData(session: SessionDetailData): SessionDetailData {
  return {
    ...session,
    title: resolveSessionTitle(session, ''),
    thumbnail_url: resolveSessionThumbnailUrl(session),
  };
}

export async function getSessionList() {
  const response = await apiClient.get<SessionListResponse>('/api/sessions/');
  response.data.data = response.data.data.map(normalizeSessionListItem);
  return response.data;
}

export async function createSessionFromUrl(payload: CreateSessionFromUrlRequest) {
  const response = await apiClient.post<CreateSessionResponse>('/api/sessions/', payload);
  response.data.data = normalizeCreateSessionData(response.data.data);
  return response.data.data;
}

export async function createSessionFromFile(payload: CreateSessionFromFileRequest) {
  const response = await apiClient.post<CreateSessionResponse>('/api/sessions/', {
    source_type: payload.source_type,
    mode: payload.mode,
    file_name: payload.file.name,
    file_type: payload.file.type || DEFAULT_FILE_TYPE,
  });
  response.data.data = normalizeCreateSessionData(response.data.data, payload.file.name);
  return response.data.data;
}

export async function getSessionDetail(id: ResourceId) {
  const response = await apiClient.get<SessionDetailResponse>(`/api/sessions/${id}/`);
  response.data.data = normalizeSessionDetailData(response.data.data);
  return response.data;
}

export async function createSessionThumbnailPresign(
  id: ResourceId,
  payload: SessionThumbnailPresignRequest = {},
) {
  const response = await apiClient.post<SessionThumbnailPresignResponse>(
    `/api/sessions/${id}/thumbnail/presign/`,
    payload,
  );
  response.data.data.thumbnail_url = resolveSessionThumbnailUrl(response.data.data);
  return response.data.data;
}

export async function updateSessionTitle(id: ResourceId, payload: UpdateSessionTitleRequest) {
  const response = await apiClient.patch<UpdateSessionTitleResponse>(
    `/api/sessions/${id}/`,
    payload,
  );
  return response.data;
}

export async function deleteSession(id: ResourceId) {
  const response = await apiClient.delete<DeleteSessionResponse>(`/api/sessions/${id}/`);
  return response.data;
}

export async function getSessionStatus(id: ResourceId) {
  const response = await apiClient.get<SessionStatusResponse>(`/api/sessions/${id}/status/`);
  return response.data;
}

export async function runSessionProcess(id: ResourceId) {
  const response = await apiClient.post<RunSessionProcessResponse>(`/api/sessions/${id}/process/`);
  return response.data;
}
