import { create } from 'zustand';

export type PlayerMode = 'spinner' | 'rain' | null;

interface PlayerState {
  selectedMode: PlayerMode;
  sessionId: string | null;
  setSelectedMode: (selectedMode: PlayerMode) => void;
  setSessionId: (sessionId: string | null) => void;
}

export const usePlayerStore = create<PlayerState>((set) => ({
  selectedMode: null,
  sessionId: null,
  setSelectedMode: (selectedMode) => set({ selectedMode }),
  setSessionId: (sessionId) => set({ sessionId }),
}));
