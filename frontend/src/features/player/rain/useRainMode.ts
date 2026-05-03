import { useEffect, useMemo, useRef, useState } from 'react';
import { mockRainSession, rainSpeedOptions } from './mockRainSession';
import type { PlaybackRate, RainKeyword } from './types';
import { useRainStore } from '../../../store/useRainStore';
import { useVideoStore } from '../../../store/useVideoStore';

const FALLBACK_VIDEO_SOURCE =
  'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4';

function clampProgress(value: number) {
  return Math.max(12, Math.min(value, 86));
}

function isPlayableVideoSource(source: string) {
  if (!source) {
    return false;
  }

  if (source.startsWith('blob:')) {
    return true;
  }

  if (source.includes('youtube.com') || source.includes('youtu.be')) {
    return false;
  }

  return /\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(source);
}

export function useRainMode() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const speedMenuRef = useRef<HTMLDivElement | null>(null);
  const { score, combo, setAccuracy, setCombo, setScore } = useRainStore();
  const { videoUrl } = useVideoStore();

  const [typedValue, setTypedValue] = useState('');
  const [playbackRate, setPlaybackRate] = useState<PlaybackRate>(1);
  const [isSpeedMenuOpen, setIsSpeedMenuOpen] = useState(false);
  const [isCaptionVisible, setIsCaptionVisible] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [comboAnimationKey, setComboAnimationKey] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const resolvedVideoSrc = useMemo(
    () => (isPlayableVideoSource(videoUrl) ? videoUrl : FALLBACK_VIDEO_SOURCE),
    [videoUrl],
  );

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

  const activeKeyword = mockRainSession.keywordPool[Math.min(activeIndex, mockRainSession.keywordPool.length - 1)];

  const fallingKeywords = useMemo<RainKeyword[]>(() => {
    return mockRainSession.keywordPool.map((keyword, index) => {
      const distance = index - activeIndex;

      if (distance < 0) {
        return {
          ...keyword,
          progress: 86,
          status: 'cleared',
        };
      }

      if (distance === 0) {
        return {
          ...keyword,
          progress: clampProgress(20 + ((currentTime * 6) % 48)),
          status: 'active',
        };
      }

      return {
        ...keyword,
        progress: clampProgress(14 + distance * 12 + ((currentTime * 4) % 10)),
        status: 'pending',
      };
    });
  }, [activeIndex, currentTime]);

  const accuracy = attempts === 0 ? 100 : Math.round((correctCount / attempts) * 100);

  useEffect(() => {
    setAccuracy(accuracy);
  }, [accuracy, setAccuracy]);

  const captionText =
    mockRainSession.captions.find(
      (caption) => currentTime >= caption.start && currentTime < caption.end,
    )?.text ?? mockRainSession.captions[mockRainSession.captions.length - 1]?.text ?? '';

  const handleTypingSubmit = () => {
    if (!activeKeyword) {
      return;
    }

    const normalizedTyped = typedValue.trim().toLowerCase();
    if (!normalizedTyped) {
      return;
    }

    setAttempts((previous) => previous + 1);

    if (normalizedTyped === activeKeyword.text.toLowerCase()) {
      const nextScore = score + 120;
      const nextCombo = combo + 1;

      setScore(nextScore);
      setCombo(nextCombo);
      setCorrectCount((previous) => previous + 1);
      setMaxCombo((previous) => Math.max(previous, nextCombo));
      setComboAnimationKey((previous) => previous + 1);
      setTypedValue('');

      if (activeIndex < mockRainSession.keywordPool.length - 1) {
        setActiveIndex((previous) => previous + 1);
      } else {
        setActiveIndex(mockRainSession.keywordPool.length);
      }

      return;
    }

    setCombo(0);
    setTypedValue('');
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

  const handleSelectSpeed = (speed: PlaybackRate) => {
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
    speedMenuRef,
    videoRef,
    videoSrc: resolvedVideoSrc,
    sessionTitle: mockRainSession.title,
    characterName: mockRainSession.characterName,
    duration,
    currentTime,
    isPlaying,
    playbackRate,
    isSpeedMenuOpen,
    isCaptionVisible,
    speedOptions: rainSpeedOptions,
    captionText,
    fallingKeywords,
    activeKeyword,
    typedValue,
    score,
    combo,
    maxCombo,
    accuracy,
    comboAnimationKey,
    setTypedValue,
    togglePlay: handleTogglePlay,
    toggleSpeedMenu: () => setIsSpeedMenuOpen((previous) => !previous),
    selectSpeed: handleSelectSpeed,
    toggleCaption: () => setIsCaptionVisible((previous) => !previous),
    submitTypedKeyword: handleTypingSubmit,
    handleTimeUpdate,
    handleSeek,
    handleLoadedMetadata,
    handlePlay: () => setIsPlaying(true),
    handlePause: () => setIsPlaying(false),
    handleEnded: () => setIsPlaying(false),
  };
}
