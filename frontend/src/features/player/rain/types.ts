import type { GameBlankItem, GameQuizItem } from '../../../types';

export type PlaybackRate = 0.5 | 0.75 | 1 | 1.25 | 1.5 | 2;

export interface RainCaption {
  start: number;
  end: number;
  text: string;
}

export interface RainKeyword {
  id: string;
  text: string;
  hint: string;
  lane: number;
  progress: number;
  status: 'pending' | 'active' | 'cleared';
}

export interface RainCaptionDisplay {
  beforeText: string;
  afterText: string;
  blank: GameBlankItem | null;
}

export interface RainQuizState {
  quiz: GameQuizItem;
  selectedIndex: number | null;
  feedback: string;
  isCorrect: boolean | null;
  isSubmitting: boolean;
}
