import type { ReactNode } from 'react';

export type ButtonVariant = 'active' | 'inactive' | 'secondary';

interface ButtonProps {
  children: ReactNode;
  type?: 'button' | 'submit' | 'reset';
  onClick?: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  className?: string;
}

const baseClasses =
  'inline-flex items-center justify-center rounded-[16px] border px-5 py-4 text-[20px] leading-[1.5] tracking-[-0.45px] transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-sky-200';

const variantClasses: Record<ButtonVariant, string> = {
  active:
    'border-[#1A9AF5] bg-[#1A9AF5] font-bold text-white shadow-[inset_0px_4px_4px_0px_#51B7FF,inset_0px_-4px_4px_0px_#0684DE] hover:bg-[#1591EA]',
  inactive:
    'cursor-not-allowed border-[#C6E4FF] bg-[#C6E4FF] font-bold text-white shadow-[inset_0px_4px_4px_0px_rgba(64,175,254,0.08),inset_0px_-4px_4px_0px_rgba(16,137,223,0.08)]',
  secondary:
    'border-[#1A9AF5] bg-white font-medium text-[#1A9AF5] shadow-[inset_0px_4px_4px_0px_rgba(64,175,254,0.08),inset_0px_-4px_4px_0px_rgba(16,137,223,0.08)] hover:bg-[#F7FBFF]',
};

function Button({
  children,
  type = 'button',
  onClick,
  variant = 'inactive',
  disabled = false,
  className = '',
}: ButtonProps) {
  const isDisabled = disabled || variant === 'inactive';

  return (
    <button
      type={type}
      onClick={isDisabled ? undefined : onClick}
      disabled={isDisabled}
      className={[
        baseClasses,
        variantClasses[variant],
        disabled ? 'cursor-not-allowed opacity-70' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </button>
  );
}

export default Button;
