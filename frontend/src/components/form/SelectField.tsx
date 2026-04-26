import React from 'react';

interface SelectOption {
  label: string;
  value: string;
}

interface SelectFieldProps {
  id?: string;
  name?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: SelectOption[];
  variant: 'default' | 'filled' | 'error';
}

const SelectField: React.FC<SelectFieldProps> = ({ id, name, value, onChange, options, variant }) => {
  const baseClasses =
    'h-[48px] w-full appearance-none rounded-[10px] border bg-white px-4 text-[16px] leading-6 outline-none transition-colors';

  const variantClasses = {
    default: 'border-[#c4cfdf] text-[#98a2b3] focus:border-[#1A9AF5]',
    filled: 'border-[#c4cfdf] text-slate-800 focus:border-[#1A9AF5]',
    error: 'border-[#ff6b6b] text-slate-800 focus:border-[#ff6b6b]',
  };

  return (
    <div className="relative">
      <select
        id={id}
        name={name}
        value={value}
        onChange={onChange}
        className={`${baseClasses} ${variantClasses[variant]}`}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[18px] text-[#394150]">
        ˅
      </span>
    </div>
  );
};

export default SelectField;
