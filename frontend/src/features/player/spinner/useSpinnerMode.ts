import { useEffect, useMemo, useRef, useState } from 'react';
import { submitQuizAnswer } from '../../../services/quiz.api';
import { getMySettings } from '../../../services/user.api';
import { getTransientStreamingSource, usePlayerStore } from '../../../store/usePlayerStore';
import type { ApiErrorResponse } from '../../../types';
import { resolvePlayerSource } from '../shared/playback';
import { useGameSessionData } from '../shared/useGameSessionData';
import { useLocalFilePlayerSrc } from '../shared/useLocalFilePlayerSrc';
import type { MediaController, PlayerType } from '../shared/playback';
import { useKeycapInteraction } from './useKeycapInteraction';
import type {
  KeycapGlowTheme,
  MascotPromptType,
  MascotVisualState,
  SpinnerAssistTool,
  SpinnerPlaybackRate,
} from './types';

const SPEED_OPTIONS: SpinnerPlaybackRate[] = [0.5, 0.75, 1, 1.25, 1.5, 2];
const KEYCAP_GLOW_THEMES: KeycapGlowTheme[] = ['red', 'orange', 'yellow', 'green', 'blue', 'purple'];
const STRETCH_TRIGGER_SECONDS = 15 * 60;
const STRETCH_COUNTDOWN_SECONDS = 60;
const FOCUS_PROMPT_DURATION_MS = 10_000;
const STRETCH_PROMPT_MESSAGE = '잠깐 스트레칭 어때요?';
const FOCUS_RETURN_MESSAGES = [
  '다시 집중해봐요 :)',
  '좋아요, 다시 시작해볼까요?',
  '조금만 더 집중해봐요!',
] as const;

function buildAnsweredQuizKey(quizId: number | null, triggerTime: number) {
  return quizId === null || quizId <= 0 ? `missing:${triggerTime}` : `quiz:${quizId}`;
}

function getQuizSubmitErrorMessage(error: unknown) {
  const apiError = error as { response?: { data?: ApiErrorResponse } };

  return (
    apiError?.response?.data?.message ||
    apiError?.response?.data?.detail ||
    '답안을 저장하지 못했어요. 다시 시도해 주세요.'
  );
}

function isDefaultSessionTitle(title?: string | null) {
  const normalizedTitle = title?.trim() ?? '';
  return !normalizedTitle || normalizedTitle === '새 학습 영상';
}

