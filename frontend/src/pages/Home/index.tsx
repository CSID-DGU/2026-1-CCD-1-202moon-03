import { isAxiosError } from 'axios';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ROUTES } from '../../constants/routes';
import { EditVideoTitleModal } from '../../features/home/EditVideoTitleModal';
import ModeSelect from '../../features/home/ModeSelect';
import VideoGrid from '../../features/home/VideoGrid';
import { deleteHomeVideoItem, renameHomeVideoItem } from '../../features/home/homeVideoActions';
import {
  buildHomeVideoItemsFromSessions,
  buildInitialHomeVideoItems,
} from '../../features/home/homeVideoItems';
import UploadVideoModal from '../../features/home/UploadVideoModal';
import type { VideoInputSubmitPayload } from '../../features/home/useVideoInput';
import { getLearningHistory } from '../../services/analytic.api';
import {
  createSessionFromFile,
  createSessionFromUrl,
  deleteSession,
  getSessionList,
  updateSessionTitle,
} from '../../services/session.api';
import { useRainStore } from '../../store/useRainStore';
import { useAuthStore } from '../../store/useAuthStore';
import { usePlayerStore } from '../../store/usePlayerStore';
import type { ApiErrorResponse, SessionMode } from '../../types';

function mapPlayerModeToSessionMode(mode: 'spinner' | 'rain'): SessionMode {
  return mode === 'spinner' ? 'fidget' : 'rain';
}

function mapUrlSourceType(url: string) {
  return /youtube\.com|youtu\.be/.test(url) ? 'youtube_url' : 'private_url';
}

function getSessionResponseId(session: { session_id?: number; id?: number }) {
  return String(session.session_id ?? session.id ?? '');
}

function extractApiErrorMessage(error: unknown, fallbackMessage: string) {
  if (isAxiosError<ApiErrorResponse>(error)) {
    if (error.response?.status === 413) {
      return '파일 용량이 너무 커서 업로드할 수 없어요. 더 작은 mp4 또는 webm 파일로 시도해 주세요.';
    }

    return error.response?.data?.message || error.response?.data?.detail || fallbackMessage;
  }

  return fallbackMessage;
}

