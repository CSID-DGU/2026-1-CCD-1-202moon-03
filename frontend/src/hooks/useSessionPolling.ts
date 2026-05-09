import { useCallback, useEffect, useRef, useState } from 'react';
import { getSessionStatus } from '../services/session.api';
import type { ResourceId, SessionStatusResponse } from '../types';

const DEFAULT_INTERVAL_MS = 4000;

interface UseSessionPollingOptions {
  sessionId: ResourceId | null;
  enabled?: boolean;
  intervalMs?: number;
}

export function useSessionPolling({
  sessionId,
  enabled = true,
  intervalMs = DEFAULT_INTERVAL_MS,
}: UseSessionPollingOptions) {
  const timerRef = useRef<number | null>(null);
  const [data, setData] = useState<SessionStatusResponse | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isPolling, setIsPolling] = useState(false);

  const stop = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }

    setIsPolling(false);
  }, []);

  const pollOnce = useCallback(async () => {
    if (sessionId === null) {
      return;
    }

    try {
      const response = await getSessionStatus(sessionId);
      setData(response);
      setError(null);

      const status = response.data.ai_status;
      if (status === 'done' || status === 'failed') {
        stop();
      }
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError : new Error('Polling failed'));
      stop();
    }
  }, [sessionId, stop]);

  const start = useCallback(() => {
    if (sessionId === null || timerRef.current !== null) {
      return;
    }

    setIsPolling(true);
    void pollOnce();

    timerRef.current = window.setInterval(() => {
      void pollOnce();
    }, intervalMs);
  }, [intervalMs, pollOnce, sessionId]);

  useEffect(() => {
    if (enabled && sessionId !== null) {
      start();
    } else {
      stop();
    }

    return stop;
  }, [enabled, sessionId, start, stop]);

  return {
    data,
    error,
    isPolling,
    start,
    stop,
  };
}
