import { useEffect, useMemo, useRef, useState } from 'react';
import type { SpinnerCaption, SpinnerAssistTool, SpinnerPlaybackRate } from './types';

const VIDEO_SOURCE =
  'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4';

const SPEED_OPTIONS: SpinnerPlaybackRate[] = [0.5, 0.75, 1, 1.25, 1.5, 2];

const CAPTIONS: SpinnerCaption[] = [
  { start: 0, end: 4, text: '스피너를 돌리며 영상 시청 리듬을 맞춰 보세요.' },
  { start: 4, end: 8, text: '중요한 문장이 들리면 반복 감각으로 구간을 붙잡아 보세요.' },
  { start: 8, end: 12, text: '속도를 조절하면서 집중이 잘되는 리듬을 찾아 보세요.' },
  { start: 12, end: 18, text: '짧은 자막 구간을 따라가며 듣기 흐름을 유지해 보세요.' },
];

export function useSpinnerMode() {
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
    videoSrc: VIDEO_SOURCE,
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
