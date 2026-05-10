import { useEffect, useMemo, useRef, useState } from 'react';
import { startGame } from '../../../services/game.api';
import { usePlayerSession } from '../../../hooks/usePlayerSession';
import { getTransientStreamingSource, usePlayerStore } from '../../../store/usePlayerStore';
import { useStreamedQuizStore } from '../../../store/useStreamedQuizStore';
import type { ApiErrorResponse, NormalizedGameData, StreamingChapterReadyEvent } from '../../../types';
import { mapNormalizedQuizToRetryQuiz } from '../../result/retryQuizData';
import {
  applyStreamingInit,
  buildChunkFromStreamingEvent,
  createEmptyNormalizedGameData,
  createNormalizedGameFromStoredData,
  mergeGameChunk,
} from './normalizeGameData';
import { resumeStreamingSession, startStreamingSession } from './streamingSession';

export type PlayerDataState =
  | 'auth_loading'
  | 'session_loading'
  | 'stream_connecting'
  | 'chapter_waiting'
  | 'ready'
  | 'stream_complete'
  | 'failed';

type ActiveStreamStrategy = 'source' | 'resume' | null;

function isQuizMissingPersistedId(quizId: number | null) {
  return quizId === null || quizId <= 0;
}

function hasGameContent(data: Pick<NormalizedGameData, 'segments' | 'quizzes' | 'fallEvents'>) {
  return data.segments.length > 0 || data.quizzes.length > 0 || data.fallEvents.length > 0;
}

function hasMissingPersistedQuizIds(quizzes: NormalizedGameData['quizzes']) {
  return quizzes.some((quiz) => isQuizMissingPersistedId(quiz.quizId));
}

