import type { ReactNode } from 'react';

interface SpinnerControlButtonProps {
  children: ReactNode;
  isActive?: boolean;
  onClick: () => void;
}

function SpinnerControlButton({
  children,
  isActive = false,
  onClick,
}: SpinnerControlButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex h-12 items-center justify-center rounded-full border px-5 text-sm font-semibold transition-all duration-200 ${
        isActive
          ? 'border-[#1A9AF5] bg-[#1A9AF5] text-white shadow-[0_10px_24px_rgba(26,154,245,0.28)]'
          : 'border-[#D6E3F3] bg-white text-[#355070] hover:border-[#B7D6F8] hover:bg-[#F5FAFF]'
      }`}
    >
      {children}
    </button>
  );
}

export default SpinnerControlButton;
