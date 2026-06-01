import type { RainKeyword, RainPlayfieldMetrics } from './types';

interface FallingKeywordsProps {
  keywords: RainKeyword[];
  inputPositions?: Record<string, number>;
  playfieldMetrics: RainPlayfieldMetrics;
}

const KEYWORD_BOX_HEIGHT = 42;
const STATE_TRANSITION_EASING = 'cubic-bezier(0.22, 1, 0.36, 1)';
const COLOR_TRANSITION_EASING = 'ease-out';
const STATE_TRANSITION_STYLE = {
  transitionProperty: 'transform, opacity, box-shadow, background-color, border-color, color',
  transitionDuration: '160ms, 160ms, 180ms, 180ms, 180ms, 180ms',
  transitionTimingFunction: [
    STATE_TRANSITION_EASING,
    STATE_TRANSITION_EASING,
    COLOR_TRANSITION_EASING,
    COLOR_TRANSITION_EASING,
    COLOR_TRANSITION_EASING,
    COLOR_TRANSITION_EASING,
  ].join(', '),
} as const;

function getAnswerBoxWidth(answerLength?: number) {
  return Math.max(100, (answerLength ?? 0) * 22 + 20);
}

function FallingKeywords({ keywords, inputPositions = {}, playfieldMetrics }: FallingKeywordsProps) {
  const startTopPx = playfieldMetrics.playfieldTopPx - KEYWORD_BOX_HEIGHT;
  const endTopPx = Math.max(playfieldMetrics.playfieldBottomPx - KEYWORD_BOX_HEIGHT, startTopPx);

  return (
    <div className="relative h-full w-full overflow-hidden rounded-[24px]">
      {keywords.map((keyword) => {
        const measuredLeft = keyword.blankKey ? inputPositions[keyword.blankKey] : undefined;
        const fallbackPercent = keyword.leftPercent ?? 12 + keyword.lane * 18;
        const clampedProgress = Math.max(0, Math.min(keyword.topProgress, 1));
        const translateYPx = startTopPx + clampedProgress * (endTopPx - startTopPx);

        if (keyword.blankKey && typeof measuredLeft !== 'number') {
          return null;
        }

        const wrapperTransformValue = `translate3d(-50%, ${translateYPx}px, 0)`;
        const boxScale =
          keyword.status === 'cleared'
            ? 'scale(0.92)'
            : keyword.status === 'missed'
              ? 'scale(1.04)'
              : 'scale(1)';
        const boxOpacity =
          keyword.status === 'cleared'
            ? 0.75
            : keyword.status === 'missed'
              ? 0.96
              : 1;

        return (
          <div
            key={keyword.id}
            className="absolute"
            style={{
              left: typeof measuredLeft === 'number' ? `${measuredLeft}px` : `${fallbackPercent}%`,
              top: '0px',
              width: `${getAnswerBoxWidth(keyword.answerLength)}px`,
              transform: wrapperTransformValue,
              transformOrigin: `center ${KEYWORD_BOX_HEIGHT / 2}px`,
              willChange: 'transform',
              backfaceVisibility: 'hidden',
            }}
          >
            <div
              className={`inline-flex h-[42px] w-full items-center justify-center whitespace-nowrap rounded-[8px] border px-[10px] py-[6px] text-center font-paperlogy text-[18px] font-semibold leading-[1.2] shadow-[0_8px_20px_rgba(3,46,78,0.14)] ${
                keyword.status === 'active'
                  ? 'border-[#032E4E] bg-[#EAF5FF] text-[#1A9AF5]'
                  : keyword.status === 'missed'
                    ? 'border-[#DC2626] bg-[#FFF1F2] text-[#BE123C] shadow-[0_10px_24px_rgba(190,24,93,0.18)]'
                    : keyword.status === 'cleared'
                      ? 'border-[#C7F0D6] bg-[#F0FFF4] text-[#15803D]'
                      : 'border-[#D7DCE4] bg-white/88 text-[#25272E]'
              }`}
              style={{
                ...STATE_TRANSITION_STYLE,
                transform: boxScale,
                opacity: boxOpacity,
              }}
            >
              {keyword.text}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default FallingKeywords;
