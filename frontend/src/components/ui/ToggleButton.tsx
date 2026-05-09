import React from 'react';

interface ToggleButtonProps {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
  hasError?: boolean;
}

const ToggleButton: React.FC<ToggleButtonProps> = ({
  selected,
  onClick,
  children,
  hasError = false,
}) => {
  return (
    <button
      className={`flex h-[48px] flex-1 items-center justify-center rounded-[10px] border text-[16px] font-medium transition-colors ${
        selected
          ? 'border-[#1A9AF5] bg-[#eef7ff] text-[#1A9AF5]'
          : hasError
            ? 'border-[#ff6b6b] bg-white text-[#98a2b3]'
            : 'border-[#c4cfdf] bg-white text-[#98a2b3]'
      }`}
      type="button"
      onClick={onClick}
    >
      {children}
    </button>
  );
};

export default ToggleButton;
