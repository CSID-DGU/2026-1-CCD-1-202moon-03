import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import character01_1 from '../../assets/user/character01_1.png';
import character02_1 from '../../assets/user/character02_1.png';
import character03_1 from '../../assets/user/character03_1.png';
import character04_1 from '../../assets/user/character04_1.png';
import character05_1 from '../../assets/user/character05_1.png';
import character06_1 from '../../assets/user/character06_1.png';
import character07_1 from '../../assets/user/character07_1.png';
import character08_1 from '../../assets/user/character08_1.png';
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
import { useRainMode } from '../../features/player/rain/useRainMode';
import FullscreenToggleButton from '../../features/player/shared/FullscreenToggleButton';
import PlayerDebugPanel from '../../features/player/shared/PlayerDebugPanel';
import PlayerStatusOverlay from '../../features/player/shared/PlayerStatusOverlay';
import SpinnerPlayer from '../../features/player/spinner/SpinnerPlayer';
import { endGame } from '../../services/game.api';
import { useAuthStore } from '../../store/authStore';
import { usePlayerStore, type RainDifficulty } from '../../store/usePlayerStore';

type AvatarKey =
  | 'character01'
  | 'character02'
  | 'character03'
  | 'character04'
  | 'character05'
  | 'character06'
  | 'character07'
  | 'character08';

const RAIN_AVATAR_IMAGES: Record<AvatarKey, string> = {
  character01: character01_1,
  character02: character02_1,
  character03: character03_1,
  character04: character04_1,
  character05: character05_1,
  character06: character06_1,
  character07: character07_1,
  character08: character08_1,
};

const RAIN_AVATAR_BACKGROUND_COLORS: Record<AvatarKey, string> = {
  character01: '#FFF4CD',
  character02: '#D2F2EA',
  character03: '#F1E0F9',
  character04: '#FFDDE7',
  character05: '#C8DFFF',
  character06: '#F1ECC8',
  character07: '#FDE6D6',
  character08: '#DDE4FF',
};

function normalizeAvatarKey(value?: string | null): AvatarKey {
  switch (value) {
    case 'character_1':
    case 'character01':
      return 'character01';
    case 'character_2':
    case 'character02':
      return 'character02';
    case 'character_3':
    case 'character03':
      return 'character03';
    case 'character_4':
    case 'character04':
      return 'character04';
    case 'character_5':
    case 'character05':
      return 'character05';
    case 'character_6':
    case 'character06':
      return 'character06';
    case 'character_7':
    case 'character07':
      return 'character07';
    case 'character_8':
    case 'character08':
      return 'character08';
    default:
      return 'character01';
  }
}

function mapStimulationLevelToDifficulty(stimulationLevel?: number): RainDifficulty {
  if (stimulationLevel === undefined || stimulationLevel === null) {
    return 'hard';
  }

  if (stimulationLevel <= 1) {
    return 'easy';
  }

  if (stimulationLevel >= 3) {
    return 'hard';
  }

  return 'normal';
}

