import { useCallback, useEffect, useMemo, useState } from 'react';
import { getSessionDetail } from '../services/session.api';
import { usePlayerStore } from '../store/usePlayerStore';
import type { ApiErrorResponse, SessionDetailData, SessionStatusData } from '../types';
import { useSessionPolling } from './useSessionPolling';

function getSessionDataId(data: { session_id?: number; id?: number }) {
  return String(data.session_id ?? data.id ?? '');
}

function getErrorMessage(error: unknown) {
  const apiError = error as { response?: { data?: ApiErrorResponse } };
  return (
    apiError?.response?.data?.message ||
    apiError?.response?.data?.detail ||
    '세션 정보를 불러오지 못했습니다.'
  );
}

export function usePlayerSession() {
  const sessionId = usePlayerStore((state) => state.sessionId);
  const [sessionDetail, setSessionDetail] = useState<SessionDetailData | null>(null);
  const [isLoadingSession, setIsLoadingSession] = useState(false);
  const [sessionError, setSessionError] = useState('');

  const fetchSessionDetail = useCallback(async () => {
    if (!sessionId) {
      setSessionDetail(null);
      return;
    }

    setIsLoadingSession(true);
    setSessionError('');

    try {
      const response = await getSessionDetail(sessionId);
      setSessionDetail(response.data);
    } catch (error) {
      setSessionError(getErrorMessage(error));
    } finally {
      setIsLoadingSession(false);
    }
  }, [sessionId]);

  useEffect(() => {
    void fetchSessionDetail();
  }, [fetchSessionDetail]);

  const shouldPollStatus =
    sessionDetail?.ai_status === 'pending' || sessionDetail?.ai_status === 'processing';

  const { data: statusResponse } = useSessionPolling({
    sessionId,
    enabled: Boolean(sessionId) && shouldPollStatus,
  });

  const sessionStatus = useMemo<SessionStatusData | null>(
    () => statusResponse?.data ?? null,
    [statusResponse],
  );

  useEffect(() => {
    if (sessionStatus?.ai_status === 'done') {
      void fetchSessionDetail();
    }
  }, [fetchSessionDetail, sessionStatus?.ai_status]);

  const normalizedSessionId = useMemo(
    () => (sessionDetail ? getSessionDataId(sessionDetail) : sessionId ?? ''),
    [sessionDetail, sessionId],
  );

  return {
    sessionId: normalizedSessionId,
    sessionDetail,
    sessionStatus,
    isLoadingSession,
    sessionError,
  };
}
