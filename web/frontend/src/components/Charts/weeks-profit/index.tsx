"use client";

import { useEffect, useMemo, useState } from "react";

import { PeriodPicker } from "@/components/period-picker";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getForecastHistory } from "@/lib/forecasting";
import { getSalesSummary } from "@/lib/sales";
import { cn } from "@/lib/utils";

import { WeeksProfitChart } from "./chart";

type PropsType = {
  timeFrame?: string;
  className?: string;
};

type TableRowData = {
  date: string;
  actualSales: number;
  predictedCount: number;
};

function formatDateLabel(isoDate: string): string {
  const d = new Date(`${isoDate}T00:00:00`);
  return d.toLocaleDateString("en-US", { weekday: "short" });
}

function formatMoney(value: number): string {
  return value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function buildRows(
  salesSummary: { date: string; count: number; total: string }[],
  forecastHistory: {
    start_date: string;
    end_date: string;
    days: number;
    items: {
      daily: { date: string; yhat: number; actual: number }[];
    }[];
  },
  timeFrame?: string,
): TableRowData[] {
  const dailyPredictedMap = new Map<string, number>();

  for (const item of forecastHistory.items ?? []) {
    for (const day of item.daily ?? []) {
      dailyPredictedMap.set(
        day.date,
        (dailyPredictedMap.get(day.date) ?? 0) + Number(day.yhat || 0),
      );
    }
  }

  const allDates = Array.from(
    new Set([...salesSummary.map((x) => x.date), ...dailyPredictedMap.keys()]),
  ).sort((a, b) => a.localeCompare(b));

  const rows = allDates.map((date) => {
    const actualSales = Number(
      salesSummary.find((x) => x.date === date)?.total ?? 0,
    );
    const predictedCount = Number(dailyPredictedMap.get(date) ?? 0);
    return { date, actualSales, predictedCount };
  });

  if (rows.length <= 7) return rows;

  if (timeFrame === "last week") {
    return rows.slice(Math.max(0, rows.length - 14), rows.length - 7);
  }

  return rows.slice(-7);
}

export function WeeksProfit({ className, timeFrame }: PropsType) {
  const [rows, setRows] = useState<TableRowData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [salesSummary, forecastHistory] = await Promise.all([
          getSalesSummary(14),
          getForecastHistory(14, 200),
        ]);

        if (cancelled) return;
        setRows(buildRows(salesSummary, forecastHistory, timeFrame));
      } catch (e: any) {
        if (cancelled) return;
        setError(e?.detail || "Failed to load profit chart data.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [timeFrame]);

  const chartData = useMemo(() => {
    return {
      actualSales: rows.map((r) => ({
        x: formatDateLabel(r.date),
        y: Number(r.actualSales.toFixed(2)),
      })),
      predictedCount: rows.map((r) => ({
        x: formatDateLabel(r.date),
        y: Number(r.predictedCount.toFixed(2)),
      })),
    };
  }, [rows]);

  const totals = useMemo(() => {
    return {
      totalActualSales: rows.reduce((sum, r) => sum + r.actualSales, 0),
      totalPredictedCount: rows.reduce((sum, r) => sum + r.predictedCount, 0),
    };
  }, [rows]);

  return (
    <div
      className={cn(
        "rounded-[10px] bg-white px-7.5 pt-7.5 shadow-1 dark:bg-gray-dark dark:shadow-card",
        className,
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-body-2xlg font-bold text-dark dark:text-white">
          Profit {timeFrame || "this week"}
        </h2>

        <PeriodPicker
          items={["this week", "last week"]}
          defaultValue={timeFrame || "this week"}
          sectionKey="weeks_profit"
        />
      </div>

      {error ? (
        <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="mt-6 text-sm text-muted-foreground">
          Loading chart data...
        </div>
      ) : (
        <>
          <WeeksProfitChart data={chartData} />

          <div className="mt-4 rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actual Sales</TableHead>
                  <TableHead className="text-right">Predicted Count</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.date}>
                    <TableCell>{row.date}</TableCell>
                    <TableCell className="text-right">
                      {formatMoney(row.actualSales)}
                    </TableCell>
                    <TableCell className="text-right">
                      {row.predictedCount.toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow>
                  <TableCell className="font-semibold">Total</TableCell>
                  <TableCell className="text-right font-semibold">
                    {formatMoney(totals.totalActualSales)}
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    {totals.totalPredictedCount.toFixed(2)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </div>
  );
}
