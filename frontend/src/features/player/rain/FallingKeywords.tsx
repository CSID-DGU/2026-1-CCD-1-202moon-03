import type { RainKeyword } from './types';

interface FallingKeywordsProps {
  keywords: RainKeyword[];
}

function FallingKeywords({ keywords }: FallingKeywordsProps) {
  return (
    <div className="relative h-full w-full overflow-hidden rounded-[24px]">
      {keywords.map((keyword) => {
        const leftOffset = keyword.leftPercent ?? 12 + keyword.lane * 18;

        return (
          <div
            key={keyword.id}
            className={`absolute rounded-[8px] border px-[14px] py-[8px] text-center font-paperlogy text-[18px] font-semibold leading-[1.5] shadow-[0_8px_20px_rgba(3,46,78,0.14)] ${
              keyword.status === 'active'
                ? 'border-[#032E4E] bg-[#EAF5FF] text-[#1A9AF5]'
                : keyword.status === 'missed'
                  ? 'border-[#DC2626] bg-[#FFF1F2] text-[#BE123C] shadow-[0_10px_24px_rgba(190,24,93,0.18)]'
                : keyword.status === 'cleared'
                  ? 'border-[#C7F0D6] bg-[#F0FFF4] text-[#15803D] opacity-75'
                  : 'border-[#D7DCE4] bg-white/88 text-[#25272E]'
            }`}
            style={{
              left: `${leftOffset}%`,
              top: `${keyword.progress}%`,
              minWidth: '100px',
              transform:
                keyword.status === 'cleared'
                  ? 'translateY(-50%) scale(0.92)'
                  : keyword.status === 'missed'
                    ? 'translateY(-50%) scale(1.04)'
                    : 'translateY(-50%)',
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
