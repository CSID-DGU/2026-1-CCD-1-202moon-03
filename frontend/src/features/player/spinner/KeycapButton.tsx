import { useEffect, useMemo, useRef } from 'react';
import keycapIcon from '../../../assets/icons/keycap2.svg';
import type { KeycapButtonVariant, KeycapGlowTheme, KeycapVisualState } from './types';

interface KeycapButtonProps {
  disabled?: boolean;
  glowTheme?: KeycapGlowTheme;
  label?: string;
  onPress: () => void;
  onPressEnd?: () => void;
  onPressStart?: () => void;
  pressTick: number;
  variant?: KeycapButtonVariant;
  visualState: KeycapVisualState;
}

const SPINNER_VARIANT_DIMENSIONS = {
  bodyHeight: '126px',
  bodyWidth: '184px',
  frameHeight: '170px',
  frameWidth: '220px',
};

const GLOW_THEME_STYLES: Record<
  KeycapGlowTheme,
  {
    outer: string;
    inner: string;
    tint: string;
  }
> = {
  red: {
    outer: 'rgba(255, 72, 72, 0.42)',
    inner: 'rgba(255, 120, 120, 0.82)',
    tint: 'rgba(255, 104, 104, 0.14)',
  },
  orange: {
    outer: 'rgba(255, 150, 28, 0.42)',
    inner: 'rgba(255, 188, 80, 0.84)',
    tint: 'rgba(255, 170, 74, 0.14)',
  },
  yellow: {
    outer: 'rgba(255, 210, 40, 0.42)',
    inner: 'rgba(255, 229, 110, 0.86)',
    tint: 'rgba(255, 223, 84, 0.14)',
  },
  green: {
    outer: 'rgba(81, 225, 106, 0.4)',
    inner: 'rgba(126, 255, 146, 0.84)',
    tint: 'rgba(94, 241, 117, 0.13)',
  },
  blue: {
    outer: 'rgba(46, 146, 255, 0.42)',
    inner: 'rgba(108, 182, 255, 0.84)',
    tint: 'rgba(93, 170, 255, 0.14)',
  },
  purple: {
    outer: 'rgba(153, 84, 255, 0.42)',
    inner: 'rgba(190, 132, 255, 0.84)',
    tint: 'rgba(170, 116, 255, 0.14)',
  },
};

export default function KeycapButton({
  disabled = false,
  glowTheme = 'red',
  label = '키캡',
  onPress,
  onPressEnd,
  onPressStart,
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
  const glowThemeStyles = useMemo(() => GLOW_THEME_STYLES[glowTheme], [glowTheme]);

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
        { opacity: 0.28, transform: 'translateY(-2px) scale(1.01)' },
        { opacity: 0.06, transform: 'translateY(8px) scale(0.97)' },
      ],
      {
        duration: 210,
        easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
    );

    bodyRef.current?.animate(
      [
        { transform: 'translateY(0px) scale(1)' },
        { transform: 'translateY(14px) scale(0.956)' },
        { transform: 'translateY(11px) scale(0.966)' },
      ],
      {
        duration: 210,
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
      onMouseDown={onPressStart}
      onMouseUp={onPressEnd}
      onMouseLeave={isPressed ? onPressEnd : undefined}
      onTouchStart={onPressStart}
      onTouchEnd={onPressEnd}
      className="group relative flex h-[170px] w-[220px] items-center justify-center bg-transparent outline-none transition-transform duration-200 ease-out hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transform-none motion-reduce:transition-none"
    >
      <div
        className="relative"
        style={{
          height: dimensions.frameHeight,
          width: dimensions.frameWidth,
        }}
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-[52px] transition-all duration-[220ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
          style={{
            background: glowThemeStyles.outer,
            filter: 'blur(34px)',
            height: isPressed ? '148px' : isReleasing ? '132px' : '104px',
            opacity: isPressed ? 1 : isReleasing ? 0.62 : 0.16,
            width: isPressed ? '168px' : isReleasing ? '148px' : '116px',
          }}
        />

        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-[44px] transition-all duration-[220ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
          style={{
            background: glowThemeStyles.inner,
            filter: 'blur(18px)',
            height: isPressed ? '108px' : isReleasing ? '94px' : '72px',
            opacity: isPressed ? 0.96 : isReleasing ? 0.54 : 0.14,
            width: isPressed ? '124px' : isReleasing ? '108px' : '82px',
          }}
        />

        <div
          ref={bodyRef}
          className={`absolute inset-0 z-[1] m-auto transition-all motion-reduce:transition-none ${
            isPressed
              ? 'translate-y-[13px] scale-[0.958] duration-[110ms] ease-out'
              : isReleasing
                ? 'translate-y-[2px] scale-[1.01] duration-[240ms] ease-[cubic-bezier(0.22,1,0.36,1)]'
                : 'translate-y-0 scale-100 duration-[240ms] ease-[cubic-bezier(0.22,1,0.36,1)]'
          }`}
          style={{ height: dimensions.bodyHeight, width: dimensions.bodyWidth }}
        >
          <div className="relative h-full w-full">
            <img
              src={keycapIcon}
              alt=""
              aria-hidden="true"
              className={`relative z-[1] h-full w-full object-contain select-none transition-all duration-[220ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${
                isPressed
                  ? 'brightness-[0.92] contrast-[1.12] saturate-[1.08]'
                  : isReleasing
                    ? 'brightness-[0.98] contrast-[1.05] saturate-[1.03]'
                    : 'brightness-100 contrast-100 saturate-100'
              }`}
            />

            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 z-[2] rounded-[24px] transition-all duration-[200ms] ease-out motion-reduce:transition-none"
              style={{
                background: glowThemeStyles.tint,
                opacity: isPressed ? 0.34 : isReleasing ? 0.16 : 0,
              }}
            />

            <div
              ref={highlightRef}
              aria-hidden="true"
              className={`pointer-events-none absolute inset-x-[26px] top-[11px] z-[4] rounded-full bg-[linear-gradient(180deg,rgba(255,255,255,0.88)_0%,rgba(255,255,255,0.22)_54%,rgba(255,255,255,0)_100%)] blur-[1px] transition-all duration-[180ms] ease-out motion-reduce:transition-none ${
                isPressed
                  ? 'h-[14px] opacity-[0.08]'
                  : isReleasing
                    ? 'h-[18px] opacity-[0.16]'
                    : 'h-[24px] opacity-[0.28]'
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
