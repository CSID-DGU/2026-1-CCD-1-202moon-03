import { useEffect, useMemo, useRef, useState } from 'react';
import { submitQuizAnswer } from '../../../services/quiz.api';
import { getTransientStreamingSource, usePlayerStore } from '../../../store/usePlayerStore';
import { useRainStore } from '../../../store/useRainStore';
import type { ApiErrorResponse, GameBlankItem } from '../../../types';
import { useGameSessionData } from '../shared/useGameSessionData';
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
const FALL_TARGET_PROGRESS = 35;
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
  blank: GameBlankItem;
  blankKey: string;
  keyword: string;
  segmentId: number;
  targetTime: number;
  fallStartTime: number;
  fallDuration: number;
  missDeadline: number;
};

function clampProgress(value: number) {
  return Math.max(FALL_PROGRESS_START, Math.min(value, FALL_PROGRESS_END));
}

function normalizeAnswer(value: string) {
  return value.trim().toLowerCase();
}

function buildBlankKey(segmentId: number, blank: GameBlankItem) {
  return `${segmentId}:${blank.position}:${normalizeAnswer(blank.keyword)}`;
}

function getVisibleLanePositions(count: number) {
  if (count <= 1) {
    return [39];
  }

  if (count === 2) {
    return [28, 56];
  }

  return [18, 39, 60];
}

