import type { WheelEvent } from 'react';
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
  const handleSpinnerWheel = (
    event: WheelEvent<HTMLButtonElement | HTMLDivElement>,
  ) => {
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
              className={`flex h-[160px] w-[220px] items-center justify-center rounded-[30px] border border-[#1A9AF5] bg-[#E5E7EC] text-[#1A9AF5] transition-all duration-150 ${
                isKeycapPressed
                  ? 'translate-y-1 scale-[0.985] shadow-[inset_0px_6px_8px_0px_#40AFFE,inset_0px_-4px_2px_0px_#1089DF]'
                  : 'shadow-[0_12px_24px_rgba(26,154,245,0.18)]'
              }`}
            >
              <span className="text-[42px] font-black tracking-[0.08em]">D</span>
            </button>
          )}
        </div>
      </div>

      <div className="w-full rounded-[22px] border border-[#E3ECF7] bg-[#F8FBFF] px-5 py-4">
        <p className="text-sm font-semibold tracking-[0.04em] text-[#355070]">
          {selectedTool === 'spinner' ? '스피너 사용 팁' : '키캡 사용 팁'}
        </p>
        <p className="mt-2 text-sm leading-6 text-[#66788E]">
          {selectedTool === 'spinner'
            ? '스피너를 가볍게 돌리며 시청 리듬을 맞춰 보세요. 시선과 손 감각으로 현재 구간을 붙잡는 데 도움이 됩니다.'
            : 'D 키를 누를 때마다 키캡이 눌리며 반응합니다. 반복 입력 감각으로 집중 흐름을 유지해 보세요.'}
        </p>
      </div>
    </section>
  );
}

export default SpinnerPracticePanel;
