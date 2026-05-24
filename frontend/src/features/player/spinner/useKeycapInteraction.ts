import { useCallback, useEffect, useRef, useState } from 'react';
import type { KeycapVisualState } from './types';

interface UseKeycapInteractionOptions {
  pressDurationMs?: number;
  releaseDurationMs?: number;
}

interface UseKeycapInteractionResult {
  isPressed: boolean;
  isReleasing: boolean;
  lastPressAt: number | null;
  pressTick: number;
  triggerPress: () => void;
  visualState: KeycapVisualState;
}

const DEFAULT_PRESS_DURATION_MS = 110;
const DEFAULT_RELEASE_DURATION_MS = 220;

export function useKeycapInteraction({
  pressDurationMs = DEFAULT_PRESS_DURATION_MS,
  releaseDurationMs = DEFAULT_RELEASE_DURATION_MS,
}: UseKeycapInteractionOptions = {}): UseKeycapInteractionResult {
  const [visualState, setVisualState] = useState<KeycapVisualState>('idle');
  const [pressTick, setPressTick] = useState(0);
  const [lastPressAt, setLastPressAt] = useState<number | null>(null);
  const pressedTimeoutRef = useRef<number | null>(null);
  const releaseTimeoutRef = useRef<number | null>(null);

  const clearTimers = useCallback(() => {
    if (pressedTimeoutRef.current !== null) {
      window.clearTimeout(pressedTimeoutRef.current);
      pressedTimeoutRef.current = null;
    }

    if (releaseTimeoutRef.current !== null) {
      window.clearTimeout(releaseTimeoutRef.current);
      releaseTimeoutRef.current = null;
    }
  }, []);

  const triggerPress = useCallback(() => {
    clearTimers();

    const now = Date.now();
    setLastPressAt(now);
    setPressTick((current) => current + 1);
    setVisualState('pressed');

    pressedTimeoutRef.current = window.setTimeout(() => {
      setVisualState('releasing');
      pressedTimeoutRef.current = null;

      releaseTimeoutRef.current = window.setTimeout(() => {
        setVisualState('idle');
        releaseTimeoutRef.current = null;
      }, releaseDurationMs);
    }, pressDurationMs);
  }, [clearTimers, pressDurationMs, releaseDurationMs]);

  useEffect(() => clearTimers, [clearTimers]);

  return {
    visualState,
    pressTick,
    lastPressAt,
    isPressed: visualState === 'pressed',
    isReleasing: visualState === 'releasing',
    triggerPress,
  };
}