function HomePage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const isHydrated = useAuthStore((state) => state.isHydrated);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const rainSessionResults = useRainStore((state) => state.sessionResults);
  const setSelectedMode = usePlayerStore((state) => state.setSelectedMode);
  const setSessionId = usePlayerStore((state) => state.setSessionId);
  const setStreamingSource = usePlayerStore((state) => state.setStreamingSource);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isModeSelectOpen, setIsModeSelectOpen] = useState(false);
  const [pendingSourceLabel, setPendingSourceLabel] = useState('');
  const [pendingUploadPayload, setPendingUploadPayload] = useState<VideoInputSubmitPayload | null>(
    null,
  );
  const [videos, setVideos] = useState(buildInitialHomeVideoItems);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [editingVideoId, setEditingVideoId] = useState<string | null>(null);
  const [isLoadingVideos, setIsLoadingVideos] = useState(false);
  const [videoLoadError, setVideoLoadError] = useState('');
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [isSavingTitle, setIsSavingTitle] = useState(false);
  const [isDeletingVideo, setIsDeletingVideo] = useState(false);

  const replayVideoId = searchParams.get('modeSelect');
  const editingVideo = useMemo(
    () => videos.find((video) => video.id === editingVideoId) ?? null,
    [editingVideoId, videos],
  );

  useEffect(() => {
    if (!replayVideoId) {
      return;
    }

    setPendingSourceLabel(`다시 보기 영상 ${replayVideoId}`);
    setIsModeSelectOpen(true);
  }, [replayVideoId]);

  useEffect(() => {
    if (!isHydrated || !isAuthenticated) {
      return;
    }

    let isCancelled = false;

    const loadSessions = async () => {
      setIsLoadingVideos(true);
      setVideoLoadError('');

      try {
        const [sessionResponse, historyResponse] = await Promise.allSettled([
          getSessionList(),
          getLearningHistory(),
        ]);

        if (isCancelled) {
          return;
        }

        if (sessionResponse.status === 'rejected') {
          throw sessionResponse.reason as unknown;
        }

        const sessions = sessionResponse.value.data;
        const history = historyResponse.status === 'fulfilled' ? historyResponse.value.data : [];

        const scoreMap: Record<string, number> = {};
        history.forEach((item) => {
          if (item.total_score !== undefined) {
            scoreMap[String(item.session_id)] = item.total_score;
          }
        });

        const maxComboMap: Record<string, number> = {};
        Object.entries(rainSessionResults).forEach(([id, result]) => {
          if (result?.maxCombo !== undefined) {
            maxComboMap[id] = result.maxCombo;
          }
        });

        setVideos(buildHomeVideoItemsFromSessions(sessions, scoreMap, maxComboMap));
      } catch (error) {
        if (!isCancelled) {
          setVideoLoadError(
            extractApiErrorMessage(error, '학습 영상 목록을 불러오지 못했습니다.'),
          );
        }
      } finally {
        if (!isCancelled) {
          setIsLoadingVideos(false);
        }
      }
    };

    void loadSessions();

    return () => {
      isCancelled = true;
    };
  }, [isAuthenticated, isHydrated, rainSessionResults]);

  const handleUploadComplete = (payload: VideoInputSubmitPayload) => {
    const sourceLabel =
      payload.sourceType === 'url'
        ? payload.url ?? 'URL 입력 영상'
        : payload.file?.name ?? '업로드한 파일';

    setPendingUploadPayload(payload);
    setPendingSourceLabel(sourceLabel);
    setIsUploadOpen(false);
    setIsModeSelectOpen(true);
    setSearchParams({});
  };

  const handleModeSelect = async (mode: 'spinner' | 'rain') => {
    if (!pendingUploadPayload) {
      setStreamingSource(null);
      setSelectedMode(mode);
      setSessionId(replayVideoId ?? `mock-session-${mode}-${Date.now()}`);
      setIsModeSelectOpen(false);
      navigate(mode === 'spinner' ? ROUTES.PLAYER_SPINNER : ROUTES.PLAYER_RAIN);
      return;
    }

    setIsCreatingSession(true);
    setVideoLoadError('');

    try {
      const sessionMode = mapPlayerModeToSessionMode(mode);
      const response =
        pendingUploadPayload.sourceType === 'url' && pendingUploadPayload.url
          ? await createSessionFromUrl({
              source_type: mapUrlSourceType(pendingUploadPayload.url),
              source_url: pendingUploadPayload.url,
              mode: sessionMode,
            })
          : await createSessionFromFile({
              source_type: 'file',
              file: pendingUploadPayload.file as File,
              mode: sessionMode,
            });

      const [latestSessionResponse, latestHistoryResponse] = await Promise.allSettled([
        getSessionList(),
        getLearningHistory(),
      ]);
      const latestSessions = latestSessionResponse.status === 'fulfilled' ? latestSessionResponse.value.data : [];
      const latestHistory = latestHistoryResponse.status === 'fulfilled' ? latestHistoryResponse.value.data : [];
      const latestScoreMap: Record<string, number> = {};
      latestHistory.forEach((item) => {
        if (item.total_score !== undefined) {
          latestScoreMap[String(item.session_id)] = item.total_score;
        }
      });
      const latestMaxComboMap: Record<string, number> = {};
      Object.entries(useRainStore.getState().sessionResults).forEach(([id, result]) => {
        if (result?.maxCombo !== undefined) {
          latestMaxComboMap[id] = result.maxCombo;
        }
      });
      setVideos(buildHomeVideoItemsFromSessions(latestSessions, latestScoreMap, latestMaxComboMap));
      setPendingUploadPayload(null);
      setPendingSourceLabel('');
      setSelectedMode(mode);
      const nextSessionId = getSessionResponseId(response.data);
      const nextSourceType =
        pendingUploadPayload.sourceType === 'url' && pendingUploadPayload.url
          ? mapUrlSourceType(pendingUploadPayload.url)
          : 'file';

      setSessionId(nextSessionId);
      setStreamingSource(
        nextSourceType === 'youtube_url' || nextSourceType === 'file'
          ? {
              type: nextSourceType,
              mode: sessionMode,
              url: pendingUploadPayload.url,
              file: pendingUploadPayload.file,
              sessionId: nextSessionId,
              language: 'ko',
            }
          : null,
      );
      setIsModeSelectOpen(false);
      navigate(mode === 'spinner' ? ROUTES.PLAYER_SPINNER : ROUTES.PLAYER_RAIN);
    } catch (error) {
      setVideoLoadError(
        extractApiErrorMessage(
          error,
          '세션 생성에 실패했습니다. mp4 또는 webm 파일인지, 그리고 파일 용량이 너무 크지 않은지 확인해 주세요.',
        ),
      );
    } finally {
      setIsCreatingSession(false);
    }
  };

  const closeModeSelect = () => {
    setIsModeSelectOpen(false);
    setPendingSourceLabel('');
    setPendingUploadPayload(null);
    if (replayVideoId) {
      setSearchParams({});
    }
  };

  const requestRenameVideo = (videoId: string, nextTitle: string) => {
    setVideos((current) => renameHomeVideoItem(current, videoId, nextTitle));
  };

  const requestDeleteVideo = async (videoId: string) => {
    if (isDeletingVideo) {
      return;
    }

    if (videoId.startsWith('placeholder-')) {
      setVideos((current) => deleteHomeVideoItem(current, videoId));
      return;
    }

    setIsDeletingVideo(true);
    setVideoLoadError('');

    try {
      await deleteSession(videoId);
      setVideos((current) => deleteHomeVideoItem(current, videoId));
    } catch (error) {
      setVideoLoadError(
        extractApiErrorMessage(error, '영상 삭제에 실패했습니다. 잠시 후 다시 시도해 주세요.'),
      );
    } finally {
      setIsDeletingVideo(false);
    }
  };

  const handleSaveTitle = async (videoId: string, nextTitle: string) => {
    if (videoId.startsWith('placeholder-')) {
      requestRenameVideo(videoId, nextTitle);
      setEditingVideoId(null);
      return;
    }

    setIsSavingTitle(true);
    setVideoLoadError('');

    try {
      await updateSessionTitle(videoId, { title: nextTitle });
      requestRenameVideo(videoId, nextTitle);
      setEditingVideoId(null);
    } catch (error) {
      setVideoLoadError(
        extractApiErrorMessage(error, '제목 수정에 실패했습니다. 잠시 후 다시 시도해 주세요.'),
      );
    } finally {
      setIsSavingTitle(false);
    }
  };

  return (
    <div className="-mx-6 min-h-screen bg-white">
      <div className="mx-auto w-full max-w-[1200px] px-4 pb-20 pt-20 sm:px-5 lg:px-6">
        <section className="space-y-4">
          <div className="space-y-3">
            <div className="justify-start font-paperlogy text-xl font-semibold leading-8 text-zinc-900">
              학습 목록
            </div>
            {isLoadingVideos ? <p className="text-sm text-slate-500">목록을 불러오는 중...</p> : null}
            {videoLoadError ? <p className="text-sm text-rose-500">{videoLoadError}</p> : null}
          </div>

          <VideoGrid
            videos={videos}
            openMenuId={openMenuId}
            onOpenUpload={() => setIsUploadOpen(true)}
            onToggleMenu={(videoId) =>
              setOpenMenuId((current) => (current === videoId ? null : videoId))
            }
            onRequestEdit={(videoId) => {
              setOpenMenuId(null);
              setEditingVideoId(videoId);
            }}
            onRequestDelete={(videoId) => {
              setOpenMenuId(null);
              void requestDeleteVideo(videoId);
            }}
            onCloseMenu={() => setOpenMenuId(null)}
          />
        </section>
      </div>

      <UploadVideoModal
        isOpen={isUploadOpen}
        isSubmitting={isCreatingSession}
        onClose={() => setIsUploadOpen(false)}
        onComplete={handleUploadComplete}
      />

      <EditVideoTitleModal
        video={editingVideo}
        isOpen={Boolean(editingVideo)}
        isSubmitting={isSavingTitle}
        onClose={() => setEditingVideoId(null)}
        onSave={handleSaveTitle}
      />

      {isModeSelectOpen ? (
        <div className="fixed inset-0 z-40 bg-white">
          <ModeSelect onBack={closeModeSelect} onSelect={handleModeSelect} />
        </div>
      ) : null}
    </div>
  );
}

export default HomePage;
