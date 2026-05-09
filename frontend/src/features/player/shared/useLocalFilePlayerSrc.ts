import { useEffect, useRef, useState } from 'react';
import type { StreamingPlayerSource } from '../../../store/usePlayerStore';

export function useLocalFilePlayerSrc(
  sessionId: string | null,
  streamingSource: StreamingPlayerSource | null,
) {
  const [localFileUrl, setLocalFileUrl] = useState('');
  const activeBlobUrlRef = useRef<string | null>(null);

  useEffect(() => {
    const hasMatchingFile =
      streamingSource?.type === 'file' &&
      !!streamingSource.file &&
      String(streamingSource.sessionId ?? '') === String(sessionId ?? '');

    if (!hasMatchingFile) {
      setLocalFileUrl('');
      return;
    }

    const file = streamingSource.file;
    if (!file) {
      setLocalFileUrl('');
      return;
    }

    const nextUrl = URL.createObjectURL(file);
    const previousUrl = activeBlobUrlRef.current;

    activeBlobUrlRef.current = nextUrl;
    setLocalFileUrl(nextUrl);

    if (previousUrl && previousUrl !== nextUrl) {
      URL.revokeObjectURL(previousUrl);
    }

    return () => {
      if (activeBlobUrlRef.current === nextUrl) {
        activeBlobUrlRef.current = null;
      }

      URL.revokeObjectURL(nextUrl);
    };
  }, [sessionId, streamingSource?.file, streamingSource?.sessionId, streamingSource?.type]);

  return localFileUrl;
}
