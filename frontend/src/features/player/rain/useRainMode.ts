import { useEffect, useMemo, useRef, useState } from 'react';
import { submitQuizAnswer } from '../../../services/quiz.api';
import { getTransientStreamingSource, usePlayerStore } from '../../../store/usePlayerStore';
import { useRainStore } from '../../../store/useRainStore';
import type { ApiErrorResponse, GameBlankItem } from '../../../types';
import { useGameSessionData } from '../shared/useGameSessionData';
import { useAuthenticatedVideoUrl } from '../shared/useAuthenticatedVideoUrl';
import { useLocalFilePlayerSrc } from '../shared/useLocalFilePlayerSrc';
import type { MediaController, PlayerType } from '../shared/playback';
import { resolveMediaUrl } from '../shared/playback';
import type {
  PlaybackRate,
  RainCaptionDisplay,
  RainCaptionInputItem,
  RainKeyword,
  RainQuizState,
} from './types';
import type { RainSettings } from './RainSettingsModal';

const RAIN_DIFFICULTY = {
  easy: {
    activeBlanks: 1,
    fallSpeed: 0.3,
    minFallDuration: 3.5,
  },
  normal: {
    activeBlanks: 2,
    fallSpeed: 0.5,
    minFallDuration: 3,
  },
  hard: {
    activeBlanks: 3,
    fallSpeed: 1.0,
    minFallDuration: 2.4,
  },
};

const FALL_PROGRESS_START = -12;
const FALL_PROGRESS_END = 86;
const MISS_GRACE_SECONDS = 2.2;
const MISSED_DISPLAY_BUFFER = MISS_GRACE_SECONDS + 0.5;
const RAIN_SPEED_OPTIONS: PlaybackRate[] = [0.5, 0.75, 1, 1.25, 1.5, 2];

function buildAnsweredQuizKey(quizId: number | null, triggerTime: number) {
  return quizId === null || quizId <= 0 ? `missing:${triggerTime}` : `quiz:${quizId}`;
}

type PreparedRainEvent = {
  id: string;
  lane: number;
  leftPercent: number;
  blank: GameBlankItem;
  blankKey: string;
  keyword: string;
  segmentId: number;
  targetTime: number;
  fallStartTime: number;
  fallDuration: number;
  missDeadline: number;
};

type PreparedRainSummary = {
  events: PreparedRainEvent[];
  unmatchedCount: number;
  droppedByBlankLimit: number;
  duplicateKeywordCandidates: number;
};

function clampProgress(value: number) {
  return Math.max(FALL_PROGRESS_START, Math.min(value, FALL_PROGRESS_END));
}

