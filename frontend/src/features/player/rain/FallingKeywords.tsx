import type { RainKeyword } from './types';

interface FallingKeywordsProps {
  keywords: RainKeyword[];
}

function FallingKeywords({ keywords }: FallingKeywordsProps) {
  return (
    <div className="relative h-full w-full overflow-hidden rounded-[24px]">
      {keywords.map((keyword) => {
        const leftOffset = 9 + keyword.lane * 21;

        return (
          <div
            key={keyword.id}
            className={`absolute rounded-full px-4 py-2 text-sm font-semibold shadow-[0_10px_24px_rgba(148,163,184,0.22)] transition-all duration-300 ${
              keyword.status === 'active'
                ? 'border border-[#9DD1FF] bg-[#2F80ED] text-white'
                : keyword.status === 'cleared'
                  ? 'border border-[#D6E6F8] bg-white/78 text-[#7A8EA5] opacity-60'
                  : 'border border-[#DDE7F2] bg-white/92 text-[#2C3D52]'
            }`}
            style={{
              left: `${leftOffset}%`,
              top: `${keyword.progress}%`,
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
