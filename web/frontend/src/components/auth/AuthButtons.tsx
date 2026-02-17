import React from 'react';
import { cn } from '@/lib/utils';
import { ButtonProps } from '@/types/auth';

export const AuthButton: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  isLoading = false,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles = cn(
    // layout + size (SaaS standard)
    'inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold',
    // motion + accessibility
    'transition-colors transition-shadow',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
    // disabled
    'disabled:pointer-events-none disabled:opacity-60'
  );

  const variants = {
    primary: cn(
      'bg-primary text-primary-foreground shadow-sm',
      'hover:bg-[color:var(--restaurant-primary-dark)]',
      'active:translate-y-[0.5px]'
    ),
    secondary: cn(
      'bg-muted text-foreground border border-border shadow-sm',
      'hover:bg-muted/70'
    ),
    outline: cn(
      'bg-background text-foreground border border-border shadow-sm',
      'hover:bg-muted'
    ),
  } as const;

  return (
    <button
      className={cn(baseStyles, variants[variant], className)}
      disabled={disabled || isLoading}
      aria-busy={isLoading}
      {...props}
    >
      {isLoading ? (
        <>
          <span className="sr-only">Loading</span>
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        </>
      ) : (
        children
      )}
    </button>
  );
};
