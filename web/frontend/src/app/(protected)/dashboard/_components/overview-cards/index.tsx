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
  TrendingUp,
  Utensils,
} from 'lucide-react';
import { Category, fetchCategories, fetchItems, MenuItem } from '@/lib/menu';

type Row = { date: string; count: number; total: string };

export function DashboardKpiCards() {
  const [week, setWeek] = useState<Row[]>([]);
  const [lowStock, setLowStock] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [stockStatus, setStockStatus] = useState<Record<number, boolean>>({});

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [w, items] = await Promise.all([
          getSalesSummary(7),
          getLowStockItems().catch(() => []),
        ]);
        if (mounted) {
          setWeek(w);
          setLowStock(items);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
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

  useEffect(() => {
    (async () => {
      try {
        const cats = await fetchCategories();
        setCategories(cats);
      } catch (error) {
        console.error('Failed categories:', error);
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const params: Record<string, string> = {};
        if (selectedCategory) params.category = String(selectedCategory);
        if (search.trim()) params.search = search.trim();
        const data = await fetchItems(params);
        setItems(data);

        const initialStock: Record<number, boolean> = {};
        data.forEach((i) => {
          initialStock[i.id] = i.is_available;
        });
        setStockStatus((prev) => ({ ...initialStock, ...prev }));
      } catch (error) {
        console.error('Failed items:', error);
      } finally {
        setLoading(false);
      }
    })();
  }, [selectedCategory, search]);

  // --- Metrics ---
  const metrics = useMemo(() => {
    const total = items.length;
    const avg =
      total > 0
        ? items.reduce((acc, curr) => acc + Number(curr.price), 0) / total
        : 0;
    return {
      totalItems: total,
      activeteMenuItems: items.filter((i) => i.is_available).length,
      activeCategories: categories.length,
      avgPrice: avg,
    };
  }, [items, categories]);

  return (
    <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
      <OverviewCard
        label='Total Revenue'
        value={`LKR ${compactFormat(weekTotal)}`}
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
        label='Total Menu Items'
        value={metrics.activeCategories}
        subLabel='Active dishes'
        Icon={Utensils}
        // trend={{ value: 2.1, direction: 'down' }} // Mock trend
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
