import React from 'react';

interface StatusMessageProps {
  variant: 'error' | 'success';
  children?: React.ReactNode;
}

const StatusMessage: React.FC<StatusMessageProps> = ({ variant, children }) => {
  if (!children) {
    return null;
  }

  const variantClasses = {
    error: 'text-[#ff5a52]',
    success: 'text-emerald-600',
  };

  return <p className={`text-[14px] font-medium leading-5 ${variantClasses[variant]}`}>{children}</p>;
};

export default StatusMessage;
