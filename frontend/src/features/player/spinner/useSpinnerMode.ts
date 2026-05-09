import { useEffect, useMemo, useRef, useState } from 'react';
import { submitQuizAnswer } from '../../../services/quiz.api';
import { getTransientStreamingSource, usePlayerStore } from '../../../store/usePlayerStore';
import type { ApiErrorResponse } from '../../../types';
import { resolveMediaUrl } from '../shared/playback';
import { useGameSessionData } from '../shared/useGameSessionData';
import { useLocalFilePlayerSrc } from '../shared/useLocalFilePlayerSrc';
import type { MediaController, PlayerType } from '../shared/playback';
import type { SpinnerAssistTool, SpinnerPlaybackRate } from './types';

const SPEED_OPTIONS: SpinnerPlaybackRate[] = [0.5, 0.75, 1, 1.25, 1.5, 2];

function buildAnsweredQuizKey(quizId: number | null, triggerTime: number) {
  return quizId === null || quizId <= 0 ? `missing:${triggerTime}` : `quiz:${quizId}`;
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
  answerIndex: number,
  correctFeedback: string,
  incorrectFeedback: string,
  selectedIndex: number,
) {
  const isCorrect = selectedIndex === answerIndex;
  const feedback = isCorrect ? correctFeedback : incorrectFeedback;

  return { isCorrect, feedback };
}

