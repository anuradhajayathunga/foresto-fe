import { cn } from '@/lib/utils';
import { AlertTriangle, Info, XCircle, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export type AlertLevel = 'warning' | 'info' | 'error';

export type AlertEntry = {
  level: AlertLevel;
  title: string;
  message: string;
  action?: { label: string; href: string };
};

type Props = { alerts: AlertEntry[] };

// Modernized SaaS configuration with distinct icon wrappers, crisp rings, and button styles
const levelConfig: Record<
  AlertLevel,
  {
    container: string;
    iconWrap: string;
    titleColor: string;
    msgColor: string;
    actionBtn: string;
    Icon: typeof AlertTriangle;
  }
> = {
  warning: {
    container: 'bg-amber-50 dark:bg-amber-500/10 ring-amber-500/20 dark:ring-amber-500/30',
    iconWrap: 'bg-amber-100/50 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400',
    titleColor: 'text-amber-900 dark:text-amber-300',
    msgColor: 'text-amber-700 dark:text-amber-400/80',
    actionBtn: 'text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-500/20',
    Icon: AlertTriangle,
  },
  info: {
    container: 'bg-blue-50 dark:bg-blue-500/10 ring-blue-500/20 dark:ring-blue-500/30',
    iconWrap: 'bg-blue-100/50 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400',
    titleColor: 'text-blue-900 dark:text-blue-300',
    msgColor: 'text-blue-700 dark:text-blue-400/80',
    actionBtn: 'text-blue-800 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-500/20',
    Icon: Info,
  },
  error: {
    container: 'bg-rose-50 dark:bg-rose-500/10 ring-rose-500/20 dark:ring-rose-500/30',
    iconWrap: 'bg-rose-100/50 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400',
    titleColor: 'text-rose-900 dark:text-rose-300',
    msgColor: 'text-rose-700 dark:text-rose-400/80',
    actionBtn: 'text-rose-800 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-500/20',
    Icon: XCircle,
  },
};

export function AlertsSection({ alerts }: Props) {
  if (alerts.length === 0) return null;

  return (
    <div className="flex flex-col gap-3">
      {alerts.map((alert, i) => {
        const { container, iconWrap, titleColor, msgColor, actionBtn, Icon } = levelConfig[alert.level];
        
        return (
          <div
            key={i}
            className={cn(
              'relative flex flex-col sm:flex-row sm:items-start gap-4 rounded-xl p-4 shadow-sm ring-1 ring-inset animate-in fade-in slide-in-from-top-1',
              container
            )}
          >
            {/* Icon Badge */}
            <div className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-full', iconWrap)}>
              <Icon className="h-4 w-4" strokeWidth={2.5} />
            </div>

            {/* Content */}
            <div className="flex-1 pt-0.5 min-w-0">
              <h4 className={cn('text-sm font-semibold tracking-tight', titleColor)}>
                {alert.title}
              </h4>
              <p className={cn('mt-1 text-[13px] leading-relaxed', msgColor)}>
                {alert.message}
              </p>
            </div>

            {/* Call to Action */}
            {alert.action && (
              <div className="shrink-0 pt-1 sm:pt-0">
                <Link
                  href={alert.action.href}
                  className={cn(
                    'inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors',
                    actionBtn
                  )}
                >
                  {alert.action.label}
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}