function resolveKeywordProgress(currentTime: number, event: PreparedRainEvent) {
  if (currentTime <= event.fallStartTime) {
    return FALL_PROGRESS_START;
  }

  if (currentTime <= event.targetTime) {
    const timeUntilTarget = Math.max(event.targetTime - event.fallStartTime, 0.001);
    const progressRatio = (currentTime - event.fallStartTime) / timeUntilTarget;

    return clampProgress(
      FALL_PROGRESS_START +
        progressRatio * (FALL_TARGET_PROGRESS - FALL_PROGRESS_START),
    );
  }

  if (currentTime <= event.missDeadline) {
    const timeUntilMiss = Math.max(event.missDeadline - event.targetTime, 0.001);
    const progressRatio = (currentTime - event.targetTime) / timeUntilMiss;

    return clampProgress(
      FALL_TARGET_PROGRESS +
        progressRatio * (FALL_PROGRESS_END - FALL_TARGET_PROGRESS),
    );
  }

  return FALL_PROGRESS_END;
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

function resolveLocalQuizResult(
  quiz: RainQuizState['quiz'],
  selectedIndex: number,
) {
  const isCorrect = selectedIndex === quiz.answer_index;
  const feedback = isCorrect ? quiz.correct_feedback || '' : quiz.incorrect_feedback || '';

  return { isCorrect, feedback };
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
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const [currentQuizState, setCurrentQuizState] = useState<RainQuizState | null>(null);
  const [quizCorrectCount, setQuizCorrectCount] = useState(0);
  const [quizAnsweredCount, setQuizAnsweredCount] = useState(0);
  const [missCount, setMissCount] = useState(0);
  const [lastJudgement, setLastJudgement] = useState<'hit' | 'miss' | 'wrong' | null>(null);
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
    controllerRef.current?.setPlaybackRate(playbackRate);
  }, [playbackRate]);

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

  const preparedEvents = useMemo<PreparedRainEvent[]>(
    () =>
      gameData.fallEvents
        .map((event, index) => {
          const segment = gameData.segments.find((item) => item.segmentId === event.segmentId);
          const blank = segment?.blanks.find(
            (item) =>
              segmentBlankKeys.get(event.segmentId)?.has(buildBlankKey(event.segmentId, item)) &&
              normalizeAnswer(item.keyword) === normalizeAnswer(event.keyword),
          );

          if (!segment || !blank) {
            return null;
          }

          const targetTime = event.targetTime;
          const baseFallDuration = Math.max(event.fallWindow / effectiveFallSpeed, 0.5 / effectiveFallSpeed);
          const fallDuration = Math.max(baseFallDuration, effectiveMinFallDuration);
          const fallStartTime = Math.max(0, targetTime - fallDuration);
          const missDeadline = targetTime + MISS_GRACE_SECONDS;

          return {
            id: `${event.segmentId}:${event.keyword}:${event.targetTime}:${index}`,
            lane: index % 4,
            blank,
            blankKey: buildBlankKey(event.segmentId, blank),
            keyword: event.keyword,
            segmentId: event.segmentId,
            targetTime,
            fallStartTime,
            fallDuration,
            missDeadline,
          };
        })
        .filter((event): event is PreparedRainEvent => event !== null),
    [effectiveFallSpeed, effectiveMinFallDuration, gameData.fallEvents, gameData.segments, segmentBlankKeys],
  );

  const activeSegment = useMemo(
    () =>
      gameData.segments.find((segment) => currentTime >= segment.start && currentTime < segment.end) ?? null,
    [currentTime, gameData.segments],
  );

  const localFileUrl = useLocalFilePlayerSrc(sessionId, streamingSource);

  const playerSrc = useMemo(() => {
    if (localFileUrl) {
      return localFileUrl;
    }

    if (sessionDetail?.source_url) {
      return resolveMediaUrl(sessionDetail.source_url);
    }

    return streamingSource?.url || '';
  }, [localFileUrl, sessionDetail?.source_url, streamingSource?.url]);

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
        .filter(
          (event) =>
            currentTime >= event.fallStartTime &&
            currentTime <= event.missDeadline + (MISSED_DISPLAY_BUFFER - MISS_GRACE_SECONDS),
        )
        .map((event) => {
          const isCleared = answeredKeywordIdsRef.current.has(event.id);
          const isMissed =
            missedKeywordIdsRef.current.has(event.id) ||
            (!isCleared && currentTime > event.missDeadline);

          if (isCleared) {
            return {
              id: event.id,
              text: event.keyword,
              hint: `${event.blank.answer_length}글자`,
              lane: event.lane,
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
              progress: FALL_PROGRESS_END,
              status: 'missed' as const,
            };
          }

          if (currentTime < event.fallStartTime) {
            return {
              id: event.id,
              text: event.keyword,
              hint: `${event.blank.answer_length}글자`,
              lane: event.lane,
              progress: FALL_PROGRESS_START,
              status: 'pending' as const,
            };
          }

          return {
            id: event.id,
            text: event.keyword,
            hint: `${event.blank.answer_length}글자`,
            lane: event.lane,
            progress: resolveKeywordProgress(currentTime, event),
            status: activeKeyword?.id === event.id ? 'active' : 'pending',
          };
        }),
    [activeKeyword?.id, currentTime, preparedEvents],
  );

  const visibleFallingKeywords = useMemo<RainKeyword[]>(() => {
    const keywordById = new Map(fallingKeywords.map((keyword) => [keyword.id, keyword]));

    const prioritizedIds = preparedEvents
      .filter((event) => keywordById.has(event.id))
      .map((event) => {
        const keyword = keywordById.get(event.id);
        const isInFlight =
          keyword?.status !== 'cleared' &&
          keyword?.status !== 'missed' &&
          currentTime >= event.fallStartTime &&
          currentTime <= event.missDeadline;

        return {
          eventId: event.id,
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
      .slice(0, effectiveActiveBlanks);

    const lanePositions = getVisibleLanePositions(prioritizedIds.length);

    return prioritizedIds.reduce<RainKeyword[]>((keywords, { eventId }, index) => {
        const keyword = keywordById.get(eventId);
        if (!keyword) {
          return keywords;
        }

        keywords.push({
          ...keyword,
          lane: index,
          leftPercent: lanePositions[index] ?? lanePositions[lanePositions.length - 1] ?? 39,
        });

        return keywords;
      }, []);
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

    setTypedValuesByBlankKey((current) => ({
      ...current,
      [blankKey]: '',
    }));

    if (!targetEvent || !normalizedTyped) {
      return;
    }

    if (
      answeredKeywordIdsRef.current.has(targetEvent.id) ||
      missedKeywordIdsRef.current.has(targetEvent.id)
    ) {
      return;
    }

    setAttempts((previous) => previous + 1);

    if (normalizedTyped === normalizeAnswer(targetEvent.keyword)) {
      answeredKeywordIdsRef.current.add(targetEvent.id);

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

    setCombo(0);
    setLastJudgement('wrong');
  };

  const submitCurrentQuizAnswer = async (selectedIndex: number) => {
    if (!sessionId || !currentQuizState || currentQuizState.selectedIndex !== null) {
      return;
    }

    const quizId = currentQuizState.quiz.quiz_id;

    if (quizId === undefined || quizId === null || quizId <= 0) {
      const { isCorrect, feedback } = resolveLocalQuizResult(currentQuizState.quiz, selectedIndex);

      console.warn('[quiz submit][rain] fallback to local grading', {
        sessionId,
        quizId,
        selectedIndex,
      });

      if (isCorrect) {
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
      return;
      setCurrentQuizState((current) =>
        current
          ? {
              ...current,
              submitError: '퀴즈 정보를 찾지 못해 답안을 저장할 수 없습니다.',
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
      const { isCorrect, feedback } = resolveLocalQuizResult(currentQuizState.quiz, selectedIndex);

      console.error('[quiz submit][rain] error', {
        sessionId,
        quizId,
        selectedIndex,
        error,
      });

      console.warn('[quiz submit][rain] fallback to local grading after submit error', {
        sessionId,
        quizId,
        selectedIndex,
      });

      if (isCorrect) {
        setQuizCorrectCount((current) => current + 1);
      }

      setCurrentQuizState((current) =>
        current
          ? {
              ...current,
              selectedIndex,
              feedback,
              submitError: getQuizSubmitErrorMessage(error),
              isCorrect,
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
    sessionTitle: sessionDetail?.title || 'Rain mode',
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
