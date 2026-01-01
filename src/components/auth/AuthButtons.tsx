import React from 'react';
import { ButtonProps } from '@/types/auth';

export const AuthButton: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  isLoading = false,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles =
    'flex items-center justify-center px-4 py-3 text-sm font-medium transition rounded-lg shadow-theme-xs';

  const variants = {
    primary: 'text-white bg-primary/90 hover:bg-primary disabled:opacity-50',
    secondary:
      'text-gray-700 bg-gray-100 hover:bg-gray-200 hover:text-gray-800 dark:bg-white/5 dark:text-white/90 dark:hover:bg-white/10',
    outline:
      'border border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-white/90 dark:hover:bg-gray-800',
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <div className='h-5 w-5 animate-spin rounded-full border-2 border-solid border-white border-t-transparent' />
      ) : (
        children
      )}
    </button>
  );
};
