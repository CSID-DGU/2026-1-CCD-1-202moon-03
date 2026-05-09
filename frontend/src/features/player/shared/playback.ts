import type { SessionSourceType } from '../../../types';

export type PlayerType = 'html5' | 'youtube';

export interface MediaController {
  play: () => Promise<void> | void;
  pause: () => void;
  seek: (time: number) => void;
  setPlaybackRate: (rate: number) => void;
  getCurrentTime: () => number;
  getDuration: () => number;
}

export interface ResolvedPlayerSource {
  playerType: PlayerType;
  playerSrc: string;
}

function getBackendOrigin() {
  const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL ?? '';

  try {
    return new URL(configuredBaseUrl).origin;
  } catch {
    return window.location.origin;
  }
}

function isAbsoluteUrl(value: string) {
  return /^(https?:)?\/\//i.test(value) || value.startsWith('blob:') || value.startsWith('data:');
}

export function resolveMediaUrl(sourceUrl: string) {
  const normalizedSourceUrl = sourceUrl.trim();

  if (!normalizedSourceUrl) {
    return '';
  }

  if (isAbsoluteUrl(normalizedSourceUrl)) {
    if (normalizedSourceUrl.startsWith('//')) {
      return `https:${normalizedSourceUrl}`;
    }

    return normalizedSourceUrl;
  }

  const backendOrigin = getBackendOrigin();
  const relativePath = normalizedSourceUrl.startsWith('/')
    ? normalizedSourceUrl
    : `/${normalizedSourceUrl.replace(/^\.?\//, '')}`;

  try {
    return new URL(relativePath, backendOrigin).toString();
  } catch {
    return normalizedSourceUrl;
  }
}

export function toYoutubeEmbedUrl(sourceUrl: string) {
  const normalizedSourceUrl = sourceUrl.trim();

  if (!normalizedSourceUrl) {
    return '';
  }

  try {
    const parsedUrl = new URL(normalizedSourceUrl);
    const hostname = parsedUrl.hostname.replace(/^www\./, '');
    let videoId = '';

    if (hostname === 'youtu.be') {
      videoId = parsedUrl.pathname.replace(/\//g, '');
    } else if (hostname === 'youtube.com' || hostname === 'm.youtube.com') {
      if (parsedUrl.pathname === '/watch') {
        videoId = parsedUrl.searchParams.get('v') ?? '';
      } else if (parsedUrl.pathname.startsWith('/embed/')) {
        videoId = parsedUrl.pathname.split('/')[2] ?? '';
      } else if (parsedUrl.pathname.startsWith('/shorts/')) {
        videoId = parsedUrl.pathname.split('/')[2] ?? '';
      }
    }

    if (!videoId) {
      return '';
    }

    return `https://www.youtube.com/embed/${videoId}`;
  } catch {
    return '';
  }
}

export function resolvePlayerSource({
  sourceType,
  sourceUrl,
  fallbackSrc,
}: {
  sourceType?: SessionSourceType;
  sourceUrl?: string;
  fallbackSrc: string;
}): ResolvedPlayerSource {
  const normalizedSourceUrl = sourceUrl?.trim() ?? '';

  if (sourceType === 'youtube_url') {
    const embedUrl = toYoutubeEmbedUrl(normalizedSourceUrl);

    if (embedUrl) {
      return {
        playerType: 'youtube',
        playerSrc: embedUrl,
      };
    }
  }

  if (normalizedSourceUrl) {
    return {
      playerType: 'html5',
      playerSrc: resolveMediaUrl(normalizedSourceUrl),
    };
  }

  return {
    playerType: 'html5',
    playerSrc: resolveMediaUrl(fallbackSrc),
  };
}
