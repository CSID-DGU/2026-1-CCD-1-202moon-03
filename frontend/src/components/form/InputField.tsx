import React from 'react';

interface InputFieldProps {
  type: React.HTMLInputTypeAttribute;
  placeholder: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  variant: 'default' | 'filled' | 'error';
  autoComplete?: string;
  id?: string;
  name?: string;
  ariaDescribedBy?: string;
  disabled?: boolean;
}

const InputField: React.FC<InputFieldProps> = ({
  type,
  placeholder,
  value,
  onChange,
  variant,
  autoComplete,
  id,
  name,
  ariaDescribedBy,
  disabled,
}) => {
  const baseClasses =
    'w-full rounded-[12px] border px-5 py-4 text-[16px] leading-6 text-slate-800 outline-none transition-colors duration-200 disabled:bg-slate-50 disabled:text-slate-400';

  const variantClasses = {
    default:
      'border-slate-300 bg-white placeholder:text-slate-400 focus:border-sky-500 focus:ring-0',
    filled: 'border-slate-300 bg-white focus:border-sky-500 focus:ring-0',
    error: 'border-[#ff6b6b] bg-white text-slate-800 focus:border-[#ff6b6b] focus:ring-0',
  };

  return (
    <input
      id={id}
      name={name}
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      autoComplete={autoComplete}
      aria-invalid={variant === 'error'}
      aria-describedby={ariaDescribedBy}
      disabled={disabled}
      className={`${baseClasses} ${variantClasses[variant]}`}
    />
  );
};

export default InputField;