function getErrorMessage(error: unknown, fallbackMessage: string) {
  const apiError = error as { response?: { data?: ApiErrorResponse } };

  if (error instanceof Error && error.message) {
    return error.message;
  }

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
  const streamingSource = storeStreamingSource ?? getTransientStreamingSource();
  const initializedStreamingSessionRef = useRef<string | null>(null);
  const loadedStoredGameSessionRef = useRef<string | null>(null);
  const hydratedPersistedStreamSessionRef = useRef<string | null>(null);
  const latestGameDataRef = useRef<NormalizedGameData>(createEmptyNormalizedGameData());
  const saveStreamedQuizzes = useStreamedQuizStore((state) => state.saveStreamedQuizzes);

  const [state, setState] = useState<PlayerDataState>('session_loading');
  const [activeStreamStrategy, setActiveStreamStrategy] = useState<ActiveStreamStrategy>(null);
  const [gameData, setGameData] = useState<NormalizedGameData>(createEmptyNormalizedGameData);
  const [errorMessage, setErrorMessage] = useState('');
  const [lastStreamEventType, setLastStreamEventType] = useState('');
  const [lastChunkSegments, setLastChunkSegments] = useState<number | null>(null);
  const [lastMergedTotalSegments, setLastMergedTotalSegments] = useState<number | null>(null);

  const currentAiStatus = sessionStatus?.ai_status ?? sessionDetail?.ai_status ?? null;
  const hasVideoUrl = Boolean(sessionDetail?.video_url);
  const isStreamingCurrentSession =
    Boolean(streamingSource?.sessionId) &&
    String(streamingSource?.sessionId) === String(sessionId ?? '');
  const hasCompletedStreamingData =
    gameData.isComplete &&
    (hasGameContent(gameData) || gameData.loadedChapterIndexes.length > 0);
  const shouldResumeFileCurrentSession =
    Boolean(sessionId) &&
    !streamingSource &&
    sessionDetail?.source_type === 'file' &&
    !hasCompletedStreamingData &&
    currentAiStatus !== null &&
    currentAiStatus !== 'done' &&
    currentAiStatus !== 'failed';
  const isStreamingFlowCurrentSession =
    activeStreamStrategy !== null || isStreamingCurrentSession || shouldResumeFileCurrentSession;
  const hasStartGameData = hasGameContent(gameData);
  const recoveryStrategy = useMemo(() => {
    if (streamingSource?.type === 'file' && streamingSource.file) {
      return 'transient_file';
    }
    if (shouldResumeFileCurrentSession || activeStreamStrategy === 'resume') {
      return 'stream_resume';
    }
    if (currentAiStatus === 'done') {
      return 'stored_game';
    }
    if (streamingSource?.type === 'youtube_url') {
      return 'stream_source';
    }

    return null;
  }, [
    activeStreamStrategy,
    currentAiStatus,
    shouldResumeFileCurrentSession,
    streamingSource?.file,
    streamingSource?.type,
  ]);

  useEffect(() => {
    console.log('[useGameSessionData] snapshot', {
      sessionId,
      sessionDetailId: sessionDetail?.id ?? sessionDetail?.session_id ?? null,
      currentAiStatus,
      state,
      activeStreamStrategy,
      isHydrated,
      isAuthenticated,
      streamingSource,
      isStreamingCurrentSession,
      shouldResumeFileCurrentSession,
    });
  }, [
    activeStreamStrategy,
    currentAiStatus,
    isAuthenticated,
    isHydrated,
    isStreamingCurrentSession,
    sessionDetail?.id,
    sessionDetail?.session_id,
    sessionId,
    shouldResumeFileCurrentSession,
    state,
    streamingSource,
  ]);

  useEffect(() => {
    latestGameDataRef.current = gameData;
  }, [gameData]);

  useEffect(() => {
    const emptyGameData = createEmptyNormalizedGameData();

    latestGameDataRef.current = emptyGameData;
    setGameData(emptyGameData);
    setErrorMessage('');
    setLastStreamEventType('');
    setLastChunkSegments(null);
    setLastMergedTotalSegments(null);
    setActiveStreamStrategy(null);
    setState(!isHydrated ? 'auth_loading' : 'session_loading');
    initializedStreamingSessionRef.current = null;
    loadedStoredGameSessionRef.current = null;
    hydratedPersistedStreamSessionRef.current = null;
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
    const shouldUseSourceStreaming = Boolean(sessionId && streamingSource && isStreamingCurrentSession);
    const shouldUseResumeStreaming = Boolean(sessionId && shouldResumeFileCurrentSession);

    if (!sessionId || (!shouldUseSourceStreaming && !shouldUseResumeStreaming)) {
      return;
    }

    if (initializedStreamingSessionRef.current === sessionId) {
      return;
    }

    let isCancelled = false;
    const streamStrategy: Exclude<ActiveStreamStrategy, null> = shouldUseSourceStreaming
      ? 'source'
      : 'resume';

    initializedStreamingSessionRef.current = sessionId;
    setActiveStreamStrategy(streamStrategy);
    setState('stream_connecting');
    setErrorMessage('');
    console.log('[useGameSessionData] start streaming branch', {
      sessionId,
      streamStrategy,
      streamingSource,
    });

    const run = async () => {
      try {
        const eventStream =
          streamStrategy === 'source' && streamingSource
            ? startStreamingSession({ source: streamingSource })
            : resumeStreamingSession({
                sessionId,
                language: streamingSource?.language ?? 'ko',
              });

        for await (const event of eventStream) {
          if (isCancelled) {
            break;
          }

          console.log('[useGameSessionData] stream event', event);
          setLastStreamEventType(event.type);

          if (event.type === 'init') {
            const nextGameData = applyStreamingInit(latestGameDataRef.current, {
              sessionId: event.session_id,
              totalDuration: event.total_duration,
              chapters: event.chapters,
            });

            latestGameDataRef.current = nextGameData;
            setGameData(nextGameData);
            setState('chapter_waiting');
            continue;
          }

          if (event.type === 'chapter_ready') {
            const streamEvent = event as StreamingChapterReadyEvent & {
              subtitles?: Array<Record<string, unknown>>;
            };
            const firstSegment = Array.isArray(streamEvent.segments)
              ? ((streamEvent.segments[0] as unknown) as Record<string, unknown> | undefined)
              : undefined;
            const firstSubtitle = Array.isArray(streamEvent.subtitles)
              ? streamEvent.subtitles[0]
              : undefined;
            console.log('[useGameSessionData] chapter_ready payload shape', {
              chapterIndex: event.chapter_index,
              segmentKeys: firstSegment ? Object.keys(firstSegment) : null,
              subtitlesKeys: firstSubtitle ? Object.keys(firstSubtitle) : null,
              segmentsLength: Array.isArray(streamEvent.segments)
                ? streamEvent.segments.length
                : null,
              subtitlesLength: Array.isArray(streamEvent.subtitles)
                ? streamEvent.subtitles.length
                : null,
              rawEvent: streamEvent,
            });

            const chunk = buildChunkFromStreamingEvent(event as StreamingChapterReadyEvent);
            setLastChunkSegments(chunk.segments.length);
            console.log('[useGameSessionData] chapter_ready normalized chunk', {
              chapterIndex: chunk.chapterIndex,
              chunkSegments: chunk.segments.length,
              chunkQuizzes: chunk.quizzes.length,
              chunkFallEvents: chunk.fallEvents.length,
            });

            const merged = mergeGameChunk(latestGameDataRef.current, chunk);
            latestGameDataRef.current = merged;
            setLastMergedTotalSegments(merged.segments.length);
            setGameData(merged);
            setState('ready');

            if (sessionId && merged.quizzes.length > 0) {
              saveStreamedQuizzes(
                sessionId,
                merged.quizzes.map((quiz, index) => mapNormalizedQuizToRetryQuiz(quiz, index)),
              );
            }

            console.log('[useGameSessionData] merged game data totals', {
              totalSegments: merged.segments.length,
              totalQuizzes: merged.quizzes.length,
              totalFallEvents: merged.fallEvents.length,
              loadedChapterIndexes: merged.loadedChapterIndexes,
            });
            continue;
          }

          if (event.type === 'complete') {
            const completedGameData = { ...latestGameDataRef.current, isComplete: true };

            latestGameDataRef.current = completedGameData;
            setGameData(completedGameData);
            setState('stream_complete');
            console.log('[useGameSessionData] stream complete');

            if (
              sessionId &&
              hydratedPersistedStreamSessionRef.current !== sessionId &&
              hasMissingPersistedQuizIds(completedGameData.quizzes)
            ) {
              hydratedPersistedStreamSessionRef.current = sessionId;

              try {
                const response = await startGame(sessionId);
                const normalizedGameData = createNormalizedGameFromStoredData(response.data);

                const nextGameData =
                  normalizedGameData.segments.length > 0
                    ? normalizedGameData
                    : {
                        ...latestGameDataRef.current,
                        quizzes:
                          normalizedGameData.quizzes.length > 0
                            ? normalizedGameData.quizzes
                            : latestGameDataRef.current.quizzes,
                      };

                latestGameDataRef.current = nextGameData;
                setGameData(nextGameData);

                if (nextGameData.quizzes.length > 0) {
                  saveStreamedQuizzes(
                    sessionId,
                    nextGameData.quizzes.map((quiz, index) =>
                      mapNormalizedQuizToRetryQuiz(quiz, index),
                    ),
                  );
                }

                console.log('[useGameSessionData] hydrated persisted quizzes after stream complete', {
                  sessionId,
                  quizIds: nextGameData.quizzes.map((quiz) => quiz.quizId),
                  quizIndexes: nextGameData.quizzes.map((quiz) => quiz.quizIndex),
                });
              } catch (error) {
                hydratedPersistedStreamSessionRef.current = null;
                console.log('[useGameSessionData] persisted quiz hydration failed', error);
              }
            }
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
  }, [
    isStreamingCurrentSession,
    saveStreamedQuizzes,
    sessionId,
    shouldResumeFileCurrentSession,
    streamingSource,
  ]);

  useEffect(() => {
    if (hasCompletedStreamingData) {
      console.log('[useGameSessionData] preserve completed streaming data', {
        sessionId,
        segments: gameData.segments.length,
        quizzes: gameData.quizzes.length,
        fallEvents: gameData.fallEvents.length,
      });
      return;
    }

    if (!sessionId || isStreamingFlowCurrentSession) {
      if (sessionId && isStreamingFlowCurrentSession) {
        console.log('[useGameSessionData] skip stored branch because streaming branch is active', {
          sessionId,
          activeStreamStrategy,
        });
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
      console.log('[useGameSessionData] stored branch failed status', sessionStatus?.error_message);
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

    if (sessionDetail?.source_type === 'file' && !sessionDetail.video_url) {
      setState('failed');
      setErrorMessage('저장된 영상 URL을 불러오지 못했습니다.');
      console.log('[useGameSessionData] stored branch missing video_url for file session', {
        sessionId,
      });
      return;
    }

    if (loadedStoredGameSessionRef.current === sessionId) {
      return;
    }

    let isCancelled = false;
    loadedStoredGameSessionRef.current = sessionId;
    setActiveStreamStrategy(null);
    setState('session_loading');
    setErrorMessage('');
    console.log('[useGameSessionData] start stored game branch', { sessionId });

    const run = async () => {
      try {
        const response = await startGame(sessionId);

        if (isCancelled) {
          return;
        }

        const normalizedGameData = createNormalizedGameFromStoredData(response.data);

        if (!hasGameContent(normalizedGameData)) {
          loadedStoredGameSessionRef.current = null;
          setState('failed');
          setErrorMessage('저장된 게임 데이터를 불러오지 못했습니다.');
          console.log('[useGameSessionData] stored game empty payload', {
            sessionId,
            responseData: response.data,
          });
          return;
        }

        latestGameDataRef.current = normalizedGameData;
        setGameData(normalizedGameData);
        setState('ready');
        console.log('[useGameSessionData] startGame raw quizzes', {
          sessionId,
          quizCount: response.data.quizzes?.length ?? 0,
          quizIds: (response.data.quizzes ?? []).map((quiz) => quiz.quiz_id ?? null),
          quizIndexes: (response.data.quizzes ?? []).map((quiz) => quiz.quiz_index ?? null),
          firstQuiz: response.data.quizzes?.[0] ?? null,
        });
        console.log('[useGameSessionData] normalized quizzes', {
          sessionId,
          quizIds: normalizedGameData.quizzes.map((quiz) => quiz.quizId),
          firstQuiz: normalizedGameData.quizzes[0] ?? null,
        });
        console.log('[useGameSessionData] stored game loaded', {
          sessionId,
          subtitles: response.data.subtitles?.length ?? 0,
          segments: response.data.segments?.length ?? 0,
          fall_events: response.data.fall_events?.length ?? 0,
          quizzes: response.data.quizzes?.length ?? 0,
          normalizedSegments: normalizedGameData.segments.length,
          normalizedFallEvents: normalizedGameData.fallEvents.length,
        });
      } catch (error) {
        if (!isCancelled) {
          loadedStoredGameSessionRef.current = null;
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
    activeStreamStrategy,
    currentAiStatus,
    gameData.fallEvents.length,
    gameData.isComplete,
    gameData.loadedChapterIndexes.length,
    gameData.quizzes.length,
    gameData.segments.length,
    hasCompletedStreamingData,
    isLoadingSession,
    isStreamingFlowCurrentSession,
    sessionError,
    sessionId,
    sessionStatus?.error_message,
  ]);

  const statusLabel = useMemo(() => {
    if (isStreamingFlowCurrentSession) {
      if (state === 'stream_connecting') return '스트리밍 연결 중...';
      if (state === 'chapter_waiting') return '첫 챕터를 준비하는 중...';
      if (state === 'stream_complete') return '전체 챕터 수신 완료';
    } else {
      if (state === 'chapter_waiting') return `AI status: ${currentAiStatus ?? 'pending'}`;
      if (state === 'session_loading') return '게임 데이터를 준비하는 중...';
    }

    return '';
  }, [currentAiStatus, isStreamingFlowCurrentSession, state]);

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
      activeStreamStrategy,
      shouldResumeFileCurrentSession,
      recoveryStrategy,
      streamingSourceType: streamingSource?.type ?? null,
      streamingSourceSessionId: streamingSource?.sessionId ?? null,
      hasVideoUrl,
      hasStartGameData,
      loadedSegments: gameData.segments.length,
      loadedQuizzes: gameData.quizzes.length,
      loadedFallEvents: gameData.fallEvents.length,
      loadedChapterIndexes: gameData.loadedChapterIndexes,
      lastStreamEventType,
      lastChunkSegments,
      lastMergedTotalSegments,
      errorMessage,
    },
  };
}
