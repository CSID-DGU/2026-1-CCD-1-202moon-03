import React from 'react';

interface FormFieldProps {
  label: string;
  htmlFor: string;
  errorMessage?: string;
  description?: string;
  required?: boolean;
  children: React.ReactNode;
}

const FormField: React.FC<FormFieldProps> = ({
  label,
  htmlFor,
  errorMessage,
  description,
  required = false,
  children,
}) => {
  const errorId = errorMessage ? `${htmlFor}-error` : undefined;

  return (
    <div className="space-y-3">
      <label className="block text-[16px] font-medium leading-6 text-slate-400" htmlFor={htmlFor}>
        {label}
        {required ? <span className="sr-only"> required</span> : null}
      </label>
      {description ? <p className="text-sm text-slate-500">{description}</p> : null}
      {children}
      {errorMessage ? (
        <p className="text-[14px] leading-5 text-[#ff5a52]" id={errorId}>
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
};

export default FormField;
