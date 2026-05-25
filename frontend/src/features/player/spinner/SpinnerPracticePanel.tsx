import type { WheelEvent } from 'react';
import mascotDefaultIcon from '../../../assets/icons/mascot_default.svg';
import mascotHoverIcon from '../../../assets/icons/mascot_hover.svg';
import mascotPressedIcon from '../../../assets/icons/mascot_pressed.svg';
import spinnerIcon from '../../../assets/icons/spinner.svg';
import KeycapButton from './KeycapButton';
import type {
  KeycapGlowTheme,
  KeycapVisualState,
  MascotPromptType,
  MascotVisualState,
  SpinnerAssistTool,
} from './types';

const SPINNER_VIEWBOX_SIZE = 200;
const SPINNER_HUB_CX = 100;
const SPINNER_HUB_CY = 115.2;
const SPINNER_HUB_RADIUS = 28;
const SPINNER_VISUAL_OFFSET_Y_PX = -10;
const STRETCH_GUIDE_STEPS = [
  '목과 어깨를 천천히 돌려주세요',
  '양팔을 위로 길게 뻗어주세요',
  '손목과 허리를 가볍게 풀어주세요',
] as const;

interface SpinnerPracticePanelProps {
  selectedTool: SpinnerAssistTool;
  spinnerTurns: number;
  keycapGlowTheme: KeycapGlowTheme;
  keycapPressTick: number;
  keycapVisualState: KeycapVisualState;
  mascotVisualState: MascotVisualState;
  mascotPromptType: MascotPromptType;
  mascotMessage: string | null;
  isStretchGuideOpen: boolean;
  stretchCountdownSeconds: number;
  onSelectTool: (tool: SpinnerAssistTool) => void;
  onSpin: () => void;
  onSpinnerWheel: (deltaY: number) => void;
  onKeycapPressEnd: () => void;
  onKeycapPressStart: () => void;
  onMascotClick: () => void;
  onDismissStretchGuide: () => void;
}

