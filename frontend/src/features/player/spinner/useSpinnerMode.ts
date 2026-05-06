import { useEffect, useMemo, useRef, useState } from 'react';
import { usePlayerSession } from '../../../hooks/usePlayerSession';
import { resolvePlayerSource } from '../shared/playback';
import type { SpinnerCaption, SpinnerAssistTool, SpinnerPlaybackRate } from './types';

const VIDEO_SOURCE =
  'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4';

const SPEED_OPTIONS: SpinnerPlaybackRate[] = [0.5, 0.75, 1, 1.25, 1.5, 2];

const CAPTIONS: SpinnerCaption[] = [
  { start: 0, end: 4, text: 'Use the spinner and keycap to keep your focus on the video.' },
  { start: 4, end: 8, text: 'Repeat important sections and follow each sentence carefully.' },
  { start: 8, end: 12, text: 'Adjust playback speed and practice at a pace that fits you.' },
  { start: 12, end: 18, text: 'Stay with the current scene and continue the rhythm of study.' },
];

export function useSpinnerMode() {
  const { sessionId, sessionDetail, sessionStatus, isLoadingSession, sessionError } =
    usePlayerSession();
  const videoRef = useRef<HTMLVideoElement | null>(null);
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

  useEffect(() => {
    const video = videoRef.current;
    if (!video) {
      return;
    }

    video.playbackRate = playbackRate;
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
      CAPTIONS.find((caption) => currentTime >= caption.start && currentTime < caption.end)?.text ??
      CAPTIONS[CAPTIONS.length - 1]?.text ??
      '',
    [currentTime],
  );

  const resolvedPlayerSource = useMemo(
    () =>
      resolvePlayerSource({
        sourceType: sessionDetail?.source_type,
        sourceUrl: sessionDetail?.source_url,
        fallbackSrc: VIDEO_SOURCE,
      }),
    [sessionDetail?.source_type, sessionDetail?.source_url],
  );

  const handleSpin = () => {
    setSelectedTool('spinner');
    setSpinnerTurns((current) => current + 1);
  };

  const handleSpinnerWheel = (deltaY: number) => {
    setSelectedTool('spinner');
    const deltaTurns = deltaY * -0.0024;
    setSpinnerTurns((current) => current + deltaTurns);
  };

  const handleTogglePlay = async () => {
    const video = videoRef.current;
    if (!video) {
      return;
    }

    if (video.paused) {
      try {
        await video.play();
      } catch {
        setIsPlaying(false);
      }
      return;
    }

    video.pause();
  };

  const handleSelectSpeed = (speed: SpinnerPlaybackRate) => {
    setPlaybackRate(speed);
    setIsSpeedMenuOpen(false);
  };

  const handleLoadedMetadata = () => {
    const video = videoRef.current;
    if (!video) {
      return;
    }

    setDuration(video.duration || 0);
  };

  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video) {
      return;
    }

    setCurrentTime(video.currentTime);
  };

  const handleSeek = (nextTime: number) => {
    const video = videoRef.current;
    if (!video) {
      return;
    }

    const safeTime = Math.min(Math.max(nextTime, 0), duration || 0);
    video.currentTime = safeTime;
    setCurrentTime(safeTime);
  };

  return {
    sessionId,
    playerType: resolvedPlayerSource.playerType,
    playerSrc: resolvedPlayerSource.playerSrc,
    sessionTitle: sessionDetail?.title || 'Spinner mode',
    sessionAiStatus: sessionStatus?.ai_status ?? sessionDetail?.ai_status ?? null,
    isLoadingSession,
    sessionError,
    videoRef,
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
    duration,
    speedOptions: SPEED_OPTIONS,
    captionText,
    handleSelectTool: setSelectedTool,
    handleSpin,
    handleSpinnerWheel,
    handlePressKeycap,
    handleTogglePlay,
    handleToggleSpeedMenu: () => setIsSpeedMenuOpen((current) => !current),
    handleSelectSpeed,
    handleToggleCaption: () => setIsCaptionVisible((current) => !current),
    handleTimeUpdate,
    handleSeek,
    handleLoadedMetadata,
    handlePlay: () => setIsPlaying(true),
    handlePause: () => setIsPlaying(false),
    handleEnded: () => setIsPlaying(false),
  };
}
