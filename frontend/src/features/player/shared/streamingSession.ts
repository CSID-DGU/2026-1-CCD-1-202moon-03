import { createSessionThumbnailPresign } from '../../../services/session.api';
import { useAuthStore } from '../../../store/useAuthStore';
import type { StreamingPlayerSource } from '../../../store/usePlayerStore';
import type { StreamingSessionEvent } from '../../../types';
import { createThumbnailFromVideoFile } from './videoThumbnail';

function getApiBaseUrl() {
  return import.meta.env.VITE_API_BASE_URL ?? '';
}

function buildAbsoluteUrl(path: string) {
  const baseUrl = getApiBaseUrl();

  try {
    return new URL(path, baseUrl).toString();
  } catch {
    return `${baseUrl}${path}`;
  }
}

function getAuthHeaders() {
  const accessToken = useAuthStore.getState().accessToken;

  if (!accessToken) {
    throw new Error('로그인이 필요합니다.');
  }

  return {
    Authorization: `Bearer ${accessToken}`,
  };
}

function assertFileStreamingSource(
  source: StreamingPlayerSource,
): asserts source is StreamingPlayerSource & { file: File; sessionId: string } {
  if (!source.file) {
    throw new Error('스트리밍할 파일 정보가 없습니다.');
  }

  if (!source.sessionId) {
    throw new Error('스트리밍을 시작할 세션 ID가 없습니다.');
  }
}

function decodeSseBlock(block: string): StreamingSessionEvent[] {
  const lines = block
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.startsWith('data:'));

  return lines
    .map((line) => line.replace(/^data:\s*/, ''))
    .filter(Boolean)
    .map((payload) => JSON.parse(payload) as StreamingSessionEvent);
}

async function buildStreamingError(response: Response) {
  const fallbackMessage = `스트리밍 연결 실패: ${response.status}`;
  const contentType = response.headers.get('content-type') ?? '';

  try {
    if (contentType.includes('application/json')) {
      const payload = (await response.json()) as {
        message?: string;
        detail?: string;
      };

      return payload.message ?? payload.detail ?? fallbackMessage;
    }

    const text = (await response.text()).trim();

    if (!text || text.startsWith('<')) {
      return fallbackMessage;
    }

    return text;
  } catch {
    return fallbackMessage;
  }
}

async function* readSseEvents(response: Response) {
  if (!response.ok) {
    throw new Error(await buildStreamingError(response));
  }

  if (!response.body) {
    throw new Error('스트리밍 응답 본문이 없습니다.');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();

    if (done) {
      break;
    }

    buffer += decoder.decode(value, { stream: true });
    const chunks = buffer.split(/\r?\n\r?\n/);
    buffer = chunks.pop() ?? '';

    for (const chunk of chunks) {
      for (const event of decodeSseBlock(chunk)) {
        yield event;
      }
    }
  }

  if (buffer.trim()) {
    for (const event of decodeSseBlock(buffer)) {
      yield event;
    }
  }
}

async function uploadSessionThumbnail({
  file,
  sessionId,
  signal,
}: {
  file: File;
  sessionId: string;
  signal?: AbortSignal;
}) {
  console.log('[streamingSession] thumbnail upload start', {
    sessionId,
    fileName: file.name,
    fileType: file.type,
    fileSize: file.size,
  });

  const thumbnailBlob = await createThumbnailFromVideoFile(file);
  console.log('[streamingSession] thumbnail blob created', {
    sessionId,
    blobType: thumbnailBlob.type,
    blobSize: thumbnailBlob.size,
  });

  const thumbnailPresign = await createSessionThumbnailPresign(sessionId, {
    file_type: thumbnailBlob.type || 'image/jpeg',
  });
  console.log('[streamingSession] thumbnail presign received', {
    sessionId,
    hasPresignedUrl: Boolean(thumbnailPresign.presigned_url),
    thumbnailUrl: thumbnailPresign.thumbnail_url,
  });

  const uploadResponse = await fetch(thumbnailPresign.presigned_url, {
    method: 'PUT',
    body: thumbnailBlob,
    signal,
  });
  console.log('[streamingSession] thumbnail upload response', {
    sessionId,
    ok: uploadResponse.ok,
    status: uploadResponse.status,
  });

  if (!uploadResponse.ok) {
    throw new Error(await buildStreamingError(uploadResponse));
  }
}

