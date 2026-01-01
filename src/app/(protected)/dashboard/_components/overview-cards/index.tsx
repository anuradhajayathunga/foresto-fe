'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

import { getSalesSummary } from '@/lib/sales';
import { getLowStockItems } from '@/lib/inventory';
import { compactFormat } from '@/lib/format-number';

import { Button } from '@/components/ui/button';
import { OverviewCard } from './card';
import { 
  Coins, 
  ShoppingCart, 
  Calculator, 
  AlertTriangle, 
  ArrowUpRight, 
  ArrowDownRight,
  TrendingUp
} from 'lucide-react';

type Row = { date: string; count: number; total: string };

export function DashboardKpiCards() {
  const [week, setWeek] = useState<Row[]>([]);
  const [lowStock, setLowStock] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [w, items] = await Promise.all([
          getSalesSummary(7),
          getLowStockItems().catch(() => [])
        ]);
        if (mounted) {
          setWeek(w);
          setLowStock(items);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const weekTotal = useMemo(
    () => week.reduce((s, r) => s + Number(r.total || 0), 0),
    [week]
  );

  const weekCount = useMemo(
    () => week.reduce((s, r) => s + (r.count || 0), 0),
    [week]
  );

  const avgOrder = useMemo(
    () => (weekCount ? weekTotal / weekCount : 0),
    [weekTotal, weekCount]
  );

  const lowStockCount = lowStock.length;

  return (
    <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
      <OverviewCard
        label='Total Revenue'
        value={`Rs. ${compactFormat(weekTotal)}`}
        subLabel='Last 7 days'
        Icon={Coins}
        trend={{ value: 12.5, direction: 'up' }} // Mock trend
        loading={loading}
      />

      <OverviewCard
        label='Total Orders'
        value={compactFormat(weekCount)}
        subLabel='Last 7 days'
        Icon={ShoppingCart}
        trend={{ value: 4.3, direction: 'up' }} // Mock trend
        loading={loading}
      />

      <OverviewCard
        label='Avg. Order Value'
        value={`Rs. ${avgOrder.toFixed(0)}`}
        subLabel='Last 7 days'
        Icon={Calculator}
        trend={{ value: 2.1, direction: 'down' }} // Mock trend
        loading={loading}
      />

      <OverviewCard
        label='Inventory Alert'
        value={lowStockCount === 0 ? 'Healthy' : `${lowStockCount} Items`}
        subLabel={lowStockCount === 0 ? 'Stock levels optimal' : 'Below reorder point'}
        Icon={AlertTriangle}
        variant={lowStockCount > 0 ? 'warning' : 'default'}
        loading={loading}
        rightSlot={
          lowStockCount > 0 && (
            <Link href='/inventory?tab=low'>
              <Button  variant='outline' className="h-7 text-xs border-amber-200 text-amber-700 hover:bg-amber-50 hover:text-amber-800 dark:border-amber-800 dark:text-amber-400">
                Review
              </Button>
            </Link>
          )
        }
      />
    </div>
  );
}