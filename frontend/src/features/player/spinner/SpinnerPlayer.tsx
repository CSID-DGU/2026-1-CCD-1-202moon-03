import { useEffect, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent, ReactNode, RefObject } from 'react';
import triDownIcon from '../../../assets/icons/tri-down.svg';
import triUpIcon from '../../../assets/icons/tri-up.svg';
import type { MediaController, PlayerType } from '../shared/playback';
import type { SpinnerAssistTool, SpinnerPlaybackRate } from './types';

declare global {
  interface Window {
    YT?: {
      Player: new (
        element: HTMLElement,
        options: {
          videoId: string;
          playerVars?: Record<string, number>;
          events?: {
            onReady?: (event: { target: YouTubePlayer }) => void;
            onStateChange?: (event: { data: number; target: YouTubePlayer }) => void;
          };
        },
      ) => YouTubePlayer;
      PlayerState: {
        ENDED: number;
        PLAYING: number;
        PAUSED: number;
      };
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

interface YouTubePlayer {
  playVideo: () => void;
  pauseVideo: () => void;
  seekTo: (seconds: number, allowSeekAhead?: boolean) => void;
  setPlaybackRate: (rate: number) => void;
  getCurrentTime: () => number;
  getDuration: () => number;
  destroy: () => void;
}

interface SpinnerPlayerProps {
  playerType: PlayerType;
  playerSrc: string;
  videoRef: RefObject<HTMLVideoElement | null>;
  controllerRef: RefObject<MediaController | null>;
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
  onTimeUpdate: (time: number, duration: number) => void;
  onSeek: (time: number) => void;
  onLoadedMetadata: (duration: number) => void;
  onPlay: () => void;
  onPause: () => void;
  onEnded: () => void;
}

function extractYoutubeVideoId(playerSrc: string) {
  try {
    const parsedUrl = new URL(playerSrc);
    const pathSegments = parsedUrl.pathname.split('/').filter(Boolean);

    if (pathSegments[0] === 'embed' && pathSegments[1]) {
      return pathSegments[1];
    }

    return parsedUrl.searchParams.get('v') ?? '';
  } catch {
    return '';
  }
}

function ensureYouTubeApiLoaded() {
  return new Promise<void>((resolve, reject) => {
    if (window.YT?.Player) {
      resolve();
      return;
    }

    const existingScript = document.querySelector<HTMLScriptElement>(
      'script[data-youtube-iframe-api="true"]',
    );

    const handleReady = () => resolve();

    if (existingScript) {
      const previous = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        previous?.();
        handleReady();
      };
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://www.youtube.com/iframe_api';
    script.async = true;
    script.dataset.youtubeIframeApi = 'true';
    script.onerror = () => reject(new Error('YouTube IFrame API를 불러오지 못했습니다.'));

    const previous = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previous?.();
      handleReady();
    };

    document.body.appendChild(script);
  });
}

function SpinnerPlayer({
  playerType,
  playerSrc,
  videoRef,
  controllerRef,
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
  const youtubeContainerRef = useRef<HTMLDivElement | null>(null);
  const youtubePlayerRef = useRef<YouTubePlayer | null>(null);
  const youtubeProgressTimerRef = useRef<number | null>(null);
  const [areControlsVisible, setAreControlsVisible] = useState(true);
  const isYoutubePlayer = playerType === 'youtube';

  const clearHideControlsTimeout = () => {
    if (hideControlsTimeoutRef.current !== null) {
      window.clearTimeout(hideControlsTimeoutRef.current);
      hideControlsTimeoutRef.current = null;
    }
  };

  const clearYoutubeProgressTimer = () => {
    if (youtubeProgressTimerRef.current !== null) {
      window.clearInterval(youtubeProgressTimerRef.current);
      youtubeProgressTimerRef.current = null;
    }
  };

  const syncYoutubeProgress = () => {
    const player = youtubePlayerRef.current;

    if (!player) {
      return;
    }

    onTimeUpdate(player.getCurrentTime() || 0, player.getDuration() || 0);
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

  useEffect(() => {
    if (!isYoutubePlayer) {
      const videoElement = videoRef.current;

      controllerRef.current = videoElement
        ? {
            play: () => videoElement.play(),
            pause: () => videoElement.pause(),
            seek: (time) => {
              videoElement.currentTime = time;
            },
            setPlaybackRate: (rate) => {
              videoElement.playbackRate = rate;
            },
            getCurrentTime: () => videoElement.currentTime || 0,
            getDuration: () => videoElement.duration || 0,
          }
        : null;

      return;
    }

    let isCancelled = false;

    const initializeYoutubePlayer = async () => {
      const videoId = extractYoutubeVideoId(playerSrc);

      if (!youtubeContainerRef.current || !videoId) {
        return;
      }

      try {
        await ensureYouTubeApiLoaded();
      } catch {
        return;
      }

      if (isCancelled || !window.YT?.Player || !youtubeContainerRef.current) {
        return;
      }

      const player = new window.YT.Player(youtubeContainerRef.current, {
        videoId,
        playerVars: {
          rel: 0,
          modestbranding: 1,
          playsinline: 1,
        },
        events: {
          onReady: (event) => {
            youtubePlayerRef.current = event.target;
            controllerRef.current = {
              play: () => event.target.playVideo(),
              pause: () => event.target.pauseVideo(),
              seek: (time) => event.target.seekTo(time, true),
              setPlaybackRate: (rate) => event.target.setPlaybackRate(rate),
              getCurrentTime: () => event.target.getCurrentTime() || 0,
              getDuration: () => event.target.getDuration() || 0,
            };
            const nextDuration = event.target.getDuration() || 0;
            onLoadedMetadata(nextDuration);
            syncYoutubeProgress();
          },
          onStateChange: (event) => {
            if (!window.YT?.PlayerState) {
              return;
            }

            if (event.data === window.YT.PlayerState.PLAYING) {
              onPlay();
              clearYoutubeProgressTimer();
              youtubeProgressTimerRef.current = window.setInterval(syncYoutubeProgress, 250);
              return;
            }

            if (event.data === window.YT.PlayerState.PAUSED) {
              onPause();
              clearYoutubeProgressTimer();
              syncYoutubeProgress();
              return;
            }

            if (event.data === window.YT.PlayerState.ENDED) {
              onEnded();
              clearYoutubeProgressTimer();
              syncYoutubeProgress();
            }
          },
        },
      });

      youtubePlayerRef.current = player;
    };

    void initializeYoutubePlayer();

    return () => {
      isCancelled = true;
      clearYoutubeProgressTimer();
      youtubePlayerRef.current?.destroy();
      youtubePlayerRef.current = null;
      controllerRef.current = null;
    };
  }, [
    controllerRef,
    isYoutubePlayer,
    onEnded,
    onLoadedMetadata,
    onPause,
    onPlay,
    onTimeUpdate,
    playerSrc,
    videoRef,
  ]);

  return (
    <section
      className="relative h-[590px] overflow-hidden rounded-[11.455px] bg-[#DDDDDD]"
      onMouseMove={handleMouseMove}
    >
      {isYoutubePlayer ? (
        <div ref={youtubeContainerRef} className="absolute inset-0 h-full w-full" />
      ) : (
        <video
          ref={videoRef}
          className="absolute inset-0 h-full w-full object-cover"
          src={playerSrc}
          preload="metadata"
          playsInline
          onTimeUpdate={(event) =>
            onTimeUpdate(event.currentTarget.currentTime, event.currentTarget.duration || 0)
          }
          onLoadedMetadata={(event) => onLoadedMetadata(event.currentTarget.duration || 0)}
          onPlay={onPlay}
          onPause={onPause}
          onEnded={onEnded}
        />
      )}

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
          aria-label="Video progress"
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