function mapFidgetToggleKeyToKeyboardKey(settingKey?: string | null) {
  switch (settingKey) {
    case 'ctrl':
      return 'enter';
    case 'shift':
      return 'shift';
    case 'alt':
    default:
      return 'g';
  }
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
    sessionPlaybackMode,
    debug,
  } = useGameSessionData();
  const storeStreamingSource = usePlayerStore((playerStore) => playerStore.streamingSource);
  const streamingSource = storeStreamingSource ?? getTransientStreamingSource();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const controllerRef = useRef<MediaController | null>(null);
  const speedMenuRef = useRef<HTMLDivElement | null>(null);
  const autoPlaySessionRef = useRef<string | null>(null);
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const {
    isPressed: isKeycapPressed,
    endPress: endKeycapPress,
    lastPressAt: keycapLastPressAt,
    pressTick: keycapPressTick,
    startPress: startKeycapPress,
    triggerPress: triggerKeycapPress,
    visualState: keycapVisualState,
  } = useKeycapInteraction();

  const [selectedTool, setSelectedTool] = useState<SpinnerAssistTool>('spinner');
  const [spinnerTurns, setSpinnerTurns] = useState(0);
  const [keycapGlowIndex, setKeycapGlowIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackRate, setPlaybackRate] = useState<SpinnerPlaybackRate>(1);
  const [isSpeedMenuOpen, setIsSpeedMenuOpen] = useState(false);
  const [isCaptionVisible, setIsCaptionVisible] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [quizState, setQuizState] = useState<{
    quizId: number | null;
    quizIndex: number;
    triggerTime: number;
    question: string;
    options: string[];
    answerIndex: number;
    segmentRange?: [number, number];
    feedback: string;
    incorrectFeedback: string;
    explanation: string;
    submitError: string;
    selectedIndex: number | null;
    isCorrect: boolean | null;
    isSubmitting: boolean;
  } | null>(null);
  const [quizCorrectCount, setQuizCorrectCount] = useState(0);
  const [quizAnsweredCount, setQuizAnsweredCount] = useState(0);
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [hasShownStretchPrompt, setHasShownStretchPrompt] = useState(false);
  const [isStretchPromptVisible, setIsStretchPromptVisible] = useState(false);
  const [isStretchGuideOpen, setIsStretchGuideOpen] = useState(false);
  const [stretchCountdownSeconds, setStretchCountdownSeconds] = useState(STRETCH_COUNTDOWN_SECONDS);
  const [focusMessage, setFocusMessage] = useState<string | null>(null);
  const [isFocusPromptVisible, setIsFocusPromptVisible] = useState(false);
  const [youtubePlayerStage, setYoutubePlayerStage] = useState<string | null>(null);
  const [youtubeVideoId, setYoutubeVideoId] = useState<string | null>(null);
  const [isLocalPlayerReady, setIsLocalPlayerReady] = useState(false);
  const [hasController, setHasController] = useState(false);
  const [lastControlAction, setLastControlAction] = useState<string | null>(null);
  const [fidgetToggleKey, setFidgetToggleKey] = useState<'alt' | 'ctrl' | 'shift'>('alt');
  const answeredQuizIdsRef = useRef<Set<string>>(new Set());
  const quizCorrectCountRef = useRef(0);
  const quizAnsweredCountRef = useRef(0);
  const tabSwitchCountRef = useRef(0);

  useEffect(() => {
    let isCancelled = false;

    const loadFidgetToggleKey = async () => {
      try {
        const response = await getMySettings();

        if (!isCancelled) {
          const nextKey = response.data.fidget_toggle_key;
          if (nextKey === 'alt' || nextKey === 'ctrl' || nextKey === 'shift') {
            setFidgetToggleKey(nextKey);
          }
        }
      } catch {
        // Fall back to the default G key mapping when settings cannot be loaded.
      }
    };

    void loadFidgetToggleKey();

    return () => {
      isCancelled = true;
    };
  }, []);
  const wasDocumentHiddenRef = useRef(false);
  const focusPromptTimeoutRef = useRef<number | null>(null);
  const stretchCountdownIntervalRef = useRef<number | null>(null);

  const clearFocusPromptTimeout = () => {
    if (focusPromptTimeoutRef.current !== null) {
      window.clearTimeout(focusPromptTimeoutRef.current);
      focusPromptTimeoutRef.current = null;
    }
  };

  const clearStretchCountdownInterval = () => {
    if (stretchCountdownIntervalRef.current !== null) {
      window.clearInterval(stretchCountdownIntervalRef.current);
      stretchCountdownIntervalRef.current = null;
    }
  };

  const dismissStretchGuide = () => {
    clearStretchCountdownInterval();
    setIsStretchGuideOpen(false);
    setIsStretchPromptVisible(false);
    setStretchCountdownSeconds(STRETCH_COUNTDOWN_SECONDS);
  };

  const dismissFocusPrompt = () => {
    clearFocusPromptTimeout();
    setIsFocusPromptVisible(false);
    setFocusMessage(null);
  };

  useEffect(() => {
    quizCorrectCountRef.current = quizCorrectCount;
  }, [quizCorrectCount]);

  useEffect(() => {
    quizAnsweredCountRef.current = quizAnsweredCount;
  }, [quizAnsweredCount]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        wasDocumentHiddenRef.current = true;
        tabSwitchCountRef.current += 1;
        setTabSwitchCount(tabSwitchCountRef.current);
        return;
      }

      if (!wasDocumentHiddenRef.current) {
        return;
      }

      wasDocumentHiddenRef.current = false;
      clearFocusPromptTimeout();
      setFocusMessage(
        FOCUS_RETURN_MESSAGES[Math.floor(Math.random() * FOCUS_RETURN_MESSAGES.length)],
      );
      setIsFocusPromptVisible(true);
      focusPromptTimeoutRef.current = window.setTimeout(() => {
        setIsFocusPromptVisible(false);
        setFocusMessage(null);
        focusPromptTimeoutRef.current = null;
      }, FOCUS_PROMPT_DURATION_MS);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearFocusPromptTimeout();
    };
  }, []);

  useEffect(() => {
    if (hasShownStretchPrompt || currentTime < STRETCH_TRIGGER_SECONDS) {
      return;
    }

    setHasShownStretchPrompt(true);
    setIsStretchPromptVisible(true);
  }, [currentTime, hasShownStretchPrompt]);

  useEffect(() => {
    if (!isStretchGuideOpen) {
      clearStretchCountdownInterval();
      return;
    }

    setStretchCountdownSeconds(STRETCH_COUNTDOWN_SECONDS);
    stretchCountdownIntervalRef.current = window.setInterval(() => {
      setStretchCountdownSeconds((current) => {
        if (current <= 1) {
          clearStretchCountdownInterval();
          setIsStretchGuideOpen(false);
          setIsStretchPromptVisible(false);
          return STRETCH_COUNTDOWN_SECONDS;
        }

        return current - 1;
      });
  }, 1000);

    return () => {
      clearStretchCountdownInterval();
    };
  }, [isStretchGuideOpen]);

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
    const triggerKey = mapFidgetToggleKeyToKeyboardKey(fidgetToggleKey);

    const handleWindowKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const isTypingTarget =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target?.isContentEditable;

      if (isTypingTarget || event.repeat) {
        return;
      }

      if (event.key.toLowerCase() !== triggerKey) {
        return;
      }

      event.preventDefault();
      handleKeycapPressStart();
    };

    const handleWindowKeyUp = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() !== triggerKey) {
        return;
      }

      endKeycapPress();
    };

    window.addEventListener('keydown', handleWindowKeyDown);
    window.addEventListener('keyup', handleWindowKeyUp);

    return () => {
      window.removeEventListener('keydown', handleWindowKeyDown);
      window.removeEventListener('keyup', handleWindowKeyUp);
    };
  }, [endKeycapPress, fidgetToggleKey]);

  const captionText = useMemo(
    () =>
      gameData.segments.find((segment) => currentTime >= segment.start && currentTime < segment.end)
        ?.originalText ?? '',
    [currentTime, gameData.segments],
  );

  const localFileUrl = useLocalFilePlayerSrc(sessionId, streamingSource);

  const resolvedPlayerSource = useMemo(() => {
    if (localFileUrl) {
      return {
        playerType: 'html5' as const,
        playerSrc: localFileUrl,
      };
    }

    return resolvePlayerSource({
      sourceType: sessionDetail?.source_type ?? streamingSource?.type,
      sourceUrl: sessionDetail?.source_url ?? streamingSource?.url,
      fallbackSrc: sessionDetail?.video_url ?? '',
    });
  }, [
    localFileUrl,
    sessionDetail?.source_type,
    sessionDetail?.source_url,
    sessionDetail?.video_url,
    streamingSource?.type,
    streamingSource?.url,
  ]);
  const { playerType, playerSrc } = resolvedPlayerSource;

  const sessionTitle = useMemo(() => {
    if (streamingSource?.type === 'file' && isDefaultSessionTitle(sessionDetail?.title)) {
      return (
        streamingSource.file?.name?.trim() ||
        streamingSource.fileName?.trim() ||
        sessionDetail?.title ||
        'Spinner mode'
      );
    }

    return sessionDetail?.title || 'Spinner mode';
  }, [sessionDetail?.title, streamingSource]);

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
      quizIndex: nextQuiz.quizIndex,
      triggerTime: nextQuiz.triggerTime,
      question: nextQuiz.question,
      options: nextQuiz.options,
      answerIndex: nextQuiz.answerIndex,
      segmentRange: nextQuiz.segmentRange,
      feedback: nextQuiz.correctFeedback,
      incorrectFeedback: nextQuiz.incorrectFeedback,
      explanation: nextQuiz.explanation ?? '',
      submitError: '',
      selectedIndex: null,
      isCorrect: null,
      isSubmitting: false,
    });
  }, [currentTime, gameData.quizzes, quizState, state]);

  useEffect(() => {
    if (!quizState || quizState.quizId !== null) {
      return;
    }

    const persistedQuiz =
      gameData.quizzes.find((quiz) => quiz.quizIndex === quizState.quizIndex && quiz.quizId !== null) ??
      gameData.quizzes.find(
        (quiz) =>
          quiz.quizId !== null &&
          quiz.triggerTime === quizState.triggerTime &&
          quiz.question === quizState.question,
      );

    if (!persistedQuiz) {
      return;
    }

    setQuizState((current) =>
      current
        ? {
            ...current,
            quizId: persistedQuiz.quizId,
            submitError: '',
          }
        : current,
    );
  }, [gameData.quizzes, quizState]);

  const handlePressKeycap = () => {
    setSelectedTool('keycap');
    setKeycapGlowIndex((current) => (current + 1) % KEYCAP_GLOW_THEMES.length);
    triggerKeycapPress();
  };

  const handleKeycapPressStart = () => {
    setSelectedTool('keycap');
    setKeycapGlowIndex((current) => (current + 1) % KEYCAP_GLOW_THEMES.length);
    startKeycapPress();
  };

  const handleKeycapPressEnd = () => {
    endKeycapPress();
  };

  const handleMascotClick = () => {
    if (!isStretchPromptVisible) {
      return;
    }

    controllerRef.current?.pause();
    setIsStretchPromptVisible(false);
    setIsStretchGuideOpen(true);
  };

  const mascotVisualState: MascotVisualState = isStretchGuideOpen
    ? 'pressed'
    : isFocusPromptVisible
      ? 'pressed'
      : isStretchPromptVisible
        ? 'hover'
        : 'default';

  const mascotPromptType: MascotPromptType = isStretchGuideOpen
    ? 'stretch'
    : isStretchPromptVisible
    ? 'stretch'
    : isFocusPromptVisible
      ? 'focus-return'
      : 'none';

  const mascotMessage = isStretchPromptVisible
    ? STRETCH_PROMPT_MESSAGE
    : isFocusPromptVisible
      ? focusMessage
      : null;

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
    const controller = controllerRef.current;
    controller?.seek(nextTime);
    setCurrentTime(nextTime);

    const nextDuration = controller?.getDuration() ?? 0;
    if (nextDuration > 0) {
      setDuration(nextDuration);
    }
  };

  const submitCurrentQuizAnswer = async (selectedIndex: number) => {
    if (!sessionId || !quizState || quizState.selectedIndex !== null) {
      return;
    }

    if (quizState.quizId === null || quizState.quizId <= 0) {
      setQuizState((current) =>
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
      const feedback = isCorrect ? quizState.feedback : quizState.incorrectFeedback;
      const explanation = response.data.explanation || quizState.explanation;

      if (isCorrect) {
        quizCorrectCountRef.current += 1;
        setQuizCorrectCount((current) => current + 1);
      }

      setQuizState((current) =>
        current
            ? {
              ...current,
              selectedIndex,
              isCorrect,
              feedback,
              explanation,
              submitError: '',
              isSubmitting: false,
            }
          : current,
      );
    } catch (error: unknown) {
      console.error('[quiz submit][spinner] error', {
        sessionId,
        quizId: quizState.quizId,
        selectedIndex,
        error,
      });

      setQuizState((current) =>
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
    if (!quizState) {
      return;
    }

    answeredQuizIdsRef.current.add(buildAnsweredQuizKey(quizState.quizId, quizState.triggerTime));
    quizAnsweredCountRef.current += 1;
    setQuizAnsweredCount((current) => current + 1);
    setQuizState(null);
    await controllerRef.current?.play();
  };

  const enhancedDebug = useMemo(
    () => ({
      ...debug,
      keycapGlowTheme: KEYCAP_GLOW_THEMES[keycapGlowIndex],
      keycapLastPressAt,
      keycapPressTick,
      keycapVisualState,
      mascotVisualState,
      mascotPromptType,
      isStretchGuideOpen,
      stretchCountdownSeconds,
      focusMessage,
      hasShownStretchPrompt,
      youtubePlayerStage,
      youtubeVideoId,
      isLocalPlayerReady,
      hasController,
      lastControlAction,
      tabSwitchCount,
    }),
    [
      debug,
      focusMessage,
      hasController,
      hasShownStretchPrompt,
      isLocalPlayerReady,
      isStretchGuideOpen,
      keycapGlowIndex,
      keycapLastPressAt,
      keycapPressTick,
      keycapVisualState,
      lastControlAction,
      mascotPromptType,
      mascotVisualState,
      stretchCountdownSeconds,
      tabSwitchCount,
      youtubePlayerStage,
      youtubeVideoId,
    ],
  );

  return {
    sessionId,
    playerType: playerType as PlayerType,
    playerSrc,
    sessionTitle,
    sessionAiStatus: currentAiStatus,
    playerStatus: state,
    playerStatusLabel: statusLabel,
    sessionError: errorMessage,
    debug: enhancedDebug,
    videoRef,
    controllerRef,
    speedMenuRef,
    selectedTool,
    spinnerTurns,
    isKeycapPressed,
    keycapGlowTheme: KEYCAP_GLOW_THEMES[keycapGlowIndex],
    keycapPressTick,
    keycapVisualState,
    isPlayerReady,
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
    tabSwitchCount,
    totalQuizCount: gameData.quizzes.length,
    getLatestQuizStats: () => ({
      quizCorrectCount: quizCorrectCountRef.current,
      quizAnsweredCount: quizAnsweredCountRef.current,
    }),
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
    handleKeycapPressStart,
    handleKeycapPressEnd,
    mascotVisualState,
    mascotPromptType,
    mascotMessage,
    isStretchGuideOpen,
    stretchCountdownSeconds,
    handleMascotClick,
    handleDismissStretchGuide: dismissStretchGuide,
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
    handleYoutubeDebug: ({
      action,
      hasController: nextHasController,
      isLocalPlayerReady: nextIsLocalPlayerReady,
      stage,
      videoId,
    }: {
      stage: string;
      playerSrc: string;
      videoId: string;
      playerType: PlayerType;
      action?: string;
      canControlPlayback?: boolean;
      isLocalPlayerReady?: boolean;
      hasController?: boolean;
      reason?: string;
      errorCode?: number;
    }) => {
      setYoutubePlayerStage(stage);
      setYoutubeVideoId(videoId || null);
      if (typeof nextIsLocalPlayerReady === 'boolean') {
        setIsLocalPlayerReady(nextIsLocalPlayerReady);
      }
      if (typeof nextHasController === 'boolean') {
        setHasController(nextHasController);
      }
      if (action) {
        setLastControlAction(action);
      }
    },
    handlePlay: () => setIsPlaying(true),
    handlePause: () => setIsPlaying(false),
    handleEnded: () => setIsPlaying(false),
    submitQuizAnswer: submitCurrentQuizAnswer,
    continueFromQuiz,
  };
}