function SpinnerPracticePanel({
  selectedTool,
  spinnerTurns,
  keycapGlowTheme,
  keycapPressTick,
  keycapVisualState,
  mascotVisualState,
  mascotPromptType,
  mascotMessage,
  isStretchGuideOpen,
  stretchCountdownSeconds,
  onSelectTool,
  onSpin,
  onSpinnerWheel,
  onKeycapPressEnd,
  onKeycapPressStart,
  onMascotClick,
  onDismissStretchGuide,
}: SpinnerPracticePanelProps) {
  const handleSpinnerWheel = (event: WheelEvent<HTMLButtonElement | HTMLDivElement>) => {
    event.preventDefault();
    onSpinnerWheel(event.deltaY);
  };

  const mascotIcon =
    mascotVisualState === 'hover'
      ? mascotHoverIcon
      : mascotVisualState === 'pressed'
        ? mascotPressedIcon
        : mascotDefaultIcon;

  const mascotSizeClass =
    mascotVisualState === 'default' ? 'h-[188px] w-[188px]' : 'h-[172px] w-[172px]';
  const mascotPositionClass = 'translate-y-[130px]';

  const showMascotBubble = Boolean(mascotMessage) && !isStretchGuideOpen;
  const isStretchPrompt = mascotPromptType === 'stretch' && !isStretchGuideOpen;

  return (
    <section className="flex h-[540px] w-[280px] flex-col items-center justify-between">
      <div className="w-full">
        <div
          className="flex h-[228px] w-full items-center justify-center overflow-hidden rounded-[12px] border border-[#52555F] bg-[#25272E]"
          onWheel={selectedTool === 'spinner' ? handleSpinnerWheel : undefined}
        >
          {selectedTool === 'spinner' ? (
            <button
              type="button"
              onClick={onSpin}
              onWheel={handleSpinnerWheel}
              className="relative flex h-[220px] w-[220px] cursor-ns-resize items-center justify-center"
              aria-label="마우스 휠이나 클릭으로 스피너 회전"
            >
              <div
                className="relative h-[182px] w-[182px] shrink-0"
                style={{ transform: `translateY(${SPINNER_VISUAL_OFFSET_Y_PX}px)` }}
              >
                <div
                  className="absolute inset-0 transition-transform duration-700 ease-out"
                  style={{
                    transform: `rotate(${spinnerTurns * 360}deg)`,
                    transformOrigin: `${(SPINNER_HUB_CX / SPINNER_VIEWBOX_SIZE) * 100}% ${
                      (SPINNER_HUB_CY / SPINNER_VIEWBOX_SIZE) * 100
                    }%`,
                    willChange: 'transform',
                  }}
                >
                  <svg
                    viewBox={`0 0 ${SPINNER_VIEWBOX_SIZE} ${SPINNER_VIEWBOX_SIZE}`}
                    className="block h-full w-full"
                    aria-hidden="true"
                  >
                    <defs>
                      <mask id="spinner-arms-mask">
                        <rect
                          x="0"
                          y="0"
                          width={SPINNER_VIEWBOX_SIZE}
                          height={SPINNER_VIEWBOX_SIZE}
                          fill="white"
                        />
                        <circle
                          cx={SPINNER_HUB_CX}
                          cy={SPINNER_HUB_CY}
                          r={SPINNER_HUB_RADIUS}
                          fill="black"
                        />
                      </mask>
                    </defs>
                    <image
                      href={spinnerIcon}
                      x="0"
                      y="0"
                      width={SPINNER_VIEWBOX_SIZE}
                      height={SPINNER_VIEWBOX_SIZE}
                      mask="url(#spinner-arms-mask)"
                      preserveAspectRatio="none"
                    />
                  </svg>
                </div>

                <svg
                  viewBox={`0 0 ${SPINNER_VIEWBOX_SIZE} ${SPINNER_VIEWBOX_SIZE}`}
                  className="pointer-events-none absolute inset-0 block h-full w-full"
                  aria-hidden="true"
                >
                  <defs>
                    <clipPath id="spinner-hub-clip">
                      <circle cx={SPINNER_HUB_CX} cy={SPINNER_HUB_CY} r={SPINNER_HUB_RADIUS} />
                    </clipPath>
                  </defs>
                  <image
                    href={spinnerIcon}
                    x="0"
                    y="0"
                    width={SPINNER_VIEWBOX_SIZE}
                    height={SPINNER_VIEWBOX_SIZE}
                    clipPath="url(#spinner-hub-clip)"
                    preserveAspectRatio="none"
                  />
                </svg>
              </div>
            </button>
          ) : (
            <KeycapButton
              label="키캡"
              onPress={() => {}}
              onPressEnd={onKeycapPressEnd}
              onPressStart={() => {
                onSelectTool('keycap');
                onKeycapPressStart();
              }}
              glowTheme={keycapGlowTheme}
              pressTick={keycapPressTick}
              variant="spinner"
              visualState={keycapVisualState}
            />
          )}
        </div>
      </div>

      <div
        className={`relative w-full px-4 transition-all duration-300 ${
          isStretchGuideOpen ? 'min-h-[292px] py-5' : 'min-h-[268px] py-3'
        }`}
      >
        {isStretchGuideOpen ? (
          <div className="flex h-full flex-col">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[12px] font-semibold uppercase tracking-[0.22em] text-[#9FB5D1]">
                  Stretch
                </p>
                <h2 className="mt-2 text-[24px] font-bold leading-[1.25] tracking-[-0.03em] text-white">
                  잠깐 몸을
                  <br />
                  풀어볼까요?
                </h2>
              </div>
              <div className="rounded-full bg-[rgba(26,154,245,0.14)] px-3 py-1.5 text-[18px] font-bold text-[#57B7FF]">
                {stretchCountdownSeconds}s
              </div>
            </div>

            <div className="mt-5 rounded-[18px] bg-[#1D2430] px-4 py-4">
              <ol className="space-y-3">
                {STRETCH_GUIDE_STEPS.map((step, index) => (
                  <li key={step} className="flex items-start gap-3 text-[14px] leading-[1.6] text-[#E2E8F0]">
                    <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white text-[13px] font-bold text-[#1A9AF5]">
                      {index + 1}
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </div>

            <div className="mt-auto flex justify-end gap-2 pt-5">
              <button
                type="button"
                onClick={onDismissStretchGuide}
                className="h-[46px] rounded-[14px] border border-[#677489] px-5 text-[15px] font-semibold text-[#D9E3F0] transition-colors hover:bg-white/5"
              >
                건너뛰기
              </button>
              <button
                type="button"
                onClick={onDismissStretchGuide}
                className="h-[46px] rounded-[14px] bg-[#1A9AF5] px-6 text-[15px] font-semibold text-white transition-colors hover:bg-[#1089E4]"
              >
                확인
              </button>
            </div>
          </div>
        ) : (
          <div className="flex h-full items-start justify-center">
            <div className={`flex flex-col items-center ${mascotPositionClass} ${showMascotBubble ? 'gap-[10px]' : ''}`}>
              {showMascotBubble ? (
                <div className="relative z-10 w-[220px] rounded-[20px] border border-[#D8E6F6] bg-white px-4 py-3 text-center text-[14px] font-semibold leading-[1.5] text-[#1E293B] shadow-[0_14px_30px_rgba(15,23,42,0.18)]">
                  {mascotMessage}
                  <div className="absolute left-1/2 top-full h-3 w-3 -translate-x-1/2 -translate-y-1/2 rotate-45 border-b border-r border-[#D8E6F6] bg-white" />
                </div>
              ) : null}

              {isStretchPrompt ? (
                <button
                  type="button"
                  onClick={onMascotClick}
                  className="rounded-[24px] outline-none transition-transform duration-200 hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-[#7CC7FF]"
                >
                  <img src={mascotIcon} alt="마스코트" className={`${mascotSizeClass} object-contain`} />
                </button>
              ) : (
                <img src={mascotIcon} alt="마스코트" className={`${mascotSizeClass} object-contain`} />
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

export default SpinnerPracticePanel;
