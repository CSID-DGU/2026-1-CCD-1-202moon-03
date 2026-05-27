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
  answerLength?: number;
  lane: number;
  blankKey?: string;
  leftPercent?: number;
  progress: number;
  status: 'pending' | 'active' | 'cleared' | 'missed';
}

export interface RainCaptionTextItem {
  type: 'text';
  key: string;
  text: string;
}

export interface RainCaptionInputItem {
  type: 'input';
  key: string;
  renderKey?: string;
  blank: GameBlankItem;
  value: string;
  placeholder: string;
  resolvedState: 'pending' | 'cleared' | 'missed';
}

export interface RainCaptionDisplay {
  items: Array<RainCaptionTextItem | RainCaptionInputItem>;
  hasPlaceholder: boolean;
}

export interface RainQuizState {
  quiz: GameQuizItem;
  selectedIndex: number | null;
  feedback: string;
  explanation: string;
  submitError: string;
  isCorrect: boolean | null;
  isSubmitting: boolean;
}
