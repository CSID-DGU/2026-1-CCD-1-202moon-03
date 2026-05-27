import { useCallback, useMemo, useRef, useState } from 'react';
import { startGame } from '../../services/game.api';
import { retryQuiz } from '../../services/quiz.api';
import { useStreamedQuizStore } from '../../store/useStreamedQuizStore';
import type { ApiErrorResponse, RetryQuizItem } from '../../types';
import { mapGameQuizToRetryQuiz } from './retryQuizData';

const DEFAULT_CORRECT_FEEDBACK = '정답입니다.';
const DEFAULT_INCORRECT_FEEDBACK = '오답입니다. 다시 확인해 보세요.';
const EMPTY_QUIZ_MESSAGE = '다시 풀 수 있는 퀴즈가 없습니다.';
const DEFAULT_LOAD_ERROR = '퀴즈를 다시 불러오지 못했습니다.';

interface QuizRetryState {
  isOpen: boolean;
  isLoading: boolean;
  loadError: string;
  quizzes: RetryQuizItem[];
  currentQuizIndex: number;
  selectedIndex: number | null;
  feedback: string;
  explanation: string;
  isCorrect: boolean | null;
  isCompleted: boolean;
}

function createInitialState(): QuizRetryState {
  return {
    isOpen: false,
    isLoading: false,
    loadError: '',
    quizzes: [],
    currentQuizIndex: 0,
    selectedIndex: null,
    feedback: '',
    explanation: '',
    isCorrect: null,
    isCompleted: false,
  };
}

function getErrorMessage(error: unknown) {
  const apiError = error as { response?: { data?: ApiErrorResponse } };

  return apiError?.response?.data?.message || apiError?.response?.data?.detail || DEFAULT_LOAD_ERROR;
}

async function loadRetryQuizzes(sessionId: string) {
  const retryResponse = await retryQuiz(sessionId);
  const retryQuizzes = retryResponse.data?.quizzes ?? [];

  if (retryQuizzes.length > 0) {
    return retryQuizzes;
  }

  const startGameResponse = await startGame(sessionId);
  const fallbackQuizzes = startGameResponse.data?.quizzes ?? [];

  return fallbackQuizzes.map(mapGameQuizToRetryQuiz);
}

export function useQuizRetry(sessionId: string) {
  const [state, setState] = useState<QuizRetryState>(createInitialState);
  const requestIdRef = useRef(0);
  const streamedQuizSession = useStreamedQuizStore((store) =>
    sessionId ? store.streamedQuizSessions[sessionId] ?? null : null,
  );

  const openQuizRetry = useCallback(() => {
    if (!sessionId) {
      setState({
        ...createInitialState(),
        isOpen: true,
        loadError: DEFAULT_LOAD_ERROR,
      });
      return;
    }

    if ((streamedQuizSession?.quizzes.length ?? 0) > 0) {
      setState({
        ...createInitialState(),
        isOpen: true,
        quizzes: streamedQuizSession?.quizzes ?? [],
      });
      return;
    }

    const nextRequestId = requestIdRef.current + 1;
    requestIdRef.current = nextRequestId;

    setState({
      ...createInitialState(),
      isOpen: true,
      isLoading: true,
    });

    void loadRetryQuizzes(sessionId)
      .then((quizzes) => {
        if (requestIdRef.current !== nextRequestId) {
          return;
        }

        setState({
          ...createInitialState(),
          isOpen: true,
          quizzes,
          loadError: quizzes.length === 0 ? EMPTY_QUIZ_MESSAGE : '',
        });
      })
      .catch((error: unknown) => {
        if (requestIdRef.current !== nextRequestId) {
          return;
        }

        setState({
          ...createInitialState(),
          isOpen: true,
          loadError: getErrorMessage(error),
        });
      });
  }, [sessionId, streamedQuizSession]);

  const closeQuizRetry = useCallback(() => {
    requestIdRef.current += 1;
    setState(createInitialState());
  }, []);

  const restartQuizRetry = useCallback(() => {
    setState((current) => ({
      ...current,
      currentQuizIndex: 0,
      selectedIndex: null,
      feedback: '',
      explanation: '',
      isCorrect: null,
      isCompleted: false,
    }));
  }, []);

  const selectOption = useCallback((index: number) => {
    setState((current) => {
      const quiz = current.quizzes[current.currentQuizIndex];

      if (!quiz || current.selectedIndex !== null || current.isCompleted) {
        return current;
      }

      const isCorrect = index === quiz.answer_index;
      const feedback = isCorrect
        ? quiz.correct_feedback || DEFAULT_CORRECT_FEEDBACK
        : quiz.incorrect_feedback || DEFAULT_INCORRECT_FEEDBACK;

      return {
        ...current,
        selectedIndex: index,
        feedback,
        explanation: quiz.explanation || '',
        isCorrect,
      };
    });
  }, []);

  const continueQuizRetry = useCallback(() => {
    setState((current) => {
      if (current.selectedIndex === null) {
        return current;
      }

      const nextQuizIndex = current.currentQuizIndex + 1;

      if (nextQuizIndex >= current.quizzes.length) {
        return {
          ...current,
          selectedIndex: null,
          feedback: '',
          explanation: '',
          isCorrect: null,
          isCompleted: true,
        };
      }

      return {
        ...current,
        currentQuizIndex: nextQuizIndex,
        selectedIndex: null,
        feedback: '',
        explanation: '',
        isCorrect: null,
      };
    });
  }, []);

  const currentQuiz = useMemo(
    () => state.quizzes[state.currentQuizIndex] ?? null,
    [state.currentQuizIndex, state.quizzes],
  );

  return {
    ...state,
    currentQuiz,
    currentIndex: currentQuiz ? state.currentQuizIndex + 1 : 0,
    totalCount: state.quizzes.length,
    openQuizRetry,
    closeQuizRetry,
    restartQuizRetry,
    selectOption,
    continueQuizRetry,
  };
}
