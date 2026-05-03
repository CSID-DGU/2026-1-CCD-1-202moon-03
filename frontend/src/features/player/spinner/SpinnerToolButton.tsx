import type { ReactNode } from 'react';

interface SpinnerToolButtonProps {
  label: string;
  icon: ReactNode;
  isActive: boolean;
  onClick: () => void;
}

function SpinnerToolButton({
  label,
  icon,
  isActive,
  onClick,
}: SpinnerToolButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex min-h-[88px] w-full items-center gap-4 rounded-[22px] border px-5 py-4 text-left transition-all duration-200 ${
        isActive
          ? 'border-[#1A9AF5] bg-[#EAF5FF] shadow-[0_16px_32px_rgba(26,154,245,0.12)]'
          : 'border-[#DEE5F0] bg-white hover:border-[#BFD9F5] hover:bg-[#F9FCFF]'
      }`}
    >
      <span
        className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-[18px] ${
          isActive ? 'bg-white shadow-[0_8px_18px_rgba(148,163,184,0.14)]' : 'bg-[#F3F7FB]'
        }`}
      >
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block font-paperlogy text-[20px] font-semibold leading-[1.4] text-[#1C2430]">
          {label}
        </span>
        <span className="mt-1 block text-sm leading-6 text-[#697A90]">
          {isActive ? '현재 선택됨' : '학습 도구 선택'}
        </span>
      </span>
    </button>
  );
}

export default SpinnerToolButton;
