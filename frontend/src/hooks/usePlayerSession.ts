import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';
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
  const isHydrated = useAuthStore((state) => state.isHydrated);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const sessionId = usePlayerStore((state) => state.sessionId);
  const sessionPlaybackMode = usePlayerStore((state) => state.sessionPlaybackMode);
  const [sessionDetail, setSessionDetail] = useState<SessionDetailData | null>(null);
  const [isLoadingSession, setIsLoadingSession] = useState(false);
  const [sessionError, setSessionError] = useState('');

  const fetchSessionDetail = useCallback(async () => {
    if (!isHydrated) {
      return;
    }

    if (!isAuthenticated) {
      setSessionDetail(null);
      setSessionError('로그인이 필요합니다.');
      return;
    }

    if (!sessionId) {
      setSessionDetail(null);
      return;
    }

    setIsLoadingSession(true);
    setSessionError('');

    try {
      const response = await getSessionDetail(sessionId);
      if (response.data.source_type === 'file' && !response.data.video_url) {
        setSessionError('저장된 영상 URL을 불러오지 못했습니다.');
      }
      setSessionDetail(response.data);
    } catch (error) {
      setSessionError(getErrorMessage(error));
    } finally {
      setIsLoadingSession(false);
    }
  }, [isAuthenticated, isHydrated, sessionId]);

  useEffect(() => {
    void fetchSessionDetail();
  }, [fetchSessionDetail]);

  const shouldPollStatus =
    sessionDetail?.ai_status === 'pending' || sessionDetail?.ai_status === 'processing';

  const { data: statusResponse } = useSessionPolling({
    sessionId,
    enabled: isHydrated && isAuthenticated && Boolean(sessionId) && shouldPollStatus,
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
    isLoadingSession: !isHydrated || isLoadingSession,
    sessionError,
    isAuthenticated,
    isHydrated,
    sessionPlaybackMode,
  };
}
