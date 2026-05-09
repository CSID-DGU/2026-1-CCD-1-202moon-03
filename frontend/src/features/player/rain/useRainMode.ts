import { useEffect, useMemo, useRef, useState } from 'react';
import { submitQuizAnswer } from '../../../services/quiz.api';
import { getTransientStreamingSource, usePlayerStore } from '../../../store/usePlayerStore';
import { useRainStore } from '../../../store/useRainStore';
import { useGameSessionData } from '../shared/useGameSessionData';
import type { MediaController, PlayerType } from '../shared/playback';
import { resolveMediaUrl } from '../shared/playback';
import type { PlaybackRate, RainCaptionDisplay, RainKeyword, RainQuizState } from './types';

const RAIN_DIFFICULTY = {
  activeBlanks: 2,
  fallSpeed: 1,
};

const FALL_PROGRESS_START = 12;
const FALL_PROGRESS_END = 86;
const FALL_PROGRESS_RANGE = FALL_PROGRESS_END - FALL_PROGRESS_START;
const RAIN_SPEED_OPTIONS: PlaybackRate[] = [0.5, 0.75, 1, 1.25, 1.5, 2];

function clampProgress(value: number) {
  return Math.max(FALL_PROGRESS_START, Math.min(value, FALL_PROGRESS_END));
}

function normalizeAnswer(value: string) {
  return value.trim().toLowerCase();
}

function buildCaptionDisplay(
  activeSegment: {
    originalText: string;
    blankText: string;
    blanks: { keyword: string; position: number; answer_length: number }[];
  } | null,
  activeBlank: { keyword: string; position: number; answer_length: number } | null,
): RainCaptionDisplay {
  if (!activeSegment) {
    return { beforeText: '', afterText: '', blank: null };
  }

  if (!activeBlank) {
    return {
      beforeText: activeSegment.originalText,
      afterText: '',
      blank: null,
    };
  }

  const placeholders = activeSegment.blankText.split('______');
  const targetIndex = activeSegment.blanks.findIndex(
    (blank) =>
      blank.position === activeBlank.position &&
      normalizeAnswer(blank.keyword) === normalizeAnswer(activeBlank.keyword),
  );

  if (targetIndex === -1) {
    return {
      beforeText: activeSegment.originalText,
      afterText: '',
      blank: null,
    };
  }

  let beforeText = placeholders[0] ?? '';
  let afterText = '';

  for (let index = 0; index < activeSegment.blanks.length; index += 1) {
    const blank = activeSegment.blanks[index];
    const nextChunk = placeholders[index + 1] ?? '';

    if (index < targetIndex) {
      beforeText += `${blank.keyword}${nextChunk}`;
      continue;
    }

    if (index === targetIndex) {
      afterText = nextChunk;
      for (let tailIndex = index + 1; tailIndex < activeSegment.blanks.length; tailIndex += 1) {
        const tailBlank = activeSegment.blanks[tailIndex];
        afterText += `${tailBlank.keyword}${placeholders[tailIndex + 1] ?? ''}`;
      }
      break;
    }
  }

  return {
    beforeText: beforeText.trim(),
    afterText: afterText.trim(),
    blank: activeBlank,
  };
}

