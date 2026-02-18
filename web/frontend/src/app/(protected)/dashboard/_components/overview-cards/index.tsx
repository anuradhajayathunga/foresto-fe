'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

import { getSalesSummary, type SalesSummary } from '@/lib/sales';
import { getLowStockItems } from '@/lib/inventory';
import { compactFormat } from '@/lib/format-number';

import { Button } from '@/components/ui/button';
import { OverviewCard } from './card';
import { Coins, ShoppingCart, AlertTriangle, Utensils } from 'lucide-react';
import { Category, fetchCategories, fetchItems, MenuItem } from '@/lib/menu';

type Row = { date: string; count: number; total: number };
type LowStockItem = Awaited<ReturnType<typeof getLowStockItems>>[number];

export function DashboardKpiCards() {
  const [summary, setSummary] = useState<SalesSummary | null>(null);
  const [lowStock, setLowStock] = useState<LowStockItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);

  // Split loading states to avoid effects overwriting each other
  const [salesLoading, setSalesLoading] = useState(true);
  const [menuLoading, setMenuLoading] = useState(true);

  const loading = salesLoading || menuLoading;

  // Sales summary + low stock
  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const [salesRes, lowItems] = await Promise.all([
          getSalesSummary(7),
          getLowStockItems().catch(() => [] as LowStockItem[]),
        ]);

        if (!mounted) return;
        setSummary(salesRes);
        setLowStock(lowItems);
      } catch (error) {
        console.error('Failed to load sales/stock data:', error);
      } finally {
        if (mounted) setSalesLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  // Menu categories + items
  useEffect(() => {
    let mounted = true;

    (async () => {
      setMenuLoading(true);
      try {
        const [cats, menuItems] = await Promise.all([
          fetchCategories().catch(() => [] as Category[]),
          fetchItems().catch(() => [] as MenuItem[]),
        ]);

        if (!mounted) return;
        setCategories(cats);
        setItems(menuItems);
      } catch (error) {
        console.error('Failed to load menu data:', error);
      } finally {
        if (mounted) setMenuLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  // Convert summary.by_day -> Row[] (fixes your original type mismatch root cause)
  const week: Row[] = useMemo(
    () =>
      (summary?.by_day ?? []).map((d) => ({
        date: d.day,
        count: Number(d.qty ?? 0),
        total: Number(d.revenue ?? 0),
      })),
    [summary]
  );

  // Prefer backend totals when available, fallback to week aggregate
  const weekTotal = useMemo(() => {
    if (summary?.total_revenue != null) return Number(summary.total_revenue || 0);
    return week.reduce((sum, row) => sum + row.total, 0);
  }, [summary, week]);

  const weekCount = useMemo(() => {
    if (summary?.total_qty != null) return Number(summary.total_qty || 0);
    return week.reduce((sum, row) => sum + row.count, 0);
  }, [summary, week]);

  const lowStockCount = lowStock.length;

  const metrics = useMemo(() => {
    const totalItems = items.length;
    const avgPrice =
      totalItems > 0
        ? items.reduce((acc, curr) => acc + Number(curr.price), 0) / totalItems
        : 0;

    return {
      totalItems,
      activeMenuItems: items.filter((i) => i.is_available).length,
      activeCategories: categories.length,
      avgPrice,
    };
  }, [items, categories]);

  return (
    <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
      <OverviewCard
        label='Total Revenue'
        value={`LKR ${compactFormat(weekTotal)}`}
        subLabel='Last 7 days'
        Icon={Coins}
        trend={{ value: 12.5, direction: 'up' }} // replace with real trend if you have it
        loading={loading}
      />

      <OverviewCard
        label='Total Orders'
        value={compactFormat(weekCount)}
        subLabel='Last 7 days'
        Icon={ShoppingCart}
        trend={{ value: 4.3, direction: 'up' }} // replace with real trend if you have it
        loading={loading}
      />

      <OverviewCard
        label='Total Menu Items'
        value={metrics.activeMenuItems}
        subLabel={`${metrics.activeCategories} categories`}
        Icon={Utensils}
        loading={loading}
      />

      <OverviewCard
        label='Inventory Alert'
        value={lowStockCount === 0 ? 'Healthy' : `${lowStockCount} Items`}
        subLabel={
          lowStockCount === 0 ? 'Stock levels optimal' : 'Below reorder point'
        }
        Icon={AlertTriangle}
        variant={lowStockCount > 0 ? 'warning' : 'default'}
        loading={loading}
        rightSlot={
          lowStockCount > 0 && (
            <Link href='/inventory?tab=low'>
              <Button
                variant='outline'
                className='h-7 text-xs border-amber-200 text-amber-700 hover:bg-amber-50 hover:text-amber-800 dark:border-amber-800 dark:text-amber-400'
              >
                Review
              </Button>
            </Link>
          )
        }
      />
    </div>
  );
}
