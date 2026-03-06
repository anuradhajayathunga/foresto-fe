import { cn } from '@/lib/utils';
import { AlertTriangle, Info, XCircle } from 'lucide-react';
import Link from 'next/link';

export type AlertLevel = 'warning' | 'info' | 'error';

export type AlertEntry = {
  level: AlertLevel;
  title: string;
  message: string;
  action?: { label: string; href: string };
};

type Props = { alerts: AlertEntry[] };

const levelConfig: Record<
  AlertLevel,
  { bg: string; border: string; titleColor: string; msgColor: string; Icon: typeof AlertTriangle }
> = {
  warning: {
    bg: 'bg-amber-50 dark:bg-amber-950/20',
    border: 'border-amber-200 dark:border-amber-800',
    titleColor: 'text-amber-900 dark:text-amber-300',
    msgColor: 'text-amber-700 dark:text-amber-400',
    Icon: AlertTriangle,
  },
  info: {
    bg: 'bg-blue-50 dark:bg-blue-950/20',
    border: 'border-blue-200 dark:border-blue-800',
    titleColor: 'text-blue-900 dark:text-blue-300',
    msgColor: 'text-blue-700 dark:text-blue-400',
    Icon: Info,
  },
  error: {
    bg: 'bg-rose-50 dark:bg-rose-950/20',
    border: 'border-rose-200 dark:border-rose-800',
    titleColor: 'text-rose-900 dark:text-rose-300',
    msgColor: 'text-rose-700 dark:text-rose-400',
    Icon: XCircle,
  },
};

export function AlertsSection({ alerts }: Props) {
  if (alerts.length === 0) return null;

  return (
    <div className='space-y-2'>
      {alerts.map((alert, i) => {
        const { bg, border, titleColor, msgColor, Icon } = levelConfig[alert.level];
        return (
          <div
            key={i}
            className={cn('flex items-start gap-3 rounded-lg border p-4', bg, border)}
          >
            <Icon className={cn('mt-0.5 h-4 w-4 shrink-0', titleColor)} />
            <div className='min-w-0 flex-1'>
              <p className={cn('text-sm font-medium', titleColor)}>{alert.title}</p>
              <p className={cn('mt-0.5 text-xs', msgColor)}>{alert.message}</p>
            </div>
            {alert.action && (
              <Link
                href={alert.action.href}
                className={cn(
                  'shrink-0 text-xs font-medium underline-offset-2 hover:underline',
                  titleColor,
                )}
              >
                {alert.action.label}
              </Link>
            )}
          </div>
        );
      })}
    </div>
  );
}
