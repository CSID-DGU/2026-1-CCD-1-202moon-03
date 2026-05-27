import { useCallback, useEffect, useRef, useState } from 'react';
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
          playerVars?: Record<string, string | number | undefined>;
          events?: {
            onReady?: (event: { target: YouTubePlayer }) => void;
            onStateChange?: (event: { data: number; target: YouTubePlayer }) => void;
            onError?: (event: { data: number; target: YouTubePlayer }) => void;
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
  getAvailablePlaybackRates: () => number[];
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
  isPlayerReady: boolean;
  isPlaying: boolean;
  playbackRate: SpinnerPlaybackRate;
  isSpeedMenuOpen: boolean;
  speedOptions: SpinnerPlaybackRate[];
  isCaptionVisible: boolean;
  captionText: string;
  selectedTool?: SpinnerAssistTool;
  overlayContent?: ReactNode;
  subtitleContent?: ReactNode;
  renderSubtitleContent?: (isWrapped: boolean) => ReactNode;
  onMeasurementRootChange?: (element: HTMLElement | null) => void;
  onTogglePlay: () => void;
  onToggleSpeedMenu: () => void;
  onSelectSpeed: (speed: SpinnerPlaybackRate) => void;
  onToggleCaption: () => void;
  onTimeUpdate: (time: number, duration: number) => void;
  onSeek: (time: number) => void;
  onLoadedMetadata: (duration: number) => void;
  onPlayerReady?: () => void;
  onYoutubeDebug?: (payload: {
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
  }) => void;
  onPlay: () => void;
  onPause: () => void;
  onEnded: () => void;
}

