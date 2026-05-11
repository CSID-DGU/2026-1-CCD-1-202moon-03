import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../constants/routes';
import ComboIndicator from '../../features/player/rain/ComboIndicator';
import FallingKeywords from '../../features/player/rain/FallingKeywords';
import RainCaptionInput, {
  type RainCaptionInputHandle,
} from '../../features/player/rain/RainCaptionInput';
import RainQuizModal from '../../features/player/rain/RainQuizModal';
import RainSettingsModal from '../../features/player/rain/RainSettingsModal';
import type { RainSettings } from '../../features/player/rain/RainSettingsModal';
import ScoreBoard from '../../features/player/rain/ScoreBoard';
import PlayerDebugPanel from '../../features/player/shared/PlayerDebugPanel';
import { useRainMode } from '../../features/player/rain/useRainMode';
import PlayerStatusOverlay from '../../features/player/shared/PlayerStatusOverlay';
import SpinnerPlayer from '../../features/player/spinner/SpinnerPlayer';
import { endGame } from '../../services/game.api';

function FocusCharacterIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 32 32"
      aria-hidden="true"
      className="h-24 w-24 fill-[#15171C]"
    >
      <path d="M 18.125 4 C 14.820313 4 10.960938 4.546875 7.96875 7.5625 C 4.976563 10.578125 3 15.867188 3 25 L 3 26 L 12.65625 26 C 13.644531 26.625 14.757813 27 16 27 C 17.238281 27 18.355469 26.617188 19.34375 26 L 29 26 L 29 25 C 29 16.875 27.429688 12.15625 25.375 9.40625 C 23.566406 6.984375 21.484375 6.3125 19.9375 6.15625 L 19 4.5 L 18.71875 4 Z M 17.5625 6.0625 L 18.375 7.5 L 18.65625 8 L 19.25 8 C 20.261719 8 22.097656 8.339844 23.78125 10.59375 C 25.382813 12.738281 26.800781 16.832031 26.9375 24 L 21.5625 24 C 21.671875 23.859375 21.773438 23.707031 21.875 23.5625 C 23.234375 21.625 24 19.207031 24 17 L 22 17 C 22 18.722656 21.355469 20.828125 20.25 22.40625 C 19.144531 23.984375 17.664063 25 16 25 C 14.335938 25 12.855469 23.988281 11.75 22.40625 C 10.644531 20.824219 10 18.710938 10 17 C 10 16.554688 10.085938 16.332031 10.21875 16.15625 C 10.351563 15.980469 10.585938 15.828125 10.9375 15.6875 C 11.644531 15.410156 12.835938 15.292969 14.09375 15.1875 C 15.351563 15.082031 16.664063 14.980469 17.84375 14.4375 C 19.023438 13.894531 20 12.660156 20 11 L 18 11 C 18 12.042969 17.726563 12.304688 17.03125 12.625 C 16.335938 12.945313 15.148438 13.082031 13.90625 13.1875 C 12.664063 13.292969 11.355469 13.351563 10.1875 13.8125 C 9.601563 14.042969 9.039063 14.390625 8.625 14.9375 C 8.210938 15.484375 8 16.214844 8 17 C 8 19.199219 8.769531 21.589844 10.125 23.53125 C 10.234375 23.6875 10.347656 23.847656 10.46875 24 L 5.0625 24 C 5.214844 15.863281 7.007813 11.351563 9.375 8.96875 C 11.695313 6.628906 14.648438 6.121094 17.5625 6.0625 Z M 13 17 C 12.449219 17 12 17.449219 12 18 C 12 18.550781 12.449219 19 13 19 C 13.550781 19 14 18.550781 14 18 C 14 17.449219 13.550781 17 13 17 Z M 19 17 C 18.449219 17 18 17.449219 18 18 C 18 18.550781 18.449219 19 19 19 C 19.550781 19 20 18.550781 20 18 C 20 17.449219 19.550781 17 19 17 Z" />
    </svg>
  );
}

