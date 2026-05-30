import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { SessionMode } from '../types';

export type PlayerMode = 'spinner' | 'rain' | null;
export type RainDifficulty = 'easy' | 'normal' | 'hard';
export type SessionPlaybackMode = 'live' | 'replay';

export interface StreamingPlayerSource {
  type: 'youtube_url' | 'file';
  mode: SessionMode;
  url?: string;
  file?: File;
  presignedUrl?: string | null;
  s3Key?: string | null;
  language?: string;
  sessionId?: string | null;
}

interface PlayerState {
  selectedMode: PlayerMode;
  sessionId: string | null;
  streamingSource: StreamingPlayerSource | null;
  sessionPlaybackMode: SessionPlaybackMode;
  rainDifficulty: RainDifficulty;
  setSelectedMode: (selectedMode: PlayerMode) => void;
  setSessionId: (sessionId: string | null) => void;
  setStreamingSource: (streamingSource: StreamingPlayerSource | null) => void;
  setSessionPlaybackMode: (sessionPlaybackMode: SessionPlaybackMode) => void;
  setRainDifficulty: (rainDifficulty: RainDifficulty) => void;
  resetPlayerState: () => void;
}

let transientStreamingSource: StreamingPlayerSource | null = null;

const initialState = {
  selectedMode: null as PlayerMode,
  sessionId: null as string | null,
  streamingSource: null as StreamingPlayerSource | null,
  sessionPlaybackMode: 'live' as SessionPlaybackMode,
  rainDifficulty: 'hard' as RainDifficulty,
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
      setSessionPlaybackMode: (sessionPlaybackMode) => set({ sessionPlaybackMode }),
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
        sessionPlaybackMode: state.sessionPlaybackMode,
        rainDifficulty: state.rainDifficulty,
        streamingSource: state.streamingSource
          ? {
              type: state.streamingSource.type,
              mode: state.streamingSource.mode,
              url: state.streamingSource.url,
              presignedUrl: state.streamingSource.presignedUrl,
              s3Key: state.streamingSource.s3Key,
              language: state.streamingSource.language,
              sessionId: state.streamingSource.sessionId,
            }
          : null,
      }),
    },
  ),
);
