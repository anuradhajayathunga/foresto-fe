import { cn } from '@/lib/utils';
import { formatMessageTime } from '@/lib/format-message-time';
import { ShoppingCart, Leaf, Package, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';

export type ActivityItem = {
  id: string;
  type: 'sale' | 'production' | 'inventory';
  title: string;
  description: string;
  timestamp: string;
  status: 'completed' | 'pending' | 'warning';
};

type Props = {
  items: ActivityItem[];
  className?: string;
};

const typeConfig = {
  sale: {
    Icon: ShoppingCart,
    bg: 'bg-blue-50 dark:bg-blue-950/30',
    color: 'text-blue-600 dark:text-blue-400',
  },
  production: {
    Icon: Leaf,
    bg: 'bg-emerald-50 dark:bg-emerald-950/30',
    color: 'text-emerald-600 dark:text-emerald-400',
  },
  inventory: {
    Icon: Package,
    bg: 'bg-amber-50 dark:bg-amber-950/30',
    color: 'text-amber-600 dark:text-amber-400',
  },
};

const statusConfig = {
  completed: {
    Icon: CheckCircle2,
    color: 'text-emerald-500',
    label: 'Completed',
  },
  pending: {
    Icon: Clock,
    color: 'text-blue-500',
    label: 'Pending',
  },
  warning: {
    Icon: AlertTriangle,
    color: 'text-amber-500',
    label: 'Warning',
  },
};

export function ActivityList({ items, className }: Props) {
  return (
    <div
      className={cn(
        'rounded-[10px] bg-white p-6 shadow-1 dark:bg-gray-dark dark:shadow-card',
        className,
      )}
    >
      <h2 className='mb-5 text-body-2xlg font-bold text-dark dark:text-white'>
        Recent Activity
      </h2>

      {items.length === 0 ? (
        <p className='text-sm text-muted-foreground'>No recent activity.</p>
      ) : (
        <ul className='space-y-3'>
          {items.map((item) => {
            const { Icon: TypeIcon, bg, color } = typeConfig[item.type];
            const { Icon: StatusIcon, color: statusColor, label: statusLabel } =
              statusConfig[item.status];

            return (
              <li
                key={item.id}
                className='flex items-center gap-4 rounded-lg border border-border/50 bg-gray-1 px-4 py-3 dark:bg-dark-2'
              >
                {/* Type icon */}
                <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-full', bg)}>
                  <TypeIcon className={cn('h-5 w-5', color)} />
                </div>

                {/* Content */}
                <div className='min-w-0 flex-1'>
                  <p className='truncate text-sm font-medium text-dark dark:text-white'>
                    {item.title}
                  </p>
                  <p className='truncate text-xs text-muted-foreground'>
                    {item.description}
                  </p>
                </div>

                {/* Status + time */}
                <div className='flex shrink-0 flex-col items-end gap-1'>
                  <div className={cn('flex items-center gap-1 text-xs font-medium', statusColor)}>
                    <StatusIcon className='h-3.5 w-3.5' />
                    <span>{statusLabel}</span>
                  </div>
                  <time className='text-xs text-muted-foreground' dateTime={item.timestamp}>
                    {formatMessageTime(item.timestamp)}
                  </time>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