function RainModePage() {
  const navigate = useNavigate();
  const [isEndingStudy, setIsEndingStudy] = useState(false);
  const [judgment, setJudgment] = useState<{ key: number; combo: number } | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [rainSettings, setRainSettings] = useState<RainSettings>({
    mode: 'auto',
    difficulty: 'normal',
    blankCount: 3,
    fallSpeed: 1,
  });
  const captionInputRef = useRef<RainCaptionInputHandle | null>(null);
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

    typedValuesByBlankKey,
    score,
    combo,
    maxCombo,
    accuracy,
    comboAnimationKey,
    quizState,
    quizCorrectCount,
    quizAnsweredCount,
    tabSwitchCount,
    totalQuizCount,
    getLatestQuizStats,
    handleTypedValueChange,
    handleCaptionCompositionStateChange,
    handleCaptionFocusBlankKeyChange,
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
    handlePlayerReady,
    handlePlay,
    handlePause,
    handleEnded,
  } = useRainMode(rainSettings);

  const refocusCaptionInput = () => {
    requestAnimationFrame(() => {
      captionInputRef.current?.focusPrimaryInput();
    });
  };

  useEffect(() => {
    if (comboAnimationKey === 0) return;
    setJudgment({ key: comboAnimationKey, combo });
    const timer = setTimeout(() => setJudgment(null), 900);
    return () => clearTimeout(timer);
  }, [comboAnimationKey]);

  const hasCaptionContent = captionDisplay.items.length > 0 || Boolean(captionText.trim());

  const handleFinishStudy = async () => {
    if (!sessionId) {
      navigate(ROUTES.RESULT);
      return;
    }

    setIsEndingStudy(true);

    try {
      const latestQuizStats = getLatestQuizStats();
      await endGame(sessionId, {
        watch_rate: duration > 0 ? Math.min(Math.max(currentTime / duration, 0), 1) : 0,
        total_score: score,
        max_combo: maxCombo,
        typing_accuracy: Math.min(Math.max(accuracy / 100, 0), 1),
        quiz_correct: latestQuizStats.quizCorrectCount,
        quiz_total: latestQuizStats.quizAnsweredCount || totalQuizCount,
        tab_switch_count: tabSwitchCount,
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

          <div className="relative">
            <button
              type="button"
              onClick={() => setIsSettingsOpen((prev) => !prev)}
              className="rounded-[12px] border border-[#52555F] bg-[#25272E] px-4 py-[10px] font-paperlogy text-[15px] font-semibold text-white"
            >
              모드설정
            </button>

            <RainSettingsModal
              isOpen={isSettingsOpen}
              settings={rainSettings}
              onClose={() => setIsSettingsOpen(false)}
              onApply={(next) => setRainSettings(next)}
            />
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
                overlayContent={
                  <div className="relative h-full w-full">
                    <FallingKeywords keywords={fallingKeywords} />
                    {judgment ? (
                      <div
                        key={judgment.key}
                        className={`pointer-events-none absolute bottom-[16px] left-1/2 -translate-x-1/2 animate-judgment font-paperlogy font-black drop-shadow-[0_2px_8px_rgba(0,0,0,0.4)] ${
                          judgment.combo >= 10
                            ? 'text-[32px] text-[#F59E0B]'
                            : judgment.combo >= 5
                              ? 'text-[30px] text-[#A855F7]'
                              : judgment.combo >= 3
                                ? 'text-[28px] text-[#3B82F6]'
                                : 'text-[26px] text-[#22C55E]'
                        }`}
                      >
                        {judgment.combo >= 10 ? 'AMAZING!' : judgment.combo >= 5 ? 'PERFECT!' : judgment.combo >= 3 ? 'GREAT!' : 'GOOD!'}
                      </div>
                    ) : null}
                  </div>
                }
                captionOverlay={hasCaptionContent ? (
                  <RainCaptionInput
                    ref={captionInputRef}
                    items={captionDisplay.items}
                    fallbackText={captionText}
                    onChange={handleTypedValueChange}
                    onCompositionStateChange={handleCaptionCompositionStateChange}
                    onFocusBlankKeyChange={handleCaptionFocusBlankKeyChange}
                    onSubmit={submitTypedKeyword}
                  />
                ) : null}
                onTogglePlay={async () => {
                  await togglePlay();
                  refocusCaptionInput();
                }}
                onToggleSpeedMenu={() => {
                  toggleSpeedMenu();
                  refocusCaptionInput();
                }}
                onSelectSpeed={(speed) => {
                  selectSpeed(speed);
                  refocusCaptionInput();
                }}
                onToggleCaption={() => {
                  toggleCaption();
                  refocusCaptionInput();
                }}
                onTimeUpdate={handleTimeUpdate}
                onSeek={(nextTime) => {
                  handleSeek(nextTime);
                  refocusCaptionInput();
                }}
                onLoadedMetadata={handleLoadedMetadata}
                onPlayerReady={() => {
                  handlePlayerReady();
                  refocusCaptionInput();
                }}
                onPlay={() => {
                  handlePlay();
                  refocusCaptionInput();
                }}
                onPause={() => {
                  handlePause();
                  refocusCaptionInput();
                }}
                onEnded={() => {
                  handleEnded();
                  refocusCaptionInput();
                }}
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
              <FocusCharacterIcon />
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
