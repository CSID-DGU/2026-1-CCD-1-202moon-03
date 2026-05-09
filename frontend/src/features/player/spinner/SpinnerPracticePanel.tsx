import type { WheelEvent } from 'react';
import keycapIcon from '../../../assets/icons/keycap.svg';
import mascotDefaultIcon from '../../../assets/icons/mascot_default.svg';
import spinnerIcon from '../../../assets/icons/spinner.svg';
import type { SpinnerAssistTool } from './types';

interface SpinnerPracticePanelProps {
  selectedTool: SpinnerAssistTool;
  spinnerTurns: number;
  isKeycapPressed: boolean;
  keycapPressCount: number;
  onSelectTool: (tool: SpinnerAssistTool) => void;
  onSpin: () => void;
  onSpinnerWheel: (deltaY: number) => void;
  onPressKeycap: () => void;
}

function SpinnerPracticePanel({
  selectedTool,
  spinnerTurns,
  isKeycapPressed,
  keycapPressCount,
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
    <section className="flex h-[592px] w-[306px] flex-col items-center justify-between">
      <div className="w-full">
        <div
          className="flex h-[246px] w-full items-center justify-center overflow-hidden rounded-[12px] border border-[#52555F] bg-[#25272E]"
          onWheel={selectedTool === 'spinner' ? handleSpinnerWheel : undefined}
        >
          {selectedTool === 'spinner' ? (
            <button
              type="button"
              onClick={onSpin}
              onWheel={handleSpinnerWheel}
              className="relative flex h-[250px] w-[250px] cursor-ns-resize items-center justify-center"
              aria-label="마우스 휠이나 클릭으로 스피너 회전"
            >
              <img
                src={spinnerIcon}
                alt="원형 스피너"
                className="h-[206px] w-[206px] object-contain transition-transform duration-700 ease-out"
                style={{ transform: `rotate(${spinnerTurns * 360}deg)` }}
              />
            </button>
          ) : (
            <button
              key={keycapPressCount}
              type="button"
              onClick={() => {
                onSelectTool('keycap');
                onPressKeycap();
              }}
              aria-pressed={isKeycapPressed}
              className={`flex h-[160px] w-[220px] items-center justify-center bg-transparent transition-all duration-150 ${
                isKeycapPressed
                  ? 'translate-y-3 scale-[0.95]'
                  : 'hover:-translate-y-0.5'
              }`}
            >
              <img
                src={keycapIcon}
                alt="키캡"
                className={`h-[136px] w-[196px] object-contain transition-all duration-150 ${
                  isKeycapPressed
                    ? 'brightness-[0.9] contrast-[1.04] saturate-[1.08] drop-shadow-[0_3px_4px_rgba(16,137,223,0.14)]'
                    : 'drop-shadow-[0_18px_30px_rgba(26,154,245,0.28)]'
                }`}
              />
            </button>
          )}
        </div>
      </div>

      <div className="flex w-full items-center justify-center px-2 py-2">
        <img
          src={mascotDefaultIcon}
          alt="마스코트"
          className="h-[220px] w-[220px] object-contain"
        />
      </div>
    </section>
  );
}

export default SpinnerPracticePanel;
