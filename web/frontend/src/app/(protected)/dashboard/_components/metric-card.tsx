import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

type Status = 'success' | 'warning' | 'neutral';

type Props = {
  title: string;
  value: string | number;
  unit?: string;
  subtitle?: string;
  icon?: ReactNode;
  status?: Status;
  onClick?: () => void;
};

// Refined color palette with crisp inset rings
const statusStyles: Record<Status, string> = {
  success: 'bg-emerald-50 text-emerald-600 ring-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/20',
  warning: 'bg-amber-50 text-amber-600 ring-amber-500/20 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-500/20',
  neutral: 'bg-slate-50 text-slate-600 ring-slate-500/20 dark:bg-slate-800 dark:text-slate-400 dark:ring-slate-700',
};

export function MetricCard({
  title,
  value,
  unit,
  subtitle,
  icon,
  status = 'neutral',
  onClick,
}: Props) {
  const isInteractive = !!onClick;

  return (
    <div
      role={isInteractive ? 'button' : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      onClick={onClick}
      className={cn(
        'group relative flex flex-col justify-between overflow-hidden rounded-xl bg-white p-5',
        'shadow-sm ring-1 ring-inset ring-slate-200 dark:bg-slate-950 dark:ring-slate-800',
        isInteractive && [
          'cursor-pointer transition-all duration-200 ease-in-out outline-none',
          'hover:-translate-y-0.5 hover:shadow-md hover:ring-slate-300 dark:hover:ring-slate-700',
          'focus-visible:ring-2 focus-visible:ring-indigo-500 dark:focus-visible:ring-indigo-400'
        ]
      )}
    >
      <div className='flex items-start justify-between gap-4'>
        <h3 className='text-sm font-medium text-slate-500 dark:text-slate-400'>
          {title}
        </h3>
        {icon && (
          <div 
            className={cn(
              'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ring-1 ring-inset', 
              statusStyles[status]
            )}
          >
            {/* Ensures standard sizing for whatever Lucide icon is passed */}
            <div className="[&>svg]:h-5 [&>svg]:w-5">
              {icon}
            </div>
          </div>
        )}
      </div>
      
      <div className='mt-4 flex items-baseline gap-2'>
        <span className='text-3xl font-bold tracking-tight text-slate-900 dark:text-white tabular-nums'>
          {value}
        </span>
        {unit && (
          <span className='text-sm font-medium text-slate-500 dark:text-slate-400'>
            {unit}
          </span>
        )}
      </div>
      
      {subtitle && (
        <p className='mt-2 text-xs font-medium text-slate-500 dark:text-slate-400 line-clamp-1'>
          {subtitle}
        </p>
      )}
    </div>
  );
}