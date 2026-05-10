import { useEffect, useRef, useState } from 'react';
import { useAuthStore } from '../../../store/useAuthStore';
import { resolveMediaUrl } from './playback';

export function useAuthenticatedVideoUrl({
  enabled,
  sourceUrl,
}: {
  enabled: boolean;
  sourceUrl?: string | null;
}) {
  const accessToken = useAuthStore((state) => state.accessToken);
  const [blobUrl, setBlobUrl] = useState('');
  const activeBlobUrlRef = useRef<string | null>(null);

  useEffect(() => {
    if (!enabled || !sourceUrl || !accessToken) {
      setBlobUrl('');
      return;
    }

    const resolvedUrl = resolveMediaUrl(sourceUrl);
    if (!resolvedUrl) {
      setBlobUrl('');
      return;
    }

    const controller = new AbortController();

    const run = async () => {
      try {
        const response = await fetch(resolvedUrl, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`video fetch failed: ${response.status}`);
        }

        const videoBlob = await response.blob();
        const nextBlobUrl = URL.createObjectURL(videoBlob);
        const previousBlobUrl = activeBlobUrlRef.current;

        activeBlobUrlRef.current = nextBlobUrl;
        setBlobUrl(nextBlobUrl);

        if (previousBlobUrl && previousBlobUrl !== nextBlobUrl) {
          URL.revokeObjectURL(previousBlobUrl);
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          console.log('[useAuthenticatedVideoUrl] fetch failed', {
            sourceUrl: resolvedUrl,
            error,
          });
          setBlobUrl('');
        }
      }
    };

    void run();

    return () => {
      controller.abort();

      const currentBlobUrl = activeBlobUrlRef.current;
      if (currentBlobUrl) {
        activeBlobUrlRef.current = null;
        URL.revokeObjectURL(currentBlobUrl);
      }
    };
  }, [accessToken, enabled, sourceUrl]);

  return blobUrl;
}
