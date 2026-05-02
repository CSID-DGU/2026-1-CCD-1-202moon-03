import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getMockVideoById } from '../home/mockVideos';

export function useResult() {
  const [searchParams] = useSearchParams();
  const videoId = searchParams.get('videoId');

  const video = useMemo(() => getMockVideoById(videoId), [videoId]);

  return {
    video,
    title: video.title,
    summary: video.aiSummary,
    highlightedKeywords: video.keywords,
  };
}
