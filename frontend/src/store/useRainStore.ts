import { create } from 'zustand';

interface RainState {
  score: number;
  combo: number;
  accuracy: number;
  setScore: (score: number) => void;
  setCombo: (combo: number) => void;
  setAccuracy: (accuracy: number) => void;
  resetRainState: () => void;
}

const initialState = {
  score: 0,
  combo: 0,
  accuracy: 0,
};

export const useRainStore = create<RainState>((set) => ({
  ...initialState,
  setScore: (score) => set({ score }),
  setCombo: (combo) => set({ combo }),
  setAccuracy: (accuracy) => set({ accuracy }),
  resetRainState: () => set(initialState),
}));
