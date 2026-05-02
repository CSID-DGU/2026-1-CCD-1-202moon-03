import { useState } from 'react';
import { Link } from 'react-router-dom';
import featuredThumbnail from '../../assets/home-thumbnail.png';
import { ROUTES } from '../../constants/routes';
import type { HomeVideoItem } from './homeVideoItems';
import { HomeVideoMenu } from './HomeVideoMenu';

interface VideoCardProps {
  video: HomeVideoItem;
  isMenuOpen: boolean;
  onToggleMenu: (videoId: string) => void;
  onRequestEdit: (videoId: string) => void;
  onRequestDelete: (videoId: string) => void;
  onCloseMenu: () => void;
}

function VideoCard({
  video,
  isMenuOpen,
  onToggleMenu,
  onRequestEdit,
  onRequestDelete,
  onCloseMenu,
}: VideoCardProps) {
  const [isThumbnailHovered, setIsThumbnailHovered] = useState(false);
  const detailHref = `${ROUTES.RESULT}?videoId=${encodeURIComponent(video.id)}`;
  const hoverModeLabel = video.mode === 'rain' ? '집중호우' : '피젯스피너';
  const showHoverSummary = !video.isPlaceholder;

  return (
    <article className="relative overflow-visible">
      <Link
        to={detailHref}
        className="relative block overflow-hidden rounded-[20px] border border-[#DEE3EC] bg-white shadow-[0_1px_3px_rgba(15,23,42,0.04)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_16px_36px_rgba(15,23,42,0.1)]"
      >
        <div
          className={`relative aspect-[1.86/1] ${
            video.hasThumbnail ? 'bg-[#D7DBE4]' : 'bg-[#F1F3F7]'
          }`}
          onMouseEnter={() => setIsThumbnailHovered(true)}
          onMouseLeave={() => setIsThumbnailHovered(false)}
        >
          {video.hasThumbnail ? (
            <img src={featuredThumbnail} alt={video.title} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center">
              <PlaceholderImageIcon />
            </div>
          )}

          {showHoverSummary ? (
            <div
              className={`pointer-events-none absolute inset-0 overflow-hidden transition-opacity duration-200 ${
                isThumbnailHovered ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0)_0%,rgba(0,0,0,0.8)_100%)] backdrop-blur-[4px]" />
              <div
                className={`absolute inset-x-0 bottom-0 px-4 text-white ${
                  video.mode === 'spinner' ? 'pb-6' : 'pb-4'
                }`}
              >
                <div className="space-y-1 text-[15px] leading-[1.5]">
                  <div className="flex items-center justify-between gap-4">
                    <span className="font-paperlogy text-white/88">모드</span>
                    <span className="font-paperlogy font-medium text-white">{hoverModeLabel}</span>
                  </div>

                  {video.mode === 'rain' ? (
                    <>
                      <div className="flex items-center justify-between gap-4">
                        <span className="font-paperlogy text-white/88">점수</span>
                        <span className="font-paperlogy font-medium text-white">
                          {video.score ?? 0}점
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <span className="font-paperlogy text-white/88">최대 콤보수</span>
                        <span className="font-paperlogy font-medium text-white">
                          {video.maxCombo ?? 0}
                        </span>
                      </div>
                    </>
                  ) : null}
                </div>
              </div>
            </div>
          ) : null}
        </div>

        <div className="relative space-y-1.5 px-3.5 py-4">
          <h2 className="pr-10 text-[16px] font-semibold leading-[1.5] tracking-[-0.02em] text-[#20232B]">
            {video.title}
          </h2>
          <p className="text-[14px] leading-[1.5] text-[#8F96A3]">{video.learnedAt}</p>
        </div>
      </Link>

      <div className="absolute right-3 top-[calc(100%-64px)] z-20">
        <button
          type="button"
          aria-label={`${video.title} 더보기`}
          aria-haspopup="menu"
          aria-expanded={isMenuOpen}
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            onToggleMenu(video.id);
          }}
          className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors ${
            isMenuOpen
              ? 'bg-[#F3F5F9] text-[#15171C]'
              : 'text-[#15171C] hover:bg-[#F3F5F9]'
          }`}
        >
          <DotsVerticalIcon />
        </button>

        <HomeVideoMenu
          isOpen={isMenuOpen}
          onClose={onCloseMenu}
          onEdit={() => onRequestEdit(video.id)}
          onDelete={() => onRequestDelete(video.id)}
        />
      </div>
    </article>
  );
}

function DotsVerticalIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="12" cy="5" r="1.8" fill="currentColor" />
      <circle cx="12" cy="12" r="1.8" fill="currentColor" />
      <circle cx="12" cy="19" r="1.8" fill="currentColor" />
    </svg>
  );
}

function PlaceholderImageIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 48 48"
      className="h-14 w-14 text-[#C9D1E0]"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="7" y="7" width="34" height="34" rx="6" stroke="currentColor" strokeWidth="3" />
      <circle cx="17" cy="18" r="4" fill="currentColor" />
      <path d="M13 33L22 24L28 29L33 23L35 25V33H13Z" fill="currentColor" />
    </svg>
  );
}

export default VideoCard;
