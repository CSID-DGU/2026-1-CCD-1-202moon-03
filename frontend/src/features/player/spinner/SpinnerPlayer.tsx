import { useEffect, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent, ReactNode, RefObject } from 'react';
import triDownIcon from '../../../assets/icons/tri-down.svg';
import triUpIcon from '../../../assets/icons/tri-up.svg';
import type { SpinnerAssistTool, SpinnerPlaybackRate } from './types';

interface SpinnerPlayerProps {
  videoSrc: string;
  videoRef: RefObject<HTMLVideoElement | null>;
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  playbackRate: SpinnerPlaybackRate;
  isSpeedMenuOpen: boolean;
  speedOptions: SpinnerPlaybackRate[];
  isCaptionVisible: boolean;
  captionText: string;
  selectedTool?: SpinnerAssistTool;
  overlayContent?: ReactNode;
  captionOverlay?: ReactNode;
  onTogglePlay: () => void;
  onToggleSpeedMenu: () => void;
  onSelectSpeed: (speed: SpinnerPlaybackRate) => void;
  onToggleCaption: () => void;
  onTimeUpdate: () => void;
  onSeek: (time: number) => void;
  onLoadedMetadata: () => void;
  onPlay: () => void;
  onPause: () => void;
  onEnded: () => void;
}

