import type { SessionListItem } from '../../types';
import { formatDisplayDate } from '../../utils/format';
import { mockHomeVideos, type HomeVideoRecord } from './mockVideos';

export interface HomeVideoItem extends HomeVideoRecord {
  hasThumbnail: boolean;
  isPlaceholder?: boolean;
  thumbnailUrl?: string;
}

const thumbnailPalette = [
  'from-sky-500 to-indigo-500',
  'from-amber-400 to-orange-500',
  'from-emerald-400 to-teal-500',
  'from-fuchsia-500 to-rose-500',
  'from-cyan-500 to-blue-500',
  'from-lime-500 to-emerald-500',
] as const;

const placeholderItems: HomeVideoItem[] = Array.from({ length: 5 }, (_, index) => ({
  id: `placeholder-${index + 1}`,
  title: '영상 제목',
  thumbnailLabel: 'EMPTY',
  thumbnailColor: 'from-slate-200 to-slate-300',
  mode: 'spinner',
  learnedAt: '날짜',
  aiSummary: '',
  keywords: [],
  hasThumbnail: false,
  isPlaceholder: true,
}));

function buildThumbnailLabel(title: string) {
  const sanitized = title.replace(/\s+/g, '').toUpperCase();
  return sanitized.slice(0, 4) || 'TADA';
}

function mapSessionModeToHomeMode(mode: SessionListItem['mode']): HomeVideoItem['mode'] {
  return mode === 'fidget' ? 'spinner' : 'rain';
}

function getSessionItemId(session: SessionListItem, index: number) {
  return String(session.session_id ?? session.id ?? `session-${index}`);
}

function toHomeVideoItem(video: HomeVideoRecord): HomeVideoItem {
  return {
    ...video,
    hasThumbnail: video.id === 'rain-lesson-01',
  };
}

export function buildInitialHomeVideoItems(): HomeVideoItem[] {
  return [...mockHomeVideos.map(toHomeVideoItem), ...placeholderItems];
}

export function buildHomeVideoItemsFromSessions(sessions: SessionListItem[]): HomeVideoItem[] {
  if (sessions.length === 0) {
    return placeholderItems;
  }

  return sessions.map((session, index) => ({
    id: getSessionItemId(session, index),
    title: session.title,
    thumbnailLabel: buildThumbnailLabel(session.title),
    thumbnailColor: thumbnailPalette[index % thumbnailPalette.length],
    mode: mapSessionModeToHomeMode(session.mode),
    learnedAt: formatDisplayDate(new Date(session.created_at)),
    aiSummary: '',
    keywords: [],
    hasThumbnail: Boolean(session.thumbnail_url),
    thumbnailUrl: session.thumbnail_url || undefined,
  }));
}
