'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ShoppingCart,
  AlertTriangle,
  TrendingUp,
  Package,
  ChefHat,
  Boxes,
  BarChart3,
} from 'lucide-react';

import { listSales, type Sale } from '@/lib/sales';
import { getLowStockItems, type InventoryItem } from '@/lib/inventory';
import { listProductions, listWastes, type KitchenProduction, type KitchenWaste } from '@/lib/kitchen';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

import { MetricCard } from './metric-card';
import { AlertsSection, type AlertEntry, type AlertLevel } from './alerts-section';
import { QuickActionsSection } from './quick-actions';
import { ActivityList, type ActivityItem } from './activity-list';

function toNum(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function toDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function DashboardWidgets() {
  const router = useRouter();

  const [sales, setSales] = useState<Sale[]>([]);
  const [lowStock, setLowStock] = useState<InventoryItem[]>([]);
  const [productions, setProductions] = useState<KitchenProduction[]>([]);
  const [wastes, setWastes] = useState<KitchenWaste[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    const today = new Date();
    const todayStr = toDateString(today);
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekAgoStr = toDateString(weekAgo);

    let mounted = true;
    (async () => {
      try {
        const [s, ls, p, w] = await Promise.allSettled([
          listSales(),
          getLowStockItems(),
          listProductions({ date_from: weekAgoStr, date_to: todayStr }),
          listWastes({ date_from: weekAgoStr, date_to: todayStr }),
        ]);
        if (!mounted) return;
        if (s.status === 'fulfilled') setSales(s.value);
        if (ls.status === 'fulfilled') setLowStock(ls.value);
        if (p.status === 'fulfilled') setProductions(p.value);
        if (w.status === 'fulfilled') setWastes(w.value);
        if (
          s.status === 'rejected' &&
          ls.status === 'rejected' &&
          p.status === 'rejected' &&
          w.status === 'rejected'
        ) {
          setFetchError('Failed to load dashboard data');
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const data = useMemo(() => {
    const todayStr = toDateString(new Date());

    const todaySales = sales.filter((s) => {
      const dateStr = String(s.sold_at || s.created_at || '');
      if (!dateStr) return false;
      try {
        return toDateString(new Date(dateStr)) === todayStr;
      } catch {
        return false;
      }
    });

    const totalTodaySales = todaySales.reduce((sum, s) => sum + toNum(s.total), 0);
    const totalAllSales = sales.reduce((sum, s) => sum + toNum(s.total), 0);
    const totalPlanned = productions.reduce((sum, p) => sum + toNum(p.planned_qty), 0);
    const totalPrepared = productions.reduce((sum, p) => sum + toNum(p.prepared_qty), 0);
    const totalWaste = wastes.reduce((sum, w) => sum + toNum(w.waste_qty), 0);
    const wasteRate = totalPrepared > 0 ? (totalWaste / totalPrepared) * 100 : 0;
    const lowStockCount = lowStock.length;

    // Alerts
    const alerts: AlertEntry[] = [];
    if (lowStockCount > 0) {
      alerts.push({
        level: 'warning' as AlertLevel,
        title: `${lowStockCount} ${lowStockCount === 1 ? 'Item' : 'Items'} Low in Stock`,
        message: 'Review inventory and create purchase orders to maintain adequate stock.',
        action: { label: 'View Inventory', href: '/inventory' },
      });
    }
    if (wasteRate > 5) {
      alerts.push({
        level: 'warning' as AlertLevel,
        title: `High Waste Rate (${wasteRate.toFixed(1)}%)`,
        message: 'Review kitchen practices and wastage trends to reduce losses.',
        action: { label: 'View Kitchen', href: '/kitchen' },
      });
    }
    if (totalPlanned > 0 && totalPrepared === 0) {
      alerts.push({
        level: 'info' as AlertLevel,
        title: 'Production Planned',
        message: `${totalPlanned.toFixed(0)} units planned — mark items as prepared in the kitchen.`,
        action: { label: 'View Production', href: '/kitchen' },
      });
    }

    // Activity items
    const activities: ActivityItem[] = [];

    todaySales.slice(0, 5).forEach((sale) => {
      activities.push({
        id: `sale-${sale.id}`,
        type: 'sale',
        title: `Order #${sale.id} ${sale.status === 'PAID' ? 'paid' : sale.status.toLowerCase()}`,
        description: `LKR ${toNum(sale.total).toLocaleString()} via ${sale.payment_method}`,
        timestamp: String(sale.sold_at || sale.created_at || new Date().toISOString()),
        status: sale.status === 'PAID' ? 'completed' : sale.status === 'VOID' ? 'warning' : 'pending',
      });
    });

    productions.slice(0, 3).forEach((prod) => {
      activities.push({
        id: `prod-${prod.id}`,
        type: 'production',
        title: `${prod.menu_item_name ?? `Item #${prod.menu_item}`} production`,
        description: `Planned: ${prod.planned_qty}, Prepared: ${prod.prepared_qty}`,
        timestamp: prod.updated_at ?? prod.created_at ?? prod.date,
        status:
          toNum(prod.prepared_qty) >= toNum(prod.planned_qty) && toNum(prod.planned_qty) > 0
            ? 'completed'
            : 'pending',
      });
    });

    activities.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );

    return {
      totalTodaySales,
      totalAllSales,
      totalPlanned,
      totalPrepared,
      totalWaste,
      wasteRate,
      lowStockCount,
      alerts,
      activities: activities.slice(0, 6),
      lowStockItems: lowStock.slice(0, 5),
    };
  }, [sales, lowStock, productions, wastes]);

  if (loading) {
    return (
      <div className='mt-6 space-y-4'>
        <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4'>
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className='h-28 animate-pulse rounded-[10px] bg-muted' />
          ))}
        </div>
        <div className='h-10 animate-pulse rounded-lg bg-muted' />
        <div className='grid grid-cols-2 gap-3 sm:grid-cols-4'>
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className='h-24 animate-pulse rounded-[10px] bg-muted' />
          ))}
        </div>
        <div className='h-64 animate-pulse rounded-[10px] bg-muted' />
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className='mt-6 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-800 dark:bg-rose-950/20 dark:text-rose-400'>
        {fetchError}
      </div>
    );
  }

  return (
    <div className='mt-6 space-y-6'>
      {/* Today's Metric Cards */}
      <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4'>
        <MetricCard
          title="Today's Sales"
          value={`LKR ${data.totalTodaySales.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
          icon={<TrendingUp className='h-5 w-5' />}
          status='success'
        />
        <MetricCard
          title='Low Stock Items'
          value={data.lowStockCount}
          unit={data.lowStockCount === 1 ? 'item' : 'items'}
          status={data.lowStockCount > 0 ? 'warning' : 'neutral'}
          icon={<AlertTriangle className='h-5 w-5' />}
          onClick={() => router.push('/inventory')}
        />
        <MetricCard
          title='Planned Production'
          value={data.totalPlanned.toFixed(0)}
          unit='units'
          subtitle={`${data.totalPrepared.toFixed(0)} prepared`}
          icon={<ChefHat className='h-5 w-5' />}
          status='neutral'
        />
        <MetricCard
          title='Waste Rate'
          value={data.wasteRate.toFixed(1)}
          unit='%'
          subtitle='Last 7 days'
          icon={<BarChart3 className='h-5 w-5' />}
          status={data.wasteRate > 5 ? 'warning' : 'success'}
        />
      </div>

      {/* Alerts */}
      <AlertsSection alerts={data.alerts} />

      {/* Quick Actions */}
      <QuickActionsSection
        actions={[
          {
            title: 'New Sale',
            description: 'Record a transaction',
            href: '/sales/new',
            icon: <ShoppingCart className='h-5 w-5' />,
          },
          {
            title: 'Plan Production',
            description: 'Schedule kitchen prep',
            href: '/kitchen',
            icon: <ChefHat className='h-5 w-5' />,
          },
          {
            title: 'Check Inventory',
            description: 'View stock levels',
            href: '/inventory',
            icon: <Package className='h-5 w-5' />,
          },
          {
            title: 'Purchase Requests',
            description: 'Manage supplier orders',
            href: '/kitchen/requests',
            icon: <Boxes className='h-5 w-5' />,
          },
        ]}
      />

      {/* Content Grid */}
      <div className='grid grid-cols-1 gap-6 lg:grid-cols-3'>
        {/* Activity - 2/3 width */}
        <div className='lg:col-span-2'>
          <Card className='p-6'>
            <h2 className='text-lg font-semibold text-dark dark:text-white'>
              Today&apos;s Activity
            </h2>
            <p className='mb-4 mt-0.5 text-sm text-muted-foreground'>
              Latest transactions and operations
            </p>
            <ActivityList items={data.activities} />
          </Card>
        </div>

        {/* Right Column - 1/3 width */}
        <div className='space-y-6'>
          {/* Low Stock Alert Panel */}
          {data.lowStockItems.length > 0 && (
            <Card className='p-6'>
              <div className='mb-4 flex items-center justify-between'>
                <h3 className='font-semibold text-dark dark:text-white'>Low Stock Alert</h3>
                <Badge variant='secondary'>{data.lowStockCount}</Badge>
              </div>
              <div className='space-y-3'>
                {data.lowStockItems.map((item) => (
                  <div
                    key={item.id}
                    className='rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950/20'
                  >
                    <p className='text-sm font-medium text-amber-900 dark:text-amber-300'>
                      {item.name}
                    </p>
                    <div className='mt-2 flex items-center justify-between text-xs'>
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
            </Card>
          )}

          {/* Summary Card */}
          <Card className='p-6'>
            <h3 className='mb-4 font-semibold text-dark dark:text-white'>Summary</h3>
            <div className='space-y-3'>
              <div className='flex items-center justify-between'>
                <span className='text-sm text-muted-foreground'>Total Sales (All Time)</span>
                <span className='font-medium text-dark dark:text-white'>
                  LKR{' '}
                  {data.totalAllSales.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </span>
              </div>
              <div className='flex items-center justify-between'>
                <span className='text-sm text-muted-foreground'>Production (7 days)</span>
                <span className='font-medium text-dark dark:text-white'>
                  {data.totalPlanned.toFixed(0)} units
                </span>
              </div>
              <div className='flex items-center justify-between'>
                <span className='text-sm text-muted-foreground'>Waste Quantity</span>
                <span className='font-medium text-dark dark:text-white'>
                  {data.totalWaste.toFixed(2)}
                </span>
              </div>
              <div className='border-t pt-3'>
                <div className='flex items-center justify-between'>
                  <span className='text-sm font-medium text-muted-foreground'>Efficiency</span>
                  <Badge
                    className={
                      data.wasteRate < 2
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400'
                        : data.wasteRate < 5
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/30 dark:text-amber-400'
                          : 'bg-rose-100 text-rose-800 dark:bg-rose-950/30 dark:text-rose-400'
                    }
                  >
                    {(100 - data.wasteRate).toFixed(1)}%
                  </Badge>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
