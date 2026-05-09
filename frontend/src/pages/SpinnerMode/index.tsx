import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../constants/routes';
import RainQuizModal from '../../features/player/rain/RainQuizModal';
import PlayerDebugPanel from '../../features/player/shared/PlayerDebugPanel';
import PlayerStatusOverlay from '../../features/player/shared/PlayerStatusOverlay';
import SpinnerPlayer from '../../features/player/spinner/SpinnerPlayer';
import SpinnerPracticePanel from '../../features/player/spinner/SpinnerPracticePanel';
import { useSpinnerMode } from '../../features/player/spinner/useSpinnerMode';
import { endGame } from '../../services/game.api';

function SpinnerModePage() {
  const navigate = useNavigate();
  const [isEndingStudy, setIsEndingStudy] = useState(false);
  const {
    sessionId,
    playerType,
    playerSrc,
    sessionTitle,
    sessionAiStatus,
    playerStatus,
    playerStatusLabel,
    sessionError,
    debug,
    videoRef,
    controllerRef,
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
    quizState,
    quizCorrectCount,
    quizAnsweredCount,
    totalQuizCount,
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
    submitQuizAnswer,
    continueFromQuiz,
  } = useSpinnerMode();

  const handleFinishStudy = async () => {
    if (!sessionId) {
      navigate(ROUTES.RESULT);
      return;
    }

    setIsEndingStudy(true);

    try {
      await endGame(sessionId, {
        watch_rate: duration > 0 ? Math.min(Math.max(currentTime / duration, 0), 1) : 0,
        quiz_correct: quizCorrectCount,
        quiz_total: quizAnsweredCount || totalQuizCount,
      });
    } catch {
      // Ignore save failures and continue to result.
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
            <div className="flex items-center gap-[6px]">
              <ModeChip
                label="스피너"
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
            ) : (
              <PlayerStatusOverlay
                title={playerStatus === 'failed' ? '재생을 준비하지 못했어요' : '학습 영상을 준비 중이에요'}
                description={sessionError || playerStatusLabel || '첫 챕터가 준비되면 바로 재생이 시작됩니다.'}
                tone={playerStatus === 'failed' ? 'error' : 'neutral'}
              />
            )}
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

      <RainQuizModal
        quizState={
          quizState
            ? {
                quiz: {
                  quiz_id: quizState.quizId,
                  trigger_time: 0,
                  question: quizState.question,
                  options: quizState.options,
                  answer_index: quizState.answerIndex,
                  correct_feedback: quizState.feedback,
                  incorrect_feedback: quizState.incorrectFeedback,
                },
                selectedIndex: quizState.selectedIndex,
                feedback: quizState.selectedIndex === null ? '' : quizState.feedback,
                isCorrect: quizState.isCorrect,
                isSubmitting: quizState.isSubmitting,
              }
            : null
        }
        onSelectOption={(index) => void submitQuizAnswer(index)}
        onContinue={() => void continueFromQuiz()}
      />
      <PlayerDebugPanel debug={debug} />
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
