import { useState } from 'react';
import { useVideoStore } from '../../store/useVideoStore';

export interface VideoInputValues {
  youtubeUrl: string;
  personalVideoLink: string;
  audioFile: File | null;
}

const initialValues: VideoInputValues = {
  youtubeUrl: '',
  personalVideoLink: '',
  audioFile: null,
};

export function useVideoInput() {
  const setVideoUrl = useVideoStore((state) => state.setVideoUrl);
  const [values, setValues] = useState<VideoInputValues>(initialValues);
  const [isModeSelectVisible, setIsModeSelectVisible] = useState(false);

  const updateField = <Key extends keyof VideoInputValues>(
    field: Key,
    value: VideoInputValues[Key],
  ) => {
    setValues((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = () => {
    const resolvedUrl =
      values.youtubeUrl.trim() || values.personalVideoLink.trim() || values.audioFile?.name || '';

    setVideoUrl(resolvedUrl);
    setIsModeSelectVisible(true);
  };

  return {
    values,
    isModeSelectVisible,
    updateField,
    handleSubmit,
  };
}
