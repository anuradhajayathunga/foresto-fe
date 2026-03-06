'use client';

import { useRouter } from 'next/navigation';
import { AlertTriangle, TrendingUp, ChefHat, BarChart3 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

import { useDashboardData } from './dashboard-data-context';
import { MetricCard } from './metric-card';
import { AlertsSection } from './alerts-section';
import { ActivityList } from './activity-list';

function toNum(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

// ── Row 1: Today's Metric Cards ──────────────────────────────────────────────

export function TodayMetricsRow() {
  const router = useRouter();
  const { loading, fetchError, totalTodaySales, lowStockCount, totalPlanned, totalPrepared, wasteRate } =
    useDashboardData();

  if (fetchError) return null;

  if (loading) {
    return (
      <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4'>
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className='h-28 animate-pulse rounded-[10px] bg-muted' />
        ))}
      </div>
    );
  }

  return (
    <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4'>
      <MetricCard
        title="Today's Sales"
        value={`LKR ${totalTodaySales.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
        icon={<TrendingUp className='h-5 w-5' />}
        status='success'
      />
      <MetricCard
        title='Low Stock Items'
        value={lowStockCount}
        unit={lowStockCount === 1 ? 'item' : 'items'}
        status={lowStockCount > 0 ? 'warning' : 'neutral'}
        icon={<AlertTriangle className='h-5 w-5' />}
        onClick={() => router.push('/inventory')}
      />
      <MetricCard
        title='Planned Production'
        value={totalPlanned.toFixed(0)}
        unit='units'
        subtitle={`${totalPrepared.toFixed(0)} prepared`}
        icon={<ChefHat className='h-5 w-5' />}
        status='neutral'
      />
      <MetricCard
        title='Waste Rate'
        value={wasteRate.toFixed(1)}
        unit='%'
        subtitle='Last 7 days'
        icon={<BarChart3 className='h-5 w-5' />}
        status={wasteRate > 5 ? 'warning' : 'success'}
      />
    </div>
  );
}

// ── Row 2: Alerts ─────────────────────────────────────────────────────────────

export function AlertsRow() {
  const { loading, fetchError, alerts } = useDashboardData();
  if (loading || fetchError || alerts.length === 0) return null;
  return (
    <div>
      <h2 className='mb-4 text-sm font-semibold tracking-wide text-muted-foreground'>
        ALERTS & NOTIFICATIONS
      </h2>
      <AlertsSection alerts={alerts} />
    </div>
  );
}

// ── Row 3: Activity + Low Stock Panel + Summary ───────────────────────────────

export function ActivityRow() {
  const {
    loading,
    fetchError,
    activities,
    lowStockCount,
    lowStockItems,
    totalAllSales,
    totalPlanned,
    totalWaste,
    wasteRate,
  } = useDashboardData();

  if (fetchError) {
    return (
      <div className='rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-800 dark:bg-rose-950/20 dark:text-rose-400'>
        {fetchError}
      </div>
    );
  }

  if (loading) {
    return (
      <div className='grid grid-cols-1 gap-6 lg:grid-cols-3'>
        <div className='h-64 animate-pulse rounded-[10px] bg-muted lg:col-span-2' />
        <div className='h-64 animate-pulse rounded-[10px] bg-muted' />
      </div>
    );
  }

  return (
    <div className='grid grid-cols-1 gap-6 lg:grid-cols-12'>
      {/* Activity List – Left Section */}
      <div className='col-span-12 xl:col-span-12'>
        <Card className='rounded-xl '>
          <div className='p-6 sm:p-8'>
            <div className='mb-6 space-y-1'>
              <h2 className='text-lg font-semibold text-dark dark:text-white'>
                Today&apos;s Activity
              </h2>
              <p className='text-sm text-muted-foreground'>
                Latest transactions and operations
              </p>
            </div>
            <ActivityList items={activities} />
          </div>
        </Card>
      </div>

      {/* Right column – Sidebar */}
      <div className='space-y-6 col-span-12 lg:col-span-4'>
        {/* Low Stock Panel */}
        {/* {lowStockItems.length > 0 && (
          <Card className='border-amber-200 bg-gradient-to-br from-amber-50 to-amber-50/50 dark:border-amber-900/30 dark:from-amber-950/20 dark:to-amber-950/10'>
            <div className='space-y-4 p-6 sm:p-8'>
              <div className='flex items-center justify-between'>
                <h3 className='font-semibold text-dark dark:text-white'>
                  Low Stock Alert
                </h3>
                <Badge className='bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'>
                  {lowStockCount}
                </Badge>
              </div>
              <div className='space-y-3'>
                {lowStockItems.map((item) => (
                  <div
                    key={item.id}
                    className='rounded-lg border border-amber-200 bg-white/60 p-3 backdrop-blur-sm dark:border-amber-800/50 dark:bg-slate-800/30'
                  >
                    <p className='text-sm font-medium text-amber-900 dark:text-amber-300'>
                      {item.name}
                    </p>
                    <div className='mt-2.5 flex items-center justify-between text-xs font-medium'>
                      <span className='text-amber-700 dark:text-amber-400'>
                        Stock: {toNum(item.current_stock)} {item.unit}
                      </span>
                      <span className='text-amber-600 dark:text-amber-500'>
                        Reorder: {toNum(item.reorder_level)} {item.unit}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        )} */}

        {/* Summary Card */}
        {/* <Card className='border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900'>
          <div className='space-y-4 p-6 sm:p-8'>
            <div className='space-y-1'>
              <h3 className='font-semibold text-dark dark:text-white'>Summary</h3>
              <p className='text-xs text-muted-foreground'>Overview metrics</p>
            </div>
            <div className='space-y-3.5'>
              <div className='flex items-center justify-between'>
                <span className='text-sm text-muted-foreground'>Total Sales (All Time)</span>
                <span className='font-semibold text-dark dark:text-white'>
                  LKR {totalAllSales.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </span>
              </div>
              <div className='flex items-center justify-between border-t border-slate-200 pt-3.5 dark:border-slate-700'>
                <span className='text-sm text-muted-foreground'>Production (7 days)</span>
                <span className='font-semibold text-dark dark:text-white'>
                  {totalPlanned.toFixed(0)} units
                </span>
              </div>
              <div className='flex items-center justify-between'>
                <span className='text-sm text-muted-foreground'>Waste Quantity</span>
                <span className='font-semibold text-dark dark:text-white'>
                  {totalWaste.toFixed(2)}
                </span>
              </div>
              <div className='border-t border-slate-200 pt-3.5 dark:border-slate-700'>
                <div className='flex items-center justify-between'>
                  <span className='text-sm font-medium text-muted-foreground'>Efficiency</span>
                  <Badge
                    className={
                      wasteRate < 2
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400'
                        : wasteRate < 5
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/30 dark:text-amber-400'
                          : 'bg-rose-100 text-rose-800 dark:bg-rose-950/30 dark:text-rose-400'
                    }
                  >
                    {(100 - wasteRate).toFixed(1)}%
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </Card> */}
      </div>
    </div>
  );
}
