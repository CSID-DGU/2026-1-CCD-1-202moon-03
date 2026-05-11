import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface RainSessionResult {
  score: number;
  maxCombo: number;
  accuracy: number;
  tabSwitchCount?: number;
}

interface RainState {
  score: number;
  combo: number;
  accuracy: number;
  sessionResults: Record<string, RainSessionResult>;
  setScore: (score: number) => void;
  setCombo: (combo: number) => void;
  setAccuracy: (accuracy: number) => void;
  saveSessionResult: (sessionId: string, result: RainSessionResult) => void;
  resetRainState: () => void;
  clearRainStore: () => void;
}

const initialState = {
  score: 0,
  combo: 0,
  accuracy: 0,
};

export const useRainStore = create<RainState>()(
  persist(
    (set) => ({
      ...initialState,
      sessionResults: {},
      setScore: (score) => set({ score }),
      setCombo: (combo) => set({ combo }),
      setAccuracy: (accuracy) => set({ accuracy }),
      saveSessionResult: (sessionId, result) =>
        set((state) => ({
          sessionResults: {
            ...state.sessionResults,
            [sessionId]: result,
          },
        })),
      resetRainState: () => set((state) => ({ ...initialState, sessionResults: state.sessionResults })),
      clearRainStore: () => set({ ...initialState, sessionResults: {} }),
    }),
    {
      name: 'rain-game-store',
      partialize: (state) => ({
        score: state.score,
        combo: state.combo,
        accuracy: state.accuracy,
        sessionResults: state.sessionResults,
      }),
    },
  ),
);
