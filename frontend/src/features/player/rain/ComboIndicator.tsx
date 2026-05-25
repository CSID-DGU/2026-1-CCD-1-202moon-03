import type { CSSProperties } from 'react';

interface ComboIndicatorProps {
  combo: number;
  animationKey: number;
}

const comboValueOutlineStyle: CSSProperties = {
  background: 'linear-gradient(180deg, #58BAFF 0%, #005693 100%)',
  backgroundClip: 'text',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
};

const comboOutlineStyle: CSSProperties = {
  WebkitTextFillColor: '#FFFFFF',
  WebkitTextStrokeWidth: '8.5px',
  WebkitTextStrokeColor: '#FFFFFF',
};

function ComboIndicator({ combo, animationKey }: ComboIndicatorProps) {
  return (
    <div className="relative flex h-[84px] w-full items-end justify-center overflow-visible">
      <div className="flex w-[184.5px] flex-col items-center gap-[6px] overflow-visible font-maplestory font-bold leading-none not-italic whitespace-nowrap text-transparent">
        <p
          className="text-center text-[18px] leading-none text-white"
        >
          COMBO
        </p>

        <span
          aria-hidden="true"
          className="absolute bottom-0 left-1/2 -translate-x-1/2 font-maplestory text-center text-[52px] font-bold leading-none tracking-[5.2px]"
          style={comboOutlineStyle}
        >
          {combo}
        </span>
        <span
          key={animationKey}
          className={`relative text-center text-[52px] leading-none tracking-[5.2px] ${
            animationKey > 0 ? 'animate-combo-num' : ''
          }`}
          style={comboValueOutlineStyle}
        >
          {combo}
        </span>
      </div>

      <span className="sr-only">{combo} combo</span>
    </div>
  );
}

export default ComboIndicator;
