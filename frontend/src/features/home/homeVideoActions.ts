import type { HomeVideoItem } from './homeVideoItems';

export function renameHomeVideoItem(
  videos: HomeVideoItem[],
  videoId: string,
  nextTitle: string,
): HomeVideoItem[] {
  return videos.map((video) =>
    video.id === videoId
      ? {
          ...video,
          title: nextTitle,
        }
      : video,
  );
}

export function deleteHomeVideoItem(videos: HomeVideoItem[], videoId: string): HomeVideoItem[] {
  return videos.filter((video) => video.id !== videoId);
}
