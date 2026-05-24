import type { RainKeyword } from './types';

interface FallingKeywordsProps {
  keywords: RainKeyword[];
  inputPositions?: Record<string, number>;
}

function getAnswerBoxWidth(answerLength?: number) {
  return Math.max(100, (answerLength ?? 0) * 22 + 20);
}

function FallingKeywords({ keywords, inputPositions = {} }: FallingKeywordsProps) {
  return (
    <div className="relative h-full w-full overflow-hidden rounded-[24px]">
      {keywords.map((keyword) => {
        const measuredLeft = keyword.blankKey ? inputPositions[keyword.blankKey] : undefined;
        const fallbackPercent = keyword.leftPercent ?? 12 + keyword.lane * 18;

        if (keyword.blankKey && typeof measuredLeft !== 'number') {
          return null;
        }

        const translateY =
          keyword.status === 'cleared'
            ? 'translate(-50%, -50%) scale(0.92)'
            : keyword.status === 'missed'
              ? 'translate(-50%, -50%) scale(1.04)'
              : 'translate(-50%, -50%)';

        return (
          <div
            key={keyword.id}
            className={`absolute inline-flex h-[42px] w-[100px] items-center justify-center whitespace-nowrap rounded-[8px] border px-[10px] py-[6px] text-center font-paperlogy text-[18px] font-semibold leading-[1.2] shadow-[0_8px_20px_rgba(3,46,78,0.14)] ${
              keyword.status === 'active'
                ? 'border-[#032E4E] bg-[#EAF5FF] text-[#1A9AF5]'
                : keyword.status === 'missed'
                  ? 'border-[#DC2626] bg-[#FFF1F2] text-[#BE123C] shadow-[0_10px_24px_rgba(190,24,93,0.18)]'
                : keyword.status === 'cleared'
                  ? 'border-[#C7F0D6] bg-[#F0FFF4] text-[#15803D] opacity-75'
                  : 'border-[#D7DCE4] bg-white/88 text-[#25272E]'
            }`}
            style={{
              left: typeof measuredLeft === 'number' ? `${measuredLeft}px` : `${fallbackPercent}%`,
              top: `${keyword.progress}%`,
              width: `${getAnswerBoxWidth(keyword.answerLength)}px`,
              transform: translateY,
            }}
          >
            {keyword.text}
          </div>
        );
      })}
    </div>
  );
}

export default FallingKeywords;
