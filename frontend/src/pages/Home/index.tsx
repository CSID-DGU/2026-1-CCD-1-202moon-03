import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ROUTES } from '../../constants/routes';
import { EditVideoTitleModal } from '../../features/home/EditVideoTitleModal';
import ModeSelect from '../../features/home/ModeSelect';
import VideoGrid from '../../features/home/VideoGrid';
import { deleteHomeVideoItem, renameHomeVideoItem } from '../../features/home/homeVideoActions';
import { buildInitialHomeVideoItems } from '../../features/home/homeVideoItems';
import UploadVideoModal from '../../features/home/UploadVideoModal';
import type { VideoInputSubmitPayload } from '../../features/home/useVideoInput';
import { usePlayerStore } from '../../store/usePlayerStore';

function HomePage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const setSelectedMode = usePlayerStore((state) => state.setSelectedMode);
  const setSessionId = usePlayerStore((state) => state.setSessionId);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isModeSelectOpen, setIsModeSelectOpen] = useState(false);
  const [pendingSourceLabel, setPendingSourceLabel] = useState('');
  const [videos, setVideos] = useState(buildInitialHomeVideoItems);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [editingVideoId, setEditingVideoId] = useState<string | null>(null);

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

  const handleUploadComplete = (payload: VideoInputSubmitPayload) => {
    const sourceLabel =
      payload.sourceType === 'url'
        ? payload.url ?? 'URL 입력 영상'
        : payload.file?.name ?? '업로드한 파일';

    setPendingSourceLabel(sourceLabel);
    setIsUploadOpen(false);
    setIsModeSelectOpen(true);
    setSearchParams({});
  };

  const handleModeSelect = (mode: 'spinner' | 'rain') => {
    setSelectedMode(mode);
    setSessionId(replayVideoId ?? `mock-session-${mode}-${Date.now()}`);
    setIsModeSelectOpen(false);
    navigate(mode === 'spinner' ? ROUTES.PLAYER_SPINNER : ROUTES.PLAYER_RAIN);
  };

  const closeModeSelect = () => {
    setIsModeSelectOpen(false);
    setPendingSourceLabel('');
    if (replayVideoId) {
      setSearchParams({});
    }
  };

  const requestRenameVideo = (videoId: string, nextTitle: string) => {
    setVideos((current) => renameHomeVideoItem(current, videoId, nextTitle));
  };

  const requestDeleteVideo = (videoId: string) => {
    setVideos((current) => deleteHomeVideoItem(current, videoId));
  };

  const handleSaveTitle = (videoId: string, nextTitle: string) => {
    requestRenameVideo(videoId, nextTitle);
    setEditingVideoId(null);
  };

  return (
    <div className="-mx-6 min-h-screen bg-white">
      <div className="mx-auto w-full max-w-[1200px] px-4 pb-20 pt-20 sm:px-5 lg:px-6">
        <section className="space-y-4">
          <div className="space-y-3">
            <div className="justify-start font-paperlogy text-xl font-semibold leading-8 text-zinc-900">
              학습 목록
            </div>
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
              requestDeleteVideo(videoId);
            }}
            onCloseMenu={() => setOpenMenuId(null)}
          />
        </section>
      </div>

      <UploadVideoModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onComplete={handleUploadComplete}
      />

      <EditVideoTitleModal
        video={editingVideo}
        isOpen={Boolean(editingVideo)}
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
