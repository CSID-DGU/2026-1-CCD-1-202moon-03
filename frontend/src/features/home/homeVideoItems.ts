import { mockHomeVideos, type HomeVideoRecord } from './mockVideos';

export interface HomeVideoItem extends HomeVideoRecord {
  hasThumbnail: boolean;
  isPlaceholder?: boolean;
}

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

function toHomeVideoItem(video: HomeVideoRecord): HomeVideoItem {
  return {
    ...video,
    hasThumbnail: video.id === 'rain-lesson-01',
  };
}

export function buildInitialHomeVideoItems(): HomeVideoItem[] {
  return [...mockHomeVideos.map(toHomeVideoItem), ...placeholderItems];
}
