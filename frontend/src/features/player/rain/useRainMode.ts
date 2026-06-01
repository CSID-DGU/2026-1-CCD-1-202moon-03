import { useEffect, useMemo, useRef, useState } from 'react';
import { submitQuizAnswer } from '../../../services/quiz.api';
import { getTransientStreamingSource, usePlayerStore } from '../../../store/usePlayerStore';
import { useRainStore } from '../../../store/useRainStore';
import type { ApiErrorResponse, GameBlankItem } from '../../../types';
import { useGameSessionData } from '../shared/useGameSessionData';
import { useLocalFilePlayerSrc } from '../shared/useLocalFilePlayerSrc';
import type { MediaController, PlayerType } from '../shared/playback';
import { resolvePlayerSource } from '../shared/playback';
import type {
  PlaybackRate,
  RainCaptionDisplay,
  RainCaptionInputItem,
  RainKeyword,
  RainQuizState,
} from './types';
import type { RainSettings } from './RainSettingsModal';
import {
  RAIN_DIFFICULTY_PRESETS,
  type RainDifficultyPresetKey,
} from './rainDifficultyPresets';

const TARGET_TIME_SEGMENT_TOLERANCE_SECONDS = 3;
const DEFAULT_MISS_GRACE_SECONDS = 1.2;
const MISS_END_BUFFER_SECONDS = 0.2;
const MISSED_DISPLAY_BUFFER = 0.75;
const SHORT_SEGMENT_THRESHOLD_SECONDS = 4;
const MIN_BLANK_SEGMENT_DURATION_SECONDS = 2.0;
const SHORT_SEGMENT_EXTRA_FALL_DURATION = 0.5;
const SHORT_SEGMENT_EXTRA_LEAD_TIME = 0.4;
const SEGMENT_TRANSITION_INPUT_HOLD_MS = 250;
const QUIZ_PAUSE_LEAD_SECONDS = 0.12;
const RAIN_SPEED_OPTIONS: PlaybackRate[] = [0.5, 0.75, 1, 1.25, 1.5, 2];
const ADAPTIVE_WINDOW_SIZE = 10;
const ADAPTIVE_SAMPLING_STEPS = [5, 4, 3, 2, 1] as const;
const ADAPTIVE_FALL_SPEED_MIN = 0.7;
const ADAPTIVE_FALL_SPEED_MAX = 1.3;
const ADAPTIVE_LEAD_OFFSET_MIN = -0.4;
const ADAPTIVE_LEAD_OFFSET_MAX = 0.8;
const ADAPTIVE_MISS_GRACE_MIN = 0.8;
const ADAPTIVE_MISS_GRACE_MAX = 1.5;

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
  missingSegmentCount: number;
  missingBlankMatchCount: number;
  missingBlankMatchDetails: Array<{
    segmentId: number;
    eventKeyword: string;
    normalizedEventKeyword: string;
    segmentBlankKeywords: string[];
  }>;
  droppedByBlankLimit: number;
  duplicateKeywordCandidates: number;
  invalidTargetTimeCount: number;
};

type AdaptiveDecision = 'promote' | 'hold' | 'relax';

type AdaptiveDifficultyState = {
  samplingStep: (typeof ADAPTIVE_SAMPLING_STEPS)[number];
  activeBlanks: 1 | 2;
  fallSpeedMultiplier: number;
  fallLeadTimeOffset: number;
  missGraceSeconds: number;
};

type PerformanceWindowEntry = {
  result: 'correct' | 'wrong' | 'miss';
  eventId: string;
  timestamp: number;
  comboAfter: number;
};

type WindowMetrics = {
  accuracy: number | null;
  missRate: number | null;
  maxCombo: number;
};

function clampNumber(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function roundToTenth(value: number) {
  return Math.round(value * 10) / 10;
}

function createAdaptiveDifficultyState(
  difficulty: RainDifficultyPresetKey,
): AdaptiveDifficultyState {
  const preset = RAIN_DIFFICULTY_PRESETS[difficulty].auto;
  return {
    samplingStep: preset.samplingStep,
    activeBlanks: preset.activeBlanks,
    fallSpeedMultiplier: preset.fallSpeedMultiplier,
    fallLeadTimeOffset: preset.fallLeadTimeOffset,
    missGraceSeconds: preset.missGraceSeconds,
  };
}

function getAdaptiveDecision(windowEntries: PerformanceWindowEntry[]): AdaptiveDecision {
  if (windowEntries.length < ADAPTIVE_WINDOW_SIZE) {
    return 'hold';
  }

  const correctCount = windowEntries.filter((entry) => entry.result === 'correct').length;
  const missCount = windowEntries.filter((entry) => entry.result === 'miss').length;
  const accuracy = (correctCount / windowEntries.length) * 100;
  const missRate = (missCount / windowEntries.length) * 100;
  const maxComboAfter = Math.max(...windowEntries.map((entry) => entry.comboAfter), 0);

  if (accuracy > 85 && missRate < 10) {
    return maxComboAfter < 2 ? 'hold' : 'promote';
  }

  if (accuracy < 65 || missRate > 35) {
    return 'relax';
  }

  return 'hold';
}

function adjustAdaptiveDifficulty(
  current: AdaptiveDifficultyState,
  decision: Exclude<AdaptiveDecision, 'hold'>,
): AdaptiveDifficultyState {
  if (decision === 'promote') {
    const samplingIndex = ADAPTIVE_SAMPLING_STEPS.indexOf(current.samplingStep);
    if (samplingIndex < ADAPTIVE_SAMPLING_STEPS.length - 1) {
      return { ...current, samplingStep: ADAPTIVE_SAMPLING_STEPS[samplingIndex + 1] };
    }

    if (current.fallSpeedMultiplier < ADAPTIVE_FALL_SPEED_MAX) {
      return {
        ...current,
        fallSpeedMultiplier: roundToTenth(
          clampNumber(current.fallSpeedMultiplier + 0.1, ADAPTIVE_FALL_SPEED_MIN, ADAPTIVE_FALL_SPEED_MAX),
        ),
      };
    }

    if (current.missGraceSeconds > ADAPTIVE_MISS_GRACE_MIN) {
      return {
        ...current,
        missGraceSeconds: roundToTenth(
          clampNumber(current.missGraceSeconds - 0.1, ADAPTIVE_MISS_GRACE_MIN, ADAPTIVE_MISS_GRACE_MAX),
        ),
      };
    }

    if (current.fallLeadTimeOffset > ADAPTIVE_LEAD_OFFSET_MIN) {
      return {
        ...current,
        fallLeadTimeOffset: roundToTenth(
          clampNumber(current.fallLeadTimeOffset - 0.2, ADAPTIVE_LEAD_OFFSET_MIN, ADAPTIVE_LEAD_OFFSET_MAX),
        ),
      };
    }

    if (current.activeBlanks < 2) {
      return { ...current, activeBlanks: 2 };
    }

    return current;
  }

  if (current.activeBlanks > 1) {
    return { ...current, activeBlanks: 1 };
  }

  if (current.fallLeadTimeOffset < ADAPTIVE_LEAD_OFFSET_MAX) {
    return {
      ...current,
      fallLeadTimeOffset: roundToTenth(
        clampNumber(current.fallLeadTimeOffset + 0.2, ADAPTIVE_LEAD_OFFSET_MIN, ADAPTIVE_LEAD_OFFSET_MAX),
      ),
    };
  }

  if (current.missGraceSeconds < ADAPTIVE_MISS_GRACE_MAX) {
    return {
      ...current,
      missGraceSeconds: roundToTenth(
        clampNumber(current.missGraceSeconds + 0.2, ADAPTIVE_MISS_GRACE_MIN, ADAPTIVE_MISS_GRACE_MAX),
      ),
    };
  }

  if (current.fallSpeedMultiplier > ADAPTIVE_FALL_SPEED_MIN) {
    return {
      ...current,
      fallSpeedMultiplier: roundToTenth(
        clampNumber(current.fallSpeedMultiplier - 0.1, ADAPTIVE_FALL_SPEED_MIN, ADAPTIVE_FALL_SPEED_MAX),
      ),
    };
  }

  const samplingIndex = ADAPTIVE_SAMPLING_STEPS.indexOf(current.samplingStep);
  if (samplingIndex > 0) {
    return { ...current, samplingStep: ADAPTIVE_SAMPLING_STEPS[samplingIndex - 1] };
  }

  return current;
}

function clampProgress(value: number) {
  return Math.max(0, Math.min(value, 1));
}

function normalizeAnswer(value: string) {
  return value
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, '')
    .trim();
}