export function useRainMode() {
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
  const storeStreamingSource = usePlayerStore((state) => state.streamingSource);
  const streamingSource = storeStreamingSource ?? getTransientStreamingSource();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const controllerRef = useRef<MediaController | null>(null);
  const speedMenuRef = useRef<HTMLDivElement | null>(null);
  const initializedSessionIdRef = useRef<string | null>(null);
  const answeredQuizIdsRef = useRef<Set<number>>(new Set());
  const answeredKeywordIdsRef = useRef<Set<string>>(new Set());
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

  const [typedValue, setTypedValue] = useState('');
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
  const [currentQuizState, setCurrentQuizState] = useState<RainQuizState | null>(null);
  const [quizCorrectCount, setQuizCorrectCount] = useState(0);
  const [quizAnsweredCount, setQuizAnsweredCount] = useState(0);

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

    const savedResult = sessionResults[sessionId];
    setScore(savedResult?.score ?? 0);
    setCombo(0);
    setAccuracy(savedResult?.accuracy ?? 0);
    setMaxCombo(savedResult?.maxCombo ?? 0);
    setAttempts(0);
    setCorrectCount(0);
    setTypedValue('');
    setCurrentTime(0);
    setDuration(0);
    setIsPlaying(false);
    setCurrentQuizState(null);
    setQuizCorrectCount(0);
    setQuizAnsweredCount(0);

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

  const activeSegmentIds = useMemo(() => {
    const map = new Map<number, Set<string>>();

    gameData.segments.forEach((segment) => {
      map.set(
        segment.segmentId,
        new Set(
          segment.blanks
            .slice(0, RAIN_DIFFICULTY.activeBlanks)
            .map((blank) => `${blank.position}:${normalizeAnswer(blank.keyword)}`),
        ),
      );
    });

    return map;
  }, [gameData.segments]);

  const preparedEvents = useMemo(
    () =>
      gameData.fallEvents
        .map((event, index) => {
          const segment = gameData.segments.find((item) => item.segmentId === event.segmentId);
          const blank = segment?.blanks.find(
            (item) =>
              activeSegmentIds.get(event.segmentId)?.has(
                `${item.position}:${normalizeAnswer(item.keyword)}`,
              ) && normalizeAnswer(item.keyword) === normalizeAnswer(event.keyword),
          );

          if (!blank) {
            return null;
          }

          const fallDuration = event.fallWindow / RAIN_DIFFICULTY.fallSpeed;

          return {
            id: `${event.segmentId}:${event.keyword}:${event.targetTime}:${index}`,
            lane: index % 4,
            blank,
            keyword: event.keyword,
            segmentId: event.segmentId,
            targetTime: event.targetTime,
            fallStartTime: event.targetTime - fallDuration,
            fallDuration,
          };
        })
        .filter(
          (
            event,
          ): event is {
            id: string;
            lane: number;
            blank: { keyword: string; position: number; answer_length: number };
            keyword: string;
            segmentId: number;
            targetTime: number;
            fallStartTime: number;
            fallDuration: number;
          } => event !== null,
        ),
    [activeSegmentIds, gameData.fallEvents, gameData.segments],
  );

  const activeSegment = useMemo(
    () =>
      gameData.segments.find((segment) => currentTime >= segment.start && currentTime < segment.end) ??
      gameData.segments[gameData.segments.length - 1] ??
      null,
    [currentTime, gameData.segments],
  );

  const localFileUrl = useMemo(() => {
    if (!streamingSource?.file || String(streamingSource.sessionId ?? '') !== String(sessionId ?? '')) {
      return '';
    }

    return URL.createObjectURL(streamingSource.file);
  }, [sessionId, streamingSource?.file, streamingSource?.sessionId]);

  useEffect(() => {
    return () => {
      if (localFileUrl) {
        URL.revokeObjectURL(localFileUrl);
      }
    };
  }, [localFileUrl]);

  const activeKeyword = useMemo(() => {
    const currentEvent =
      preparedEvents.find(
        (event) =>
          !answeredKeywordIdsRef.current.has(event.id) &&
          currentTime >= event.fallStartTime &&
          currentTime <= event.targetTime,
      ) ??
      preparedEvents.find(
        (event) => !answeredKeywordIdsRef.current.has(event.id) && currentTime < event.fallStartTime,
      );

    if (!currentEvent) {
      return null;
    }

    return {
      id: currentEvent.id,
      text: currentEvent.keyword,
      hint: `${currentEvent.blank.answer_length}글자`,
      lane: currentEvent.lane,
      progress: clampProgress(FALL_PROGRESS_START),
      status: 'active' as const,
      blank: currentEvent.blank,
    };
  }, [currentTime, preparedEvents]);

  const fallingKeywords = useMemo<RainKeyword[]>(
    () =>
      preparedEvents
        .filter(
          (event) =>
            currentTime <= event.targetTime + 1.5 &&
            currentTime >= event.fallStartTime - event.fallDuration * 0.8,
        )
        .map((event) => {
          if (answeredKeywordIdsRef.current.has(event.id) || currentTime > event.targetTime) {
            return {
              id: event.id,
              text: event.keyword,
              hint: `${event.blank.answer_length}글자`,
              lane: event.lane,
              progress: FALL_PROGRESS_END,
              status: 'cleared' as const,
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

          const progressRatio = (currentTime - event.fallStartTime) / event.fallDuration;
          return {
            id: event.id,
            text: event.keyword,
            hint: `${event.blank.answer_length}글자`,
            lane: event.lane,
            progress: clampProgress(FALL_PROGRESS_START + progressRatio * FALL_PROGRESS_RANGE),
            status: activeKeyword?.id === event.id ? 'active' : 'pending',
          };
        }),
    [activeKeyword?.id, currentTime, preparedEvents],
  );

  const captionDisplay = useMemo(
    () =>
      buildCaptionDisplay(
        activeSegment
          ? {
              originalText: activeSegment.originalText,
              blankText: activeSegment.blankText,
              blanks: activeSegment.blanks,
            }
          : null,
        activeKeyword?.blank ?? null,
      ),
    [activeKeyword?.blank, activeSegment],
  );

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
    if (currentQuizState || state === 'failed') {
      return;
    }

    const nextQuiz = gameData.quizzes.find(
      (quiz) => !answeredQuizIdsRef.current.has(quiz.quizId) && currentTime >= quiz.triggerTime,
    );

    if (!nextQuiz) {
      return;
    }

    controllerRef.current?.pause();
    setCurrentQuizState({
      quiz: {
        quiz_id: nextQuiz.quizId,
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
      isCorrect: null,
      isSubmitting: false,
    });
  }, [currentQuizState, currentTime, gameData.quizzes, state]);

  const handleTypingSubmit = () => {
    if (!activeKeyword) {
      return;
    }

    const normalizedTyped = normalizeAnswer(typedValue);
    if (!normalizedTyped) {
      return;
    }

    setAttempts((previous) => previous + 1);

    if (normalizedTyped === normalizeAnswer(activeKeyword.text)) {
      answeredKeywordIdsRef.current.add(activeKeyword.id);
      const nextScore = score + 120;
      const nextCombo = combo + 1;

      setScore(nextScore);
      setCombo(nextCombo);
      setCorrectCount((previous) => previous + 1);
      setMaxCombo((previous) => Math.max(previous, nextCombo));
      setComboAnimationKey((previous) => previous + 1);
      setTypedValue('');
      return;
    }

    setCombo(0);
    setTypedValue('');
  };

  const submitCurrentQuizAnswer = async (selectedIndex: number) => {
    if (!sessionId || !currentQuizState || currentQuizState.selectedIndex !== null) {
      return;
    }

    setCurrentQuizState((current) => (current ? { ...current, isSubmitting: true } : current));

    try {
      const response = await submitQuizAnswer(sessionId, currentQuizState.quiz.quiz_id ?? 0, {
        selected_index: selectedIndex,
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
              isCorrect,
              isSubmitting: false,
            }
          : current,
      );
    } catch {
      const isCorrect = selectedIndex === currentQuizState.quiz.answer_index;
      if (isCorrect) {
        setQuizCorrectCount((current) => current + 1);
      }

      setCurrentQuizState((current) =>
        current
          ? {
              ...current,
              selectedIndex,
              feedback: isCorrect
                ? current.quiz.correct_feedback || ''
                : current.quiz.incorrect_feedback || '',
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

    answeredQuizIdsRef.current.add(currentQuizState.quiz.quiz_id ?? 0);
    setQuizAnsweredCount((current) => current + 1);
    setCurrentQuizState(null);
    await controllerRef.current?.play();
  };

  return {
    sessionId,
    speedMenuRef,
    videoRef,
    controllerRef,
    playerType: (
      sessionDetail?.source_type === 'youtube_url' ||
      streamingSource?.type === 'youtube_url'
        ? 'youtube'
        : 'html5') as PlayerType,
    playerSrc:
      sessionDetail?.source_url
        ? resolveMediaUrl(sessionDetail.source_url)
        : streamingSource?.url || localFileUrl,
    sessionTitle: sessionDetail?.title || 'Rain mode',
    sessionAiStatus: currentAiStatus,
    playerStatus: state,
    playerStatusLabel: statusLabel,
    sessionError: errorMessage,
    debug,
    characterName: '집중 캐릭터',
    duration: duration || gameData.durationSec,
    currentTime,
    isPlaying,
    playbackRate,
    isSpeedMenuOpen,
    isCaptionVisible,
    speedOptions: RAIN_SPEED_OPTIONS,
    captionText: activeSegment?.originalText ?? '',
    captionDisplay,
    fallingKeywords,
    activeKeyword,
    typedValue,
    score,
    combo,
    maxCombo,
    accuracy,
    comboAnimationKey,
    quizState: currentQuizState,
    quizCorrectCount,
    quizAnsweredCount,
    totalQuizCount: gameData.quizzes.length,
    setTypedValue,
    togglePlay: async () => {
      if (currentQuizState || state === 'chapter_waiting' || state === 'stream_connecting') {
        return;
      }

      if (isPlaying) {
        controllerRef.current?.pause();
        return;
      }

      await controllerRef.current?.play();
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
    handlePlay: () => setIsPlaying(true),
    handlePause: () => setIsPlaying(false),
    handleEnded: () => setIsPlaying(false),
  };
}
