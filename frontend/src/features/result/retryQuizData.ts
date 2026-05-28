import type { GameQuizItem, NormalizedQuiz, RetryQuizItem } from '../../types';

export function mapGameQuizToRetryQuiz(quiz: GameQuizItem, index: number): RetryQuizItem {
  return {
    quiz_id: quiz.quiz_id ?? quiz.quiz_index ?? index,
    quiz_index: quiz.quiz_index ?? index,
    answer_index: quiz.answer_index,
    question: quiz.question,
    options: quiz.options ?? [],
    correct_feedback: quiz.correct_feedback,
    incorrect_feedback: quiz.incorrect_feedback,
    explanation: quiz.explanation,
    trigger_time: quiz.trigger_time,
    segment_range: quiz.segment_range,
  };
}

export function mapNormalizedQuizToRetryQuiz(
  quiz: NormalizedQuiz,
  index: number,
): RetryQuizItem {
  return {
    quiz_id: quiz.quizId ?? index,
    quiz_index: quiz.quizIndex ?? index,
    answer_index: quiz.answerIndex,
    question: quiz.question,
    options: quiz.options,
    correct_feedback: quiz.correctFeedback,
    incorrect_feedback: quiz.incorrectFeedback,
    explanation: quiz.explanation,
    trigger_time: quiz.triggerTime,
    segment_range: quiz.segmentRange,
  };
}
