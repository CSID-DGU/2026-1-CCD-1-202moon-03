import type {
  GameFallEventItem,
  GameBlankItem,
  GameQuizItem,
  GameSubtitleItem,
  NormalizedFallEvent,
  NormalizedGameChunk,
  NormalizedGameData,
  NormalizedQuiz,
  NormalizedSegment,
  StartGameResponseData,
  StreamingChapterMeta,
  StreamingChapterReadyEvent,
} from '../../../types';

function uniqueByKey<T>(items: T[], getKey: (item: T) => string) {
  const seen = new Set<string>();

  return items.filter((item) => {
    const key = getKey(item);

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

export function normalizeSegment(
  segment: GameSubtitleItem | {
    segment_id: number;
    start?: number;
    end?: number;
    start_sec?: number;
    end_sec?: number;
    text?: string;
    original_text?: string;
    blank_text?: string;
    blanks?: GameBlankItem[];
  },
  chapterIndex?: number,
): NormalizedSegment {
  const originalText =
    segment.original_text ??
    ('text' in segment ? segment.text ?? '' : '');

  return {
    segmentId: segment.segment_id,
    start: segment.start ?? segment.start_sec ?? 0,
    end: segment.end ?? segment.end_sec ?? 0,
    originalText,
    blankText: segment.blank_text ?? originalText,
    blanks: segment.blanks ?? [],
    chapterIndex,
  };
}

export function normalizeFallEvent(
  event: GameFallEventItem,
  chapterIndex?: number,
): NormalizedFallEvent {
  return {
    keyword: event.keyword,
    targetTime: event.target_time,
    fallWindow: event.fall_window,
    segmentId: event.segment_id,
    chapterIndex,
  };
}

export function normalizeQuiz(quiz: GameQuizItem, fallbackIndex: number, chapterIndex?: number): NormalizedQuiz {
  const fallbackFeedback = quiz.explanation ?? '';

  return {
    quizId: quiz.quiz_id ?? null,
    triggerTime: quiz.trigger_time,
    segmentRange: quiz.segment_range,
    question: quiz.question,
    options: quiz.options ?? [],
    answerIndex: quiz.answer_index,
    correctFeedback: quiz.correct_feedback ?? fallbackFeedback,
    incorrectFeedback: quiz.incorrect_feedback ?? fallbackFeedback,
    chapterIndex,
  };
}

export function buildChunkFromStoredGame(data: StartGameResponseData): NormalizedGameChunk {
  return {
    chapterIndex: 0,
    segments: (data.subtitles ?? []).map((segment) => normalizeSegment(segment, 0)),
    fallEvents: (data.fall_events ?? []).map((event) => normalizeFallEvent(event, 0)),
    quizzes: (data.quizzes ?? []).map((quiz, index) => normalizeQuiz(quiz, index, 0)),
  };
}

export function buildChunkFromStreamingEvent(
  event: StreamingChapterReadyEvent,
): NormalizedGameChunk {
  const subtitleItems = event.segments ?? event.subtitles ?? event.corrected_subtitles ?? [];

  return {
    chapterIndex: event.chapter_index,
    segments: subtitleItems.map((segment) => normalizeSegment(segment, event.chapter_index)),
    fallEvents: (event.fall_events ?? []).map((fallEvent) =>
      normalizeFallEvent(fallEvent, event.chapter_index),
    ),
    quizzes: (event.quizzes ?? []).map((quiz, index) =>
      normalizeQuiz(quiz, index, event.chapter_index),
    ),
  };
}

export function mergeGameChunk(
  current: NormalizedGameData,
  chunk: NormalizedGameChunk,
): NormalizedGameData {
  const nextSegments = uniqueByKey(
    [...current.segments, ...chunk.segments].sort((left, right) => left.start - right.start),
    (segment) => `${segment.segmentId}:${segment.start}:${segment.end}`,
  );
  const nextFallEvents = uniqueByKey(
    [...current.fallEvents, ...chunk.fallEvents].sort(
      (left, right) => left.targetTime - right.targetTime,
    ),
    (event) => `${event.segmentId}:${event.keyword}:${event.targetTime}`,
  );
  const nextQuizzes = uniqueByKey(
    [...current.quizzes, ...chunk.quizzes].sort(
      (left, right) => left.triggerTime - right.triggerTime,
    ),
    (quiz) => `${quiz.quizId}:${quiz.triggerTime}`,
  );
  const loadedChapterIndexes = Array.from(
    new Set([...current.loadedChapterIndexes, chunk.chapterIndex]),
  ).sort((left, right) => left - right);

  return {
    ...current,
    segments: nextSegments,
    fallEvents: nextFallEvents,
    quizzes: nextQuizzes,
    loadedChapterIndexes,
  };
}

export function createEmptyNormalizedGameData(): NormalizedGameData {
  return {
    sessionId: null,
    mode: null,
    durationSec: 0,
    segments: [],
    fallEvents: [],
    quizzes: [],
    chapters: [],
    loadedChapterIndexes: [],
    isComplete: false,
  };
}

export function createNormalizedGameFromStoredData(
  data: StartGameResponseData,
): NormalizedGameData {
  const chunk = buildChunkFromStoredGame(data);

  return {
    sessionId: data.session_id ?? null,
    mode: data.mode ?? null,
    durationSec: data.duration_sec ?? 0,
    segments: chunk.segments,
    fallEvents: chunk.fallEvents,
    quizzes: chunk.quizzes,
    chapters: [],
    loadedChapterIndexes: [0],
    isComplete: true,
  };
}

export function applyStreamingInit(
  current: NormalizedGameData,
  payload: { sessionId?: number; totalDuration: number; chapters: StreamingChapterMeta[] },
): NormalizedGameData {
  return {
    ...current,
    sessionId: payload.sessionId ?? current.sessionId,
    durationSec: payload.totalDuration,
    chapters: payload.chapters,
  };
}
