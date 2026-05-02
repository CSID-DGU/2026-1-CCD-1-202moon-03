interface ComboIndicatorProps {
  combo: number;
  animationKey: number;
}

function ComboIndicator({ combo, animationKey }: ComboIndicatorProps) {
  const showBurst = animationKey > 0;

  return (
    <div className="relative overflow-hidden rounded-[24px] border border-[#DDE7F2] bg-white px-6 py-5 shadow-[0_16px_36px_rgba(148,163,184,0.16)]">
      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#2F80ED]">
        Combo
      </p>
      <div className="mt-3 flex items-end gap-3">
        <p className="text-5xl font-semibold tracking-[-0.04em] text-[#1D2836]">{combo}</p>
        <span className="pb-2 text-base font-medium text-[#5D7088]">연속 정답</span>
      </div>

      <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#E7EEF7]">
        <div
          className="h-full rounded-full bg-[linear-gradient(90deg,#93C5FD_0%,#2F80ED_100%)] transition-all duration-300"
          style={{ width: `${Math.min(combo * 10, 100)}%` }}
        />
      </div>

      {showBurst ? (
        <div
          key={animationKey}
          className="pointer-events-none absolute right-6 top-6 animate-[ping_550ms_ease-out_1] rounded-full bg-[#2F80ED]/12 px-4 py-2 text-sm font-semibold text-[#2F80ED]"
        >
          +COMBO
        </div>
      ) : null}
    </div>
  );
}

export default ComboIndicator;
