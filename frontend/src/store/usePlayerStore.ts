import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type PlayerMode = 'spinner' | 'rain' | null;

interface PlayerState {
  selectedMode: PlayerMode;
  sessionId: string | null;
  setSelectedMode: (selectedMode: PlayerMode) => void;
  setSessionId: (sessionId: string | null) => void;
}

export const usePlayerStore = create<PlayerState>()(
  persist(
    (set) => ({
      selectedMode: null,
      sessionId: null,
      setSelectedMode: (selectedMode) => set({ selectedMode }),
      setSessionId: (sessionId) => set({ sessionId }),
    }),
    {
      name: 'player-session-store',
      partialize: (state) => ({
        selectedMode: state.selectedMode,
        sessionId: state.sessionId,
      }),
    },
  ),
);