export async function* startStreamingSession({
  source,
  signal,
}: {
  source: StreamingPlayerSource;
  signal?: AbortSignal;
}): AsyncGenerator<StreamingSessionEvent, void, void> {
  console.log('[streamingSession] startStreamingSession entered', {
    sourceType: source.type,
    sessionId: source.sessionId ?? null,
    hasFile: Boolean(source.file),
    hasPresignedUrl: Boolean(source.presignedUrl),
    hasS3Key: Boolean(source.s3Key),
    language: source.language ?? 'ko',
  });

  const headers = getAuthHeaders();

  if (source.type === 'youtube_url') {
    console.log('[streamingSession] before youtube stream request', {
      sessionId: source.sessionId ?? null,
      url: source.url ?? null,
    });

    const response = await fetch(buildAbsoluteUrl('/api/sessions/stream/'), {
      method: 'POST',
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: source.url,
        language: source.language ?? 'ko',
        ...(source.sessionId ? { session_id: source.sessionId } : {}),
      }),
      signal,
    });

    console.log('[streamingSession] after youtube stream response', {
      sessionId: source.sessionId ?? null,
      ok: response.ok,
      status: response.status,
    });

    yield* readSseEvents(response);
    return;
  }

  const presignedUrl = source.presignedUrl;
  const s3Key = source.s3Key;
  const hasLocalFile = Boolean(source.file);

  console.log('[streamingSession] file stream metadata', {
    sessionId: source.sessionId ?? null,
    presignedUrl,
    s3Key,
    hasLocalFile,
  });

  if (presignedUrl) {
    const url = new URL(presignedUrl);
    console.log('[streamingSession] presigned url details', {
      algorithm: url.searchParams.get('X-Amz-Algorithm'),
      containsCaret: presignedUrl.includes('^'),
      containsEncodedCaret: presignedUrl.includes('%5E'),
      host: url.host,
    });
  }

  if (!presignedUrl) {
    throw new Error('S3 업로드 URL 정보가 없습니다.');
  }

  if (!s3Key) {
    throw new Error('S3 파일 키 정보가 없습니다.');
  }

  if (hasLocalFile) {
    assertFileStreamingSource(source);
    console.log('[streamingSession] before S3 PUT', {
      sessionId: source.sessionId,
      fileName: source.file.name,
      fileType: source.file.type,
      fileSize: source.file.size,
    });

    const fileBuffer = await source.file.arrayBuffer();
    console.log('[streamingSession] file buffer ready', {
      sessionId: source.sessionId,
      byteLength: fileBuffer.byteLength,
    });

    const uploadResponse = await fetch(presignedUrl, {
      method: 'PUT',
      body: fileBuffer,
      signal,
    });
    console.log('[streamingSession] after S3 PUT', {
      sessionId: source.sessionId,
      ok: uploadResponse.ok,
      status: uploadResponse.status,
    });

    if (!uploadResponse.ok) {
      throw new Error(await buildStreamingError(uploadResponse));
    }

    console.log('[streamingSession] schedule thumbnail upload', {
      sessionId: source.sessionId,
    });
    void uploadSessionThumbnail({
      file: source.file,
      sessionId: source.sessionId,
      signal,
    })
      .then(() => {
        console.log('[streamingSession] after thumbnail upload', {
          sessionId: source.sessionId,
        });
      })
      .catch((error) => {
        console.warn('[streamingSession] thumbnail upload failed', error);
      });
  }

  console.log('[streamingSession] before stream/s3 request', {
    sessionId: source.sessionId ?? null,
    s3Key,
  });

  const response = await fetch(buildAbsoluteUrl('/api/sessions/stream/s3/'), {
    method: 'POST',
    headers: {
      ...headers,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      session_id: source.sessionId,
      s3_key: s3Key,
      language: source.language ?? 'ko',
    }),
    signal,
  });

  console.log('[streamingSession] after stream/s3 response', {
    sessionId: source.sessionId ?? null,
    ok: response.ok,
    status: response.status,
  });

  yield* readSseEvents(response);
}

export async function* resumeStreamingSession({
  sessionId,
  language,
  signal,
}: {
  sessionId: string;
  language?: string;
  signal?: AbortSignal;
}): AsyncGenerator<StreamingSessionEvent, void, void> {
  const response = await fetch(buildAbsoluteUrl(`/api/sessions/${sessionId}/stream/resume/`), {
    method: 'POST',
    headers: {
      ...getAuthHeaders(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      language: language ?? 'ko',
    }),
    signal,
  });

  yield* readSseEvents(response);
}