function RainModePage() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const avatarKey = normalizeAvatarKey(user?.avatarType);
  const avatarImageSrc = RAIN_AVATAR_IMAGES[avatarKey];
  const avatarBackgroundColor = RAIN_AVATAR_BACKGROUND_COLORS[avatarKey];
  const setRainDifficulty = usePlayerStore((state) => state.setRainDifficulty);
  const [isEndingStudy, setIsEndingStudy] = useState(false);
  const [judgment, setJudgment] = useState<{ key: number; combo: number } | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [measurementRoot, setMeasurementRoot] = useState<HTMLElement | null>(null);
  const [inputPositions, setInputPositions] = useState<Record<string, number>>({});
  const fullscreenRootRef = useRef<HTMLElement | null>(null);
  const [rainSettings, setRainSettings] = useState<RainSettings>({
    mode: 'auto',
    difficulty: 'hard',
    blankCount: 3,
    fallSpeed: 1,
  });
  const didInitializePresetRef = useRef(false);
  const captionInputRef = useRef<RainCaptionInputHandle | null>(null);
  const [captionInputDebug, setCaptionInputDebug] = useState<{
    primaryInputKey: string | null;
    draftValuesByKey: Record<string, string>;
    lastAutoFocusReason: string | null;
  }>({
    primaryInputKey: null,
    draftValuesByKey: {},
    lastAutoFocusReason: null,
  });
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
    isPlayerReady,
    isPlaying,
    playbackRate,
    isSpeedMenuOpen,
    isCaptionVisible,
    speedOptions,
    captionText,
    captionDisplay,
    fallingKeywords,
    activeKeyword,
    score,
    combo,
    maxCombo,
    accuracy,
    lastJudgement,
    comboAnimationKey,
    quizState,
    tabSwitchCount,
    totalQuizCount,
    getLatestQuizStats,
    handleTypedValueCommit,
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
    handleYoutubeDebug,
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
    if (didInitializePresetRef.current) {
      return;
    }

    const nextDifficulty = mapStimulationLevelToDifficulty(user?.stimulationLevel);
    didInitializePresetRef.current = true;
    setRainDifficulty(nextDifficulty);
    setRainSettings((current) => ({
      ...current,
      mode: 'auto',
      difficulty: nextDifficulty,
    }));
  }, [setRainDifficulty, user?.stimulationLevel]);

  useEffect(() => {
    if (comboAnimationKey === 0 || lastJudgement !== 'hit') {
      setJudgment(null);
      return;
    }

    setJudgment({ key: comboAnimationKey, combo });
    const timer = setTimeout(() => setJudgment(null), 900);
    return () => clearTimeout(timer);
  }, [comboAnimationKey, combo, lastJudgement]);

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
    <main ref={fullscreenRootRef} className="min-h-screen bg-[#15171C]">
      <div className="overflow-x-auto">
        <div className="mx-auto flex w-full max-w-[1440px] min-w-fit flex-col px-[40px] pb-[48px] pt-[32px]">
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
                  {isEndingStudy ? '학습 종료 중...' : '학습 종료'}
                </span>
              </button>

              <div className="space-y-1">
                <p className="text-lg font-semibold text-white">{sessionTitle}</p>
                {playerStatusLabel ? (
                  <p className="text-sm text-slate-300">{playerStatusLabel}</p>
                ) : null}
                {!playerStatusLabel && sessionAiStatus ? (
                  <p className="text-sm text-slate-300">AI status: {sessionAiStatus}</p>
                ) : null}
                {sessionError ? <p className="text-sm text-rose-300">{sessionError}</p> : null}
              </div>
            </div>

            <div className="flex items-start gap-2">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsSettingsOpen((prev) => !prev)}
                  className="flex h-12 w-[124px] items-center justify-center rounded-[12px] border border-[#3D4150] bg-[#1A9AF5] text-[14px] font-bold text-white transition-opacity hover:opacity-90 active:opacity-75"
                >
                  <span className="font-paperlogy">모드 설정</span>
                </button>
                <RainSettingsModal
                  isOpen={isSettingsOpen}
                  settings={rainSettings}
                  onClose={() => setIsSettingsOpen(false)}
                  onApply={(next) => setRainSettings(next)}
                />
              </div>
              <FullscreenToggleButton targetRef={fullscreenRootRef} />
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div ref={speedMenuRef} className="shrink-0">
              {playerStatus === 'ready' || playerStatus === 'stream_complete' ? (
                <SpinnerPlayer
                  playerType={playerType}
                  playerSrc={playerSrc}
                  videoRef={videoRef}
                  controllerRef={controllerRef}
                  currentTime={currentTime}
                  duration={duration}
                  isPlayerReady={isPlayerReady}
                  isPlaying={isPlaying}
                  playbackRate={playbackRate}
                  isSpeedMenuOpen={isSpeedMenuOpen}
                  speedOptions={speedOptions}
                  isCaptionVisible={isCaptionVisible}
                  captionText={captionText}
                  onMeasurementRootChange={setMeasurementRoot}
                  overlayContent={
                    <div className="relative h-full w-full">
                      <FallingKeywords
                        keywords={fallingKeywords}
                        inputPositions={inputPositions}
                      />
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
                          {judgment.combo >= 10
                            ? 'AMAZING!'
                            : judgment.combo >= 5
                              ? 'PERFECT!'
                              : judgment.combo >= 3
                                ? 'GREAT!'
                                : 'GOOD!'}
                        </div>
                      ) : null}
                    </div>
                  }
                  renderSubtitleContent={
                    hasCaptionContent
                      ? (isWrapped) => (
                          <RainCaptionInput
                            ref={captionInputRef}
                            items={captionDisplay.items}
                            fallbackText={captionText}
                            measurementRoot={measurementRoot}
                            allowWrap={isWrapped}
                            onCommit={handleTypedValueCommit}
                            onCompositionStateChange={handleCaptionCompositionStateChange}
                            onFocusBlankKeyChange={handleCaptionFocusBlankKeyChange}
                            onInputLayoutChange={setInputPositions}
                            onDebugStateChange={setCaptionInputDebug}
                            onSubmit={submitTypedKeyword}
                          />
                        )
                      : undefined
                  }
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
                  onPlayerReady={handlePlayerReady}
                  onYoutubeDebug={handleYoutubeDebug}
                  onPlay={handlePlay}
                  onPause={handlePause}
                  onEnded={handleEnded}
                />
              ) : (
                <div className="w-[min(1120px,98vw)]">
                  <PlayerStatusOverlay
                    title={
                      playerStatus === 'failed'
                        ? '재생을 준비하지 못했어요'
                        : '학습 영상을 준비 중이에요'
                    }
                    description={
                      sessionError ||
                      playerStatusLabel ||
                      '첫 챕터가 준비되면 바로 재생을 시작합니다.'
                    }
                    tone={playerStatus === 'failed' ? 'error' : 'neutral'}
                  />
                </div>
              )}
            </div>

            <div
              className="flex w-[208px] shrink-0 flex-col gap-3"
              style={{ height: 'calc(min(1120px, 98vw) * 9 / 16)' }}
            >
              <ComboIndicator combo={combo} animationKey={comboAnimationKey} />

            <aside className="aspect-square w-full shrink-0 overflow-hidden rounded-[12px] shadow-[0_8px_24px_rgba(3,46,78,0.08)]" style={{ backgroundColor: avatarBackgroundColor }}>
              <div className="relative flex h-full w-full items-end justify-center overflow-hidden">
                <img
                  src={avatarImageSrc}
                  alt="집중 캐릭터"
                  className="absolute bottom-0 left-1/2 h-[194px] w-auto max-w-none -translate-x-1/2 object-contain"
                />
              </div>
            </aside>

              <div className="h-[240px] shrink-0">
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
      </div>

      <RainQuizModal
        quizState={quizState}
        onSelectOption={(index) => void submitQuizAnswer(index)}
        onContinue={() => void continueFromQuiz()}
      />
      <PlayerDebugPanel
        debug={{
          ...debug,
          primaryInputKey: captionInputDebug.primaryInputKey,
          draftValuesByKey: captionInputDebug.draftValuesByKey,
          lastAutoFocusReason: captionInputDebug.lastAutoFocusReason,
        }}
      />
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
