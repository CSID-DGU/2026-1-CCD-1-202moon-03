import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../constants/routes';
import ComboIndicator from '../../features/player/rain/ComboIndicator';
import FallingKeywords from '../../features/player/rain/FallingKeywords';
import RainCaptionInput from '../../features/player/rain/RainCaptionInput';
import RainQuizModal from '../../features/player/rain/RainQuizModal';
import ScoreBoard from '../../features/player/rain/ScoreBoard';
import PlayerDebugPanel from '../../features/player/shared/PlayerDebugPanel';
import { useRainMode } from '../../features/player/rain/useRainMode';
import PlayerStatusOverlay from '../../features/player/shared/PlayerStatusOverlay';
import SpinnerPlayer from '../../features/player/spinner/SpinnerPlayer';
import { endGame } from '../../services/game.api';

function RainModePage() {
  const navigate = useNavigate();
  const [isEndingStudy, setIsEndingStudy] = useState(false);
  const {
    sessionId,
    speedMenuRef,
    videoRef,
    controllerRef,
    playerType,
    playerSrc,
    sessionTitle,
    sessionAiStatus,
    playerStatus,
    playerStatusLabel,
    sessionError,
    debug,
    characterName,
    duration,
    currentTime,
    isPlaying,
    playbackRate,
    isSpeedMenuOpen,
    isCaptionVisible,
    speedOptions,
    captionText,
    captionDisplay,
    fallingKeywords,
    activeKeyword,
    typedValue,
    score,
    combo,
    maxCombo,
    accuracy,
    comboAnimationKey,
    quizState,
    quizCorrectCount,
    quizAnsweredCount,
    totalQuizCount,
    setTypedValue,
    togglePlay,
    toggleSpeedMenu,
    selectSpeed,
    toggleCaption,
    submitTypedKeyword,
    submitQuizAnswer,
    continueFromQuiz,
    handleTimeUpdate,
    handleSeek,
    handleLoadedMetadata,
    handlePlay,
    handlePause,
    handleEnded,
  } = useRainMode();

  const handleFinishStudy = async () => {
    if (!sessionId) {
      navigate(ROUTES.RESULT);
      return;
    }

    setIsEndingStudy(true);

    try {
      await endGame(sessionId, {
        watch_rate: duration > 0 ? Math.min(Math.max(currentTime / duration, 0), 1) : 0,
        total_score: score,
        max_combo: maxCombo,
        typing_accuracy: Math.min(Math.max(accuracy / 100, 0), 1),
        quiz_correct: quizCorrectCount,
        quiz_total: quizAnsweredCount || totalQuizCount,
      });
    } catch {
      // Keep local fallback values and continue to the result page.
    } finally {
      setIsEndingStudy(false);
      navigate(`${ROUTES.RESULT}?videoId=${encodeURIComponent(sessionId)}`);
    }
  };

  return (
    <main className="min-h-screen bg-[#15171C]">
      <div className="mx-auto flex w-full max-w-[1440px] flex-col px-[60px] pb-[60px] pt-[40px]">
        <div className="flex items-start justify-between pb-[40px]">
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => void handleFinishStudy()}
              disabled={isEndingStudy}
              className="flex items-center gap-3 text-[#F4F6F7] disabled:opacity-70"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#1A9AF5]">
                <BackIcon />
              </span>
              <span className="font-paperlogy text-[24px] font-medium leading-none">
                {isEndingStudy ? '저장 중...' : '학습 종료'}
              </span>
            </button>
            <div className="space-y-1">
              <p className="text-lg font-semibold text-white">{sessionTitle}</p>
              {playerStatusLabel ? <p className="text-sm text-slate-300">{playerStatusLabel}</p> : null}
              {!playerStatusLabel && sessionAiStatus ? (
                <p className="text-sm text-slate-300">AI status: {sessionAiStatus}</p>
              ) : null}
              {sessionError ? <p className="text-sm text-rose-300">{sessionError}</p> : null}
            </div>
          </div>

          <div className="rounded-[12px] border border-[#52555F] bg-[#25272E] p-2">
            <button
              type="button"
              className="rounded-[8px] bg-[#1A9AF5] px-3 py-1 font-paperlogy text-[16px] font-semibold leading-6 text-white"
            >
              레인 모드
            </button>
          </div>
        </div>

        <div className="flex items-start gap-6">
          <div ref={speedMenuRef} className="min-w-0 flex-1">
            {playerStatus === 'ready' || playerStatus === 'stream_complete' ? (
              <SpinnerPlayer
                playerType={playerType}
                playerSrc={playerSrc}
                videoRef={videoRef}
                controllerRef={controllerRef}
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
                    beforeText={captionDisplay.beforeText}
                    afterText={captionDisplay.afterText}
                    value={typedValue}
                    placeholder={activeKeyword?.hint ?? activeKeyword?.text ?? ''}
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
            ) : (
              <PlayerStatusOverlay
                title={playerStatus === 'failed' ? '재생을 준비하지 못했어요' : '학습 영상을 준비 중이에요'}
                description={sessionError || playerStatusLabel || '첫 챕터가 준비되면 바로 재생이 시작됩니다.'}
                tone={playerStatus === 'failed' ? 'error' : 'neutral'}
              />
            )}
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
                coreKeyword={activeKeyword?.text ?? 'No keyword'}
              />
            </div>
          </div>
        </div>
      </div>

      <RainQuizModal
        quizState={quizState}
        onSelectOption={(index) => void submitQuizAnswer(index)}
        onContinue={() => void continueFromQuiz()}
      />
      <PlayerDebugPanel debug={debug} />
    </main>
  );
}

function formatDurationWithHours(seconds: number) {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const remainingSeconds = safeSeconds % 60;

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(
    remainingSeconds,
  ).padStart(2, '0')}`;
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
