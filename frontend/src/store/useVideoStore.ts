import { create } from 'zustand';

interface VideoState {
  videoUrl: string;
  currentTime: number;
  isPlaying: boolean;
  setVideoUrl: (videoUrl: string) => void;
  setCurrentTime: (currentTime: number) => void;
  setIsPlaying: (isPlaying: boolean) => void;
}

export const useVideoStore = create<VideoState>((set) => ({
  videoUrl: '',
  currentTime: 0,
  isPlaying: false,
  setVideoUrl: (videoUrl) => set({ videoUrl }),
  setCurrentTime: (currentTime) => set({ currentTime }),
  setIsPlaying: (isPlaying) => set({ isPlaying }),
}));
