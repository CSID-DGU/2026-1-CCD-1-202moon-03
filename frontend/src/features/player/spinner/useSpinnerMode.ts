import { useEffect, useMemo, useRef, useState } from 'react';
import type { SpinnerCaption, SpinnerAssistTool, SpinnerPlaybackRate } from './types';

const VIDEO_SOURCE =
  'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4';

const SPEED_OPTIONS: SpinnerPlaybackRate[] = [0.5, 0.75, 1, 1.25, 1.5, 2];

const CAPTIONS: SpinnerCaption[] = [
  { start: 0, end: 4, text: '집중이 흐려질 때 손끝으로 가볍게 반응해 보세요.' },
  { start: 4, end: 8, text: '피젯스피너를 돌리며 화면 속 문장을 천천히 따라갑니다.' },
  { start: 8, end: 12, text: '중요 단어가 들리면 키캡이나 스피너로 리듬을 만들어 보세요.' },
  { start: 12, end: 18, text: '반복적인 움직임이 시선과 청각을 현재 구간에 붙잡아 줍니다.' },
];

export function useSpinnerMode() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const speedMenuRef = useRef<HTMLDivElement | null>(null);
  const keycapTimeoutRef = useRef<number | null>(null);
  const keycapFrameRef = useRef<number | null>(null);
  const spinnerVelocityRef = useRef(0);
  const inertiaFrameRef = useRef<number | null>(null);

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

  const triggerKeycapPress = () => {
    if (keycapTimeoutRef.current !== null) {
      window.clearTimeout(keycapTimeoutRef.current);
    }
    if (keycapFrameRef.current !== null) {
      window.cancelAnimationFrame(keycapFrameRef.current);
    }

    setSelectedTool('keycap');
    setIsKeycapPressed(false);
    keycapFrameRef.current = window.requestAnimationFrame(() => {
      setKeycapPressCount((current) => current + 1);
      setIsKeycapPressed(true);
      keycapTimeoutRef.current = window.setTimeout(() => {
        setIsKeycapPressed(false);
        keycapTimeoutRef.current = null;
      }, 180);
      keycapFrameRef.current = null;
    });
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.playbackRate = playbackRate;
  }, [playbackRate]);

  useEffect(() => {
    if (!isSpeedMenuOpen) return;

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
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const isTypingTarget =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target?.isContentEditable;

      if (isTypingTarget || event.repeat) {
        return;
      }

      if (event.code !== 'KeyQ' && event.key.toLowerCase() !== 'q') {
        return;
      }

      event.preventDefault();
      triggerKeycapPress();
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (keycapTimeoutRef.current !== null) {
        window.clearTimeout(keycapTimeoutRef.current);
      }
      if (keycapFrameRef.current !== null) {
        window.cancelAnimationFrame(keycapFrameRef.current);
      }
      if (inertiaFrameRef.current !== null) {
        window.cancelAnimationFrame(inertiaFrameRef.current);
      }
    };
  }, []);

  const captionText = useMemo(
    () =>
      CAPTIONS.find((caption) => currentTime >= caption.start && currentTime < caption.end)?.text ??
      CAPTIONS[CAPTIONS.length - 1]?.text ??
      '',
    [currentTime],
  );

  const startSpinnerInertia = () => {
    if (inertiaFrameRef.current !== null) {
      window.cancelAnimationFrame(inertiaFrameRef.current);
    }

    const animate = () => {
      const velocity = spinnerVelocityRef.current * 0.94;

      if (Math.abs(velocity) < 0.0015) {
        spinnerVelocityRef.current = 0;
        inertiaFrameRef.current = null;
        return;
      }

      spinnerVelocityRef.current = velocity;
      setSpinnerTurns((current) => current + velocity);
      inertiaFrameRef.current = window.requestAnimationFrame(animate);
    };

    inertiaFrameRef.current = window.requestAnimationFrame(animate);
  };

  const handleSpin = () => {
    setSelectedTool('spinner');
    setSpinnerTurns((current) => current + 1);
  };

  const handleSpinnerWheel = (deltaY: number) => {
    setSelectedTool('spinner');

    const deltaTurns = deltaY * -0.0024;
    setSpinnerTurns((current) => current + deltaTurns);

    spinnerVelocityRef.current += deltaTurns * 0.18;
    spinnerVelocityRef.current = Math.max(Math.min(spinnerVelocityRef.current, 0.18), -0.18);
    startSpinnerInertia();
  };

  const handlePressKeycap = () => {
    triggerKeycapPress();
  };

  const handleTogglePlay = async () => {
    const video = videoRef.current;
    if (!video) return;

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
    if (!video) return;
    setDuration(video.duration || 0);
  };

  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video) return;
    setCurrentTime(video.currentTime);
  };

  const handleSeek = (nextTime: number) => {
    const video = videoRef.current;
    if (!video) return;

    const safeTime = Math.min(Math.max(nextTime, 0), duration || 0);
    video.currentTime = safeTime;
    setCurrentTime(safeTime);
  };

  return {
    lessonTitle: '집중 트레이닝',
    subtitle: '영상을 들으며 손끝 자극으로 집중 리듬을 유지해 보세요.',
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
