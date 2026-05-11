import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { SessionMode } from '../types';

export type PlayerMode = 'spinner' | 'rain' | null;
export type RainDifficulty = 'easy' | 'normal' | 'hard';

export interface StreamingPlayerSource {
  type: 'youtube_url' | 'file';
  mode: SessionMode;
  url?: string;
  file?: File;
  language?: string;
  sessionId?: string | null;
}

interface PlayerState {
  selectedMode: PlayerMode;
  sessionId: string | null;
  streamingSource: StreamingPlayerSource | null;
  rainDifficulty: RainDifficulty;
  setSelectedMode: (selectedMode: PlayerMode) => void;
  setSessionId: (sessionId: string | null) => void;
  setStreamingSource: (streamingSource: StreamingPlayerSource | null) => void;
  setRainDifficulty: (rainDifficulty: RainDifficulty) => void;
  resetPlayerState: () => void;
}

let transientStreamingSource: StreamingPlayerSource | null = null;

const initialState = {
  selectedMode: null as PlayerMode,
  sessionId: null as string | null,
  streamingSource: null as StreamingPlayerSource | null,
  rainDifficulty: 'normal' as RainDifficulty,
};

export function getTransientStreamingSource() {
  return transientStreamingSource;
}

export const usePlayerStore = create<PlayerState>()(
  persist(
    (set) => ({
      ...initialState,
      setSelectedMode: (selectedMode) => set({ selectedMode }),
      setSessionId: (sessionId) => set({ sessionId }),
      setStreamingSource: (streamingSource) => {
        transientStreamingSource = streamingSource;
        set({ streamingSource });
      },
      setRainDifficulty: (rainDifficulty) => set({ rainDifficulty }),
      resetPlayerState: () => {
        transientStreamingSource = null;
        set(initialState);
      },
    }),
    {
      name: 'player-session-store',
      partialize: (state) => ({
        selectedMode: state.selectedMode,
        sessionId: state.sessionId,
        rainDifficulty: state.rainDifficulty,
        streamingSource:
          state.streamingSource?.type === 'youtube_url'
            ? {
                type: state.streamingSource.type,
                mode: state.streamingSource.mode,
                url: state.streamingSource.url,
                language: state.streamingSource.language,
                sessionId: state.streamingSource.sessionId,
              }
            : null,
      }),
    },
  ),
);
