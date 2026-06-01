const DEFAULT_THUMBNAIL_TYPE = 'image/jpeg';
const DEFAULT_THUMBNAIL_QUALITY = 0.85;
const MAX_THUMBNAIL_WIDTH = 640;
const THUMBNAIL_CAPTURE_TIME_SECONDS = 4;
const THUMBNAIL_CAPTURE_END_BUFFER_SECONDS = 0.1;
const FRAME_RENDER_WAIT_MS = 80;

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

function waitForAnimationFrame() {
  return new Promise<void>((resolve) => {
    requestAnimationFrame(() => resolve());
  });
}

function waitForTimeout(durationMs: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, durationMs);
  });
}

async function waitForSeekedFrame(video: HTMLVideoElement) {
  if (video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
    await waitForEvent(video, 'loadeddata');
  }

  // Let the browser paint the seeked frame before drawing it to canvas.
  await waitForAnimationFrame();
  await waitForAnimationFrame();
  await waitForTimeout(FRAME_RENDER_WAIT_MS);
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

function getCaptureTime(duration: number) {
  if (!Number.isFinite(duration) || duration <= 0) {
    return THUMBNAIL_CAPTURE_TIME_SECONDS;
  }

  return Math.min(
    THUMBNAIL_CAPTURE_TIME_SECONDS,
    Math.max(duration - THUMBNAIL_CAPTURE_END_BUFFER_SECONDS, 0),
  );
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

  video.preload = 'auto';
  video.muted = true;
  video.playsInline = true;
  video.src = objectUrl;

  try {
    console.log('[videoThumbnail] loadedmetadata waiting', {
      fileName: file.name,
      fileSize: file.size,
    });
    await waitForEvent(video, 'loadedmetadata');

    const captureTime = getCaptureTime(video.duration);
    console.log('[videoThumbnail] metadata ready', {
      duration: video.duration,
      captureTime,
      videoWidth: video.videoWidth,
      videoHeight: video.videoHeight,
    });

    video.currentTime = captureTime;
    await waitForEvent(video, 'seeked');
    console.log('[videoThumbnail] seeked', {
      currentTime: video.currentTime,
      readyState: video.readyState,
    });

    await waitForSeekedFrame(video);
    console.log('[videoThumbnail] frame ready', {
      currentTime: video.currentTime,
      readyState: video.readyState,
    });

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
    console.log('[videoThumbnail] drawImage complete', {
      width,
      height,
    });

    return canvasToBlob(canvas, type, quality);
  } finally {
    video.pause();
    video.removeAttribute('src');
    video.load();
    URL.revokeObjectURL(objectUrl);
  }
}
