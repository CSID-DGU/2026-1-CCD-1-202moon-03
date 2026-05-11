interface ComboIndicatorProps {
  combo: number;
  animationKey: number;
}

const COMBO_TIERS = [
  { min: 10, label: 'AMAZING', border: 'border-[#F59E0B]', bg: 'bg-[#FFFBEB]', text: 'text-[#D97706]', burst: 'border-[#F59E0B]/50' },
  { min: 5,  label: 'PERFECT', border: 'border-[#A855F7]', bg: 'bg-[#FAF5FF]', text: 'text-[#9333EA]', burst: 'border-[#A855F7]/50' },
  { min: 3,  label: 'GREAT',   border: 'border-[#3B82F6]', bg: 'bg-[#EFF6FF]', text: 'text-[#2563EB]', burst: 'border-[#3B82F6]/50' },
  { min: 0,  label: 'GOOD',    border: 'border-[#EF4444]', bg: 'bg-[#FDE8E8]', text: 'text-[#EF4444]', burst: 'border-[#EF4444]/40' },
] as const;

function getTier(combo: number) {
  return COMBO_TIERS.find((tier) => combo >= tier.min) ?? COMBO_TIERS[COMBO_TIERS.length - 1];
}

function ComboIndicator({ combo, animationKey }: ComboIndicatorProps) {
  const showBurst = animationKey > 0;
  const tier = getTier(combo);

  return (
    <div className={`relative flex items-center justify-center gap-1 overflow-hidden rounded-[12px] border px-4 py-4 transition-colors duration-300 ${tier.border} ${tier.bg}`}>
      <span className="text-[20px]" aria-hidden="true">
        🔥
      </span>
      <div className={`flex items-end gap-[2px] font-paperlogy font-black leading-none ${tier.text}`}>
        <span key={animationKey} className={`text-[28px] ${showBurst ? 'animate-combo-num' : ''}`}>
          {combo}
        </span>
        <span className="text-[20px]">Combo</span>
      </div>

      {showBurst ? (
        <div
          key={animationKey}
          className={`pointer-events-none absolute inset-0 animate-[ping_500ms_ease-out_1] rounded-[12px] border ${tier.burst}`}
        >
          <span className="sr-only">combo burst</span>
        </div>
      ) : null}
    </div>
  );
}

export default ComboIndicator;
