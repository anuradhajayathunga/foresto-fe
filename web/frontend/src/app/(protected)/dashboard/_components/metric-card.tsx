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

const statusStyles: Record<Status, string> = {
  success: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400',
  warning: 'bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400',
  neutral: 'bg-muted/50 text-muted-foreground',
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
  return (
    <div
      className={cn(
        'rounded-[10px] bg-white p-5 shadow-1 dark:bg-gray-dark dark:shadow-card',
        onClick && 'cursor-pointer transition-shadow hover:shadow-md',
      )}
      onClick={onClick}
    >
      <div className='flex items-center justify-between'>
        <span className='text-sm font-medium text-muted-foreground'>{title}</span>
        {icon && (
          <div className={cn('rounded-full p-2', statusStyles[status])}>{icon}</div>
        )}
      </div>
      <div className='mt-3 flex items-baseline gap-1.5'>
        <span className='text-2xl font-bold tracking-tight text-dark dark:text-white'>
          {value}
        </span>
        {unit && <span className='text-sm text-muted-foreground'>{unit}</span>}
      </div>
      {subtitle && <p className='mt-1 text-xs text-muted-foreground'>{subtitle}</p>}
    </div>
  );
}
