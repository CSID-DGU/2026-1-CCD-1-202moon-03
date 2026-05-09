export type HomeLearningMode = 'rain' | 'spinner';

export interface HomeVideoRecord {
  id: string;
  title: string;
  thumbnailLabel: string;
  thumbnailColor: string;
  mode: HomeLearningMode;
  learnedAt: string;
  achievedAt?: string;
  score?: number;
  maxCombo?: number;
  aiSummary: string;
  keywords: string[];
}

export const mockHomeVideos: HomeVideoRecord[] = [
  {
    id: 'rain-lesson-01',
    title: 'TED Listening Practice',
    thumbnailLabel: 'TED',
    thumbnailColor: 'from-sky-500 to-indigo-500',
    mode: 'rain',
    learnedAt: '2026-04-21',
    score: 920,
    maxCombo: 18,
    aiSummary:
      'The speaker explains how deliberate practice improves listening retention and recall in real conversations.',
    keywords: ['deliberate', 'retention', 'recall', 'practice'],
  },
  {
    id: 'spinner-lesson-02',
    title: 'Business English Meeting Notes',
    thumbnailLabel: 'MEET',
    thumbnailColor: 'from-amber-400 to-orange-500',
    mode: 'spinner',
    learnedAt: '2026-04-19',
    achievedAt: '2026-04-20',
    aiSummary:
      'This session focused on extracting action items, agenda shifts, and decision keywords from a meeting clip.',
    keywords: ['agenda', 'decision', 'follow-up', 'alignment'],
  },
  {
    id: 'rain-lesson-03',
    title: 'Interview Shadowing Session',
    thumbnailLabel: 'INTV',
    thumbnailColor: 'from-emerald-400 to-teal-500',
    mode: 'rain',
    learnedAt: '2026-04-17',
    score: 870,
    maxCombo: 12,
    aiSummary:
      'The learner practiced listening for concise answers, confidence markers, and role-specific terminology.',
    keywords: ['confidence', 'role', 'answer', 'experience'],
  },
  {
    id: 'spinner-lesson-04',
    title: 'Documentary Keyword Review',
    thumbnailLabel: 'DOCU',
    thumbnailColor: 'from-fuchsia-500 to-rose-500',
    mode: 'spinner',
    learnedAt: '2026-04-13',
    achievedAt: '2026-04-14',
    aiSummary:
      'The documentary session emphasized repeated domain keywords and contextual listening around technical narration.',
    keywords: ['domain', 'narration', 'context', 'technical'],
  },
];

export function getMockVideoById(videoId: string | null) {
  return mockHomeVideos.find((video) => video.id === videoId) ?? mockHomeVideos[0];
}
