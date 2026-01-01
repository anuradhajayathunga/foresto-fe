import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { ArrowUpRight, ArrowDownRight, type LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

type PropsType = {
  label: string;
  value: string | number;
  subLabel?: ReactNode;
  
  /** Works for lucide-react and custom SVG icon components */
  Icon?: LucideIcon;
  
  /** Legacy prop support (mapped to trend) */
  growthRate?: number;
  
  /** New: Explicit trend object for more control */
  trend?: {
    value: number;
    direction: 'up' | 'down';
  };

  /** New: Loading state for skeleton UI */
  loading?: boolean;

  /** New: Visual alert state */
  variant?: 'default' | 'warning';

  /** Optional slot for buttons/links */
  rightSlot?: ReactNode;
};

export function OverviewCard({
  label,
  value,
  subLabel,
  Icon,
  growthRate,
  trend,
  loading,
  variant = 'default',
  rightSlot,
}: PropsType) {
  
  // 1. Handle Loading State
  if (loading) {
    return (
      <Card className="shadow-sm border-border/60 bg-card">
        <CardContent className="p-6">
          <div className="flex items-center justify-between space-y-0 pb-2">
            <div className="h-4 w-24 bg-muted animate-pulse rounded" />
            <div className="h-8 w-8 bg-muted animate-pulse rounded-full" />
          </div>
          <div className="h-8 w-16 bg-muted animate-pulse rounded mt-3" />
          <div className="h-3 w-32 bg-muted animate-pulse rounded mt-2" />
        </CardContent>
      </Card>
    );
  }

  // 2. Normalize Trend Data (Support both new 'trend' prop and old 'growthRate')
  const activeTrend = trend || (typeof growthRate === 'number' ? {
    value: Math.abs(growthRate),
    direction: growthRate >= 0 ? 'up' as const : 'down' as const
  } : null);

  const isWarning = variant === 'warning';

  return (
    <Card className={cn(
      "shadow-sm border-border/60 transition-all hover:shadow-md",
      isWarning && "border-amber-200 bg-amber-50/30 dark:bg-amber-950/10 dark:border-amber-800"
    )}>
      <CardContent className="p-6">
        {/* Header: Label + Icon */}
        <div className="flex items-center justify-between space-y-0">
          <span className="text-sm font-medium text-muted-foreground tracking-wide">
            {label}
          </span>
          {Icon && (
            <div className={cn(
              "p-2 rounded-full",
              isWarning 
                ? "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400" 
                : "bg-muted/50 text-muted-foreground"
            )}>
              <Icon className="h-4 w-4" />
            </div>
          )}
        </div>

        {/* Body: Value + Trend */}
        <div className="mt-3 flex items-baseline gap-2">
          <span className={cn(
            "text-2xl font-bold tracking-tight tabular-nums text-foreground",
            isWarning && "text-amber-700 dark:text-amber-400"
          )}>
            {value}
          </span>

          {activeTrend && (
            <div className={cn(
              "flex items-center text-xs font-medium px-1.5 py-0.5 rounded-md",
              activeTrend.direction === 'up' 
                ? "text-emerald-700 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950/30" 
                : "text-rose-700 bg-rose-50 dark:text-rose-400 dark:bg-rose-950/30"
            )}>
              {activeTrend.direction === 'up' 
                ? <ArrowUpRight className="h-3 w-3 mr-1" /> 
                : <ArrowDownRight className="h-3 w-3 mr-1" />
              }
              {activeTrend.value}%
            </div>
          )}
        </div>

        {/* Footer: Sublabel + Right Slot */}
        {(subLabel || rightSlot) && (
          <div className="flex items-center justify-between mt-1">
            {subLabel && (
              <p className="text-xs text-muted-foreground truncate">
                {subLabel}
              </p>
            )}
            {rightSlot && (
              <div className="ml-auto">
                {rightSlot}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}