function buildBlankKey(segmentId: number, blank: GameBlankItem) {
  return `${segmentId}:${blank.position}:${normalizeAnswer(blank.keyword)}`;
}

const FIXED_LANE_POSITIONS: number[] = [18, 39, 60];
const MANUAL_HARD_SPEED_BOOST = 1.08;

function resolveKeywordProgress(
  currentTime: number,
  event: PreparedRainEvent,
  useAcceleratedCurve = false,
) {
  if (currentTime <= event.fallStartTime) {
    return 0;
  }

  if (currentTime >= event.missDeadline) {
    return 1;
  }

  const totalDuration = Math.max(event.missDeadline - event.fallStartTime, 0.001);
  const ratio = (currentTime - event.fallStartTime) / totalDuration;

  if (!useAcceleratedCurve) {
    return clampProgress(ratio);
  }

  // Keep the early drop readable, then add a softer mid boost
  // and a controlled late acceleration for manual hard.
  if (ratio <= 0.4) {
    return clampProgress(ratio * 0.96);
  }

  if (ratio <= 0.75) {
    const localRatio = (ratio - 0.4) / 0.35;
    const startProgress = 0.384;
    const endProgress = 0.73;
    const easedLocalRatio = localRatio * 0.88 + localRatio * localRatio * 0.12;
    return clampProgress(startProgress + (endProgress - startProgress) * easedLocalRatio);
  }

  const localRatio = (ratio - 0.75) / 0.25;
  const startProgress = 0.73;
  const endProgress = 1;
  const easedLocalRatio = localRatio * 0.55 + localRatio * localRatio * 0.45;
  return clampProgress(startProgress + (endProgress - startProgress) * easedLocalRatio);
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
      renderKey: `input-slot:${index}`,
      blank,
      value: typedValuesByBlankKey[blankKey] ?? '',
      placeholder: `${normalizeAnswer(blank.keyword).length}글자`,
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
    sessionPlaybackMode,
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
  const prioritizedSegmentIdRef = useRef<number | null>(null);
  const segmentTransitionHoldRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const previousCaptionSegmentIdRef = useRef<number | null>(null);
  const previousVisibleBlankKeySignatureRef = useRef('');
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
  const [editingBlankKey, setEditingBlankKey] = useState<string | null>(null);
  const [isCaptionComposing, setIsCaptionComposing] = useState(false);
  const [prunedTypedValueCount, setPrunedTypedValueCount] = useState(0);
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
  const settledProgressRef = useRef<Map<string, number>>(new Map());
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const [currentQuizState, setCurrentQuizState] = useState<RainQuizState | null>(null);
  const [quizCorrectCount, setQuizCorrectCount] = useState(0);
  const [quizAnsweredCount, setQuizAnsweredCount] = useState(0);
  const [missCount, setMissCount] = useState(0);
  const [lastJudgement, setLastJudgement] = useState<'hit' | 'miss' | 'wrong' | null>(null);
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [youtubePlayerStage, setYoutubePlayerStage] = useState<string | null>(null);
  const [youtubeVideoId, setYoutubeVideoId] = useState<string | null>(null);
  const [isLocalPlayerReady, setIsLocalPlayerReady] = useState(false);
  const [hasController, setHasController] = useState(false);
  const [lastControlAction, setLastControlAction] = useState<string | null>(null);
  const [adaptiveDifficultyState, setAdaptiveDifficultyState] = useState<AdaptiveDifficultyState>(() =>
    createAdaptiveDifficultyState(settings?.difficulty ?? 'hard'),
  );
  const [performanceWindow, setPerformanceWindow] = useState<PerformanceWindowEntry[]>([]);
  const [adaptiveDecision, setAdaptiveDecision] = useState<AdaptiveDecision>('hold');
  const [adaptiveDecisionStreak, setAdaptiveDecisionStreak] = useState(0);
  const [windowMetrics, setWindowMetrics] = useState<WindowMetrics>({
    accuracy: null,
    missRate: null,
    maxCombo: 0,
  });
  const quizCorrectCountRef = useRef(0);
  const quizAnsweredCountRef = useRef(0);
  const tabSwitchCountRef = useRef(0);
  const adaptiveDifficultyStateRef = useRef(adaptiveDifficultyState);
  const performanceWindowRef = useRef<PerformanceWindowEntry[]>([]);
  const performanceEntryCountRef = useRef(0);
  const isManualSettings = settings?.mode === 'manual';
  const selectedDifficulty = (settings?.difficulty ?? rainDifficulty) as RainDifficultyPresetKey;
  const useManualHardAcceleration = isManualSettings && selectedDifficulty === 'hard';
  const difficultySettings = RAIN_DIFFICULTY_PRESETS[selectedDifficulty].gameplay;
  const effectiveActiveBlanks = isManualSettings
    ? settings?.blankCount ?? RAIN_DIFFICULTY_PRESETS[selectedDifficulty].manual.blankCount
    : adaptiveDifficultyState.activeBlanks;
  // 수동 속도 1~5 → 실제 배속 0.5~2.0
  const MANUAL_SPEED_MAP: Record<number, number> = { 1: 0.3, 2: 0.5, 3: 0.75, 4: 1.0, 5: 1.5 };
  const manualBaseFallSpeed = MANUAL_SPEED_MAP[settings?.fallSpeed ?? 3] ?? 1.0;
  const effectiveFallSpeed = isManualSettings
    ? useManualHardAcceleration
      ? manualBaseFallSpeed * MANUAL_HARD_SPEED_BOOST
      : manualBaseFallSpeed
    : adaptiveDifficultyState.fallSpeedMultiplier;
  const effectiveMinFallDuration = difficultySettings.minFallDuration;
  const effectiveSegmentSampleRate = isManualSettings
    ? difficultySettings.segmentSampleRate
    : adaptiveDifficultyState.samplingStep;
  const effectiveMissGraceSeconds = isManualSettings
    ? DEFAULT_MISS_GRACE_SECONDS
    : adaptiveDifficultyState.missGraceSeconds;
  const effectiveFallLeadTimeOffset = isManualSettings ? 0 : adaptiveDifficultyState.fallLeadTimeOffset;

  const recordPerformanceEntry = (
    entry: Omit<PerformanceWindowEntry, 'timestamp'> & { timestamp?: number },
  ) => {
    const nextEntry: PerformanceWindowEntry = {
      ...entry,
      timestamp: entry.timestamp ?? Date.now(),
    };
    const nextWindow = [...performanceWindowRef.current, nextEntry].slice(-ADAPTIVE_WINDOW_SIZE);

    performanceWindowRef.current = nextWindow;
    performanceEntryCountRef.current += 1;
    setPerformanceWindow(nextWindow);

    if (isManualSettings || performanceEntryCountRef.current < ADAPTIVE_WINDOW_SIZE) {
      return;
    }

    if (performanceEntryCountRef.current % ADAPTIVE_WINDOW_SIZE !== 0) {
      return;
    }

    const correctWindowCount = nextWindow.filter((windowEntry) => windowEntry.result === 'correct').length;
    const missWindowCount = nextWindow.filter((windowEntry) => windowEntry.result === 'miss').length;
    const accuracyPercent = (correctWindowCount / nextWindow.length) * 100;
    const missRatePercent = (missWindowCount / nextWindow.length) * 100;
    const maxComboAfter = Math.max(...nextWindow.map((windowEntry) => windowEntry.comboAfter), 0);
    const nextDecision = getAdaptiveDecision(nextWindow);

    setWindowMetrics({
      accuracy: Math.round(accuracyPercent * 10) / 10,
      missRate: Math.round(missRatePercent * 10) / 10,
      maxCombo: maxComboAfter,
    });
    setAdaptiveDecision(nextDecision);

    if (nextDecision === 'hold') {
      setAdaptiveDecisionStreak(0);
      return;
    }

    setAdaptiveDecisionStreak(1);

    const nextAdaptiveState = adjustAdaptiveDifficulty(
      adaptiveDifficultyStateRef.current,
      nextDecision,
    );

    adaptiveDifficultyStateRef.current = nextAdaptiveState;
    setAdaptiveDifficultyState(nextAdaptiveState);
  };

  useEffect(() => {
    adaptiveDifficultyStateRef.current = adaptiveDifficultyState;
  }, [adaptiveDifficultyState]);

  useEffect(() => {
    const nextAdaptiveState = createAdaptiveDifficultyState(selectedDifficulty);
    adaptiveDifficultyStateRef.current = nextAdaptiveState;
    performanceWindowRef.current = [];
    performanceEntryCountRef.current = 0;
    setAdaptiveDifficultyState(nextAdaptiveState);
    setPerformanceWindow([]);
    setAdaptiveDecision('hold');
    setAdaptiveDecisionStreak(0);
    setWindowMetrics({
      accuracy: null,
      missRate: null,
      maxCombo: 0,
    });
  }, [selectedDifficulty, sessionId]);

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
      return;
    }

    lastVideoTimeRef.current = currentTime;
    lastWallTimeRef.current = performance.now();

    const tick = () => {
      const elapsed = (performance.now() - lastWallTimeRef.current) / 1000;
      setRafCurrentTime(lastVideoTimeRef.current + elapsed * playbackRate);
      rafIdRef.current = requestAnimationFrame(tick);
    };

    rafIdRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
    };
  }, [isPlaying, playbackRate]);

  useEffect(() => {
    lastVideoTimeRef.current = currentTime;
    lastWallTimeRef.current = performance.now();
    if (!isPlaying) {
      setRafCurrentTime(currentTime);
    }
  }, [currentTime, isPlaying]);

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
    settledProgressRef.current = new Map();

    const savedResult = sessionResults[sessionId];
    setScore(savedResult?.score ?? 0);
    setCombo(0);
    setAccuracy(savedResult?.accuracy ?? 0);
    setMaxCombo(savedResult?.maxCombo ?? 0);
    setAttempts(0);
    setCorrectCount(0);
    setTypedValuesByBlankKey({});
    setEditingBlankKey(null);
    setIsCaptionComposing(false);
    setPrunedTypedValueCount(0);
    setCurrentTime(0);
    setDuration(0);
    setIsPlaying(false);
    setCurrentQuizState(null);
    quizCorrectCountRef.current = 0;
    quizAnsweredCountRef.current = 0;
    tabSwitchCountRef.current = savedResult?.tabSwitchCount ?? 0;
    setQuizCorrectCount(0);
    setQuizAnsweredCount(0);
    setTabSwitchCount(savedResult?.tabSwitchCount ?? 0);
    setMissCount(0);
    setLastJudgement(null);
    performanceWindowRef.current = [];
    performanceEntryCountRef.current = 0;
    setPerformanceWindow([]);
    setAdaptiveDecision('hold');
    setAdaptiveDecisionStreak(0);
    setWindowMetrics({
      accuracy: null,
      missRate: null,
      maxCombo: 0,
    });

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

  const allowedEventIds = useMemo<Set<string> | null>(() => {
    if (effectiveSegmentSampleRate <= 1) return null;
    const segmentDurationMap = new Map(
      gameData.segments.map((s) => [s.segmentId, s.end - s.start]),
    );
    return new Set(
      [...gameData.fallEvents]
        .filter((e) => (segmentDurationMap.get(e.segmentId) ?? 0) >= MIN_BLANK_SEGMENT_DURATION_SECONDS)
        .sort((a, b) => a.targetTime - b.targetTime)
        .filter((_, i) => i % effectiveSegmentSampleRate === 0)
        .map((e) => `${e.segmentId}:${e.keyword}:${e.targetTime}`),
    );
  }, [effectiveSegmentSampleRate, gameData.fallEvents, gameData.segments]);

  const allowedSegmentsFromEvents = useMemo<Set<number> | null>(() => {
    if (!allowedEventIds) return null;
    return new Set(
      gameData.fallEvents
        .filter((e) => allowedEventIds.has(`${e.segmentId}:${e.keyword}:${e.targetTime}`))
        .map((e) => e.segmentId),
    );
  }, [allowedEventIds, gameData.fallEvents]);

  // "segmentId:normalizedKeyword" 쌍 — 허용된 fall event에 대응하는 blank만 입력칸으로 만들기 위한 집합
  const allowedBlankSignatures = useMemo<Set<string> | null>(() => {
    if (!allowedEventIds) return null;
    return new Set(
      gameData.fallEvents
        .filter((e) => allowedEventIds.has(`${e.segmentId}:${e.keyword}:${e.targetTime}`))
        .map((e) => `${e.segmentId}:${normalizeAnswer(e.keyword)}`),
    );
  }, [allowedEventIds, gameData.fallEvents]);

  const segmentBlankKeys = useMemo(() => {
    const map = new Map<number, Set<string>>();

    gameData.segments.forEach((segment) => {
      if (allowedSegmentsFromEvents && !allowedSegmentsFromEvents.has(segment.segmentId)) return;
      if (segment.end - segment.start < MIN_BLANK_SEGMENT_DURATION_SECONDS) return;

      const blankPlaceholderCount = (segment.blankText.match(/_{2,}/g) ?? []).length;
      const activeBlanks = segment.blanks
        .filter(
          (blank) =>
            !allowedBlankSignatures ||
            allowedBlankSignatures.has(`${segment.segmentId}:${normalizeAnswer(blank.keyword)}`),
        )
        .slice(0, Math.min(effectiveActiveBlanks, blankPlaceholderCount));

      map.set(
        segment.segmentId,
        new Set(activeBlanks.map((blank) => buildBlankKey(segment.segmentId, blank))),
      );
    });

    return map;
  }, [allowedBlankSignatures, allowedSegmentsFromEvents, effectiveActiveBlanks, gameData.segments]);

  const preparedRainSummary = useMemo<PreparedRainSummary>(() => {
    const usedBlankKeys = new Set<string>();
    let missingSegmentCount = 0;
    let missingBlankMatchCount = 0;
    const missingBlankMatchDetails: PreparedRainSummary['missingBlankMatchDetails'] = [];
    let droppedByBlankLimit = 0;
    let duplicateKeywordCandidates = 0;
    let invalidTargetTimeCount = 0;

    const events = gameData.fallEvents.reduce<PreparedRainEvent[]>((prepared, event) => {
      const segment = gameData.segments.find((item) => item.segmentId === event.segmentId);

      if (!segment) {
        missingSegmentCount += 1;
        return prepared;
      }

      const eventId = `${event.segmentId}:${event.keyword}:${event.targetTime}`;
      if (allowedEventIds && !allowedEventIds.has(eventId)) {
        return prepared;
      }

      if (segment.end - segment.start < MIN_BLANK_SEGMENT_DURATION_SECONDS) {
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
        missingBlankMatchCount += 1;
        missingBlankMatchDetails.push({
          segmentId: event.segmentId,
          eventKeyword: event.keyword,
          normalizedEventKeyword,
          segmentBlankKeywords: segment.blanks.map((blank) => blank.keyword),
        });
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
        missingBlankMatchCount += 1;
        return prepared;
      }

      const blankKey = buildBlankKey(event.segmentId, blank);

      if (!activeBlankSet.has(blankKey)) {
        droppedByBlankLimit += 1;
        return prepared;
      }

      if (usedBlankKeys.has(blankKey)) {
        droppedByBlankLimit += 1;
        return prepared;
      }

      usedBlankKeys.add(blankKey);

      const targetTime = event.targetTime;
      const isTargetTimeOutOfSegment =
        targetTime < segment.start - TARGET_TIME_SEGMENT_TOLERANCE_SECONDS ||
        targetTime > segment.end + TARGET_TIME_SEGMENT_TOLERANCE_SECONDS;

      if (isTargetTimeOutOfSegment) {
        invalidTargetTimeCount += 1;
        return prepared;
      }

      const segmentDuration = Math.max(segment.end - segment.start, 0);
      const isShortSegment = segmentDuration < SHORT_SEGMENT_THRESHOLD_SECONDS;
      const adjustedMinFallDuration = isShortSegment
        ? effectiveMinFallDuration + SHORT_SEGMENT_EXTRA_FALL_DURATION
        : effectiveMinFallDuration;
      const extraLeadTime = isShortSegment ? SHORT_SEGMENT_EXTRA_LEAD_TIME : 0;
      const totalLeadTime = extraLeadTime + effectiveFallLeadTimeOffset;
      const baseFallDuration = Math.max(event.fallWindow / effectiveFallSpeed, 0.5 / effectiveFallSpeed);
      const fallDuration = Math.max(baseFallDuration, adjustedMinFallDuration);
      const fallStartTime = Math.max(segment.start - 2, targetTime - fallDuration - totalLeadTime);
      const missDeadline = Math.max(targetTime, segment.end - MISS_END_BUFFER_SECONDS);
      const lane = blank.position % FIXED_LANE_POSITIONS.length;

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
      missingSegmentCount,
      missingBlankMatchCount,
      missingBlankMatchDetails,
      droppedByBlankLimit,
      duplicateKeywordCandidates,
      invalidTargetTimeCount,
    };
  }, [
    allowedEventIds,
    effectiveFallLeadTimeOffset,
    effectiveFallSpeed,
    effectiveMinFallDuration,
    gameData.fallEvents,
    gameData.segments,
    segmentBlankKeys,
  ]);

  useEffect(() => {
    if (preparedRainSummary.missingBlankMatchDetails.length === 0) {
      return;
    }

    console.warn('[useRainMode] missing blank match details', preparedRainSummary.missingBlankMatchDetails);
  }, [preparedRainSummary.missingBlankMatchDetails]);

  const preparedEvents = preparedRainSummary.events;

  const activeSegment = useMemo(
    () =>
      gameData.segments.find((segment) => currentTime >= segment.start && currentTime < segment.end) ?? null,
    [currentTime, gameData.segments],
  );
  const activePlaybackSegmentId = useMemo(
    () =>
      gameData.segments.find(
        (segment) => rafCurrentTime >= segment.start && rafCurrentTime < segment.end,
      )?.segmentId ?? null,
    [gameData.segments, rafCurrentTime],
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
  const { playerType, playerSrc } = resolvedPlayerSource as {
    playerType: PlayerType;
    playerSrc: string;
  };

  const sessionTitle = useMemo(() => {
    if (streamingSource?.type === 'file' && isDefaultSessionTitle(sessionDetail?.title)) {
      return (
        streamingSource.file?.name?.trim() ||
        streamingSource.fileName?.trim() ||
        sessionDetail?.title ||
        'Rain mode'
      );
    }

    return sessionDetail?.title || 'Rain mode';
  }, [sessionDetail?.title, streamingSource]);

  useEffect(() => {
    console.log('[useRainMode] player snapshot', {
      sessionId,
      state,
      currentAiStatus,
      playerType,
      playerSrc,
      sessionSourceType: sessionDetail?.source_type ?? null,
      streamingSourceType: streamingSource?.type ?? null,
      sessionVideoUrl: sessionDetail?.video_url ?? null,
      sessionSourceUrl: sessionDetail?.source_url ?? null,
      isPlayerReady,
      youtubePlayerStage,
      youtubeVideoId,
    });
  }, [
    currentAiStatus,
    isPlayerReady,
    playerSrc,
    playerType,
    sessionDetail?.source_type,
    sessionDetail?.source_url,
    sessionDetail?.video_url,
    sessionId,
    state,
    streamingSource?.type,
    youtubePlayerStage,
    youtubeVideoId,
  ]);

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
    [correctCount, missCount, preparedEvents],
  );

  const activeKeyword = useMemo(() => {
    const prioritizedSegmentEvent =
      unresolvedEvents
        .filter(
          (event) =>
            prioritizedSegmentIdRef.current === event.segmentId &&
            rafCurrentTime <= event.missDeadline,
        )
        .sort((left, right) => left.targetTime - right.targetTime)[0] ?? null;
    const currentSegmentInFlightEvent =
      unresolvedEvents
        .filter(
          (event) =>
            activePlaybackSegmentId === event.segmentId &&
            rafCurrentTime >= event.fallStartTime &&
            rafCurrentTime <= event.missDeadline,
        )
        .sort((left, right) => left.targetTime - right.targetTime)[0] ?? null;
    const currentEvent =
      prioritizedSegmentEvent ??
      currentSegmentInFlightEvent ??
      unresolvedEvents
        .filter(
          (event) =>
            rafCurrentTime >= event.fallStartTime &&
            rafCurrentTime <= event.missDeadline,
        )
        .sort((left, right) => left.targetTime - right.targetTime)[0] ??
      unresolvedEvents
        .filter((event) => rafCurrentTime < event.fallStartTime)
        .sort((left, right) => left.targetTime - right.targetTime)[0];

    if (!currentEvent) {
      return null;
    }

    return {
      id: currentEvent.id,
      text: currentEvent.keyword.replace(/\s+/g, ''),
      hint: `${currentEvent.blank.answer_length}글자`,
      answerLength: currentEvent.keyword.replace(/\s+/g, '').length,
      lane: currentEvent.lane,
      blankKey: currentEvent.blankKey,
      leftPercent: currentEvent.leftPercent,
      topProgress: resolveKeywordProgress(
        rafCurrentTime,
        currentEvent,
        useManualHardAcceleration,
      ),
      status: 'active' as const,
      blank: currentEvent.blank,
    };
  }, [activePlaybackSegmentId, rafCurrentTime, unresolvedEvents, useManualHardAcceleration]);

  useEffect(() => {
    const overdueEvents = preparedEvents
      .filter(
        (event) =>
          !answeredKeywordIdsRef.current.has(event.id) &&
          !missedKeywordIdsRef.current.has(event.id) &&
          rafCurrentTime > event.missDeadline,
      )
      .sort((left, right) => left.targetTime - right.targetTime);

    if (overdueEvents.length === 0) {
      return;
    }

    overdueEvents.forEach((event) => {
      if (!settledProgressRef.current.has(event.id)) {
        settledProgressRef.current.set(
          event.id,
          resolveKeywordProgress(rafCurrentTime, event, useManualHardAcceleration),
        );
      }
      missedKeywordIdsRef.current.add(event.id);
      recordPerformanceEntry({
        result: 'miss',
        eventId: event.id,
        comboAfter: 0,
      });
    });

    setCombo(0);
    setAttempts((previous) => previous + overdueEvents.length);
    setMissCount((previous) => previous + overdueEvents.length);
    setLastJudgement('miss');
  }, [preparedEvents, rafCurrentTime, setCombo, useManualHardAcceleration]);

  const fallingKeywords = useMemo<RainKeyword[]>(
    () =>
      preparedEvents
        .filter((event) => {
          const isSameActiveSegment = activePlaybackSegmentId === event.segmentId;

          if (answeredKeywordIdsRef.current.has(event.id)) {
            return (
              isSameActiveSegment &&
              performance.now() - (answeredAtRef.current.get(event.id) ?? 0) < 800
            );
          }

          if (missedKeywordIdsRef.current.has(event.id)) {
            return isSameActiveSegment;
          }

          return rafCurrentTime <= event.missDeadline + MISSED_DISPLAY_BUFFER;
        })
        .map((event) => {
          const isCleared = answeredKeywordIdsRef.current.has(event.id);
          const isMissed =
            missedKeywordIdsRef.current.has(event.id) ||
            (!isCleared && rafCurrentTime > event.missDeadline);

          if (isCleared) {
            return {
              id: event.id,
              text: event.keyword.replace(/\s+/g, ''),
              hint: `${event.blank.answer_length}글자`,
              answerLength: event.keyword.replace(/\s+/g, '').length,
              lane: event.lane,
              blankKey: event.blankKey,
              leftPercent: event.leftPercent,
              topProgress:
                settledProgressRef.current.get(event.id) ??
                resolveKeywordProgress(rafCurrentTime, event, useManualHardAcceleration),
              status: 'cleared' as const,
            };
          }

          if (isMissed) {
            return {
              id: event.id,
              text: event.keyword.replace(/\s+/g, ''),
              hint: `${event.blank.answer_length}글자`,
              answerLength: event.keyword.replace(/\s+/g, '').length,
              lane: event.lane,
              blankKey: event.blankKey,
              leftPercent: event.leftPercent,
              topProgress:
                settledProgressRef.current.get(event.id) ??
                resolveKeywordProgress(rafCurrentTime, event, useManualHardAcceleration),
              status: 'missed' as const,
            };
          }

          if (rafCurrentTime < event.fallStartTime) {
            return {
              id: event.id,
              text: event.keyword.replace(/\s+/g, ''),
              hint: `${event.blank.answer_length}글자`,
              answerLength: event.keyword.replace(/\s+/g, '').length,
              lane: event.lane,
              blankKey: event.blankKey,
              leftPercent: event.leftPercent,
              topProgress: 0,
              status: activeKeyword?.id === event.id ? 'active' : 'pending',
            };
          }

          return {
            id: event.id,
            text: event.keyword.replace(/\s+/g, ''),
            hint: `${event.blank.answer_length}글자`,
            answerLength: event.keyword.replace(/\s+/g, '').length,
            lane: event.lane,
            blankKey: event.blankKey,
            leftPercent: event.leftPercent,
            topProgress: resolveKeywordProgress(rafCurrentTime, event, useManualHardAcceleration),
            status: activeKeyword?.id === event.id ? 'active' : 'pending',
          };
        }),
    [
      activeKeyword?.id,
      activePlaybackSegmentId,
      correctCount,
      missCount,
      preparedEvents,
      rafCurrentTime,
      useManualHardAcceleration,
    ],
  );

  const visibleFallingKeywords = useMemo<RainKeyword[]>(() => {
    const keywordById = new Map(fallingKeywords.map((keyword) => [keyword.id, keyword]));
    const pinnedMissedKeywords = preparedEvents
      .filter(
        (event) =>
          keywordById.has(event.id) &&
          activePlaybackSegmentId === event.segmentId &&
          keywordById.get(event.id)?.status === 'missed',
      )
      .sort((left, right) => left.targetTime - right.targetTime)
      .map((event) => keywordById.get(event.id))
      .filter((keyword): keyword is RainKeyword => Boolean(keyword));
    const pinnedMissedIds = new Set(pinnedMissedKeywords.map((keyword) => keyword.id));
    const remainingCapacity = Math.max(effectiveActiveBlanks - pinnedMissedKeywords.length, 0);
    const prioritizedKeywords = preparedEvents
      .filter((event) => keywordById.has(event.id))
      .filter((event) => !pinnedMissedIds.has(event.id))
      .map((event) => {
        const keyword = keywordById.get(event.id);
        const isInFlight =
          keyword?.status !== 'cleared' &&
          keyword?.status !== 'missed' &&
          rafCurrentTime >= event.fallStartTime &&
          rafCurrentTime <= event.missDeadline;

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
      .slice(0, remainingCapacity)
      .map(({ keyword }) => keyword)
      .filter((keyword): keyword is RainKeyword => Boolean(keyword));

    return [...pinnedMissedKeywords, ...prioritizedKeywords];
  }, [activePlaybackSegmentId, effectiveActiveBlanks, fallingKeywords, preparedEvents, rafCurrentTime]);

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

  const captionSegment = useMemo(() => {
    if (!activeSegment) return null;

    if (activeSegment.end - activeSegment.start < MIN_BLANK_SEGMENT_DURATION_SECONDS) {
      return { ...activeSegment, blankText: activeSegment.originalText, blanks: [] };
    }

    if (allowedSegmentsFromEvents && !allowedSegmentsFromEvents.has(activeSegment.segmentId)) {
      return { ...activeSegment, blankText: activeSegment.originalText, blanks: [] };
    }

    if (!allowedBlankSignatures) return activeSegment;

    // 허용된 fall event에 대응하는 blank만 입력칸으로 남기고,
    // 나머지 blank 플레이스홀더(___) 는 실제 키워드 텍스트로 교체
    const parts = activeSegment.blankText.split(/_{2,}/);
    const sortedBlanks = [...activeSegment.blanks].sort((a, b) => a.position - b.position);
    const filteredBlanks: typeof activeSegment.blanks = [];
    let newBlankText = '';

    for (let i = 0; i < parts.length - 1; i++) {
      newBlankText += parts[i] ?? '';
      const blank = sortedBlanks[i];
      if (
        blank &&
        allowedBlankSignatures.has(`${activeSegment.segmentId}:${normalizeAnswer(blank.keyword)}`)
      ) {
        newBlankText += '___';
        filteredBlanks.push(blank);
      } else {
        newBlankText += blank?.keyword ?? '';
      }
    }
    newBlankText += parts[parts.length - 1] ?? '';

    return { ...activeSegment, blankText: newBlankText, blanks: filteredBlanks };
  }, [activeSegment, allowedBlankSignatures, allowedSegmentsFromEvents]);

  const captionDisplay = useMemo(
    () =>
      buildCaptionDisplay(
        captionSegment
          ? {
              segmentId: captionSegment.segmentId,
              blankText: captionSegment.blankText,
              blanks: captionSegment.blanks.slice(0, effectiveActiveBlanks),
            }
          : null,
        typedValuesByBlankKey,
        resolvedStatesByBlankKey,
      ),
    [captionSegment, effectiveActiveBlanks, resolvedStatesByBlankKey, typedValuesByBlankKey],
  );
  const visibleCaptionBlankKeys = useMemo(
    () =>
      captionDisplay.items
        .filter((item): item is Extract<RainCaptionDisplay['items'][number], { type: 'input' }> => item.type === 'input')
        .map((item) => item.key),
    [captionDisplay.items],
  );

  useEffect(() => {
    const captionSegmentId = captionSegment?.segmentId ?? null;
    const previousCaptionSegmentId = previousCaptionSegmentIdRef.current;
    previousCaptionSegmentIdRef.current = captionSegmentId;

    const visibleBlankKeySignature = visibleCaptionBlankKeys.join('|');
    const previousVisibleBlankKeySignature = previousVisibleBlankKeySignatureRef.current;
    previousVisibleBlankKeySignatureRef.current = visibleBlankKeySignature;

    if (
      captionSegmentId === previousCaptionSegmentId &&
      previousVisibleBlankKeySignature === visibleBlankKeySignature
    ) {
      return;
    }

    if (segmentTransitionHoldRef.current) {
      clearTimeout(segmentTransitionHoldRef.current);
      segmentTransitionHoldRef.current = null;
    }

    const visibleBlankKeys = new Set(visibleCaptionBlankKeys);

    const runPrune = () => {
      setTypedValuesByBlankKey((current) => {
        const nextEntries = Object.entries(current).filter(([key]) => {
          if (visibleBlankKeys.has(key)) {
            return true;
          }

          if (editingBlankKey && key === editingBlankKey) {
            return true;
          }

          return false;
        });

        const prunedCount = Object.keys(current).length - nextEntries.length;
        if (prunedCount > 0) {
          setPrunedTypedValueCount((previous) => previous + prunedCount);
        }

        if (nextEntries.length === Object.keys(current).length) {
          return current;
        }

        return Object.fromEntries(nextEntries);
      });
    };

    if (editingBlankKey && !visibleBlankKeys.has(editingBlankKey)) {
      segmentTransitionHoldRef.current = setTimeout(() => {
        runPrune();
        segmentTransitionHoldRef.current = null;
      }, isCaptionComposing ? SEGMENT_TRANSITION_INPUT_HOLD_MS * 2 : SEGMENT_TRANSITION_INPUT_HOLD_MS);
      return;
    }

    runPrune();
  }, [captionSegment?.segmentId, editingBlankKey, isCaptionComposing, visibleCaptionBlankKeys]);

  useEffect(() => {
    return () => {
      if (segmentTransitionHoldRef.current) {
        clearTimeout(segmentTransitionHoldRef.current);
      }
    };
  }, []);

  const accuracy = attempts === 0 ? 100 : Math.round((correctCount / attempts) * 100);

  useEffect(() => {
    setAccuracy(accuracy);
  }, [accuracy, setAccuracy]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        return;
      }

      tabSwitchCountRef.current += 1;
      setTabSwitchCount(tabSwitchCountRef.current);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  useEffect(() => {
    if (!sessionId) {
      return;
    }

    saveSessionResult(sessionId, {
      score,
      maxCombo,
      accuracy,
      tabSwitchCount,
    });
  }, [accuracy, maxCombo, saveSessionResult, score, sessionId, tabSwitchCount]);

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
        rafCurrentTime >= Math.max(quiz.triggerTime - QUIZ_PAUSE_LEAD_SECONDS, 0),
    );

    if (!nextQuiz) {
      return;
    }

    const quizPauseTime = nextQuiz.triggerTime;
    controllerRef.current?.pause();
    controllerRef.current?.seek(quizPauseTime);
    setCurrentTime(quizPauseTime);
    setRafCurrentTime(quizPauseTime);
    lastVideoTimeRef.current = quizPauseTime;
    lastWallTimeRef.current = performance.now();
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
        explanation: nextQuiz.explanation,
      },
      selectedIndex: null,
      feedback: '',
      explanation: '',
      submitError: '',
      isCorrect: null,
      isSubmitting: false,
    });
  }, [currentQuizState, gameData.quizzes, rafCurrentTime, state]);

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

  const handleTypedValueCommit = (blankKey: string, value: string) => {
    setTypedValuesByBlankKey((current) => ({
      ...current,
      [blankKey]: value,
    }));
  };

  const handleTypingSubmit = (blankKey: string, value: string) => {
    const targetEvent =
      preparedEvents
        .filter((event) => event.blankKey === blankKey)
        .filter(
          (event) =>
            !answeredKeywordIdsRef.current.has(event.id) &&
            !missedKeywordIdsRef.current.has(event.id),
        )
        .sort((left, right) => left.targetTime - right.targetTime)[0] ?? null;
    const typedValue = value;
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
      prioritizedSegmentIdRef.current = targetEvent.segmentId;
      settledProgressRef.current.set(
        targetEvent.id,
        resolveKeywordProgress(rafCurrentTime, targetEvent, useManualHardAcceleration),
      );
      setTypedValuesByBlankKey((current) => ({
        ...current,
        [blankKey]: targetEvent.keyword.replace(/\s+/g, ''),
      }));

      const nextScore = score + 120;
      const nextCombo = combo + 1;

      setScore(nextScore);
      setCombo(nextCombo);
      setCorrectCount((previous) => previous + 1);
      setMaxCombo((previous) => Math.max(previous, nextCombo));
      setComboAnimationKey((previous) => previous + 1);
      setLastJudgement('hit');
      recordPerformanceEntry({
        result: 'correct',
        eventId: targetEvent.id,
        comboAfter: nextCombo,
      });
      return;
    }

    setTypedValuesByBlankKey((current) => ({ ...current, [blankKey]: '' }));
    setCombo(0);
    setLastJudgement('wrong');
    recordPerformanceEntry({
      result: 'wrong',
      eventId: targetEvent.id,
      comboAfter: 0,
    });
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
      const feedback = isCorrect
        ? currentQuizState.quiz.correct_feedback || ''
        : currentQuizState.quiz.incorrect_feedback || '';
      const explanation =
        response.data.explanation || currentQuizState.quiz.explanation || '';

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
              explanation,
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
          rafCurrentTime <= event.missDeadline,
      ).length,
    [preparedEvents, rafCurrentTime],
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
  const activePreparedEvent =
    activeKeyword?.id ? preparedEvents.find((event) => event.id === activeKeyword.id) ?? null : null;
  const settingsSummary = `${isManualSettings ? 'Manual' : 'Auto'} · ${effectiveActiveBlanks} blanks · speed ${effectiveFallSpeed}`;

  const enhancedDebug = useMemo(
    () => ({
      ...debug,
      sessionSourceType: sessionDetail?.source_type ?? null,
      playerType,
      playerSrc,
      isPlayerReady,
      youtubeVideoId,
      youtubePlayerStage,
      isLocalPlayerReady,
      hasController,
      lastControlAction,
      rainDifficulty: selectedDifficulty,
      adaptiveMode: isManualSettings ? 'manual' : 'auto',
      adaptiveDecision,
      adaptiveStreak: adaptiveDecisionStreak,
      windowSize: performanceWindow.length,
      windowAccuracy: windowMetrics.accuracy,
      windowMissRate: windowMetrics.missRate,
      adaptiveSamplingStep: adaptiveDifficultyState.samplingStep,
      activeBlanks: effectiveActiveBlanks,
      manualBaseFallSpeed,
      fallSpeed: effectiveFallSpeed,
      manualHardSpeedBoost: useManualHardAcceleration ? MANUAL_HARD_SPEED_BOOST : 1,
      manualHardAccelerationCurve: useManualHardAcceleration ? 'segmented_soft' : 'off',
      fallLeadTimeOffset: effectiveFallLeadTimeOffset,
      minFallDuration: effectiveMinFallDuration,
      missEndBufferSeconds: MISS_END_BUFFER_SECONDS,
      adaptiveMaxCombo: windowMetrics.maxCombo,
      videoTimeSeconds: rafCurrentTime,
      activeKeywordId: activeKeyword?.id ?? null,
      activeKeywordSegmentId: activePreparedEvent?.segmentId ?? null,
      prioritizedSegmentId: prioritizedSegmentIdRef.current,
      pendingKeywordCount,
      visibleKeywordCount,
      visibleKeywordStates:
        visibleFallingKeywords.length > 0
          ? visibleFallingKeywords.map((keyword) => `${keyword.id}:${keyword.status}`).join(', ')
          : null,
      nextTargetTime,
      nextFallDuration,
      missedKeywordCount: missCount,
      lastJudgement,
      rafCurrentTime,
      activeKeywordTargetTime: activePreparedEvent?.targetTime ?? null,
      preparedFallEvents: preparedEvents.length,
      missingSegmentEvents: preparedRainSummary.missingSegmentCount,
      missingBlankMatchEvents: preparedRainSummary.missingBlankMatchCount,
      missingBlankMatchDetails:
        preparedRainSummary.missingBlankMatchDetails.length > 0
          ? JSON.stringify(preparedRainSummary.missingBlankMatchDetails)
          : null,
      droppedByBlankLimit: preparedRainSummary.droppedByBlankLimit,
      duplicateKeywordCandidates: preparedRainSummary.duplicateKeywordCandidates,
      invalidTargetTimeCount: preparedRainSummary.invalidTargetTimeCount,
      editingBlankKey,
      visibleBlankKeys: visibleCaptionBlankKeys,
      draftValuesByBlankKey: typedValuesByBlankKey,
      isCaptionComposing,
      captionSegmentId: activeSegment?.segmentId ?? null,
      prunedTypedValueCount,
      tabSwitchCount,
    }),
    [
      activeKeyword?.id,
      activeSegment?.segmentId,
      adaptiveDecision,
      adaptiveDecisionStreak,
      adaptiveDifficultyState.samplingStep,
      debug,
      editingBlankKey,
      effectiveFallLeadTimeOffset,
      effectiveFallSpeed,
      effectiveActiveBlanks,
      effectiveMinFallDuration,
      isManualSettings,
      isPlayerReady,
      hasController,
      isLocalPlayerReady,
      lastJudgement,
      lastControlAction,
      missCount,
      playerSrc,
      playerType,
      manualBaseFallSpeed,
      activePreparedEvent?.segmentId,
      activePreparedEvent?.targetTime,
      nextFallDuration,
      nextTargetTime,
      pendingKeywordCount,
      performanceWindow.length,
      preparedEvents.length,
      preparedRainSummary.droppedByBlankLimit,
      preparedRainSummary.duplicateKeywordCandidates,
      preparedRainSummary.missingBlankMatchCount,
      preparedRainSummary.missingSegmentCount,
      preparedRainSummary.invalidTargetTimeCount,
      prunedTypedValueCount,
      rafCurrentTime,
      selectedDifficulty,
      sessionDetail?.source_type,
      tabSwitchCount,
      typedValuesByBlankKey,
      useManualHardAcceleration,
      youtubePlayerStage,
      youtubeVideoId,
      visibleCaptionBlankKeys,
      visibleKeywordCount,
      isCaptionComposing,
      windowMetrics.accuracy,
      windowMetrics.maxCombo,
      windowMetrics.missRate,
    ],
  );

  return {
    sessionId,
    speedMenuRef,
    videoRef,
    controllerRef,
    playerType,
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
    isPlayerReady,
    isPlaying,
    playbackRate,
    isSpeedMenuOpen,
    isCaptionVisible,
    speedOptions: RAIN_SPEED_OPTIONS,
    captionText: captionSegment?.blankText ?? '',
    captionDisplay,
    fallingKeywords: visibleFallingKeywords,
    activeKeyword,
    settingsSummary,
    typedValuesByBlankKey,
    score,
    combo,
    maxCombo,
    accuracy,
    lastJudgement,
    comboAnimationKey,
    quizState: currentQuizState,
    quizCorrectCount,
    quizAnsweredCount,
    tabSwitchCount,
    totalQuizCount: gameData.quizzes.length,
    getLatestQuizStats: () => ({
      quizCorrectCount: quizCorrectCountRef.current,
      quizAnsweredCount: quizAnsweredCountRef.current,
    }),
    handleTypedValueCommit,
    handleCaptionCompositionStateChange: (blankKey: string | null, composing: boolean) => {
      setEditingBlankKey(blankKey);
      setIsCaptionComposing(composing);
    },
    handleCaptionFocusBlankKeyChange: (blankKey: string | null) => {
      setEditingBlankKey(blankKey);
      if (blankKey === null) {
        setIsCaptionComposing(false);
      }
    },
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
      const controller = controllerRef.current;
      controller?.seek(nextTime);
      setCurrentTime(nextTime);
      setRafCurrentTime(nextTime);
      lastVideoTimeRef.current = nextTime;
      lastWallTimeRef.current = performance.now();

      const nextDuration = controller?.getDuration() ?? 0;
      if (nextDuration > 0) {
        setDuration(nextDuration);
      }
    },
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
  };
}
