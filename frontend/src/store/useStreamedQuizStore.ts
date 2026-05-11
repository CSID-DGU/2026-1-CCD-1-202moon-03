import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { RetryQuizItem, StoredRetryQuizSession } from '../types';

interface StreamedQuizState {
  streamedQuizSessions: Record<string, StoredRetryQuizSession>;
  saveStreamedQuizzes: (sessionId: string, quizzes: RetryQuizItem[]) => void;
  getStreamedQuizzes: (sessionId: string) => StoredRetryQuizSession | null;
  clearStreamedQuizzes: (sessionId: string) => void;
  clearAllStreamedQuizzes: () => void;
}

export const useStreamedQuizStore = create<StreamedQuizState>()(
  persist(
    (set, get) => ({
      streamedQuizSessions: {},
      saveStreamedQuizzes: (sessionId, quizzes) =>
        set((state) => ({
          streamedQuizSessions: {
            ...state.streamedQuizSessions,
            [sessionId]: {
              sessionId,
              quizzes,
              updatedAt: Date.now(),
            },
          },
        })),
      getStreamedQuizzes: (sessionId) => get().streamedQuizSessions[sessionId] ?? null,
      clearStreamedQuizzes: (sessionId) =>
        set((state) => {
          const nextSessions = { ...state.streamedQuizSessions };
          delete nextSessions[sessionId];
          return { streamedQuizSessions: nextSessions };
        }),
      clearAllStreamedQuizzes: () => set({ streamedQuizSessions: {} }),
    }),
    {
      name: 'streamed-quiz-store',
      partialize: (state) => ({
        streamedQuizSessions: state.streamedQuizSessions,
      }),
    },
  ),
);
