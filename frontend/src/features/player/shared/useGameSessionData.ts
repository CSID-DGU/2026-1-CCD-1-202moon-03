import { useEffect, useMemo, useRef, useState } from 'react';
import { startGame } from '../../../services/game.api';
import { usePlayerSession } from '../../../hooks/usePlayerSession';
import { getTransientStreamingSource, usePlayerStore } from '../../../store/usePlayerStore';
import type { ApiErrorResponse, NormalizedGameData, StreamingChapterReadyEvent } from '../../../types';
import {
  applyStreamingInit,
  buildChunkFromStreamingEvent,
  createEmptyNormalizedGameData,
  createNormalizedGameFromStoredData,
  mergeGameChunk,
} from './normalizeGameData';
import { startStreamingSession } from './streamingSession';

export type PlayerDataState =
  | 'auth_loading'
  | 'session_loading'
  | 'stream_connecting'
  | 'chapter_waiting'
  | 'ready'
  | 'stream_complete'
  | 'failed';

function getErrorMessage(error: unknown, fallbackMessage: string) {
  const apiError = error as { response?: { data?: ApiErrorResponse } };
  return apiError.response?.data?.message || apiError.response?.data?.detail || fallbackMessage;
}

export function useGameSessionData() {
  const {
    sessionId,
    sessionDetail,
    sessionStatus,
    isLoadingSession,
    sessionError,
    isHydrated,
    isAuthenticated,
  } = usePlayerSession();
  const storeStreamingSource = usePlayerStore((state) => state.streamingSource);
  const setStreamingSource = usePlayerStore((state) => state.setStreamingSource);
  const streamingSource = storeStreamingSource ?? getTransientStreamingSource();
  const initializedStreamingSessionRef = useRef<string | null>(null);
  const loadedStoredGameSessionRef = useRef<string | null>(null);

  const [state, setState] = useState<PlayerDataState>('session_loading');
  const [gameData, setGameData] = useState<NormalizedGameData>(createEmptyNormalizedGameData);
  const [errorMessage, setErrorMessage] = useState('');
  const [lastStreamEventType, setLastStreamEventType] = useState('');

  const isStreamingCurrentSession =
    Boolean(streamingSource?.sessionId) &&
    String(streamingSource?.sessionId) === String(sessionId ?? '');

  useEffect(() => {
    console.log('[useGameSessionData] snapshot', {
      sessionId,
      sessionDetailId: sessionDetail?.id ?? sessionDetail?.session_id ?? null,
      currentAiStatus: sessionStatus?.ai_status ?? sessionDetail?.ai_status ?? null,
      state,
      isHydrated,
      isAuthenticated,
      streamingSource,
      isStreamingCurrentSession,
    });
  }, [
    isAuthenticated,
    isHydrated,
    isStreamingCurrentSession,
    sessionDetail?.ai_status,
    sessionDetail?.id,
    sessionDetail?.session_id,
    sessionId,
    sessionStatus?.ai_status,
    state,
    streamingSource,
  ]);

  useEffect(() => {
    setGameData(createEmptyNormalizedGameData());
    setErrorMessage('');
    setLastStreamEventType('');
    setState(!isHydrated ? 'auth_loading' : 'session_loading');
    initializedStreamingSessionRef.current = null;
    loadedStoredGameSessionRef.current = null;
  }, [isHydrated, sessionId]);

  useEffect(() => {
    if (!isHydrated) {
      setState('auth_loading');
      return;
    }

    if (!isAuthenticated) {
      setState('failed');
      setErrorMessage('로그인이 필요합니다.');
    }
  }, [isAuthenticated, isHydrated]);

  useEffect(() => {
    if (!sessionId || !streamingSource || !isStreamingCurrentSession) {
      return;
    }

    if (initializedStreamingSessionRef.current === sessionId) {
      return;
    }

    let isCancelled = false;
    initializedStreamingSessionRef.current = sessionId;
    setState('stream_connecting');
    setErrorMessage('');
    console.log('[useGameSessionData] start streaming branch', {
      sessionId,
      streamingSource,
    });

    const run = async () => {
      try {
        for await (const event of startStreamingSession({ source: streamingSource })) {
          if (isCancelled) {
            break;
          }

          console.log('[useGameSessionData] stream event', event);
          setLastStreamEventType(event.type);

          if (event.type === 'init') {
            setGameData((current) =>
              applyStreamingInit(current, {
                sessionId: event.session_id,
                totalDuration: event.total_duration,
                chapters: event.chapters,
              }),
            );
            setState('chapter_waiting');
            continue;
          }

          if (event.type === 'chapter_ready') {
            const chunk = buildChunkFromStreamingEvent(event as StreamingChapterReadyEvent);
            setGameData((current) => mergeGameChunk(current, chunk));
            setState((current) => (current === 'stream_complete' ? current : 'ready'));
            continue;
          }

          if (event.type === 'complete') {
            setGameData((current) => ({ ...current, isComplete: true }));
            setState((current) => (current === 'ready' ? 'stream_complete' : current));
            setStreamingSource(null);
            console.log('[useGameSessionData] stream complete');
            continue;
          }

          if (event.type === 'error') {
            setState('failed');
            setErrorMessage(event.message);
            console.log('[useGameSessionData] stream error', event.message);
            return;
          }
        }
      } catch (error) {
        if (!isCancelled) {
          setState('failed');
          setErrorMessage(getErrorMessage(error, '스트리밍 연결에 실패했습니다.'));
          console.log('[useGameSessionData] stream exception', error);
        }
      }
    };

    void run();

    return () => {
      isCancelled = true;
    };
  }, [isStreamingCurrentSession, sessionId, setStreamingSource, streamingSource]);

  const currentAiStatus = sessionStatus?.ai_status ?? sessionDetail?.ai_status ?? null;

  useEffect(() => {
    if (!sessionId || isStreamingCurrentSession) {
      if (sessionId && isStreamingCurrentSession) {
        console.log(
          '[useGameSessionData] skip stored branch because streaming branch is active',
          { sessionId },
        );
      }
      return;
    }

    if (isLoadingSession) {
      setState('session_loading');
      console.log('[useGameSessionData] stored branch waiting for session detail');
      return;
    }

    if (sessionError) {
      setState('failed');
      setErrorMessage(sessionError);
      console.log('[useGameSessionData] stored branch session error', sessionError);
      return;
    }

    if (currentAiStatus === 'failed') {
      setState('failed');
      setErrorMessage(sessionStatus?.error_message || 'AI 처리에 실패했습니다.');
      console.log(
        '[useGameSessionData] stored branch failed status',
        sessionStatus?.error_message,
      );
      return;
    }

    if (
      currentAiStatus === 'pending' ||
      currentAiStatus === 'processing' ||
      currentAiStatus === null
    ) {
      setState('chapter_waiting');
      console.log('[useGameSessionData] stored branch pending/processing', {
        sessionId,
        currentAiStatus,
      });
      return;
    }

    if (currentAiStatus !== 'done') {
      return;
    }

    if (loadedStoredGameSessionRef.current === sessionId) {
      return;
    }

    let isCancelled = false;
    loadedStoredGameSessionRef.current = sessionId;
    setState('session_loading');
    setErrorMessage('');
    console.log('[useGameSessionData] start stored game branch', { sessionId });

    const run = async () => {
      try {
        const response = await startGame(sessionId);

        if (isCancelled) {
          return;
        }

        setGameData(createNormalizedGameFromStoredData(response.data));
        setState('ready');
        console.log('[useGameSessionData] stored game loaded', {
          sessionId,
          subtitles: response.data.subtitles?.length ?? 0,
          quizzes: response.data.quizzes?.length ?? 0,
        });
      } catch (error) {
        if (!isCancelled) {
          setState('failed');
          setErrorMessage(getErrorMessage(error, '게임 데이터를 불러오지 못했습니다.'));
          console.log('[useGameSessionData] stored game exception', error);
        }
      }
    };

    void run();

    return () => {
      isCancelled = true;
    };
  }, [
    currentAiStatus,
    isLoadingSession,
    isStreamingCurrentSession,
    sessionError,
    sessionId,
    sessionStatus?.error_message,
  ]);

  const statusLabel = useMemo(() => {
    if (isStreamingCurrentSession) {
      if (state === 'stream_connecting') return '스트리밍 연결 중...';
      if (state === 'chapter_waiting') return '첫 챕터를 준비하는 중...';
      if (state === 'stream_complete') return '전체 챕터 수신 완료';
    } else {
      if (state === 'chapter_waiting') return `AI status: ${currentAiStatus ?? 'pending'}`;
      if (state === 'session_loading') return '게임 데이터를 준비하는 중...';
    }

    return '';
  }, [currentAiStatus, isStreamingCurrentSession, state]);

  return {
    sessionId,
    sessionDetail,
    gameData,
    state,
    errorMessage,
    statusLabel,
    currentAiStatus,
    isStreamingCurrentSession,
    debug: {
      sessionId,
      state,
      currentAiStatus,
      isStreamingCurrentSession,
      streamingSourceType: streamingSource?.type ?? null,
      streamingSourceSessionId: streamingSource?.sessionId ?? null,
      loadedSegments: gameData.segments.length,
      loadedQuizzes: gameData.quizzes.length,
      loadedFallEvents: gameData.fallEvents.length,
      loadedChapterIndexes: gameData.loadedChapterIndexes,
      lastStreamEventType,
      errorMessage,
    },
  };
}
