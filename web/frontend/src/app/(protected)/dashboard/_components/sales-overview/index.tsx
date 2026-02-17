'use client';

import { useEffect, useMemo, useState } from 'react';
import { getSalesSummary } from '@/lib/sales';
import { PeriodPicker } from '@/components/period-picker';
import { standardFormat } from '@/lib/format-number';
import { SalesOverviewChart } from './chart';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown } from 'lucide-react';

type Row = { date: string; count: number; total: string };
type TimeFrame = 'weekly' | 'monthly';

export function SalesOverview({ className }: { className?: string }) {
  const [timeFrame, setTimeFrame] = useState<TimeFrame>('weekly');
  const [rows, setRows] = useState<Row[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setIsLoading(true);
      const days = timeFrame === 'weekly' ? 7 : 30;
      const data = await getSalesSummary(days);
      if (mounted) {
        setRows(data);
        setIsLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [timeFrame]);

  // Calculations
  const revenueTotal = useMemo(
    () => rows.reduce((s, r) => s + Number(r.total || 0), 0),
    [rows]
  );

  const ordersTotal = useMemo(
    () => rows.reduce((s, r) => s + (r.count || 0), 0),
    [rows]
  );

  // Mock trend calculation (Replace with real previous period logic if available)
  const trendPercentage = 12.5;
  const isTrendPositive = trendPercentage > 0;

  const chartData = useMemo(() => {
    const sorted = [...rows].sort((a, b) => a.date.localeCompare(b.date));
    return {
      revenue: sorted.map((r) => ({ x: r.date, y: Number(r.total || 0) })),
      avgOrder: sorted.map((r) => ({
        x: r.date,
        y: r.count ? Number(r.total || 0) / r.count : 0,
      })),
    };
  }, [rows]);

  return (
    <Card className={className}>
      <CardHeader className='flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 space-y-4 sm:space-y-0'>
        <div className='space-y-1'>
          <CardTitle>Sales Performance</CardTitle>
          <CardDescription>
            Revenue trends and order volume over time
          </CardDescription>
        </div>
        <PeriodPicker
          defaultValue={timeFrame}
          sectionKey='sales_overview'
          // @ts-expect-error - Assuming onChange compatibility
          onValueChange={(v: TimeFrame) => setTimeFrame(v)}
        />
      </CardHeader>

      <CardContent>
        {/* KPI Section - Placed ABOVE chart for immediate visibility */}
        <div className='flex items-end gap-8 mb-8'>
          <div>
            <p className='text-sm font-medium text-muted-foreground mb-1'>
              Total Revenue
            </p>
            <div className='flex items-baseline gap-2'>
              <h3 className='text-3xl font-bold tracking-tight text-foreground'>
                LKR {standardFormat(revenueTotal)}
              </h3>
              <Badge
                variant='outline'
                className={`font-normal ${
                  isTrendPositive
                    ? 'text-emerald-600 bg-emerald-50 border-emerald-200'
                    : 'text-red-600 bg-red-50 border-red-200'
                }`}
              >
                {isTrendPositive ? (
                  <TrendingUp className='h-3 w-3 mr-1' />
                ) : (
                  <TrendingDown className='h-3 w-3 mr-1' />
                )}
                {Math.abs(trendPercentage)}%
              </Badge>
            </div>
          </div>

          <div className='hidden sm:block pl-8 border-l border-border/50'>
            <p className='text-sm font-medium text-muted-foreground mb-1'>
              Total Orders
            </p>
            <h3 className='text-2xl font-semibold tracking-tight text-foreground'>
              {standardFormat(ordersTotal)}
            </h3>
          </div>
        </div>

        {/* Chart Container */}
        <div className='h-[350px] w-full'>
          <SalesOverviewChart data={chartData} loading={isLoading} />
        </div>
      </CardContent>
    </Card>
  );
}
