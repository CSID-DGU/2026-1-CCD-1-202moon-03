import { useMemo, useState, type ReactNode } from 'react';
import rainIcon from '../../assets/icons/rain.svg';
import spinnerIcon from '../../assets/icons/spinner.svg';
import Button from '../../components/ui/Button';
import InfoIcon from '../../components/ui/InfoIcon';
import type { PlayerMode } from '../../store/usePlayerStore';

interface ModeSelectProps {
  onBack: () => void;
  onSelect: (mode: Exclude<PlayerMode, null>) => void;
}

type SelectableMode = Exclude<PlayerMode, null>;

interface ModeCardConfig {
  mode: SelectableMode;
  title: string;
  tooltipTitle: string;
  tooltipDescription: string[];
  renderArt: () => ReactNode;
}

function ModeSelect({ onBack, onSelect }: ModeSelectProps) {
  const [selectedMode, setSelectedMode] = useState<SelectableMode | null>(null);
  const [hoveredTooltip, setHoveredTooltip] = useState<SelectableMode | null>(null);

  const cards = useMemo<ModeCardConfig[]>(
    () => [
      {
        mode: 'spinner',
        title: '피젯스피너 모드',
        tooltipTitle: '피젯스피너 모드',
        tooltipDescription: [
          '영상 시청과 함께 피젯스피너를 회전시키거나 키캡을 누르며 학습을 진행합니다.',
          '손의 반복적인 움직임이 집중 흐름 유지에 도움을 줄 수 있습니다.',
          '피젯스피너를 돌리거나 키캡을 누르며 학습 리듬을 유지해보세요.',
        ],
        renderArt: () => <SpinnerModeArtwork />,
      },
      {
        mode: 'rain',
        title: '집중호우 모드',
        tooltipTitle: '집중호우 모드',
        tooltipDescription: [
          '영상 하단 자막으로 단어가 표시되고, 해당 단어가 보이면 위에서 천천히 떨어집니다. 단어가 바닥에 닿기 전에 타이핑해서 빈칸을 채워보세요.',
          '피젯스피너가 소근육 감각 자극으로 집중을 돕는다면, 키보드 타이핑은 리듬감 있는 입력으로 영상에 머무르기를 돕습니다.',
        ],
        renderArt: () => <RainModeArtwork />,
      },
    ],
    [],
  );

  return (
    <section className="relative h-full min-h-screen overflow-hidden bg-[radial-gradient(circle_at_center,_rgba(184,223,255,0.55)_0%,_rgba(255,255,255,0.98)_38%,_rgba(234,245,255,0.92)_100%)] px-10">
      <div className="absolute left-10 top-10 z-10">
        <button type="button" onClick={onBack} className="flex items-center gap-3 text-[#1F2125]">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1A9AF5] text-white shadow-[0_6px_16px_rgba(26,154,245,0.2)]">
            <BackIcon />
          </span>
          <span className="font-paperlogy text-[32px] font-bold leading-none">이전으로</span>
        </button>
      </div>

      <div className="absolute inset-0 flex items-center justify-center px-10 py-12">
        <div className="flex flex-col items-center">
          <div className="flex flex-wrap items-center justify-center gap-8">
            {cards.map((card) => {
              const isSelected = selectedMode === card.mode;
              const isTooltipOpen = hoveredTooltip === card.mode;

              return (
                <div
                  key={card.mode}
                  className="relative h-[349px] w-[300px]"
                  onMouseLeave={() =>
                    setHoveredTooltip((current) => (current === card.mode ? null : current))
                  }
                >
                  <button
                    type="button"
                    onClick={() => setSelectedMode(card.mode)}
                    className={`relative flex h-full w-full flex-col items-center gap-[33px] overflow-hidden rounded-[24px] border p-10 text-center transition-all duration-200 ${
                      isSelected
                        ? 'border-[#1A9AF5] bg-[#EAF5FF] shadow-[0_0_24px_6px_rgba(12,32,46,0.04),4px_4px_8px_0px_rgba(12,32,46,0.08)]'
                        : 'border-[#E5E7EC] bg-white shadow-[0_0_24px_6px_rgba(12,32,46,0.04),4px_4px_8px_0px_rgba(12,32,46,0.08)] hover:-translate-y-0.5 hover:shadow-[0_10px_26px_rgba(12,32,46,0.12)]'
                    }`}
                  >
                    <div className="flex h-[200px] w-[200px] items-center justify-center">
                      {card.renderArt()}
                    </div>
                    <p
                      className={`font-paperlogy text-[24px] font-medium leading-[1.5] ${
                        isSelected ? 'text-sky-500' : 'text-[#15171C]'
                      }`}
                    >
                      {card.title}
                    </p>
                  </button>

                  <div
                    className="absolute right-[19px] top-[19px] z-20"
                    onMouseEnter={() => setHoveredTooltip(card.mode)}
                  >
                    <button
                      type="button"
                      aria-label={`${card.title} 설명 보기`}
                      className="flex h-6 w-6 items-center justify-center"
                    >
                      <InfoIcon className="h-6 w-6" />
                    </button>

                    <div
                      className={`absolute right-[-19px] top-[-19px] h-[349px] w-[300px] overflow-hidden rounded-[24px] bg-[rgba(0,0,0,0.8)] px-5 py-6 text-left backdrop-blur-[6px] transition-all duration-150 ${
                        isTooltipOpen ? 'visible opacity-100' : 'invisible opacity-0'
                      }`}
                      onMouseEnter={() => setHoveredTooltip(card.mode)}
                    >
                      <div className="pr-8">
                        <p className="text-[24px] font-semibold leading-[1.5] text-white">
                          {card.tooltipTitle}
                        </p>
                        <div className="mt-4 space-y-5 text-[16px] font-medium leading-[1.5] text-[#F4F6F7]">
                          {card.tooltipDescription.map((paragraph) => (
                            <p key={paragraph}>{paragraph}</p>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <Button
            type="button"
            disabled={!selectedMode}
            onClick={() => {
              if (selectedMode) {
                onSelect(selectedMode);
              }
            }}
            variant={selectedMode ? 'active' : 'inactive'}
            className={`mt-12 h-[64px] w-[220px] text-[20px] tracking-[-0.03em] ${
              selectedMode
                ? 'shadow-[inset_0px_4px_4px_0px_rgba(64,175,254,0.6),inset_0px_-4px_4px_0px_rgba(16,137,223,0.4)]'
                : 'shadow-[inset_0px_4px_4px_0px_rgba(64,175,254,0.08),inset_0px_-4px_4px_0px_rgba(16,137,223,0.08)]'
            }`}
          >
            선택완료
          </Button>
        </div>
      </div>
    </section>
  );
}

function SpinnerModeArtwork() {
  return <img src={spinnerIcon} alt="" className="h-[160px] w-[160px] object-contain" />;
}

function RainModeArtwork() {
  return <img src={rainIcon} alt="" className="h-[160px] w-[160px] object-contain" />;
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

export default ModeSelect;
