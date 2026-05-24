import type { WheelEvent } from 'react';
import mascotDefaultIcon from '../../../assets/icons/mascot_default.svg';
import spinnerIcon from '../../../assets/icons/spinner.svg';
import KeycapButton from './KeycapButton';
import type { KeycapVisualState, SpinnerAssistTool } from './types';

const SPINNER_VIEWBOX_SIZE = 200;
const SPINNER_HUB_CX = 100;
const SPINNER_HUB_CY = 115.2;
const SPINNER_HUB_RADIUS = 28;
const SPINNER_VISUAL_OFFSET_Y_PX = -10;

interface SpinnerPracticePanelProps {
  selectedTool: SpinnerAssistTool;
  spinnerTurns: number;
  keycapPressTick: number;
  keycapVisualState: KeycapVisualState;
  onSelectTool: (tool: SpinnerAssistTool) => void;
  onSpin: () => void;
  onSpinnerWheel: (deltaY: number) => void;
  onPressKeycap: () => void;
}

function SpinnerPracticePanel({
  selectedTool,
  spinnerTurns,
  keycapPressTick,
  keycapVisualState,
  onSelectTool,
  onSpin,
  onSpinnerWheel,
  onPressKeycap,
}: SpinnerPracticePanelProps) {
  const handleSpinnerWheel = (event: WheelEvent<HTMLButtonElement | HTMLDivElement>) => {
    event.preventDefault();
    onSpinnerWheel(event.deltaY);
  };

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
                        <circle cx={SPINNER_HUB_CX} cy={SPINNER_HUB_CY} r={SPINNER_HUB_RADIUS} fill="black" />
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
              onPress={() => {
                onSelectTool('keycap');
                onPressKeycap();
              }}
              pressTick={keycapPressTick}
              variant="spinner"
              visualState={keycapVisualState}
            />
          )}
        </div>
      </div>

      <div className="flex w-full items-center justify-center px-2 py-1">
        <img src={mascotDefaultIcon} alt="마스코트" className="h-[180px] w-[180px] object-contain" />
      </div>
    </section>
  );
}

export default SpinnerPracticePanel;
