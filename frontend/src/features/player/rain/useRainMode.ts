import { useEffect, useMemo, useState } from 'react';
import { mockRainSession, rainSpeedOptions } from './mockRainSession';
import type { PlaybackRate, RainKeyword } from './types';
import { useRainStore } from '../../../store/useRainStore';
import { useVideoStore } from '../../../store/useVideoStore';

function clampProgress(value: number) {
  return Math.max(12, Math.min(value, 86));
}

export function useRainMode() {
  const { score, combo, setAccuracy, setCombo, setScore } = useRainStore();
  const { currentTime, isPlaying, setCurrentTime, setIsPlaying, setVideoUrl } = useVideoStore();
  const [typedValue, setTypedValue] = useState('');
  const [playbackRate, setPlaybackRate] = useState<PlaybackRate>(1);
  const [isSpeedMenuOpen, setIsSpeedMenuOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [comboAnimationKey, setComboAnimationKey] = useState(0);

  useEffect(() => {
    setVideoUrl(mockRainSession.defaultVideoUrl);
    setCurrentTime(0);
    setIsPlaying(true);
  }, [setCurrentTime, setIsPlaying, setVideoUrl]);

  useEffect(() => {
    if (!isPlaying) {
      return;
    }

    const interval = window.setInterval(() => {
      const next = currentTime + 0.5 * playbackRate;
      if (next >= mockRainSession.duration) {
        setCurrentTime(mockRainSession.duration);
        setIsPlaying(false);
        return;
      }

      setCurrentTime(next);
    }, 500);

    return () => window.clearInterval(interval);
  }, [currentTime, isPlaying, playbackRate, setCurrentTime, setIsPlaying]);

  const activeKeyword = mockRainSession.keywordPool[activeIndex];

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

  return {
    sessionTitle: mockRainSession.title,
    lessonTitle: mockRainSession.lessonTitle,
    introText: mockRainSession.introText,
    videoEmbedUrl: mockRainSession.youtubeEmbedUrl,
    characterName: mockRainSession.characterName,
    duration: mockRainSession.duration,
    currentTime,
    isPlaying,
    playbackRate,
    isSpeedMenuOpen,
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
    togglePlay: () => setIsPlaying(!isPlaying),
    toggleSpeedMenu: () => setIsSpeedMenuOpen((previous) => !previous),
    selectSpeed: (speed: PlaybackRate) => {
      setPlaybackRate(speed);
      setIsSpeedMenuOpen(false);
    },
    submitTypedKeyword: handleTypingSubmit,
  };
}
