import { useState } from 'react';
import { useRainStore } from '../../../store/useRainStore';

const mockKeywords = ['topic', 'summary', 'practice'];

export function useRainMode() {
  const { score, combo, accuracy, setAccuracy, setCombo, setScore } = useRainStore();
  const [typedValue, setTypedValue] = useState('');

  return {
    keywords: mockKeywords,
    typedValue,
    score,
    combo,
    accuracy,
    setTypedValue,
    incrementSkeletonState: () => {
      setScore(score + 10);
      setCombo(combo + 1);
      setAccuracy(Math.min(100, accuracy + 5));
    },
  };
}