function normalizeAnswer(value: string) {
  return value
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function buildBlankKey(segmentId: number, blank: GameBlankItem) {
  return `${segmentId}:${blank.position}:${normalizeAnswer(blank.keyword)}`;
}

const FIXED_LANE_POSITIONS: number[] = [18, 39, 60];

function resolveKeywordProgress(currentTime: number, event: PreparedRainEvent) {
  if (currentTime <= event.fallStartTime) {
    return FALL_PROGRESS_START;
  }

  if (currentTime >= event.missDeadline) {
    return FALL_PROGRESS_END;
  }

  const totalDuration = Math.max(event.missDeadline - event.fallStartTime, 0.001);
  const ratio = (currentTime - event.fallStartTime) / totalDuration;

  return clampProgress(FALL_PROGRESS_START + ratio * (FALL_PROGRESS_END - FALL_PROGRESS_START));
}

function buildCaptionDisplay(
  activeSegment:
    | {
        segmentId: number;
        blankText: string;
        blanks: GameBlankItem[];
      }
    | null,
  typedValuesByBlankKey: Record<string, string>,
  resolvedStatesByBlankKey: Record<string, 'pending' | 'cleared' | 'missed'>,
): RainCaptionDisplay {
  if (!activeSegment) {
    return { items: [], hasPlaceholder: false };
  }

  const placeholders = activeSegment.blankText.split(/_{2,}/);
  if (placeholders.length <= 1) {
    return {
      items: [{ type: 'text', key: `text:${activeSegment.segmentId}:0`, text: activeSegment.blankText }],
      hasPlaceholder: false,
    };
  }

  const items: RainCaptionDisplay['items'] = [];
  const blankCount = placeholders.length - 1;

  for (let index = 0; index < blankCount; index += 1) {
    const textChunk = placeholders[index] ?? '';
    if (textChunk) {
      items.push({
        type: 'text',
        key: `text:${activeSegment.segmentId}:${index}`,
        text: textChunk,
      });
    }

    const blank = activeSegment.blanks[index];
    if (!blank) {
      items.push({
        type: 'text',
        key: `missing-blank:${activeSegment.segmentId}:${index}`,
        text: '______',
      });
      continue;
    }

    const blankKey = buildBlankKey(activeSegment.segmentId, blank);
    items.push({
      type: 'input',
      key: blankKey,
      blank,
      value: typedValuesByBlankKey[blankKey] ?? '',
      placeholder: `${blank.answer_length}글자`,
      resolvedState: resolvedStatesByBlankKey[blankKey] ?? 'pending',
    } satisfies RainCaptionInputItem);
  }

  const tailText = placeholders[placeholders.length - 1] ?? '';
  if (tailText) {
    items.push({
      type: 'text',
      key: `text:${activeSegment.segmentId}:tail`,
      text: tailText,
    });
  }

  return {
    items,
    hasPlaceholder: items.some((item) => item.type === 'input'),
  };
}

function getQuizSubmitErrorMessage(error: unknown) {
  const apiError = error as { response?: { data?: ApiErrorResponse } };

  return (
    apiError?.response?.data?.message ||
    apiError?.response?.data?.detail ||
    '답안을 저장하지 못했습니다. 다시 시도해 주세요.'
  );
}

function isDefaultSessionTitle(title?: string | null) {
  const normalizedTitle = title?.trim() ?? '';
  return !normalizedTitle || normalizedTitle === '새 학습 영상';
}

export function useRainMode(settings?: RainSettings) {
  const {
    sessionId,
    sessionDetail,
    gameData,
    state,
    errorMessage,
    statusLabel,
    currentAiStatus,
    debug,
  } = useGameSessionData();
  const storeStreamingSource = usePlayerStore((playerStore) => playerStore.streamingSource);
  const rainDifficulty = usePlayerStore((playerStore) => playerStore.rainDifficulty);
  const streamingSource = storeStreamingSource ?? getTransientStreamingSource();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const controllerRef = useRef<MediaController | null>(null);
  const speedMenuRef = useRef<HTMLDivElement | null>(null);
  const initializedSessionIdRef = useRef<string | null>(null);
  const autoPlaySessionRef = useRef<string | null>(null);
  const answeredQuizIdsRef = useRef<Set<string>>(new Set());
  const answeredKeywordIdsRef = useRef<Set<string>>(new Set());
  const missedKeywordIdsRef = useRef<Set<string>>(new Set());
  const answeredAtRef = useRef<Map<string, number>>(new Map());
  const {
    score,
    combo,
    setAccuracy,
    setCombo,
    setScore,
    saveSessionResult,
    sessionResults,
    resetRainState,
  } = useRainStore();

  const [typedValuesByBlankKey, setTypedValuesByBlankKey] = useState<Record<string, string>>({});
  const [playbackRate, setPlaybackRate] = useState<PlaybackRate>(1);
  const [isSpeedMenuOpen, setIsSpeedMenuOpen] = useState(false);
  const [isCaptionVisible, setIsCaptionVisible] = useState(true);
  const [maxCombo, setMaxCombo] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [comboAnimationKey, setComboAnimationKey] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [rafCurrentTime, setRafCurrentTime] = useState(0);
  const lastVideoTimeRef = useRef(0);
  const lastWallTimeRef = useRef(0);
  const rafIdRef = useRef<number | null>(null);
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const [currentQuizState, setCurrentQuizState] = useState<RainQuizState | null>(null);
  const [quizCorrectCount, setQuizCorrectCount] = useState(0);
  const [quizAnsweredCount, setQuizAnsweredCount] = useState(0);
  const [missCount, setMissCount] = useState(0);
  const [lastJudgement, setLastJudgement] = useState<'hit' | 'miss' | 'wrong' | null>(null);
  const quizCorrectCountRef = useRef(0);
  const quizAnsweredCountRef = useRef(0);
  const isManualSettings = settings?.mode === 'manual';
  const selectedDifficulty = isManualSettings
    ? rainDifficulty
    : (settings?.difficulty ?? rainDifficulty);
  const difficultySettings = RAIN_DIFFICULTY[selectedDifficulty];
  const effectiveActiveBlanks = isManualSettings
    ? settings?.blankCount ?? difficultySettings.activeBlanks
    : difficultySettings.activeBlanks;
  // 수동 속도 1~5 → 실제 배속 0.5~2.0
  const MANUAL_SPEED_MAP: Record<number, number> = { 1: 0.3, 2: 0.5, 3: 0.75, 4: 1.0, 5: 1.5 };
  const effectiveFallSpeed = isManualSettings
    ? (MANUAL_SPEED_MAP[settings?.fallSpeed ?? 3] ?? 1.0)
    : difficultySettings.fallSpeed;
  const effectiveMinFallDuration = difficultySettings.minFallDuration;

  useEffect(() => {
    quizCorrectCountRef.current = quizCorrectCount;
  }, [quizCorrectCount]);

  useEffect(() => {
    quizAnsweredCountRef.current = quizAnsweredCount;
  }, [quizAnsweredCount]);

  useEffect(() => {
    controllerRef.current?.setPlaybackRate(playbackRate);
  }, [playbackRate]);

  useEffect(() => {
    if (!isPlaying) {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
      setRafCurrentTime(currentTime);
      return;
    }

    lastVideoTimeRef.current = currentTime;
    lastWallTimeRef.current = performance.now();

    const tick = () => {
      const elapsed = (performance.now() - lastWallTimeRef.current) / 1000;
      setRafCurrentTime(lastVideoTimeRef.current + elapsed);
      rafIdRef.current = requestAnimationFrame(tick);
    };

    rafIdRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
    };
  }, [isPlaying, currentTime]);

  useEffect(() => {
    if (!sessionId) {
      return;
    }

    if (initializedSessionIdRef.current === sessionId) {
      return;
    }

    initializedSessionIdRef.current = sessionId;
    answeredQuizIdsRef.current = new Set();
    answeredKeywordIdsRef.current = new Set();
    missedKeywordIdsRef.current = new Set();
    answeredAtRef.current = new Map();

    const savedResult = sessionResults[sessionId];
    setScore(savedResult?.score ?? 0);
    setCombo(0);
    setAccuracy(savedResult?.accuracy ?? 0);
    setMaxCombo(savedResult?.maxCombo ?? 0);
    setAttempts(0);
    setCorrectCount(0);
    setTypedValuesByBlankKey({});
    setCurrentTime(0);
    setDuration(0);
    setIsPlaying(false);
    setCurrentQuizState(null);
    quizCorrectCountRef.current = 0;
    quizAnsweredCountRef.current = 0;
    setQuizCorrectCount(0);
    setQuizAnsweredCount(0);
    setMissCount(0);
    setLastJudgement(null);

    return () => {
      resetRainState();
    };
  }, [resetRainState, sessionId, sessionResults, setAccuracy, setCombo, setScore]);

  useEffect(() => {
    if (!isSpeedMenuOpen) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (!speedMenuRef.current?.contains(event.target as Node)) {
        setIsSpeedMenuOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsSpeedMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isSpeedMenuOpen]);

  const segmentBlankKeys = useMemo(() => {
    const map = new Map<number, Set<string>>();

    gameData.segments.forEach((segment) => {
      const activeBlanks = segment.blanks.slice(0, effectiveActiveBlanks);

      map.set(
        segment.segmentId,
        new Set(activeBlanks.map((blank) => buildBlankKey(segment.segmentId, blank))),
      );
    });

    return map;
  }, [effectiveActiveBlanks, gameData.segments]);

  const preparedRainSummary = useMemo<PreparedRainSummary>(() => {
    const usedBlankKeys = new Set<string>();
    let unmatchedCount = 0;
    let droppedByBlankLimit = 0;
    let duplicateKeywordCandidates = 0;

    const events = gameData.fallEvents.reduce<PreparedRainEvent[]>((prepared, event) => {
      const segment = gameData.segments.find((item) => item.segmentId === event.segmentId);

      if (!segment) {
        unmatchedCount += 1;
        return prepared;
      }

      const normalizedEventKeyword = normalizeAnswer(event.keyword);
      const activeBlankSet = segmentBlankKeys.get(event.segmentId) ?? new Set<string>();

      const matchingBlanks = segment.blanks.filter(
        (item) => normalizeAnswer(item.keyword) === normalizedEventKeyword,
      );

      if (matchingBlanks.length > 1) {
        duplicateKeywordCandidates += 1;
      }

      if (matchingBlanks.length === 0) {
        unmatchedCount += 1;
        return prepared;
      }

      const candidateBlanks = [...matchingBlanks].sort((left, right) => {
        const leftKey = buildBlankKey(event.segmentId, left);
        const rightKey = buildBlankKey(event.segmentId, right);
        const leftIsActive = activeBlankSet.has(leftKey) ? 1 : 0;
        const rightIsActive = activeBlankSet.has(rightKey) ? 1 : 0;

        if (leftIsActive !== rightIsActive) {
          return rightIsActive - leftIsActive;
        }

        const leftUnused = usedBlankKeys.has(leftKey) ? 0 : 1;
        const rightUnused = usedBlankKeys.has(rightKey) ? 0 : 1;

        if (leftUnused !== rightUnused) {
          return rightUnused - leftUnused;
        }

        return left.position - right.position;
      });

      const blank = candidateBlanks[0];

      if (!blank) {
        unmatchedCount += 1;
        return prepared;
      }

      const blankKey = buildBlankKey(event.segmentId, blank);

      if (!activeBlankSet.has(blankKey)) {
        droppedByBlankLimit += 1;
        return prepared;
      }

      usedBlankKeys.add(blankKey);

      const targetTime = event.targetTime;
      const baseFallDuration = Math.max(event.fallWindow / effectiveFallSpeed, 0.5 / effectiveFallSpeed);
      const fallDuration = Math.max(baseFallDuration, effectiveMinFallDuration);
      const fallStartTime = Math.max(0, targetTime - fallDuration);
      const missDeadline = targetTime + MISS_GRACE_SECONDS;
      const stableLaneHash = `${event.segmentId}:${normalizedEventKeyword}:${event.targetTime}`
        .split('')
        .reduce((hash, char) => hash * 31 + char.charCodeAt(0), 7);
      const lane = Math.abs(stableLaneHash) % FIXED_LANE_POSITIONS.length;

      prepared.push({
        id: `${event.segmentId}:${event.keyword}:${event.targetTime}`,
        lane,
        leftPercent: FIXED_LANE_POSITIONS[lane] ?? FIXED_LANE_POSITIONS[1],
        blank,
        blankKey,
        keyword: event.keyword,
        segmentId: event.segmentId,
        targetTime,
        fallStartTime,
        fallDuration,
        missDeadline,
      });

      return prepared;
    }, []);

    return {
      events,
      unmatchedCount,
      droppedByBlankLimit,
      duplicateKeywordCandidates,
    };
  }, [effectiveFallSpeed, effectiveMinFallDuration, gameData.fallEvents, gameData.segments, segmentBlankKeys]);

  const preparedEvents = preparedRainSummary.events;

  const activeSegment = useMemo(
    () =>
      gameData.segments.find((segment) => currentTime >= segment.start && currentTime < segment.end) ?? null,
    [currentTime, gameData.segments],
  );

  const localFileUrl = useLocalFilePlayerSrc(sessionId, streamingSource);
  const authenticatedVideoUrl = useAuthenticatedVideoUrl({
    enabled:
      !localFileUrl &&
      sessionDetail?.source_type === 'file' &&
      Boolean(sessionDetail?.video_url),
    sourceUrl: sessionDetail?.video_url,
  });

  const playerSrc = useMemo(() => {
    if (localFileUrl) {
      return localFileUrl;
    }

    if (authenticatedVideoUrl) {
      return authenticatedVideoUrl;
    }

    if (sessionDetail?.video_url) {
      return resolveMediaUrl(sessionDetail.video_url);
    }

    if (sessionDetail?.source_url) {
      return resolveMediaUrl(sessionDetail.source_url);
    }

    return streamingSource?.url || '';
  }, [
    authenticatedVideoUrl,
    localFileUrl,
    sessionDetail?.video_url,
    sessionDetail?.source_url,
    streamingSource?.url,
  ]);

  const sessionTitle = useMemo(() => {
    if (streamingSource?.type === 'file' && isDefaultSessionTitle(sessionDetail?.title)) {
      return streamingSource.file?.name?.trim() || sessionDetail?.title || 'Rain mode';
    }

    return sessionDetail?.title || 'Rain mode';
  }, [sessionDetail?.title, streamingSource]);

  useEffect(() => {
    autoPlaySessionRef.current = null;
    setIsPlayerReady(false);
  }, [playerSrc, sessionId]);

  const unresolvedEvents = useMemo(
    () =>
      preparedEvents.filter(
        (event) =>
          !answeredKeywordIdsRef.current.has(event.id) && !missedKeywordIdsRef.current.has(event.id),
      ),
    [currentTime, preparedEvents],
  );

  const activeKeyword = useMemo(() => {
    const currentEvent =
      unresolvedEvents
        .filter(
          (event) =>
            currentTime >= event.fallStartTime &&
            currentTime <= event.missDeadline,
        )
        .sort((left, right) => left.targetTime - right.targetTime)[0] ??
      unresolvedEvents
        .filter((event) => currentTime < event.fallStartTime)
        .sort((left, right) => left.targetTime - right.targetTime)[0];

    if (!currentEvent) {
      return null;
    }

    return {
      id: currentEvent.id,
      text: currentEvent.keyword,
      hint: `${currentEvent.blank.answer_length}글자`,
      lane: currentEvent.lane,
      leftPercent: currentEvent.leftPercent,
      progress: resolveKeywordProgress(currentTime, currentEvent),
      status: 'active' as const,
      blank: currentEvent.blank,
    };
  }, [currentTime, unresolvedEvents]);

  useEffect(() => {
    const overdueEvents = preparedEvents
      .filter(
        (event) =>
          !answeredKeywordIdsRef.current.has(event.id) &&
          !missedKeywordIdsRef.current.has(event.id) &&
          currentTime > event.missDeadline,
      )
      .sort((left, right) => left.targetTime - right.targetTime);

    if (overdueEvents.length === 0) {
      return;
    }

    overdueEvents.forEach((event) => {
      missedKeywordIdsRef.current.add(event.id);
    });

    setCombo(0);
    setAttempts((previous) => previous + overdueEvents.length);
    setMissCount((previous) => previous + overdueEvents.length);
    setLastJudgement('miss');
  }, [currentTime, preparedEvents, setCombo]);

  const fallingKeywords = useMemo<RainKeyword[]>(
    () =>
      preparedEvents
        .filter((event) => {
          if (answeredKeywordIdsRef.current.has(event.id)) {
            return performance.now() - (answeredAtRef.current.get(event.id) ?? 0) < 800;
          }
          return (
            rafCurrentTime >= event.fallStartTime &&
            rafCurrentTime <= event.missDeadline + (MISSED_DISPLAY_BUFFER - MISS_GRACE_SECONDS)
          );
        })
        .map((event) => {
          const isCleared = answeredKeywordIdsRef.current.has(event.id);
          const isMissed =
            missedKeywordIdsRef.current.has(event.id) ||
            (!isCleared && rafCurrentTime > event.missDeadline);

          if (isCleared) {
            return {
              id: event.id,
              text: event.keyword,
              hint: `${event.blank.answer_length}글자`,
              lane: event.lane,
              leftPercent: event.leftPercent,
              progress: FALL_PROGRESS_END,
              status: 'cleared' as const,
            };
          }

          if (isMissed) {
            return {
              id: event.id,
              text: event.keyword,
              hint: `${event.blank.answer_length}글자`,
              lane: event.lane,
              leftPercent: event.leftPercent,
              progress: FALL_PROGRESS_END,
              status: 'missed' as const,
            };
          }

          if (rafCurrentTime < event.fallStartTime) {
            return {
              id: event.id,
              text: event.keyword,
              hint: `${event.blank.answer_length}글자`,
              lane: event.lane,
              leftPercent: event.leftPercent,
              progress: FALL_PROGRESS_START,
              status: 'pending' as const,
            };
          }

          return {
            id: event.id,
            text: event.keyword,
            hint: `${event.blank.answer_length}글자`,
            lane: event.lane,
            leftPercent: event.leftPercent,
            progress: resolveKeywordProgress(rafCurrentTime, event),
            status: activeKeyword?.id === event.id ? 'active' : 'pending',
          };
        }),
    [activeKeyword?.id, rafCurrentTime, preparedEvents],
  );

  const visibleFallingKeywords = useMemo<RainKeyword[]>(() => {
    const keywordById = new Map(fallingKeywords.map((keyword) => [keyword.id, keyword]));

    return preparedEvents
      .filter((event) => keywordById.has(event.id))
      .map((event) => {
        const keyword = keywordById.get(event.id);
        const isInFlight =
          keyword?.status !== 'cleared' &&
          keyword?.status !== 'missed' &&
          currentTime >= event.fallStartTime &&
          currentTime <= event.missDeadline;

        return {
          keyword,
          priority: isInFlight ? 0 : 1,
          targetTime: event.targetTime,
        };
      })
      .sort((left, right) => {
        if (left.priority !== right.priority) {
          return left.priority - right.priority;
        }

        return left.targetTime - right.targetTime;
      })
      .slice(0, effectiveActiveBlanks)
      .map(({ keyword }) => keyword)
      .filter((keyword): keyword is RainKeyword => Boolean(keyword));
  }, [currentTime, effectiveActiveBlanks, fallingKeywords, preparedEvents]);

  const resolvedStatesByBlankKey = useMemo(() => {
    const nextState: Record<string, 'pending' | 'cleared' | 'missed'> = {};

    preparedEvents.forEach((event) => {
      if (answeredKeywordIdsRef.current.has(event.id)) {
        nextState[event.blankKey] = 'cleared';
        return;
      }

      if (missedKeywordIdsRef.current.has(event.id)) {
        nextState[event.blankKey] = 'missed';
        return;
      }

      nextState[event.blankKey] = 'pending';
    });

    return nextState;
  }, [correctCount, currentTime, missCount, preparedEvents]);

  const captionDisplay = useMemo(
    () =>
      buildCaptionDisplay(
        activeSegment
          ? {
              segmentId: activeSegment.segmentId,
              blankText: activeSegment.blankText,
              blanks: activeSegment.blanks.slice(0, effectiveActiveBlanks),
            }
          : null,
        typedValuesByBlankKey,
        resolvedStatesByBlankKey,
      ),
    [activeSegment, effectiveActiveBlanks, resolvedStatesByBlankKey, typedValuesByBlankKey],
  );

  useEffect(() => {
    const visibleBlankKeys = new Set(
      captionDisplay.items.filter((item): item is RainCaptionInputItem => item.type === 'input').map((item) => item.key),
    );

    setTypedValuesByBlankKey((current) => {
      const nextEntries = Object.entries(current).filter(([key]) => visibleBlankKeys.has(key));
      if (nextEntries.length === Object.keys(current).length) {
        return current;
      }

      return Object.fromEntries(nextEntries);
    });
  }, [captionDisplay.items]);

  const accuracy = attempts === 0 ? 100 : Math.round((correctCount / attempts) * 100);

  useEffect(() => {
    setAccuracy(accuracy);
  }, [accuracy, setAccuracy]);

  useEffect(() => {
    if (!sessionId) {
      return;
    }

    saveSessionResult(sessionId, {
      score,
      maxCombo,
      accuracy,
    });
  }, [accuracy, maxCombo, saveSessionResult, score, sessionId]);

  useEffect(() => {
    const isFirstChapterReady = gameData.loadedChapterIndexes.includes(0);
    const isStreamingFile = streamingSource?.type === 'file';
    const isStreamingYoutube = streamingSource?.type === 'youtube_url';
    const canAutoPlayFile =
      isStreamingFile && isFirstChapterReady && state !== 'failed' && state !== 'chapter_waiting';
    const canAutoPlayYoutube =
      isStreamingYoutube &&
      isFirstChapterReady &&
      isPlayerReady &&
      state !== 'failed' &&
      state !== 'chapter_waiting';

    if ((!canAutoPlayFile && !canAutoPlayYoutube) || !sessionId) {
      return;
    }

    if (currentQuizState || isPlaying || autoPlaySessionRef.current === sessionId) {
      return;
    }

    const controller = controllerRef.current;
    if (!controller) {
      return;
    }

    autoPlaySessionRef.current = sessionId;
    void Promise.resolve(controller.play()).catch(() => {
      autoPlaySessionRef.current = null;
    });
  }, [
    currentQuizState,
    gameData.loadedChapterIndexes,
    isPlayerReady,
    isPlaying,
    playerSrc,
    sessionId,
    state,
    streamingSource?.type,
  ]);

  useEffect(() => {
    if (currentQuizState || state === 'failed') {
      return;
    }

    const nextQuiz = gameData.quizzes.find(
      (quiz) =>
        !answeredQuizIdsRef.current.has(buildAnsweredQuizKey(quiz.quizId, quiz.triggerTime)) &&
        currentTime >= quiz.triggerTime,
    );

    if (!nextQuiz) {
      return;
    }

    controllerRef.current?.pause();
    setCurrentQuizState({
      quiz: {
        quiz_id: nextQuiz.quizId ?? undefined,
        quiz_index: nextQuiz.quizIndex,
        trigger_time: nextQuiz.triggerTime,
        segment_range: nextQuiz.segmentRange,
        question: nextQuiz.question,
        options: nextQuiz.options,
        answer_index: nextQuiz.answerIndex,
        correct_feedback: nextQuiz.correctFeedback,
        incorrect_feedback: nextQuiz.incorrectFeedback,
      },
      selectedIndex: null,
      feedback: '',
      submitError: '',
      isCorrect: null,
      isSubmitting: false,
    });
  }, [currentQuizState, currentTime, gameData.quizzes, state]);

  useEffect(() => {
    if (!currentQuizState || currentQuizState.quiz.quiz_id !== undefined) {
      return;
    }

    const persistedQuiz =
      gameData.quizzes.find(
        (quiz) =>
          quiz.quizId !== null &&
          quiz.quizIndex === (currentQuizState.quiz.quiz_index ?? -1),
      ) ??
      gameData.quizzes.find(
        (quiz) =>
          quiz.quizId !== null &&
          quiz.triggerTime === currentQuizState.quiz.trigger_time &&
          quiz.question === currentQuizState.quiz.question,
      );

    if (!persistedQuiz) {
      return;
    }

    setCurrentQuizState((current) =>
      current
        ? {
            ...current,
            quiz: {
              ...current.quiz,
              quiz_id: persistedQuiz.quizId ?? undefined,
            },
            submitError: '',
          }
        : current,
    );
  }, [currentQuizState, gameData.quizzes]);

  const handleTypedValueChange = (blankKey: string, value: string) => {
    setTypedValuesByBlankKey((current) => ({
      ...current,
      [blankKey]: value,
    }));
  };

  const handleTypingSubmit = (blankKey: string) => {
    const targetEvent = preparedEvents.find((event) => event.blankKey === blankKey);
    const typedValue = typedValuesByBlankKey[blankKey] ?? '';
    const normalizedTyped = normalizeAnswer(typedValue);

    if (!targetEvent || !normalizedTyped) {
      setTypedValuesByBlankKey((current) => ({ ...current, [blankKey]: '' }));
      return;
    }

    if (
      answeredKeywordIdsRef.current.has(targetEvent.id) ||
      missedKeywordIdsRef.current.has(targetEvent.id)
    ) {
      setTypedValuesByBlankKey((current) => ({ ...current, [blankKey]: '' }));
      return;
    }

    setAttempts((previous) => previous + 1);

    if (normalizedTyped === normalizeAnswer(targetEvent.keyword)) {
      answeredKeywordIdsRef.current.add(targetEvent.id);
      answeredAtRef.current.set(targetEvent.id, performance.now());
      setTypedValuesByBlankKey((current) => ({ ...current, [blankKey]: targetEvent.keyword }));

      const nextScore = score + 120;
      const nextCombo = combo + 1;

      setScore(nextScore);
      setCombo(nextCombo);
      setCorrectCount((previous) => previous + 1);
      setMaxCombo((previous) => Math.max(previous, nextCombo));
      setComboAnimationKey((previous) => previous + 1);
      setLastJudgement('hit');
      return;
    }

    setTypedValuesByBlankKey((current) => ({ ...current, [blankKey]: '' }));
    setCombo(0);
    setLastJudgement('wrong');
  };

  const submitCurrentQuizAnswer = async (selectedIndex: number) => {
    if (!sessionId || !currentQuizState || currentQuizState.selectedIndex !== null) {
      return;
    }

    const quizId = currentQuizState.quiz.quiz_id;

    if (quizId === undefined || quizId === null || quizId <= 0) {
      setCurrentQuizState((current) =>
        current
          ? {
              ...current,
              submitError: '퀴즈 저장 전이라 아직 채점할 수 없어요.',
              isSubmitting: false,
            }
          : current,
      );
      return;
    }

    setCurrentQuizState((current) =>
      current
        ? {
            ...current,
            isSubmitting: true,
            submitError: '',
          }
        : current,
    );

    try {
      console.log('[quiz submit][rain] request', {
        sessionId,
        quizId,
        selectedIndex,
      });
      const response = await submitQuizAnswer(sessionId, quizId, {
        selected_index: selectedIndex,
      });
      console.log('[quiz submit][rain] success', {
        sessionId,
        quizId,
        selectedIndex,
        response: response.data,
      });
      const isCorrect = response.data.is_correct;
      const feedback =
        response.data.explanation ||
        (isCorrect
          ? currentQuizState.quiz.correct_feedback || ''
          : currentQuizState.quiz.incorrect_feedback || '');

      if (isCorrect) {
        quizCorrectCountRef.current += 1;
        setQuizCorrectCount((current) => current + 1);
      }

      setCurrentQuizState((current) =>
        current
          ? {
              ...current,
              selectedIndex,
              feedback,
              submitError: '',
              isCorrect,
              isSubmitting: false,
            }
          : current,
      );
    } catch (error: unknown) {

      console.error('[quiz submit][rain] error', {
        sessionId,
        quizId,
        selectedIndex,
        error,
      });

      setCurrentQuizState((current) =>
        current
          ? {
              ...current,
              submitError: getQuizSubmitErrorMessage(error),
              isSubmitting: false,
            }
          : current,
      );
    }
  };

  const continueFromQuiz = async () => {
    if (!currentQuizState) {
      return;
    }

    answeredQuizIdsRef.current.add(
      buildAnsweredQuizKey(
        currentQuizState.quiz.quiz_id ?? null,
        currentQuizState.quiz.trigger_time,
      ),
    );
    quizAnsweredCountRef.current += 1;
    setQuizAnsweredCount((current) => current + 1);
    setCurrentQuizState(null);
    await Promise.resolve(controllerRef.current?.play());
  };

  const pendingKeywordCount = useMemo(
    () =>
      preparedEvents.filter(
        (event) =>
          !answeredKeywordIdsRef.current.has(event.id) &&
          !missedKeywordIdsRef.current.has(event.id) &&
          currentTime <= event.missDeadline,
      ).length,
    [currentTime, preparedEvents],
  );
  const nextTargetTime =
    unresolvedEvents
      .map((event) => event.targetTime)
      .sort((left, right) => left - right)[0] ?? null;
  const nextFallDuration =
    unresolvedEvents
      .map((event) => event.fallDuration)
      .sort((left, right) => left - right)[0] ?? null;
  const visibleKeywordCount = visibleFallingKeywords.length;
  const settingsSummary = `${isManualSettings ? 'Manual' : 'Auto'} · ${effectiveActiveBlanks} blanks · speed ${effectiveFallSpeed}`;

  const enhancedDebug = useMemo(
    () => ({
      ...debug,
      rainDifficulty: selectedDifficulty,
      activeBlanks: effectiveActiveBlanks,
      fallSpeed: effectiveFallSpeed,
      minFallDuration: effectiveMinFallDuration,
      missGraceSeconds: MISS_GRACE_SECONDS,
      activeKeywordId: activeKeyword?.id ?? null,
      pendingKeywordCount,
      visibleKeywordCount,
      nextTargetTime,
      nextFallDuration,
      missedKeywordCount: missCount,
      lastJudgement,
      preparedFallEvents: preparedEvents.length,
      unmatchedFallEvents: preparedRainSummary.unmatchedCount,
      droppedByBlankLimit: preparedRainSummary.droppedByBlankLimit,
      duplicateKeywordCandidates: preparedRainSummary.duplicateKeywordCandidates,
    }),
    [
      activeKeyword?.id,
      debug,
      effectiveFallSpeed,
      effectiveActiveBlanks,
      effectiveMinFallDuration,
      isManualSettings,
      lastJudgement,
      missCount,
      MISS_GRACE_SECONDS,
      nextFallDuration,
      nextTargetTime,
      pendingKeywordCount,
      preparedEvents.length,
      preparedRainSummary.droppedByBlankLimit,
      preparedRainSummary.duplicateKeywordCandidates,
      preparedRainSummary.unmatchedCount,
      rainDifficulty,
      visibleKeywordCount,
    ],
  );

  return {
    sessionId,
    speedMenuRef,
    videoRef,
    controllerRef,
    playerType: (
      sessionDetail?.source_type === 'youtube_url' || streamingSource?.type === 'youtube_url'
        ? 'youtube'
        : 'html5'
    ) as PlayerType,
    playerSrc,
    sessionTitle,
    sessionAiStatus: currentAiStatus,
    playerStatus: state,
    playerStatusLabel: statusLabel,
    sessionError: errorMessage,
    debug: enhancedDebug,
    characterName: '집중 캐릭터',
    duration: duration || gameData.durationSec,
    currentTime,
    isPlaying,
    playbackRate,
    isSpeedMenuOpen,
    isCaptionVisible,
    speedOptions: RAIN_SPEED_OPTIONS,
    captionText: activeSegment?.blankText ?? '',
    captionDisplay,
    fallingKeywords: visibleFallingKeywords,
    activeKeyword,
    settingsSummary,
    typedValuesByBlankKey,
    score,
    combo,
    maxCombo,
    accuracy,
    comboAnimationKey,
    quizState: currentQuizState,
    quizCorrectCount,
    quizAnsweredCount,
    totalQuizCount: gameData.quizzes.length,
    getLatestQuizStats: () => ({
      quizCorrectCount: quizCorrectCountRef.current,
      quizAnsweredCount: quizAnsweredCountRef.current,
    }),
    handleTypedValueChange,
    togglePlay: async () => {
      if (currentQuizState || state === 'chapter_waiting' || state === 'stream_connecting') {
        return;
      }

      if (isPlaying) {
        controllerRef.current?.pause();
        return;
      }

      await Promise.resolve(controllerRef.current?.play());
    },
    toggleSpeedMenu: () => setIsSpeedMenuOpen((previous) => !previous),
    selectSpeed: (speed: PlaybackRate) => {
      setPlaybackRate(speed);
      setIsSpeedMenuOpen(false);
    },
    toggleCaption: () => setIsCaptionVisible((previous) => !previous),
    submitTypedKeyword: handleTypingSubmit,
    submitQuizAnswer: submitCurrentQuizAnswer,
    continueFromQuiz,
    handleTimeUpdate: (time: number, nextDuration: number) => {
      setCurrentTime(time);
      lastVideoTimeRef.current = time;
      lastWallTimeRef.current = performance.now();
      if (nextDuration > 0) {
        setDuration(nextDuration);
      }
    },
    handleSeek: (nextTime: number) => {
      controllerRef.current?.seek(nextTime);
      setCurrentTime(nextTime);
    },
    handleLoadedMetadata: (nextDuration: number) => {
      setDuration(nextDuration);
    },
    handlePlayerReady: () => setIsPlayerReady(true),
    handlePlay: () => setIsPlaying(true),
    handlePause: () => setIsPlaying(false),
    handleEnded: () => setIsPlaying(false),
  };
}
