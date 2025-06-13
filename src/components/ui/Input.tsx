import React, { forwardRef } from 'react';
import clsx from 'clsx';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  fullWidth?: boolean;
  as?: 'input' | 'textarea';
  rows?: number;
  icon?: React.ReactNode;
}

const Input = forwardRef<HTMLInputElement | HTMLTextAreaElement, InputProps>(({
  className,
  label,
  error,
  fullWidth = false,
  id,
  as = 'input',
  rows = 3,
  icon,
  ...props
}, ref) => {
  const inputId = id || `input-${Math.random().toString(36).substring(2, 9)}`;
  
  const inputClasses = clsx(
    'block rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm',
    error && 'border-red-300',
    fullWidth && 'w-full',
    icon && 'pl-10',
    className
  );
  
  return (
    <div className={clsx('mb-4', fullWidth && 'w-full')}>
      {label && (
        <label 
          htmlFor={inputId} 
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            {icon}
          </div>
        )}
        {as === 'textarea' ? (
          <textarea
            id={inputId}
            className={inputClasses}
            rows={rows}
            ref={ref as React.Ref<HTMLTextAreaElement>}
            {...props}
          />
        ) : (
          <input
            id={inputId}
            className={inputClasses}
            ref={ref as React.Ref<HTMLInputElement>}
            {...props}
          />
        )}
      </div>
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;