import { useAuthStore } from '../../../store/useAuthStore';
import type { StreamingPlayerSource } from '../../../store/usePlayerStore';
import type { StreamingSessionEvent } from '../../../types';

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

export async function* startStreamingSession({
  source,
}: {
  source: StreamingPlayerSource;
}): AsyncGenerator<StreamingSessionEvent, void, void> {
  const headers = getAuthHeaders();

  if (source.type === 'youtube_url') {
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
    });

    yield* readSseEvents(response);
    return;
  }

  const formData = new FormData();
  if (source.file) {
    formData.append('file', source.file);
  }
  formData.append('language', source.language ?? 'ko');
  if (source.sessionId) {
    formData.append('session_id', String(source.sessionId));
  }

  const response = await fetch(buildAbsoluteUrl('/api/sessions/stream/file/'), {
    method: 'POST',
    headers,
    body: formData,
  });

  yield* readSseEvents(response);
}

export async function* resumeStreamingSession({
  sessionId,
  language,
}: {
  sessionId: string;
  language?: string;
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
  });

  yield* readSseEvents(response);
}