export function useSpinnerMode() {
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
  const keycapTimeoutRef = useRef<number | null>(null);
  const autoPlaySessionRef = useRef<string | null>(null);
  const [isPlayerReady, setIsPlayerReady] = useState(false);

  const [selectedTool, setSelectedTool] = useState<SpinnerAssistTool>('spinner');
  const [spinnerTurns, setSpinnerTurns] = useState(0);
  const [isKeycapPressed, setIsKeycapPressed] = useState(false);
  const [keycapPressCount, setKeycapPressCount] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackRate, setPlaybackRate] = useState<SpinnerPlaybackRate>(1);
  const [isSpeedMenuOpen, setIsSpeedMenuOpen] = useState(false);
  const [isCaptionVisible, setIsCaptionVisible] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [quizState, setQuizState] = useState<{
    quizId: number | null;
    triggerTime: number;
    question: string;
    options: string[];
    answerIndex: number;
    segmentRange?: [number, number];
    feedback: string;
    incorrectFeedback: string;
    submitError: string;
    selectedIndex: number | null;
    isCorrect: boolean | null;
    isSubmitting: boolean;
  } | null>(null);
  const [quizCorrectCount, setQuizCorrectCount] = useState(0);
  const [quizAnsweredCount, setQuizAnsweredCount] = useState(0);
  const answeredQuizIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    controllerRef.current?.setPlaybackRate(playbackRate);
  }, [playbackRate]);

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

  useEffect(() => {
    return () => {
      if (keycapTimeoutRef.current !== null) {
        window.clearTimeout(keycapTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const handleWindowWheel = (event: WheelEvent) => {
      event.preventDefault();
      setSelectedTool('spinner');
      const deltaTurns = event.deltaY * -0.0024;
      setSpinnerTurns((current) => current + deltaTurns);
    };

    window.addEventListener('wheel', handleWindowWheel, { passive: false });

    return () => {
      window.removeEventListener('wheel', handleWindowWheel);
    };
  }, []);

  useEffect(() => {
    const handleWindowKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const isTypingTarget =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target?.isContentEditable;

      if (isTypingTarget || event.repeat) {
        return;
      }

      if (event.key.toLowerCase() !== 'd') {
        return;
      }

      event.preventDefault();
      handlePressKeycap();
    };

    window.addEventListener('keydown', handleWindowKeyDown);

    return () => {
      window.removeEventListener('keydown', handleWindowKeyDown);
    };
  }, []);

  const captionText = useMemo(
    () =>
      gameData.segments.find((segment) => currentTime >= segment.start && currentTime < segment.end)
        ?.originalText ?? '',
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
  }, [sessionId, playerSrc]);

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

    if (quizState || isPlaying || autoPlaySessionRef.current === sessionId) {
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
    gameData.loadedChapterIndexes,
    isPlayerReady,
    isPlaying,
    playerSrc,
    quizState,
    sessionId,
    state,
    streamingSource?.type,
  ]);

  useEffect(() => {
    if (quizState || state === 'failed') {
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
    setQuizState({
      quizId: nextQuiz.quizId,
      triggerTime: nextQuiz.triggerTime,
      question: nextQuiz.question,
      options: nextQuiz.options,
      answerIndex: nextQuiz.answerIndex,
      segmentRange: nextQuiz.segmentRange,
      feedback: nextQuiz.correctFeedback,
      incorrectFeedback: nextQuiz.incorrectFeedback,
      submitError: '',
      selectedIndex: null,
      isCorrect: null,
      isSubmitting: false,
    });
  }, [currentTime, gameData.quizzes, quizState, state]);

  const handlePressKeycap = () => {
    if (keycapTimeoutRef.current !== null) {
      window.clearTimeout(keycapTimeoutRef.current);
    }

    setSelectedTool('keycap');
    setKeycapPressCount((current) => current + 1);
    setIsKeycapPressed(true);
    keycapTimeoutRef.current = window.setTimeout(() => {
      setIsKeycapPressed(false);
      keycapTimeoutRef.current = null;
    }, 160);
  };

  const handleTogglePlay = async () => {
    const controller = controllerRef.current;
    if (!controller || quizState || state === 'chapter_waiting' || state === 'stream_connecting') {
      return;
    }

    if (isPlaying) {
      controller.pause();
      return;
    }

    await Promise.resolve(controller.play());
  };

  const handleSelectSpeed = (speed: SpinnerPlaybackRate) => {
    setPlaybackRate(speed);
    setIsSpeedMenuOpen(false);
  };

  const handleSeek = (nextTime: number) => {
    controllerRef.current?.seek(nextTime);
    setCurrentTime(nextTime);
  };

  const submitCurrentQuizAnswer = async (selectedIndex: number) => {
    if (!sessionId || !quizState || quizState.selectedIndex !== null) {
      return;
    }

    if (quizState.quizId === null || quizState.quizId <= 0) {
      const { isCorrect, feedback } = resolveLocalQuizResult(
        quizState.answerIndex,
        quizState.feedback,
        quizState.incorrectFeedback,
        selectedIndex,
      );

      console.warn('[quiz submit][spinner] fallback to local grading', {
        sessionId,
        quizId: quizState.quizId,
        selectedIndex,
      });

      if (isCorrect) {
        setQuizCorrectCount((current) => current + 1);
      }
      setQuizState((current) =>
        current
          ? {
              ...current,
              selectedIndex,
              isCorrect,
              feedback,
              submitError: '',
              isSubmitting: false,
            }
          : current,
      );
      return;
      setQuizState((current) =>
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

    setQuizState((current) =>
      current
        ? {
            ...current,
            isSubmitting: true,
            submitError: '',
          }
        : current,
    );

    try {
      console.log('[quiz submit][spinner] request', {
        sessionId,
        quizId: quizState.quizId,
        selectedIndex,
      });
      const response = await submitQuizAnswer(sessionId, quizState.quizId, {
        selected_index: selectedIndex,
      });
      console.log('[quiz submit][spinner] success', {
        sessionId,
        quizId: quizState.quizId,
        selectedIndex,
        response: response.data,
      });
      const isCorrect = response.data.is_correct;
      const feedback = response.data.explanation || (isCorrect ? quizState.feedback : quizState.incorrectFeedback);

      if (isCorrect) {
        setQuizCorrectCount((current) => current + 1);
      }

      setQuizState((current) =>
        current
          ? {
              ...current,
              selectedIndex,
              isCorrect,
              feedback,
              submitError: '',
              isSubmitting: false,
            }
          : current,
      );
    } catch (error: unknown) {
      const { isCorrect, feedback } = resolveLocalQuizResult(
        quizState.answerIndex,
        quizState.feedback,
        quizState.incorrectFeedback,
        selectedIndex,
      );

      console.error('[quiz submit][spinner] error', {
        sessionId,
        quizId: quizState.quizId,
        selectedIndex,
        error,
      });

      console.warn('[quiz submit][spinner] fallback to local grading after submit error', {
        sessionId,
        quizId: quizState.quizId,
        selectedIndex,
      });

      if (isCorrect) {
        setQuizCorrectCount((current) => current + 1);
      }

      setQuizState((current) =>
        current
          ? {
              ...current,
              selectedIndex,
              isCorrect,
              feedback,
              submitError: getQuizSubmitErrorMessage(error),
              isSubmitting: false,
            }
          : current,
      );
    }
  };

  const continueFromQuiz = async () => {
    if (!quizState) {
      return;
    }

    answeredQuizIdsRef.current.add(buildAnsweredQuizKey(quizState.quizId, quizState.triggerTime));
    setQuizAnsweredCount((current) => current + 1);
    setQuizState(null);
    await controllerRef.current?.play();
  };

  return {
    sessionId,
    playerType: (
      sessionDetail?.source_type === 'youtube_url' ||
      streamingSource?.type === 'youtube_url'
        ? 'youtube'
        : 'html5') as PlayerType,
    playerSrc,
    sessionTitle: sessionDetail?.title || 'Spinner mode',
    sessionAiStatus: currentAiStatus,
    playerStatus: state,
    playerStatusLabel: statusLabel,
    sessionError: errorMessage,
    debug,
    videoRef,
    controllerRef,
    speedMenuRef,
    selectedTool,
    spinnerTurns,
    isKeycapPressed,
    keycapPressCount,
    isPlaying,
    playbackRate,
    isSpeedMenuOpen,
    isCaptionVisible,
    currentTime,
    duration: duration || gameData.durationSec,
    speedOptions: SPEED_OPTIONS,
    captionText,
    quizState,
    quizCorrectCount,
    quizAnsweredCount,
    totalQuizCount: gameData.quizzes.length,
    handleSelectTool: setSelectedTool,
    handleSpin: () => {
      setSelectedTool('spinner');
      setSpinnerTurns((current) => current + 1);
    },
    handleSpinnerWheel: (deltaY: number) => {
      setSelectedTool('spinner');
      setSpinnerTurns((current) => current + deltaY * -0.0024);
    },
    handlePressKeycap,
    handleTogglePlay,
    handleToggleSpeedMenu: () => setIsSpeedMenuOpen((current) => !current),
    handleSelectSpeed,
    handleToggleCaption: () => setIsCaptionVisible((current) => !current),
    handleTimeUpdate: (time: number, nextDuration: number) => {
      setCurrentTime(time);
      if (nextDuration > 0) {
        setDuration(nextDuration);
      }
    },
    handleSeek,
    handleLoadedMetadata: (nextDuration: number) => {
      setDuration(nextDuration);
    },
    handlePlayerReady: () => setIsPlayerReady(true),
    handlePlay: () => setIsPlaying(true),
    handlePause: () => setIsPlaying(false),
    handleEnded: () => setIsPlaying(false),
    submitQuizAnswer: submitCurrentQuizAnswer,
    continueFromQuiz,
  };
}
