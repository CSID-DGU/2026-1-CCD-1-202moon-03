interface ComboIndicatorProps {
  combo: number;
  animationKey: number;
}

function ComboIndicator({ combo, animationKey }: ComboIndicatorProps) {
  const showBurst = animationKey > 0;

  return (
    <div className="relative flex items-center justify-center gap-1 overflow-hidden rounded-[12px] border border-[#EF4444] bg-[#FDE8E8] px-4 py-4">
      <span className="text-[20px]" aria-hidden="true">
        🔥
      </span>
      <div className="flex items-end gap-[2px] font-paperlogy font-black leading-none text-[#EF4444]">
        <span className="text-[24px]">{combo}</span>
        <span className="text-[20px]">Combo</span>
      </div>

      {showBurst ? (
        <div
          key={animationKey}
          className="pointer-events-none absolute inset-0 animate-[ping_550ms_ease-out_1] rounded-[12px] border border-[#EF4444]/40"
        >
          <span className="sr-only">combo burst</span>
        </div>
      ) : null}
    </div>
  );
}

export default ComboIndicator;
