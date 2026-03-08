import { cn } from '@/lib/utils';
import { formatMessageTime } from '@/lib/format-message-time';
import { 
  ShoppingCart, 
  Leaf, 
  Package, 
  ActivitySquare 
} from 'lucide-react';

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

// --- Modernized Configs ---
const typeConfig = {
  sale: {
    Icon: ShoppingCart,
    bg: 'bg-indigo-50 dark:bg-indigo-500/10',
    color: 'text-indigo-600 dark:text-indigo-400',
    ring: 'ring-indigo-100 dark:ring-indigo-500/20'
  },
  production: {
    Icon: Leaf,
    bg: 'bg-emerald-50 dark:bg-emerald-500/10',
    color: 'text-emerald-600 dark:text-emerald-400',
    ring: 'ring-emerald-100 dark:ring-emerald-500/20'
  },
  inventory: {
    Icon: Package,
    bg: 'bg-amber-50 dark:bg-amber-500/10',
    color: 'text-amber-600 dark:text-amber-400',
    ring: 'ring-amber-100 dark:ring-amber-500/20'
  },
};

const statusConfig = {
  completed: {
    badge: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 ring-emerald-200 dark:ring-emerald-500/20',
    label: 'Completed',
  },
  pending: {
    badge: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 ring-slate-200 dark:ring-slate-700',
    label: 'Pending',
  },
  warning: {
    badge: 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400 ring-rose-200 dark:ring-rose-500/20',
    label: 'Warning',
  },
};

export function ActivityList({ items, className }: Props) {
  return (
    <div
      className={cn(
        'flex flex-col ',
        className,
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800/60">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
          Recent Activity
        </h2>
      </div>

      {/* Content */}
      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-50 dark:bg-slate-900 mb-3">
             <ActivitySquare className="h-6 w-6 text-slate-400" />
          </div>
          <p className="text-sm font-medium text-slate-900 dark:text-slate-200">No recent activity</p>
          <p className="text-xs text-slate-500 mt-1">Actions and events will appear here.</p>
        </div>
      ) : (
        <ul className="divide-y divide-slate-100 dark:divide-slate-800/60">
          {items.map((item) => {
            const { Icon: TypeIcon, bg, color, ring } = typeConfig[item.type];
            const { badge: statusBadge, label: statusLabel } = statusConfig[item.status];

            return (
              <li
                key={item.id}
                className="flex items-start gap-4 px-5 py-4 transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-900/50 group"
              >
                {/* Icon Wrapper */}
                <div className={cn('mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ring-1', bg, ring)}>
                  <TypeIcon className={cn('h-4 w-4', color)} strokeWidth={2.5} />
                </div>

                {/* Details */}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">
                    {item.title}
                  </p>
                  <p className="truncate text-xs text-slate-500 mt-0.5">
                    {item.description}
                  </p>
                </div>

                {/* Metadata (Time & Status) */}
                <div className="flex shrink-0 flex-col items-end gap-2">
                  <time 
                    className="text-[11px] font-medium text-slate-400 group-hover:text-slate-500 dark:text-slate-500 transition-colors" 
                    dateTime={item.timestamp}
                  >
                    {formatMessageTime(item.timestamp)}
                  </time>
                  <span className={cn(
                    'inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-semibold ring-1 ring-inset',
                    statusBadge
                  )}>
                    {statusLabel}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      
      {/* Optional Footer Link */}
      {items.length > 0 && (
        <div className="border-t border-slate-100 p-3 dark:border-slate-800/60">
           <button className="w-full rounded-lg px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-slate-100 transition-colors">
             View all activity
           </button>
        </div>
      )}
    </div>
  );
}