function SpinnerPlayer({
  videoSrc,
  videoRef,
  currentTime,
  duration,
  isPlaying,
  playbackRate,
  isSpeedMenuOpen,
  speedOptions,
  isCaptionVisible,
  captionText,
  overlayContent,
  captionOverlay,
  onTogglePlay,
  onToggleSpeedMenu,
  onSelectSpeed,
  onToggleCaption,
  onTimeUpdate,
  onSeek,
  onLoadedMetadata,
  onPlay,
  onPause,
  onEnded,
}: SpinnerPlayerProps) {
  const seekTrackRef = useRef<HTMLDivElement | null>(null);
  const hideControlsTimeoutRef = useRef<number | null>(null);
  const [areControlsVisible, setAreControlsVisible] = useState(true);

  const clearHideControlsTimeout = () => {
    if (hideControlsTimeoutRef.current !== null) {
      window.clearTimeout(hideControlsTimeoutRef.current);
      hideControlsTimeoutRef.current = null;
    }
  };

  const scheduleHideControls = () => {
    clearHideControlsTimeout();

    if (!isPlaying) {
      setAreControlsVisible(true);
      return;
    }

    hideControlsTimeoutRef.current = window.setTimeout(() => {
      setAreControlsVisible(false);
      hideControlsTimeoutRef.current = null;
    }, 2000);
  };

  const seekFromClientX = (clientX: number) => {
    const track = seekTrackRef.current;
    if (!track || duration <= 0) {
      return;
    }

    const rect = track.getBoundingClientRect();
    const ratio = Math.min(Math.max((clientX - rect.left) / rect.width, 0), 1);
    onSeek(duration * ratio);
  };

  const handleSeekPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    seekFromClientX(event.clientX);

    const handlePointerMove = (moveEvent: PointerEvent) => {
      seekFromClientX(moveEvent.clientX);
    };

    const handlePointerUp = (upEvent: PointerEvent) => {
      seekFromClientX(upEvent.clientX);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  const handleMouseMove = () => {
    setAreControlsVisible(true);
    scheduleHideControls();
  };

  useEffect(() => {
    if (!isPlaying) {
      clearHideControlsTimeout();
      setAreControlsVisible(true);
      return;
    }

    scheduleHideControls();

    return clearHideControlsTimeout;
  }, [isPlaying]);

  useEffect(() => clearHideControlsTimeout, []);

  return (
    <section
      className="relative h-[590px] overflow-hidden rounded-[11.455px] bg-[#DDDDDD]"
      onMouseMove={handleMouseMove}
    >
      <video
        ref={videoRef}
        className="absolute inset-0 h-full w-full object-cover"
        src={videoSrc}
        preload="metadata"
        playsInline
        onTimeUpdate={onTimeUpdate}
        onLoadedMetadata={onLoadedMetadata}
        onPlay={onPlay}
        onPause={onPause}
        onEnded={onEnded}
      />

      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0)_0%,rgba(0,0,0,0)_70%,rgba(0,0,0,0.42)_100%)]" />

      {overlayContent ? (
        <div className="pointer-events-none absolute inset-x-0 bottom-[152px] top-[24px]">
          {overlayContent}
        </div>
      ) : null}

      {isCaptionVisible && (captionOverlay || captionText) ? (
        <div className="absolute left-1/2 top-[calc(100%-184px)] -translate-x-1/2 bg-[rgba(0,0,0,0.6)] px-[15px] py-[8px]">
          {captionOverlay ?? (
            <p className="text-[22px] font-semibold leading-[1.5] text-white">{captionText}</p>
          )}
        </div>
      ) : null}

      <div
        className={`absolute bottom-0 left-0 right-0 transition-opacity duration-300 ${
          areControlsVisible ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        }`}
      >
        <div
          ref={seekTrackRef}
          className="relative h-3 w-full cursor-pointer"
          onPointerDown={handleSeekPointerDown}
          role="slider"
          aria-label="영상 탐색"
          aria-valuemin={0}
          aria-valuemax={Math.round(duration)}
          aria-valuenow={Math.round(currentTime)}
        >
          <div className="absolute left-0 right-0 top-1/2 h-1 -translate-y-1/2 bg-[rgba(0,0,0,0.2)]" />
          <div
            className="absolute left-0 top-1/2 h-1 -translate-y-1/2 bg-[#1A9AF5]"
            style={{ width: `${duration > 0 ? Math.min((currentTime / duration) * 100, 100) : 0}%` }}
          />
          <div
            className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-[#1A9AF5] shadow-[0_2px_12px_rgba(26,154,245,0.45)]"
            style={{ left: `${duration > 0 ? Math.min((currentTime / duration) * 100, 100) : 0}%` }}
          />
        </div>

        <div className="relative flex items-center justify-between px-6 pb-[18px] pt-3">
          <div className="absolute inset-0 bg-[rgba(0,0,0,0.28)] backdrop-blur-[6px]" />

          <div className="relative z-10 flex items-center gap-3">
            <button type="button" onClick={onTogglePlay} className="p-1 text-white">
              {isPlaying ? <PauseIcon /> : <PlayIcon />}
            </button>

            <div className="flex items-center gap-1 text-[16px] leading-6">
              <span className="font-semibold text-[#1A9AF5]">{formatTime(currentTime)}</span>
              <span className="font-medium text-white">/</span>
              <span className="font-medium text-white">{formatTime(duration)}</span>
            </div>
          </div>

          <div className="relative z-10 flex items-center gap-6 text-white">
            <div className="relative flex items-center">
              <button type="button" onClick={onToggleSpeedMenu} className="flex items-center gap-2 p-1">
                <TriangleDownIcon />
                <span className="min-w-[28px] text-center text-[16px] font-medium leading-6">
                  {playbackRate}x
                </span>
                <TriangleUpIcon />
              </button>

              {isSpeedMenuOpen ? (
                <div className="absolute bottom-8 left-1/2 w-[60px] -translate-x-1/2 overflow-hidden rounded-[8px] bg-[rgba(0,0,0,0.4)]">
                  {[...speedOptions].reverse().map((speed) => (
                    <button
                      key={speed}
                      type="button"
                      onClick={() => onSelectSpeed(speed)}
                      className={`flex w-full items-center justify-center px-3 py-2 text-center text-[14px] leading-[1.5] text-white ${
                        speed === playbackRate ? 'bg-[rgba(255,255,255,0.24)] font-semibold' : 'font-normal'
                      }`}
                    >
                      {speed}x
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            <button type="button" onClick={onToggleCaption} className="p-1 text-white">
              <SubtitleIcon isActive={isCaptionVisible} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds <= 0) {
    return '00:00';
  }

  const minute = Math.floor(seconds / 60);
  const second = Math.floor(seconds % 60);

  return `${String(minute).padStart(2, '0')}:${String(second).padStart(2, '0')}`;
}

function PauseIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-6 w-6 fill-none" xmlns="http://www.w3.org/2000/svg">
      <rect x="5" y="5" width="4" height="15" rx="1" fill="currentColor" />
      <rect x="15" y="5" width="4" height="15" rx="1" fill="currentColor" />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-6 w-6 fill-none" xmlns="http://www.w3.org/2000/svg">
      <path d="M8 5.5L19 12L8 18.5V5.5Z" fill="currentColor" />
    </svg>
  );
}

function TriangleUpIcon() {
  return <img src={triUpIcon} alt="" aria-hidden="true" className="h-6 w-6 invert" />;
}

function TriangleDownIcon() {
  return <img src={triDownIcon} alt="" aria-hidden="true" className="h-6 w-6 invert" />;
}

function SubtitleIcon({ isActive }: { isActive: boolean }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-6 w-6" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="3" y="6" width="18" height="12" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <path d="M7 12H10.5M13.5 12H17" stroke={isActive ? '#1A9AF5' : 'currentColor'} strokeWidth="1.8" strokeLinecap="round" />
      <path d="M7 15H12M14.5 15H17" stroke={isActive ? '#1A9AF5' : 'currentColor'} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export default SpinnerPlayer;
