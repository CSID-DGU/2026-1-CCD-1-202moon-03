import { useEffect, useMemo, useRef, useState } from 'react';
import { submitQuizAnswer } from '../../../services/quiz.api';
import { getTransientStreamingSource, usePlayerStore } from '../../../store/usePlayerStore';
import { resolveMediaUrl } from '../shared/playback';
import { useGameSessionData } from '../shared/useGameSessionData';
import type { MediaController, PlayerType } from '../shared/playback';
import type { SpinnerAssistTool, SpinnerPlaybackRate } from './types';

const SPEED_OPTIONS: SpinnerPlaybackRate[] = [0.5, 0.75, 1, 1.25, 1.5, 2];

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
    quizId: number;
    question: string;
    options: string[];
    answerIndex: number;
    feedback: string;
    incorrectFeedback: string;
    selectedIndex: number | null;
    isCorrect: boolean | null;
    isSubmitting: boolean;
  } | null>(null);
  const [quizCorrectCount, setQuizCorrectCount] = useState(0);
  const [quizAnsweredCount, setQuizAnsweredCount] = useState(0);
  const answeredQuizIdsRef = useRef<Set<number>>(new Set());

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
        ?.originalText ??
      gameData.segments[gameData.segments.length - 1]?.originalText ??
      '',
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

  useEffect(() => {
    if (quizState || state === 'failed') {
      return;
    }

    const nextQuiz = gameData.quizzes.find(
      (quiz) => !answeredQuizIdsRef.current.has(quiz.quizId) && currentTime >= quiz.triggerTime,
    );

    if (!nextQuiz) {
      return;
    }

    controllerRef.current?.pause();
    setQuizState({
      quizId: nextQuiz.quizId,
      question: nextQuiz.question,
      options: nextQuiz.options,
      answerIndex: nextQuiz.answerIndex,
      feedback: nextQuiz.correctFeedback,
      incorrectFeedback: nextQuiz.incorrectFeedback,
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

    await controller.play();
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

    setQuizState((current) => (current ? { ...current, isSubmitting: true } : current));

    try {
      const response = await submitQuizAnswer(sessionId, quizState.quizId, {
        selected_index: selectedIndex,
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
              isSubmitting: false,
            }
          : current,
      );
    } catch {
      const isCorrect = selectedIndex === quizState.answerIndex;
      if (isCorrect) {
        setQuizCorrectCount((current) => current + 1);
      }
      setQuizState((current) =>
        current
          ? {
              ...current,
              selectedIndex,
              isCorrect,
              feedback: isCorrect ? current.feedback : current.incorrectFeedback,
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

    answeredQuizIdsRef.current.add(quizState.quizId);
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
    playerSrc:
      sessionDetail?.source_url
        ? resolveMediaUrl(sessionDetail.source_url)
        : streamingSource?.url || localFileUrl,
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
    handlePlay: () => setIsPlaying(true),
    handlePause: () => setIsPlaying(false),
    handleEnded: () => setIsPlaying(false),
    submitQuizAnswer: submitCurrentQuizAnswer,
    continueFromQuiz,
  };
}