function extractYoutubeVideoId(playerSrc: string) {
  try {
    const parsedUrl = new URL(playerSrc);
    const hostname = parsedUrl.hostname.replace(/^www\./, '');
    const pathSegments = parsedUrl.pathname.split('/').filter(Boolean);

    if (hostname === 'youtu.be') {
      return pathSegments[0] ?? '';
    }

    if (pathSegments[0] === 'embed' && pathSegments[1]) {
      return pathSegments[1];
    }

    if (pathSegments[0] === 'shorts' && pathSegments[1]) {
      return pathSegments[1];
    }

    if (parsedUrl.pathname === '/watch') {
      return parsedUrl.searchParams.get('v') ?? '';
    }

    return parsedUrl.searchParams.get('v') ?? pathSegments[0] ?? '';
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

function getPlayerOrigin() {
  if (typeof window === 'undefined') {
    return undefined;
  }

  return window.location.origin;
}

function waitForNextFrame() {
  return new Promise<void>((resolve) => {
    window.requestAnimationFrame(() => resolve());
  });
}

const YOUTUBE_READY_TIMEOUT_MS = 2500;
const MAX_YOUTUBE_CONSTRUCT_RETRIES = 1;
const CONTROLS_HIDE_DELAY_MS = 5000;

function createYouTubeController(player: YouTubePlayer): MediaController {
  return {
    play: () => player.playVideo(),
    pause: () => player.pauseVideo(),
    seek: (time) => player.seekTo(time, true),
    setPlaybackRate: (rate) => player.setPlaybackRate(rate),
    getCurrentTime: () => player.getCurrentTime() || 0,
    getDuration: () => player.getDuration() || 0,
  };
}

function SpinnerPlayer({
  playerType,
  playerSrc,
  videoRef,
  controllerRef,
  currentTime,
  duration,
  isPlayerReady,
  isPlaying,
  playbackRate,
  isSpeedMenuOpen,
  speedOptions,
  isCaptionVisible,
  captionText,
  overlayContent,
  subtitleContent,
  renderSubtitleContent,
  onMeasurementRootChange,
  onTogglePlay,
  onToggleSpeedMenu,
  onSelectSpeed,
  onToggleCaption,
  onTimeUpdate,
  onSeek,
  onLoadedMetadata,
  onPlayerReady,
  onYoutubeDebug,
  onPlay,
  onPause,
  onEnded,
}: SpinnerPlayerProps) {
  const sectionRef = useRef<HTMLElement | null>(null);
  const seekTrackRef = useRef<HTMLDivElement | null>(null);
  const subtitleBarRef = useRef<HTMLDivElement | null>(null);
  const subtitleContentRef = useRef<HTMLDivElement | null>(null);
  const hideControlsTimeoutRef = useRef<number | null>(null);
  const youtubeContainerRef = useRef<HTMLDivElement | null>(null);
  const youtubePlayerRef = useRef<YouTubePlayer | null>(null);
  const youtubeProgressTimerRef = useRef<number | null>(null);
  const youtubeMountTokenRef = useRef(0);
  const activeYoutubeMountTokenRef = useRef(0);
  const onTimeUpdateRef = useRef(onTimeUpdate);
  const onLoadedMetadataRef = useRef(onLoadedMetadata);
  const onPlayerReadyRef = useRef(onPlayerReady);
  const onYoutubeDebugRef = useRef(onYoutubeDebug);
  const onPlayRef = useRef(onPlay);
  const onPauseRef = useRef(onPause);
  const onEndedRef = useRef(onEnded);
  const playbackRateRef = useRef(playbackRate);
  const currentTimeRef = useRef(currentTime);
  const [isSubtitleWrapped, setIsSubtitleWrapped] = useState(false);
  const [availablePlaybackRates, setAvailablePlaybackRates] = useState<number[]>([]);
  const [isLocalPlayerReady, setIsLocalPlayerReady] = useState(false);
  const [hasLocalController, setHasLocalController] = useState(false);
  const [isControlsVisible, setIsControlsVisible] = useState(true);
  const isYoutubePlayer = playerType === 'youtube';
  const hasCustomSubtitleContent = Boolean(subtitleContent || renderSubtitleContent);
  const canControlPlayback =
    !isYoutubePlayer || hasLocalController || isLocalPlayerReady || isPlayerReady;
  const filteredSpeedOptions =
    isYoutubePlayer && availablePlaybackRates.length > 0
      ? speedOptions.filter((speed) => availablePlaybackRates.includes(speed))
      : speedOptions;
  const hasSubtitlePanel = Boolean(
    isCaptionVisible && (subtitleContent || renderSubtitleContent || captionText),
  );
  const progressPercent = duration > 0 ? Math.min((currentTime / duration) * 100, 100) : 0;

  const emitYoutubeDebug = ({
    action,
    errorCode,
    reason,
    stage,
  }: {
    action?: string;
    errorCode?: number;
    reason?: string;
    stage: string;
  }) => {
    onYoutubeDebugRef.current?.({
      stage,
      playerSrc,
      videoId: isYoutubePlayer ? extractYoutubeVideoId(playerSrc) : '',
      playerType,
      action,
      canControlPlayback,
      isLocalPlayerReady,
      hasController: Boolean(controllerRef.current),
      reason,
      errorCode,
    });
  };

  useEffect(() => {
    onTimeUpdateRef.current = onTimeUpdate;
    onLoadedMetadataRef.current = onLoadedMetadata;
    onPlayerReadyRef.current = onPlayerReady;
    onYoutubeDebugRef.current = onYoutubeDebug;
    onPlayRef.current = onPlay;
    onPauseRef.current = onPause;
    onEndedRef.current = onEnded;
    playbackRateRef.current = playbackRate;
    currentTimeRef.current = currentTime;
  }, [onEnded, onLoadedMetadata, onPause, onPlay, onPlayerReady, onTimeUpdate, onYoutubeDebug]);

  useEffect(() => {
    playbackRateRef.current = playbackRate;
    currentTimeRef.current = currentTime;
  }, [currentTime, playbackRate]);

  useEffect(() => {
    const youtubeVideoId = isYoutubePlayer ? extractYoutubeVideoId(playerSrc) : '';
    emitYoutubeDebug({ stage: 'props' });
    console.log('[SpinnerPlayer][youtube] props', {
      playerType,
      playerSrc,
      videoId: youtubeVideoId,
      isYoutubePlayer,
      isLocalPlayerReady,
      isPlayerReady,
      canControlPlayback,
      hasController: Boolean(controllerRef.current),
    });
  }, [canControlPlayback, controllerRef, isLocalPlayerReady, isPlayerReady, isYoutubePlayer, playerSrc, playerType]);

  const clearControlsHideTimeout = useCallback(() => {
    if (hideControlsTimeoutRef.current !== null) {
      window.clearTimeout(hideControlsTimeoutRef.current);
      hideControlsTimeoutRef.current = null;
    }
  }, []);

  const revealControls = useCallback((shouldReschedule = true) => {
    clearControlsHideTimeout();
    setIsControlsVisible(true);
    if (shouldReschedule && isPlaying && canControlPlayback && !isSpeedMenuOpen) {
      hideControlsTimeoutRef.current = window.setTimeout(() => {
        setIsControlsVisible(false);
      }, CONTROLS_HIDE_DELAY_MS);
    }
  }, [canControlPlayback, clearControlsHideTimeout, isPlaying, isSpeedMenuOpen]);

  const scheduleControlsHide = useCallback(() => {
    clearControlsHideTimeout();
    if (!isPlaying || !canControlPlayback || isSpeedMenuOpen) {
      setIsControlsVisible(true);
      return;
    }

    hideControlsTimeoutRef.current = window.setTimeout(() => {
      setIsControlsVisible(false);
    }, CONTROLS_HIDE_DELAY_MS);
  }, [canControlPlayback, clearControlsHideTimeout, isPlaying, isSpeedMenuOpen]);

  useEffect(() => {
    if (!isPlaying || !canControlPlayback || isSpeedMenuOpen) {
      revealControls(false);
      return () => {
        clearControlsHideTimeout();
      };
    }

    scheduleControlsHide();
    return () => {
      clearControlsHideTimeout();
    };
  }, [
    canControlPlayback,
    clearControlsHideTimeout,
    isPlaying,
    isSpeedMenuOpen,
    revealControls,
    scheduleControlsHide,
  ]);

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

    onTimeUpdateRef.current(player.getCurrentTime() || 0, player.getDuration() || 0);
  };

  const syncYoutubeProgressSoon = () => {
    window.setTimeout(() => {
      syncYoutubeProgress();
    }, 120);
  };

  const startYoutubeProgressTimer = () => {
    clearYoutubeProgressTimer();
    youtubeProgressTimerRef.current = window.setInterval(syncYoutubeProgress, 250);
  };

  const seekFromClientX = (clientX: number) => {
    const track = seekTrackRef.current;
    if (!track || duration <= 0 || !canControlPlayback) {
      return null;
    }

    const rect = track.getBoundingClientRect();
    const ratio = Math.min(Math.max((clientX - rect.left) / rect.width, 0), 1);
    const nextTime = duration * ratio;

    if (isYoutubePlayer) {
      controllerRef.current?.seek(nextTime);
      startYoutubeProgressTimer();
      syncYoutubeProgressSoon();
    }

    onSeek(nextTime);
    return nextTime;
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

  useEffect(() => {
    onMeasurementRootChange?.(sectionRef.current);

    return () => {
      onMeasurementRootChange?.(null);
    };
  }, [onMeasurementRootChange]);

  useEffect(() => {
    if (!isCaptionVisible || (!captionText && !hasCustomSubtitleContent)) {
      setIsSubtitleWrapped(false);
      return;
    }

    let frameId = 0;

    const measureWrap = () => {
      const subtitleBar = subtitleBarRef.current;
      const subtitleContentElement = subtitleContentRef.current;

      if (!subtitleBar || !subtitleContentElement) {
        return;
      }

      const subtitleBarStyle = window.getComputedStyle(subtitleBar);
      const horizontalPadding =
        Number.parseFloat(subtitleBarStyle.paddingLeft || '0') +
        Number.parseFloat(subtitleBarStyle.paddingRight || '0');
      const availableWidth = Math.max(subtitleBar.clientWidth - horizontalPadding, 0);
      const lineHeight = Number.parseFloat(window.getComputedStyle(subtitleContentElement).lineHeight || '0');
      const hasHorizontalOverflow = subtitleContentElement.scrollWidth - 1 > availableWidth;
      const hasMultipleLines = lineHeight > 0 && subtitleContentElement.scrollHeight > lineHeight * 1.5;
      const nextWrapped = hasHorizontalOverflow || hasMultipleLines;

      setIsSubtitleWrapped((current) => (current === nextWrapped ? current : nextWrapped));
    };

    const scheduleMeasure = () => {
      window.cancelAnimationFrame(frameId);
      frameId = window.requestAnimationFrame(measureWrap);
    };

    scheduleMeasure();

    const resizeObserver =
      typeof ResizeObserver !== 'undefined' ? new ResizeObserver(() => scheduleMeasure()) : null;

    if (subtitleBarRef.current) {
      resizeObserver?.observe(subtitleBarRef.current);
    }

    if (subtitleContentRef.current) {
      resizeObserver?.observe(subtitleContentRef.current);
    }

    window.addEventListener('resize', scheduleMeasure);

    return () => {
      window.cancelAnimationFrame(frameId);
      resizeObserver?.disconnect();
      window.removeEventListener('resize', scheduleMeasure);
    };
  }, [captionText, hasCustomSubtitleContent, isCaptionVisible, renderSubtitleContent, subtitleContent]);

  useEffect(() => {
    if (!isYoutubePlayer) {
      const videoElement = videoRef.current;
      setAvailablePlaybackRates([]);
      setIsLocalPlayerReady(Boolean(videoElement));
      setHasLocalController(Boolean(videoElement));

      controllerRef.current = videoElement
        ? {
            play: async () => {
              if (videoElement.readyState === 0) {
                videoElement.load();
              }

              await videoElement.play();
            },
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

      if (videoElement) {
        onPlayerReadyRef.current?.();
      }

      return;
    }

    let isCancelled = false;
    const mountToken = youtubeMountTokenRef.current + 1;
    youtubeMountTokenRef.current = mountToken;
    activeYoutubeMountTokenRef.current = mountToken;
      let localYoutubePlayer: YouTubePlayer | null = null;
    let readyTimeoutId: number | null = null;

    const clearReadyTimeout = () => {
      if (readyTimeoutId !== null) {
        window.clearTimeout(readyTimeoutId);
        readyTimeoutId = null;
      }
    };

    const initializeYoutubePlayer = async (attempt = 0): Promise<void> => {
      const videoId = extractYoutubeVideoId(playerSrc);
      const containerElement = youtubeContainerRef.current;
      const isCurrentMountActive = () =>
        !isCancelled &&
        activeYoutubeMountTokenRef.current === mountToken &&
        youtubeContainerRef.current === containerElement &&
        Boolean(containerElement?.isConnected);

      emitYoutubeDebug({ stage: 'init_start' });
      console.log('[SpinnerPlayer][youtube] init_start', {
        playerSrc,
        videoId,
        playerType,
        hasContainer: Boolean(youtubeContainerRef.current),
      });

      if (!containerElement || !videoId) {
        emitYoutubeDebug({
          stage: 'init_blocked',
          reason: !containerElement ? 'missing_container' : 'missing_video_id',
        });
        console.log('[SpinnerPlayer][youtube] init_blocked', {
          playerSrc,
          videoId,
          hasContainer: Boolean(containerElement),
        });
        return;
      }

      try {
        await ensureYouTubeApiLoaded();
        emitYoutubeDebug({ stage: 'api_loaded' });
      } catch {
        emitYoutubeDebug({ stage: 'api_load_failed' });
        console.log('[SpinnerPlayer][youtube] api_load_failed', {
          playerSrc,
          videoId,
        });
        return;
      }

      clearReadyTimeout();
      setIsLocalPlayerReady(false);
      setHasLocalController(false);
      if (localYoutubePlayer) {
        localYoutubePlayer.destroy();
        if (youtubePlayerRef.current === localYoutubePlayer) {
          youtubePlayerRef.current = null;
        }
        localYoutubePlayer = null;
      }
      controllerRef.current = null;
      setAvailablePlaybackRates([]);
      containerElement.replaceChildren();

      emitYoutubeDebug({ stage: 'construct_scheduled' });
      await waitForNextFrame();

      if (!isCurrentMountActive() || !window.YT?.Player) {
        emitYoutubeDebug({
          stage: 'init_cancelled',
          reason: isCancelled
            ? 'effect_cancelled'
            : !containerElement?.isConnected
              ? 'container_disconnected'
              : 'yt_player_unavailable',
        });
        console.log('[SpinnerPlayer][youtube] init_cancelled', {
          isCancelled,
          hasPlayerCtor: Boolean(window.YT?.Player),
          hasContainer: Boolean(containerElement),
          isContainerConnected: Boolean(containerElement?.isConnected),
          activeMountToken: activeYoutubeMountTokenRef.current,
          mountToken,
          playerSrc,
          videoId,
        });
        return;
      }

      emitYoutubeDebug({ stage: 'player_construct' });
      const player = new window.YT.Player(containerElement, {
        videoId,
        playerVars: {
          controls: 0,
          disablekb: 1,
          enablejsapi: 1,
          fs: 0,
          iv_load_policy: 3,
          origin: getPlayerOrigin(),
          modestbranding: 1,
          playsinline: 1,
          rel: 0,
        },
        events: {
          onReady: (event) => {
            clearReadyTimeout();
            if (!isCurrentMountActive()) {
              console.log('[SpinnerPlayer][youtube] ignore stale ready', {
                playerSrc,
                videoId,
                mountToken,
                activeMountToken: activeYoutubeMountTokenRef.current,
              });
              return;
            }
            emitYoutubeDebug({ stage: 'ready' });
            console.log('[SpinnerPlayer][youtube] ready', {
              playerSrc,
              videoId,
            });
            setIsLocalPlayerReady(true);
            setHasLocalController(true);
            youtubePlayerRef.current = event.target;
            controllerRef.current = createYouTubeController(event.target);
            const supportedRates = event.target.getAvailablePlaybackRates?.() ?? [];
            setAvailablePlaybackRates(
              supportedRates.filter((rate) => Number.isFinite(rate) && rate > 0),
            );
            if (playbackRateRef.current !== 1) {
              event.target.setPlaybackRate(playbackRateRef.current);
            }
            if (currentTimeRef.current > 0) {
              event.target.seekTo(currentTimeRef.current, true);
            }
            const nextDuration = event.target.getDuration() || 0;
            onLoadedMetadataRef.current(nextDuration);
            onPlayerReadyRef.current?.();
            syncYoutubeProgress();
          },
          onStateChange: (event) => {
            if (!isCurrentMountActive()) {
              console.log('[SpinnerPlayer][youtube] ignore stale state_change', {
                playerSrc,
                videoId,
                state: event.data,
                mountToken,
                activeMountToken: activeYoutubeMountTokenRef.current,
              });
              return;
            }
            console.log('[SpinnerPlayer][youtube] state_change', {
              playerSrc,
              videoId,
              state: event.data,
            });
            if (!window.YT?.PlayerState) {
              return;
            }

            if (event.data === window.YT.PlayerState.PLAYING) {
              onPlayRef.current();
              clearYoutubeProgressTimer();
              youtubeProgressTimerRef.current = window.setInterval(syncYoutubeProgress, 250);
              return;
            }

            if (event.data === window.YT.PlayerState.PAUSED) {
              onPauseRef.current();
              clearYoutubeProgressTimer();
              syncYoutubeProgress();
              return;
            }

            if (event.data === window.YT.PlayerState.ENDED) {
              onEndedRef.current();
              clearYoutubeProgressTimer();
              syncYoutubeProgress();
            }
          },
          onError: (event) => {
            clearReadyTimeout();
            if (!isCurrentMountActive()) {
              console.log('[SpinnerPlayer][youtube] ignore stale error', {
                playerSrc,
                videoId,
                errorCode: event.data,
                mountToken,
                activeMountToken: activeYoutubeMountTokenRef.current,
              });
              return;
            }
            emitYoutubeDebug({
              stage: 'error',
              errorCode: event.data,
            });
            console.log('[SpinnerPlayer][youtube] error', {
              playerSrc,
              videoId,
              errorCode: event.data,
            });
            setIsLocalPlayerReady(false);
            setHasLocalController(false);
          },
        },
      });

      localYoutubePlayer = player;
      youtubePlayerRef.current = player;
      controllerRef.current = createYouTubeController(player);
      setHasLocalController(true);
      readyTimeoutId = window.setTimeout(() => {
        if (!isCurrentMountActive()) {
          return;
        }

        emitYoutubeDebug({
          stage: 'ready_timeout',
          reason: `attempt_${attempt + 1}`,
        });
        console.log('[SpinnerPlayer][youtube] ready_timeout', {
          playerSrc,
          videoId,
          attempt: attempt + 1,
        });

        if (localYoutubePlayer) {
          localYoutubePlayer.destroy();
          if (youtubePlayerRef.current === localYoutubePlayer) {
            youtubePlayerRef.current = null;
          }
          localYoutubePlayer = null;
        }
        controllerRef.current = null;
        setIsLocalPlayerReady(false);
        setHasLocalController(false);

        if (attempt < MAX_YOUTUBE_CONSTRUCT_RETRIES) {
          void initializeYoutubePlayer(attempt + 1);
        }
      }, YOUTUBE_READY_TIMEOUT_MS);
    };

    void initializeYoutubePlayer();

    return () => {
      isCancelled = true;
      if (activeYoutubeMountTokenRef.current === mountToken) {
        activeYoutubeMountTokenRef.current = 0;
      }
      clearReadyTimeout();
      clearYoutubeProgressTimer();
      setIsLocalPlayerReady(false);
      setHasLocalController(false);
      if (localYoutubePlayer) {
        localYoutubePlayer.destroy();
        setAvailablePlaybackRates([]);
        emitYoutubeDebug({ stage: 'destroyed' });
        if (youtubePlayerRef.current === localYoutubePlayer) {
          youtubePlayerRef.current = null;
        }
        localYoutubePlayer = null;
      }
      youtubeContainerRef.current?.replaceChildren();
      controllerRef.current = null;
    };
  }, [
    controllerRef,
    isYoutubePlayer,
    playerType,
    playerSrc,
    videoRef,
  ]);

  const handlePlayButtonClick = () => {
    console.log('[SpinnerPlayer][control] play_toggle_clicked', {
      canControlPlayback,
      isLocalPlayerReady,
      isPlayerReady,
      youtubePlayerStage: isYoutubePlayer ? 'runtime' : 'html5',
      hasController: Boolean(controllerRef.current),
      isPlaying,
    });
    emitYoutubeDebug({
      stage: isYoutubePlayer ? 'control_click' : 'html5_control_click',
      action: 'play_toggle_clicked',
    });
    if (!canControlPlayback) {
      return;
    }
    if (isYoutubePlayer) {
      if (isPlaying) {
        controllerRef.current?.pause();
        clearYoutubeProgressTimer();
        onPauseRef.current();
      } else {
        void Promise.resolve(controllerRef.current?.play()).catch(() => {
          // Keep the existing state if YouTube rejects the request.
        });
        startYoutubeProgressTimer();
        onPlayRef.current();
      }
      syncYoutubeProgressSoon();
    }
    void onTogglePlay();
  };

  const handleSpeedMenuButtonClick = () => {
    console.log('[SpinnerPlayer][control] speed_menu_clicked', {
      canControlPlayback,
      isLocalPlayerReady,
      isPlayerReady,
      hasController: Boolean(controllerRef.current),
      playbackRate,
    });
    emitYoutubeDebug({
      stage: isYoutubePlayer ? 'control_click' : 'html5_control_click',
      action: 'speed_menu_clicked',
    });
    if (!canControlPlayback) {
      return;
    }
    onToggleSpeedMenu();
  };

  const handleSpeedOptionClick = (speed: SpinnerPlaybackRate) => {
    console.log('[SpinnerPlayer][control] speed_selected', {
      canControlPlayback,
      isLocalPlayerReady,
      isPlayerReady,
      hasController: Boolean(controllerRef.current),
      selectedSpeed: speed,
    });
    emitYoutubeDebug({
      stage: isYoutubePlayer ? 'control_click' : 'html5_control_click',
      action: `speed_selected_${speed}`,
    });
    if (!canControlPlayback) {
      return;
    }
    onSelectSpeed(speed);
  };

  const handleCaptionButtonClick = () => {
    console.log('[SpinnerPlayer][control] caption_toggle_clicked', {
      isCaptionVisible,
    });
    emitYoutubeDebug({
      stage: isYoutubePlayer ? 'control_click' : 'html5_control_click',
      action: 'caption_toggle_clicked',
    });
    onToggleCaption();
  };

  return (
    <section ref={sectionRef} className="flex w-[min(1120px,98vw)] flex-col items-center">
      <div
        className={`relative aspect-video w-full overflow-hidden bg-black ${
          hasSubtitlePanel ? 'rounded-t-[11.455px]' : 'rounded-[11.455px]'
        }`}
        onPointerMove={() => revealControls()}
        onPointerEnter={() => revealControls()}
        onPointerDown={() => revealControls()}
      >
        {isYoutubePlayer ? (
          <div ref={youtubeContainerRef} className="absolute inset-0 z-0 h-full w-full" />
        ) : (
          <video
            ref={videoRef}
            className="absolute inset-0 z-0 h-full w-full object-contain"
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

        <div className="pointer-events-none absolute inset-0 z-10 bg-[linear-gradient(180deg,rgba(0,0,0,0)_0%,rgba(0,0,0,0)_70%,rgba(0,0,0,0.42)_100%)]" />

        {overlayContent ? (
          <div className="pointer-events-none absolute inset-x-0 bottom-[152px] top-[24px] z-20">
            {overlayContent}
          </div>
        ) : null}

        <div
          className={`absolute inset-x-0 bottom-0 z-30 overflow-visible transition-opacity duration-200 ${
            isControlsVisible ? 'opacity-100' : 'pointer-events-none opacity-0'
          } ${
            isYoutubePlayer
              ? 'border-b-2 border-[#2D3340] bg-black'
              : 'bg-[linear-gradient(180deg,rgba(0,0,0,0)_0%,rgba(0,0,0,0.4)_100%)]'
          }`}
        >
          <div
            className={`relative h-[10px] w-full cursor-pointer ${
              canControlPlayback ? '' : 'cursor-not-allowed opacity-45'
            }`}
            onPointerDown={(event) => {
              console.log('[SpinnerPlayer][control] seek_pointer_down', {
                canControlPlayback,
                isLocalPlayerReady,
                isPlayerReady,
                hasController: Boolean(controllerRef.current),
                clientX: event.clientX,
                currentTime,
                duration,
              });
              emitYoutubeDebug({
                stage: isYoutubePlayer ? 'control_click' : 'html5_control_click',
                action: 'seek_pointer_down',
              });
              handleSeekPointerDown(event);
            }}
            role="slider"
            aria-label="Video progress"
            aria-valuemin={0}
            aria-valuemax={Math.round(duration)}
            aria-valuenow={Math.round(currentTime)}
          >
            <div className="absolute inset-x-0 top-1/2 h-[2px] -translate-y-1/2 bg-[rgba(255,255,255,0.2)]" />
            <div
              className="absolute left-0 top-1/2 h-[2px] -translate-y-1/2 bg-[#1A9AF5]"
              style={{ width: `${progressPercent}%` }}
            />
            <div ref={seekTrackRef} className="absolute inset-0" />
            <div
              className="pointer-events-none absolute top-1/2 h-[10px] w-[10px] -translate-x-1/2 -translate-y-1/2 rounded-full border-[1.5px] border-white bg-[#1A9AF5]"
              style={{ left: `${progressPercent}%` }}
            />
          </div>

          <div className="relative flex w-full items-center justify-between px-6 pb-[18px] pt-3">
            <div className="relative z-10 flex items-center gap-3">
              <button
                type="button"
                onClick={handlePlayButtonClick}
                aria-disabled={!canControlPlayback}
                className={`p-1 text-white ${
                  canControlPlayback ? '' : 'cursor-not-allowed opacity-45'
                }`}
              >
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
                <button
                  type="button"
                  onClick={handleSpeedMenuButtonClick}
                  aria-disabled={!canControlPlayback}
                  className={`flex items-center p-1 ${
                    canControlPlayback ? '' : 'cursor-not-allowed opacity-45'
                  }`}
                >
                  <TriangleUpIcon />
                  <span className="min-w-[28px] px-1 text-center text-[16px] font-medium leading-6">
                    {playbackRate}x
                  </span>
                  <TriangleDownIcon />
                </button>

                {isSpeedMenuOpen ? (
                  <div className="absolute bottom-8 left-1/2 w-[60px] -translate-x-1/2 overflow-hidden rounded-[8px] bg-[rgba(0,0,0,0.4)]">
                    {[...filteredSpeedOptions].reverse().map((speed) => (
                      <button
                        key={speed}
                        type="button"
                        onClick={() => handleSpeedOptionClick(speed)}
                        className={`flex w-full items-center justify-center px-3 py-2 text-center text-[14px] leading-[1.5] text-white ${
                          speed === playbackRate
                            ? 'bg-[rgba(255,255,255,0.24)] font-semibold'
                            : 'font-normal'
                        }`}
                      >
                        {speed}x
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>

              <button type="button" onClick={handleCaptionButtonClick} className="p-1 text-white">
                <SubtitleIcon isActive={isCaptionVisible} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {hasSubtitlePanel ? (
        <div
          ref={subtitleBarRef}
          className={`flex w-full items-center rounded-b-[11.455px] bg-[rgba(0,0,0,0.78)] px-6 text-white transition-[padding,height] duration-150 ${
            isSubtitleWrapped ? 'py-3 min-h-[118px]' : 'py-4 min-h-[76px]'
          }`}
        >
          <div
            ref={subtitleContentRef}
            className={`w-full text-center text-[22px] font-semibold leading-[1.45] text-white ${
              isSubtitleWrapped
                ? 'whitespace-normal [word-break:keep-all]'
                : 'overflow-hidden whitespace-nowrap'
            }`}
          >
            {renderSubtitleContent
              ? renderSubtitleContent(isSubtitleWrapped)
              : subtitleContent ?? <p>{captionText}</p>}
          </div>
        </div>
      ) : null}
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
