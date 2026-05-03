import { Link } from 'react-router-dom';
import { ROUTES } from '../../constants/routes';
import ComboIndicator from '../../features/player/rain/ComboIndicator';
import FallingKeywords from '../../features/player/rain/FallingKeywords';
import RainCaptionInput from '../../features/player/rain/RainCaptionInput';
import ScoreBoard from '../../features/player/rain/ScoreBoard';
import SpinnerPlayer from '../../features/player/spinner/SpinnerPlayer';
import { useRainMode } from '../../features/player/rain/useRainMode';

function RainModePage() {
  const {
    speedMenuRef,
    videoRef,
    videoSrc,
    sessionTitle,
    characterName,
    duration,
    currentTime,
    isPlaying,
    playbackRate,
    isSpeedMenuOpen,
    isCaptionVisible,
    speedOptions,
    captionText,
    fallingKeywords,
    activeKeyword,
    typedValue,
    score,
    combo,
    maxCombo,
    accuracy,
    comboAnimationKey,
    setTypedValue,
    togglePlay,
    toggleSpeedMenu,
    selectSpeed,
    toggleCaption,
    submitTypedKeyword,
    handleTimeUpdate,
    handleSeek,
    handleLoadedMetadata,
    handlePlay,
    handlePause,
    handleEnded,
  } = useRainMode();

  const { beforeText, afterText } = splitCaption(captionText);

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
            <button
              type="button"
              className="rounded-[8px] bg-[#1A9AF5] px-3 py-1 font-paperlogy text-[16px] font-semibold leading-6 text-white"
            >
              모드 설정
            </button>
          </div>
        </div>

        <div className="flex items-start gap-6">
          <div ref={speedMenuRef} className="min-w-0 flex-1">
            <SpinnerPlayer
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
              overlayContent={<FallingKeywords keywords={fallingKeywords} />}
              captionOverlay={
                <RainCaptionInput
                  beforeText={beforeText}
                  afterText={afterText}
                  value={typedValue}
                  placeholder={activeKeyword?.text ?? ''}
                  onChange={setTypedValue}
                  onSubmit={submitTypedKeyword}
                />
              }
              onTogglePlay={togglePlay}
              onToggleSpeedMenu={toggleSpeedMenu}
              onSelectSpeed={selectSpeed}
              onToggleCaption={toggleCaption}
              onTimeUpdate={handleTimeUpdate}
              onSeek={handleSeek}
              onLoadedMetadata={handleLoadedMetadata}
              onPlay={handlePlay}
              onPause={handlePause}
              onEnded={handleEnded}
            />
          </div>

          <div className="flex h-[590px] w-[240px] flex-col gap-3">
            <aside className="flex h-[252px] items-center justify-center rounded-[12px] border border-[#E5E7EC] bg-[#F4F6F7] p-4 text-center">
              <p className="text-[16px] font-semibold leading-6 text-[#15171C]">{characterName}</p>
            </aside>

            <ComboIndicator combo={combo} animationKey={comboAnimationKey} />

            <div className="flex-1">
              <ScoreBoard
                score={score}
                maxCombo={maxCombo}
                accuracy={accuracy}
                studyTime={formatDurationWithHours(currentTime)}
                coreKeyword={activeKeyword?.text ?? '키워드'}
              />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function splitCaption(caption: string) {
  const trimmedCaption = caption.trim();
  if (!trimmedCaption) {
    return { beforeText: '', afterText: '' };
  }

  const midpoint = Math.max(1, Math.floor(trimmedCaption.length / 2));
  const beforeText = trimmedCaption.slice(0, midpoint).trim();
  const afterText = trimmedCaption.slice(midpoint).trim();

  return { beforeText, afterText };
}

function formatDurationWithHours(seconds: number) {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const remainingSeconds = safeSeconds % 60;

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
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

export default RainModePage;
