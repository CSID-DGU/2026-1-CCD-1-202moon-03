import type { RainKeyword } from './types';

interface FallingKeywordsProps {
  keywords: RainKeyword[];
}

function FallingKeywords({ keywords }: FallingKeywordsProps) {
  return (
    <div className="relative h-full w-full overflow-hidden rounded-[24px]">
      {keywords.map((keyword) => {
        const leftOffset = 12 + keyword.lane * 18;

        return (
          <div
            key={keyword.id}
            className={`absolute rounded-[8px] border px-[14px] py-[8px] text-center font-paperlogy text-[18px] font-semibold leading-[1.5] shadow-[0_8px_20px_rgba(3,46,78,0.14)] transition-all duration-300 ${
              keyword.status === 'active'
                ? 'border-[#032E4E] bg-[#EAF5FF] text-[#1A9AF5]'
                : keyword.status === 'cleared'
                  ? 'border-[#E5E7EC] bg-white/72 text-[#7D828B] opacity-50'
                  : 'border-[#D7DCE4] bg-white/88 text-[#25272E]'
            }`}
            style={{
              left: `${leftOffset}%`,
              top: `${keyword.progress}%`,
              minWidth: '100px',
              transform: 'translateY(-50%)',
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
