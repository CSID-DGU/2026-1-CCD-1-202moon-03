const SESSION_STUDY_TIME_STORAGE_KEY = 'session-study-times';

type SessionStudyTimeMap = Record<string, number>;

function readSessionStudyTimeMap(): SessionStudyTimeMap {
  if (typeof window === 'undefined') {
    return {};
  }

  try {
    const rawValue = window.localStorage.getItem(SESSION_STUDY_TIME_STORAGE_KEY);
    if (!rawValue) {
      return {};
    }

    const parsedValue = JSON.parse(rawValue) as SessionStudyTimeMap;
    return typeof parsedValue === 'object' && parsedValue !== null ? parsedValue : {};
  } catch {
    return {};
  }
}

function writeSessionStudyTimeMap(nextValue: SessionStudyTimeMap) {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(SESSION_STUDY_TIME_STORAGE_KEY, JSON.stringify(nextValue));
  } catch {
    // Ignore storage failures and keep the in-memory flow working.
  }
}

export function saveSessionStudyTime(sessionId: string | number, studyTimeSeconds: number) {
  const normalizedSessionId = String(sessionId);
  const safeStudyTimeSeconds = Math.max(0, Math.floor(studyTimeSeconds));
  const currentMap = readSessionStudyTimeMap();

  writeSessionStudyTimeMap({
    ...currentMap,
    [normalizedSessionId]: safeStudyTimeSeconds,
  });
}

export function getSessionStudyTime(sessionId: string | number) {
  const normalizedSessionId = String(sessionId);
  const studyTimeSeconds = readSessionStudyTimeMap()[normalizedSessionId];

  return typeof studyTimeSeconds === 'number' && Number.isFinite(studyTimeSeconds)
    ? Math.max(0, studyTimeSeconds)
    : null;
}
