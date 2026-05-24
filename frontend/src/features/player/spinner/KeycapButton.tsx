import { useEffect, useRef } from 'react';
import keycapIcon from '../../../assets/icons/keycap.svg';
import type { KeycapButtonVariant, KeycapVisualState } from './types';

interface KeycapButtonProps {
  disabled?: boolean;
  label?: string;
  onPress: () => void;
  pressTick: number;
  variant?: KeycapButtonVariant;
  visualState: KeycapVisualState;
}

const SPINNER_VARIANT_DIMENSIONS = {
  bodyHeight: '120px',
  bodyWidth: '176px',
  frameHeight: '132px',
  frameWidth: '176px',
};

export default function KeycapButton({
  disabled = false,
  label = '키캡',
  onPress,
  pressTick,
  variant = 'default',
  visualState,
}: KeycapButtonProps) {
  const highlightRef = useRef<HTMLDivElement | null>(null);
  const bodyRef = useRef<HTMLDivElement | null>(null);

  const isPressed = visualState === 'pressed';
  const isReleasing = visualState === 'releasing';
  const isResting = visualState === 'idle';
  const dimensions = SPINNER_VARIANT_DIMENSIONS;

  useEffect(() => {
    if (pressTick <= 0 || typeof window === 'undefined') {
      return;
    }

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) {
      return;
    }

    highlightRef.current?.animate(
      [
        { opacity: 0.56, transform: 'translateY(-3px) scale(1.015)' },
        { opacity: 0.12, transform: 'translateY(7px) scale(0.978)' },
      ],
      {
        duration: 200,
        easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
    );

    bodyRef.current?.animate(
      [
        { transform: 'translateY(0px) scale(1)' },
        { transform: 'translateY(11px) scale(0.965)' },
        { transform: 'translateY(8px) scale(0.974)' },
      ],
      {
        duration: 200,
        easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
    );
  }, [pressTick]);

  return (
    <button
      type="button"
      aria-pressed={isPressed}
      aria-label={label}
      disabled={disabled}
      data-state={visualState}
      onClick={onPress}
      className="group relative flex h-[144px] w-[196px] items-center justify-center bg-transparent outline-none transition-transform duration-200 ease-out hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transform-none motion-reduce:transition-none"
    >
      <div
        className="relative"
        style={{
          height: dimensions.frameHeight,
          width: dimensions.frameWidth,
        }}
      >
        <div
          ref={bodyRef}
          className={`relative z-[1] transition-all motion-reduce:transition-none ${
            isPressed
              ? 'translate-y-[9px] scale-[0.97] duration-[110ms] ease-out'
              : isReleasing
                ? 'translate-y-[2px] scale-[1.004] duration-[220ms] ease-[cubic-bezier(0.22,1,0.36,1)]'
                : 'translate-y-0 scale-100 duration-[220ms] ease-[cubic-bezier(0.22,1,0.36,1)]'
          }`}
        >
          <div className="relative" style={{ height: dimensions.bodyHeight, width: dimensions.bodyWidth }}>
            <img
              src={keycapIcon}
              alt=""
              aria-hidden="true"
              className={`relative z-[1] h-full w-full object-contain select-none transition-all duration-[220ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${
                isPressed
                  ? 'brightness-[0.88] contrast-[1.08] saturate-[1.08] hue-rotate-[2deg]'
                  : isReleasing
                    ? 'brightness-[0.97] contrast-[1.04] saturate-[1.05] hue-rotate-[1deg]'
                    : 'brightness-100 contrast-100 saturate-100'
              }`}
            />

            <div
              className={`pointer-events-none absolute inset-0 z-[2] rounded-[22px] transition-all duration-[200ms] ease-out motion-reduce:transition-none ${
                isPressed
                  ? 'bg-[#19c59c]/[0.08]'
                  : isReleasing
                    ? 'bg-[#19c59c]/[0.04]'
                    : 'bg-transparent'
              }`}
            />

            <img
              src={keycapIcon}
              alt=""
              aria-hidden="true"
              className={`pointer-events-none absolute inset-0 z-[3] h-full w-full object-contain mix-blend-screen transition-all duration-[180ms] ease-out motion-reduce:transition-none ${
                isPressed
                  ? 'opacity-[0.08]'
                  : isReleasing
                    ? 'opacity-[0.22]'
                    : 'opacity-[0.38]'
              }`}
            />

            <div
              ref={highlightRef}
              className={`pointer-events-none absolute inset-x-[22px] top-[11px] z-[4] rounded-full bg-[linear-gradient(180deg,rgba(255,255,255,0.68)_0%,rgba(255,255,255,0.2)_52%,rgba(255,255,255,0)_100%)] blur-[1px] transition-all duration-[180ms] ease-out motion-reduce:transition-none ${
                isPressed
                  ? 'h-[18px] opacity-[0.1]'
                  : isReleasing
                    ? 'h-[22px] opacity-[0.2]'
                    : 'h-[28px] opacity-[0.36]'
              }`}
            />

            <div
              className={`pointer-events-none absolute inset-x-[18px] top-[18px] z-[4] rounded-full bg-[linear-gradient(180deg,rgba(255,255,255,0.3)_0%,rgba(88,215,255,0.08)_58%,rgba(255,255,255,0)_100%)] blur-[8px] transition-all duration-[220ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${
                isPressed
                  ? 'h-[22px] opacity-[0.06]'
                  : isReleasing
                    ? 'h-[26px] opacity-[0.18]'
                    : 'h-[32px] opacity-[0.32]'
              }`}
            />

            <div
              className={`pointer-events-none absolute inset-x-[10px] top-[10px] z-[5] rounded-[18px] border-t transition-all duration-[220ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${
                isPressed
                  ? 'h-[34px] border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.05)_0%,rgba(255,255,255,0)_100%)]'
                  : isReleasing
                    ? 'h-[36px] border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.06)_0%,rgba(255,255,255,0)_100%)]'
                    : 'h-[38px] border-white/12 bg-[linear-gradient(180deg,rgba(255,255,255,0.08)_0%,rgba(255,255,255,0)_100%)]'
              }`}
            />
          </div>
        </div>
      </div>

      <span className="sr-only">
        {variant === 'spinner' ? 'Spinner mode keycap button' : label}
      </span>
      {isResting ? null : <span className="sr-only">{visualState}</span>}
    </button>
  );
}
