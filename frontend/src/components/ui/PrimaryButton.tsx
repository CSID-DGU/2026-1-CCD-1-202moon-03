import React from 'react';

interface PrimaryButtonProps {
  type: 'button' | 'submit';
  disabled: boolean;
  variant: 'disabled' | 'active' | 'loading';
  children: React.ReactNode;
  onClick?: () => void;
}

const PrimaryButton: React.FC<PrimaryButtonProps> = ({
  type,
  disabled,
  variant,
  children,
  onClick,
}) => {
  const baseClasses =
    'inline-flex h-[64px] w-full items-center justify-center rounded-[12px] px-4 text-[24px] font-semibold transition-colors duration-200 focus:outline-none focus:ring-2';

  const variantClasses = {
    disabled: 'cursor-not-allowed bg-[#C6E4FF] text-white focus:ring-sky-200',
    active: 'bg-[#1A9AF5] text-white hover:bg-[#168fe6] focus:ring-sky-200',
    loading: 'bg-[#1A9AF5] text-white hover:bg-[#168fe6] focus:ring-sky-200',
  };

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`${baseClasses} ${variantClasses[variant]}`}
    >
      {children}
    </button>
  );
};

export default PrimaryButton;
