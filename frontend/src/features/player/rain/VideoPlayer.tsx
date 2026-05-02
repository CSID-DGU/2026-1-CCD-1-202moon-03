import type { ReactNode } from 'react';
import type { PlaybackRate } from './types';

interface VideoPlayerProps {
  lessonTitle: string;
  subtitle: string;
  videoEmbedUrl: string;
  captionText: string;
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  playbackRate: PlaybackRate;
  isSpeedMenuOpen: boolean;
  speedOptions: PlaybackRate[];
  keywordOverlay?: ReactNode;
  onTogglePlay: () => void;
  onToggleSpeedMenu: () => void;
  onSelectSpeed: (speed: PlaybackRate) => void;
}

function VideoPlayer({
  lessonTitle,
  subtitle,
  videoEmbedUrl,
  captionText,
  currentTime,
  duration,
  isPlaying,
  playbackRate,
  isSpeedMenuOpen,
  speedOptions,
  keywordOverlay,
  onTogglePlay,
  onToggleSpeedMenu,
  onSelectSpeed,
}: VideoPlayerProps) {
  return (
    <section className="overflow-hidden rounded-[28px] border border-[#DEE5F0] bg-white shadow-[0_24px_60px_rgba(148,163,184,0.18)]">
      <div className="relative aspect-video overflow-hidden bg-[#DDEBFA]">
        <iframe
          className="absolute inset-0 h-full w-full"
          src={videoEmbedUrl}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.14)_0%,rgba(255,255,255,0)_30%,rgba(255,255,255,0.18)_100%)] pointer-events-none" />

        <div className="absolute left-7 top-7 z-10 max-w-[460px] space-y-3">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#2F80ED]">
            Rain Mode
          </p>
          <div>
            <h1 className="text-[34px] font-semibold tracking-[-0.03em] text-[#1C2430]">
              {lessonTitle}
            </h1>
            <p className="mt-2 text-sm leading-6 text-[#5E6B7D]">{subtitle}</p>
          </div>
        </div>

        <div className="absolute right-7 top-7 z-10 rounded-full border border-[#D8E7F8] bg-white/90 px-4 py-2 text-sm text-[#355070] shadow-[0_8px_20px_rgba(148,163,184,0.18)] backdrop-blur">
          {formatTime(currentTime)} / {formatTime(duration)}
        </div>

        <div className="pointer-events-none absolute inset-x-0 top-[116px] bottom-[120px] z-[5] px-6">
          {keywordOverlay}
        </div>

        <div className="absolute inset-x-0 bottom-0 z-10 px-6 pb-6">
          <div className="rounded-[22px] border border-[#D8E7F8] bg-white/92 px-6 py-4 shadow-[0_16px_32px_rgba(148,163,184,0.18)] backdrop-blur">
            <p className="text-center text-lg leading-8 text-[#243041]">{captionText}</p>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-[22px] border border-[#DDE7F2] bg-white/94 px-4 py-3 shadow-[0_10px_24px_rgba(148,163,184,0.16)] backdrop-blur">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onTogglePlay}
                className="flex h-11 items-center justify-center rounded-full bg-[#2F80ED] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#1E73E6]"
              >
                {isPlaying ? '일시정지' : '재생'}
              </button>

              <div className="h-2 w-[240px] overflow-hidden rounded-full bg-[#E5EDF7]">
                <div
                  className="h-full rounded-full bg-[linear-gradient(90deg,#60A5FA_0%,#2F80ED_100%)] transition-all"
                  style={{ width: `${Math.min((currentTime / duration) * 100, 100)}%` }}
                />
              </div>
            </div>

            <div className="relative">
              <button
                type="button"
                onClick={onToggleSpeedMenu}
                className="rounded-full border border-[#D6E3F3] bg-[#F7FAFD] px-4 py-2 text-sm font-medium text-[#355070] transition-colors hover:bg-[#EEF5FC]"
              >
                속도 {playbackRate}x
              </button>

              {isSpeedMenuOpen ? (
                <div className="absolute right-0 top-[calc(100%+10px)] z-20 w-28 rounded-2xl border border-[#DDE7F2] bg-white p-2 shadow-[0_16px_32px_rgba(148,163,184,0.2)]">
                  {speedOptions.map((speed) => (
                    <button
                      key={speed}
                      type="button"
                      onClick={() => onSelectSpeed(speed)}
                      className={`flex w-full rounded-xl px-3 py-2 text-left text-sm transition-colors ${
                        speed === playbackRate
                          ? 'bg-[#2F80ED] text-white'
                          : 'text-[#355070] hover:bg-[#F1F6FC]'
                      }`}
                    >
                      {speed}x
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function formatTime(seconds: number) {
  const minute = Math.floor(seconds / 60);
  const second = Math.floor(seconds % 60);

  return `${String(minute).padStart(2, '0')}:${String(second).padStart(2, '0')}`;
}

export default VideoPlayer;
