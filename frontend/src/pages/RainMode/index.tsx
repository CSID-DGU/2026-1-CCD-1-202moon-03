import { Link } from 'react-router-dom';
import { ROUTES } from '../../constants/routes';
import ComboIndicator from '../../features/player/rain/ComboIndicator';
import FallingKeywords from '../../features/player/rain/FallingKeywords';
import ScoreBoard from '../../features/player/rain/ScoreBoard';
import TypingInput from '../../features/player/rain/TypingInput';
import VideoPlayer from '../../features/player/rain/VideoPlayer';
import { useRainMode } from '../../features/player/rain/useRainMode';

function RainModePage() {
  const {
    sessionTitle,
    lessonTitle,
    introText,
    videoEmbedUrl,
    characterName,
    duration,
    currentTime,
    isPlaying,
    playbackRate,
    isSpeedMenuOpen,
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
    submitTypedKeyword,
  } = useRainMode();

  return (
    <div className="min-h-screen w-full bg-white">
      <main className="mx-auto flex min-h-screen w-full max-w-[1440px] flex-col gap-6 bg-white px-6 py-6 text-[#1D2836]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#2F80ED]">
              Player Mode
            </p>
            <h1 className="mt-2 text-4xl font-semibold tracking-[-0.04em] text-[#1D2836]">
              {sessionTitle}
            </h1>
          </div>

          <Link className="text-sm text-[#6A7C91] transition-colors hover:text-[#2F80ED]" to={ROUTES.RESULT}>
            결과 화면 보기
          </Link>
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className="space-y-6">
            <ComboIndicator combo={combo} animationKey={comboAnimationKey} />

            <VideoPlayer
              lessonTitle={lessonTitle}
              subtitle={introText}
              videoEmbedUrl={videoEmbedUrl}
              captionText={captionText}
              currentTime={currentTime}
              duration={duration}
              isPlaying={isPlaying}
              playbackRate={playbackRate}
              isSpeedMenuOpen={isSpeedMenuOpen}
              speedOptions={speedOptions}
              keywordOverlay={<FallingKeywords keywords={fallingKeywords} />}
              onTogglePlay={togglePlay}
              onToggleSpeedMenu={toggleSpeedMenu}
              onSelectSpeed={selectSpeed}
            />

            <TypingInput
              value={typedValue}
              activeKeyword={activeKeyword?.text}
              hint={activeKeyword?.hint}
              onChange={setTypedValue}
              onSubmit={submitTypedKeyword}
            />
          </div>

          <div className="xl:pt-[92px]">
            <ScoreBoard
              score={score}
              maxCombo={maxCombo}
              accuracy={accuracy}
              characterName={characterName}
            />
          </div>
        </div>
      </main>
    </div>
  );
}

export default RainModePage;
