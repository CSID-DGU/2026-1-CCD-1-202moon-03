import { Link } from 'react-router-dom';
import SpinnerPlayer from '../../features/player/spinner/SpinnerPlayer';
import SpinnerPracticePanel from '../../features/player/spinner/SpinnerPracticePanel';
import { useSpinnerMode } from '../../features/player/spinner/useSpinnerMode';
import { ROUTES } from '../../constants/routes';

function SpinnerModePage() {
  const {
    lessonTitle,
    subtitle,
    videoSrc,
    videoRef,
    speedMenuRef,
    selectedTool,
    spinnerTurns,
    isKeycapPressed,
    keycapPressCount,
    isPlaying,
    playbackRate,
    isSpeedMenuOpen,
    isCaptionVisible,
    currentTime,
    duration,
    speedOptions,
    captionText,
    handleSelectTool,
    handleSpin,
    handleSpinnerWheel,
    handlePressKeycap,
    handleTogglePlay,
    handleToggleSpeedMenu,
    handleSelectSpeed,
    handleToggleCaption,
    handleTimeUpdate,
    handleSeek,
    handleLoadedMetadata,
    handlePlay,
    handlePause,
    handleEnded,
  } = useSpinnerMode();

  return (
    <main className="min-h-screen bg-[#15171C]">
      <div className="mx-auto flex w-full max-w-[1440px] flex-col px-[60px] pb-[60px] pt-[40px]">
        <div className="flex items-center justify-between pb-[40px]">
          <Link to={ROUTES.RESULT} className="flex items-center gap-3 text-[#F4F6F7]">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#1A9AF5]">
              <BackIcon />
            </span>
            <span className="font-paperlogy text-[24px] font-medium leading-none">학습 종료</span>
          </Link>

          <div className="rounded-[12px] border border-[#52555F] bg-[#25272E] p-2">
            <div className="flex items-center gap-[6px]">
              <ModeChip
                label="피젯"
                isActive={selectedTool === 'spinner'}
                onClick={() => handleSelectTool('spinner')}
              />
              <ModeChip
                label="키캡"
                isActive={selectedTool === 'keycap'}
                onClick={() => handleSelectTool('keycap')}
              />
            </div>
          </div>
        </div>

        <div className="flex items-start gap-6">
          <div ref={speedMenuRef} className="min-w-0 flex-1">
            <SpinnerPlayer
              lessonTitle={lessonTitle}
              subtitle={subtitle}
              videoSrc={videoSrc}
              videoRef={videoRef}
              currentTime={currentTime}
              duration={duration}
              isPlaying={isPlaying}
              playbackRate={playbackRate}
              isSpeedMenuOpen={isSpeedMenuOpen}
              speedOptions={speedOptions}
              isCaptionVisible={isCaptionVisible}
              captionText={captionText}
              selectedTool={selectedTool}
              onTogglePlay={handleTogglePlay}
              onToggleSpeedMenu={handleToggleSpeedMenu}
              onSelectSpeed={handleSelectSpeed}
              onToggleCaption={handleToggleCaption}
              onTimeUpdate={handleTimeUpdate}
              onSeek={handleSeek}
              onLoadedMetadata={handleLoadedMetadata}
              onPlay={handlePlay}
              onPause={handlePause}
              onEnded={handleEnded}
            />
          </div>

          <SpinnerPracticePanel
            selectedTool={selectedTool}
            spinnerTurns={spinnerTurns}
            isKeycapPressed={isKeycapPressed}
            keycapPressCount={keycapPressCount}
            onSelectTool={handleSelectTool}
            onSpin={handleSpin}
            onSpinnerWheel={handleSpinnerWheel}
            onPressKeycap={handlePressKeycap}
          />
        </div>
      </div>
    </main>
  );
}

function ModeChip({
  label,
  isActive,
  onClick,
}: {
  label: string;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-[8px] px-3 py-1 text-[16px] font-semibold leading-6 text-white transition-colors ${
        isActive ? 'bg-[#1A9AF5]' : 'bg-transparent'
      }`}
    >
      <span className="font-paperlogy">{label}</span>
    </button>
  );
}

function BackIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M14.5 6.5L9 12L14.5 17.5"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default SpinnerModePage;
