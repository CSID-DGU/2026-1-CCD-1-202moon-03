const DEFAULT_THUMBNAIL_TYPE = 'image/jpeg';
const DEFAULT_THUMBNAIL_QUALITY = 0.85;
const MAX_THUMBNAIL_WIDTH = 640;

function waitForEvent<T extends Event>(target: EventTarget, eventName: string) {
  return new Promise<T>((resolve, reject) => {
    const handleSuccess = (event: Event) => {
      cleanup();
      resolve(event as T);
    };

    const handleFailure = () => {
      cleanup();
      reject(new Error('썸네일 생성을 위한 영상 프레임을 불러오지 못했습니다.'));
    };

    const cleanup = () => {
      target.removeEventListener(eventName, handleSuccess);
      target.removeEventListener('error', handleFailure);
    };

    target.addEventListener(eventName, handleSuccess, { once: true });
    target.addEventListener('error', handleFailure, { once: true });
  });
}

function getThumbnailSize(videoWidth: number, videoHeight: number) {
  if (videoWidth <= MAX_THUMBNAIL_WIDTH) {
    return {
      width: videoWidth,
      height: videoHeight,
    };
  }

  const scale = MAX_THUMBNAIL_WIDTH / videoWidth;

  return {
    width: Math.round(videoWidth * scale),
    height: Math.round(videoHeight * scale),
  };
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('썸네일 이미지를 만들지 못했습니다.'));
        return;
      }

      resolve(blob);
    }, type, quality);
  });
}

export async function createThumbnailFromVideoFile(
  file: File,
  {
    type = DEFAULT_THUMBNAIL_TYPE,
    quality = DEFAULT_THUMBNAIL_QUALITY,
  }: {
    type?: string;
    quality?: number;
  } = {},
) {
  const objectUrl = URL.createObjectURL(file);
  const video = document.createElement('video');

  video.preload = 'metadata';
  video.muted = true;
  video.playsInline = true;
  video.src = objectUrl;

  try {
    await waitForEvent(video, 'loadeddata');

    if (!video.videoWidth || !video.videoHeight) {
      throw new Error('영상 크기를 확인할 수 없어 썸네일을 생성하지 못했습니다.');
    }

    const { width, height } = getThumbnailSize(video.videoWidth, video.videoHeight);
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext('2d');

    if (!context) {
      throw new Error('썸네일 캔버스를 초기화하지 못했습니다.');
    }

    context.drawImage(video, 0, 0, width, height);

    return canvasToBlob(canvas, type, quality);
  } finally {
    video.pause();
    video.removeAttribute('src');
    video.load();
    URL.revokeObjectURL(objectUrl);
  }
}
