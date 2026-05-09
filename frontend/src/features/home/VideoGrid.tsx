import type { HomeVideoItem } from './homeVideoItems';
import VideoCard from './VideoCard';

interface VideoGridProps {
  videos: HomeVideoItem[];
  openMenuId: string | null;
  onOpenUpload: () => void;
  onToggleMenu: (videoId: string) => void;
  onRequestEdit: (videoId: string) => void;
  onRequestDelete: (videoId: string) => void;
  onCloseMenu: () => void;
}

function VideoGrid({
  videos,
  openMenuId,
  onOpenUpload,
  onToggleMenu,
  onRequestEdit,
  onRequestDelete,
  onCloseMenu,
}: VideoGridProps) {
  return (
    <>
      <section className="grid grid-cols-1 gap-x-5 gap-y-4 md:grid-cols-2 xl:grid-cols-3">
        {videos.map((video) => (
          <VideoCard
            key={video.id}
            video={video}
            isMenuOpen={openMenuId === video.id}
            onToggleMenu={onToggleMenu}
            onRequestEdit={onRequestEdit}
            onRequestDelete={onRequestDelete}
            onCloseMenu={onCloseMenu}
          />
        ))}
      </section>

      <button
        type="button"
        onClick={onOpenUpload}
        aria-label="영상 업로드"
        className="fixed bottom-8 right-8 z-20 flex h-20 w-20 items-center justify-center rounded-full bg-[#1A9AF5] text-white shadow-[0_16px_32px_rgba(26,154,245,0.32)] transition-all duration-200 hover:scale-[1.03] hover:bg-[#1492EC]"
      >
        <svg
          aria-hidden="true"
          width="40"
          height="40"
          viewBox="0 0 40 40"
          className="h-10 w-10"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M20 34.1849C18.619 34.1849 17.5 33.0659 17.5 31.6849V8.31494C17.5 6.93394 18.619 5.81494 20 5.81494C21.381 5.81494 22.5 6.93394 22.5 8.31494V31.6849C22.5 33.0659 21.381 34.1849 20 34.1849Z"
            fill="white"
          />
          <path
            d="M31.6849 22.5H8.31494C6.93394 22.5 5.81494 21.381 5.81494 20C5.81494 18.619 6.93394 17.5 8.31494 17.5H31.6849C33.0659 17.5 34.1849 18.619 34.1849 20C34.1849 21.381 33.0659 22.5 31.6849 22.5Z"
            fill="white"
          />
        </svg>
      </button>
    </>
  );
}

export default VideoGrid;
