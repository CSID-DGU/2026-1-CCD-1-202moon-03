import { useMemo, useState } from 'react';
import { useVideoStore } from '../../store/useVideoStore';

export interface VideoInputValues {
  url: string;
  file: File | null;
}

export interface VideoInputSubmitPayload {
  sourceType: 'url' | 'file';
  url?: string;
  file?: File;
}

const initialValues: VideoInputValues = {
  url: '',
  file: null,
};

export function useVideoInput() {
  const setVideoUrl = useVideoStore((state) => state.setVideoUrl);
  const [values, setValues] = useState<VideoInputValues>(initialValues);

  const isUrlDisabled = Boolean(values.file);
  const isFileDisabled = Boolean(values.url.trim());
  const canSubmit = Boolean(values.url.trim() || values.file);

  const selectedSourceLabel = useMemo(() => {
    if (values.url.trim()) {
      return values.url.trim();
    }

    if (values.file) {
      return values.file.name;
    }

    return '';
  }, [values.file, values.url]);

  const setUrl = (url: string) => {
    setValues((current) => ({
      ...current,
      url,
      file: url.trim() ? null : current.file,
    }));
  };

  const setFile = (file: File | null) => {
    setValues((current) => ({
      url: file ? '' : current.url,
      file,
    }));
  };

  const reset = () => {
    setValues(initialValues);
  };

  const handleSubmit = (): VideoInputSubmitPayload | null => {
    if (values.url.trim()) {
      const nextUrl = values.url.trim();
      setVideoUrl(nextUrl);
      return {
        sourceType: 'url',
        url: nextUrl,
      };
    }

    if (values.file) {
      setVideoUrl(values.file.name);
      return {
        sourceType: 'file',
        file: values.file,
      };
    }

    return null;
  };

  return {
    values,
    canSubmit,
    isUrlDisabled,
    isFileDisabled,
    selectedSourceLabel,
    setUrl,
    setFile,
    reset,
    handleSubmit,
  };
}
