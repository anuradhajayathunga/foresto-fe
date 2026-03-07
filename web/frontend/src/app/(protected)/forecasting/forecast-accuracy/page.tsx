"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ClipboardList,
  RefreshCw,
  ShoppingCart,
  Target,
  Trash2,
  CalendarRange,
  Search,
  Info,
  TrendingDown,
  TrendingUp,
  AlertCircle,
  Activity,
  Layers,
} from "lucide-react";

import {
  listProductions,
  listWastes,
  type KitchenProduction,
  type KitchenWaste,
} from "@/lib/kitchen";
import { listSales, type Sale } from "@/lib/sales";
import { listAllRecipeLines, type RecipeLine } from "@/lib/recipes";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// --- Types ---
type CoverageFilter = "all" | "with_forecast" | "no_forecast";

type ForecastAccuracyRow = {
  key: string;
  date: string;
  menu_item_id: number;
  menu_item_name: string;
  forecast_qty: number | null;
  planned_qty: number | null;
  prepared_qty: number | null;
  sold_qty: number;
  waste_qty: number;
  ingredient_waste_qty: number;
  actual_demand_qty: number;
  waste_rate_pct: number | null;
  forecast_accuracy_pct: number | null;
  plan_accuracy_pct: number | null;
  sell_through_pct: number | null;
  over_prep_qty: number;
  under_prep_qty: number;
  production_row_count: number;
  sales_line_count: number;
  waste_entry_count: number;
};

type ForecastAccuracyData = {
  rows: ForecastAccuracyRow[];
  ingredientWasteBreakdown: Array<{
    ingredient_id: number;
    ingredient_name: string;
    ingredient_unit: string;
    ingredient_waste_qty: number;
    ingredient_demand_qty: number;
    ingredient_waste_rate_pct: number | null;
    menu_item_coverage: number;
  }>;
  kpis: {
    rowCount: number;
    forecastCoverageCount: number;
    forecastCoveragePct: number | null;
    avgForecastAccuracyPct: number | null;
    avgPlanAccuracyPct: number | null;
    avgSellThroughPct: number | null;
    totalActualDemandQty: number;
    totalSoldQty: number;
    totalWasteQty: number;
    totalIngredientWasteQty: number;
    totalOverPrepQty: number;
    totalUnderPrepQty: number;
  };
  charts: {
    accuracyTrend: Array<{
      date: string;
      forecastAccuracy: number | null;
      planAccuracy: number | null;
    }>;
    worstForecastRows: Array<{ label: string; error: number }>;
    worstPlanRows: Array<{ label: string; error: number }>;
  };
};

type RowAccumulator = {
  key: string;
  date: string;
  menu_item_id: number;
  menu_item_name: string;
  forecast_qty: number | null;
  planned_qty: number | null;
  prepared_qty: number | null;
  sold_qty: number;
  waste_qty: number;
  production_row_count: number;
  sales_line_count: number;
  waste_entry_count: number;
};

// --- Utilities ---
function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function daysAgoISO(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function parseQty(v: unknown): number {
  const n = Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
}

function fmt(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return "-";
  return n.toFixed(2);
}

function pct(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return "-";
  return `${n.toFixed(1)}%`;
}

function avg(values: Array<number | null>): number | null {
  const valid = values.filter(
    (v): v is number => v != null && Number.isFinite(v),
  );
  if (valid.length === 0) return null;
  return valid.reduce((s, v) => s + v, 0) / valid.length;
}

function calcAccuracy(
  referenceQty: number | null,
  actualQty: number,
): number | null {
  if (referenceQty == null) return null;
  if (actualQty <= 0) return referenceQty <= 0 ? 100 : 0;
  const error = Math.abs(referenceQty - actualQty);
  const result = 100 - (error / actualQty) * 100;
  return Math.max(0, Math.min(100, result));
}

// Custom modern badge for percentages
function percentBadge(value: number | null) {
  if (value == null)
    return (
      <Badge variant="secondary" className="bg-slate-100  font-medium">
        N/A
      </Badge>
    );
  if (value >= 90) {
    return (
      <Badge className="bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20 hover:bg-emerald-50 font-medium">
        {pct(value)}
      </Badge>
    );
  }
  if (value >= 70) {
    return (
      <Badge className="bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20 hover:bg-amber-50 font-medium">
        {pct(value)}
      </Badge>
    );
  }
  return (
    <Badge className="bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-600/20 hover:bg-rose-50 font-medium">
      {pct(value)}
    </Badge>
  );
}

function parseError(error: unknown): string {
  if (!error) return "Failed to load forecast accuracy data.";
  if (typeof error === "string") return error;
  if (typeof error === "object" && error !== null && "detail" in error) {
    return String((error as { detail: unknown }).detail);
  }
  return "Failed to load forecast accuracy data.";
}

function toSaleDate(sale: Sale): string | null {
  const raw = sale.created_at ?? sale.sold_at;
  if (!raw) return null;
  return raw.slice(0, 10);
}

// --- Data Builder ---
function buildDashboardData(
  productions: KitchenProduction[],
  wastes: KitchenWaste[],
  sales: Sale[],
  recipeLines: RecipeLine[],
  dateFrom: string,
  dateTo: string,
): ForecastAccuracyData {
  const rowMap = new Map<string, RowAccumulator>();
  const recipeQtyByMenuItem = new Map<number, number>();
  const recipeLinesByMenuItem = new Map<
    number,
    Array<{
      ingredient_id: number;
      ingredient_name: string;
      ingredient_unit: string;
      qty: number;
    }>
  >();

  for (const line of recipeLines) {
    const menuItemId = Number(line.menu_item);
    if (!menuItemId || !Number.isFinite(menuItemId)) continue;
    const perUnitQty = parseQty(line.qty);
    recipeQtyByMenuItem.set(
      menuItemId,
      (recipeQtyByMenuItem.get(menuItemId) ?? 0) + perUnitQty,
    );

    const existingLines = recipeLinesByMenuItem.get(menuItemId) ?? [];
    existingLines.push({
      ingredient_id: Number(line.ingredient),
      ingredient_name: line.ingredient_name || `Ingredient #${line.ingredient}`,
      ingredient_unit: line.ingredient_unit || "",
      qty: perUnitQty,
    });
    recipeLinesByMenuItem.set(menuItemId, existingLines);
  }

  function ensureRow(
    date: string,
    menuItemId: number,
    menuItemName: string,
  ): RowAccumulator {
    const key = `${date}__${menuItemId}`;
    const existing = rowMap.get(key);
    if (existing) return existing;

    const row: RowAccumulator = {
      key,
      date,
      menu_item_id: menuItemId,
      menu_item_name: menuItemName || `Item #${menuItemId}`,
      forecast_qty: null,
      planned_qty: null,
      prepared_qty: null,
      sold_qty: 0,
      waste_qty: 0,
      production_row_count: 0,
      sales_line_count: 0,
      waste_entry_count: 0,
    };
    rowMap.set(key, row);
    return row;
  }

  for (const p of productions) {
    if (!p.date || p.date < dateFrom || p.date > dateTo) continue;
    const row = ensureRow(p.date, p.menu_item, p.menu_item_name ?? "");
    row.forecast_qty = parseQty(p.suggested_qty);
    row.planned_qty = parseQty(p.planned_qty);
    row.prepared_qty = parseQty(p.prepared_qty);
    row.production_row_count += 1;
  }

  for (const w of wastes) {
    if (!w.date || w.date < dateFrom || w.date > dateTo) continue;
    const row = ensureRow(w.date, w.menu_item, w.menu_item_name ?? "");
    row.waste_qty += parseQty(w.waste_qty);
    row.waste_entry_count += 1;
  }

  for (const sale of sales) {
    if (sale.status !== "PAID") continue;
    const saleDate = toSaleDate(sale);
    if (!saleDate || saleDate < dateFrom || saleDate > dateTo) continue;

    for (const item of sale.items ?? []) {
      const menuItemId = Number(item.menu_item);
      if (!menuItemId || !Number.isFinite(menuItemId)) continue;
      const row = ensureRow(
        saleDate,
        menuItemId,
        item.menu_item_name ?? item.name ?? "",
      );
      row.sold_qty += parseQty(item.qty);
      row.sales_line_count += 1;
    }
  }

  const rows: ForecastAccuracyRow[] = Array.from(rowMap.values())
    .map((r) => {
      const actualDemand = r.sold_qty + r.waste_qty;
      const forecastAccuracy = calcAccuracy(r.forecast_qty, actualDemand);
      const planAccuracy = calcAccuracy(r.planned_qty, actualDemand);
      const sellThrough =
        r.prepared_qty != null && r.prepared_qty > 0
          ? (r.sold_qty / r.prepared_qty) * 100
          : null;
      const wasteRate =
        actualDemand > 0 ? (r.waste_qty / actualDemand) * 100 : null;
      const prepared = r.prepared_qty ?? 0;
      const ingredientWasteQty =
        r.waste_qty * (recipeQtyByMenuItem.get(r.menu_item_id) ?? 0);
      const overPrep = Math.max(prepared - actualDemand, 0);
      const underPrep = Math.max(actualDemand - prepared, 0);

      return {
        ...r,
        actual_demand_qty: actualDemand,
        ingredient_waste_qty: ingredientWasteQty,
        waste_rate_pct: wasteRate,
        forecast_accuracy_pct: forecastAccuracy,
        plan_accuracy_pct: planAccuracy,
        sell_through_pct: sellThrough,
        over_prep_qty: overPrep,
        under_prep_qty: underPrep,
      };
    })
    .sort((a, b) =>
      a.date === b.date
        ? a.menu_item_name.localeCompare(b.menu_item_name)
        : a.date.localeCompare(b.date),
    );

  const rowCount = rows.length;
  const forecastCoverageCount = rows.filter(
    (r) => r.forecast_qty != null,
  ).length;

  const accuracyByDate = new Map<
    string,
    { f: Array<number | null>; p: Array<number | null> }
  >();
  for (const row of rows) {
    const bucket = accuracyByDate.get(row.date) ?? { f: [], p: [] };
    bucket.f.push(row.forecast_accuracy_pct);
    bucket.p.push(row.plan_accuracy_pct);
    accuracyByDate.set(row.date, bucket);
  }

  const accuracyTrend = Array.from(accuracyByDate.entries())
    .map(([date, vals]) => ({
      date,
      forecastAccuracy: avg(vals.f),
      planAccuracy: avg(vals.p),
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const worstForecastRows = rows
    .filter((r) => r.forecast_qty != null)
    .map((r) => ({
      label: `${r.date} - ${r.menu_item_name}`,
      error: Math.abs((r.forecast_qty ?? 0) - r.actual_demand_qty),
    }))
    .sort((a, b) => b.error - a.error)
    .slice(0, 10);

  const worstPlanRows = rows
    .filter((r) => r.planned_qty != null)
    .map((r) => ({
      label: `${r.date} - ${r.menu_item_name}`,
      error: Math.abs((r.planned_qty ?? 0) - r.actual_demand_qty),
    }))
    .sort((a, b) => b.error - a.error)
    .slice(0, 10);

  const ingredientAccumulator = new Map<
    number,
    {
      ingredient_id: number;
      ingredient_name: string;
      ingredient_unit: string;
      ingredient_waste_qty: number;
      ingredient_demand_qty: number;
      menu_item_ids: Set<number>;
    }
  >();

  for (const row of rows) {
    const menuRecipeLines = recipeLinesByMenuItem.get(row.menu_item_id) ?? [];
    for (const rl of menuRecipeLines) {
      const ingredientDemandQty = row.actual_demand_qty * rl.qty;
      const ingredientWasteQty = row.waste_qty * rl.qty;
      const existing = ingredientAccumulator.get(rl.ingredient_id) ?? {
        ingredient_id: rl.ingredient_id,
        ingredient_name: rl.ingredient_name,
        ingredient_unit: rl.ingredient_unit,
        ingredient_waste_qty: 0,
        ingredient_demand_qty: 0,
        menu_item_ids: new Set<number>(),
      };

      existing.ingredient_demand_qty += ingredientDemandQty;
      existing.ingredient_waste_qty += ingredientWasteQty;
      existing.menu_item_ids.add(row.menu_item_id);
      ingredientAccumulator.set(rl.ingredient_id, existing);
    }
  }

  const ingredientWasteBreakdown = Array.from(ingredientAccumulator.values())
    .map((r) => ({
      ingredient_id: r.ingredient_id,
      ingredient_name: r.ingredient_name,
      ingredient_unit: r.ingredient_unit,
      ingredient_waste_qty: r.ingredient_waste_qty,
      ingredient_demand_qty: r.ingredient_demand_qty,
      ingredient_waste_rate_pct:
        r.ingredient_demand_qty > 0
          ? (r.ingredient_waste_qty / r.ingredient_demand_qty) * 100
          : null,
      menu_item_coverage: r.menu_item_ids.size,
    }))
    .sort((a, b) => {
      if (b.ingredient_waste_qty !== a.ingredient_waste_qty) {
        return b.ingredient_waste_qty - a.ingredient_waste_qty;
      }
      return a.ingredient_name.localeCompare(b.ingredient_name);
    });

  return {
    rows,
    ingredientWasteBreakdown,
    kpis: {
      rowCount,
      forecastCoverageCount,
      forecastCoveragePct:
        rowCount > 0 ? (forecastCoverageCount / rowCount) * 100 : null,
      avgForecastAccuracyPct: avg(rows.map((r) => r.forecast_accuracy_pct)),
      avgPlanAccuracyPct: avg(rows.map((r) => r.plan_accuracy_pct)),
      avgSellThroughPct: avg(rows.map((r) => r.sell_through_pct)),
      totalActualDemandQty: rows.reduce((s, r) => s + r.actual_demand_qty, 0),
      totalSoldQty: rows.reduce((s, r) => s + r.sold_qty, 0),
      totalWasteQty: rows.reduce((s, r) => s + r.waste_qty, 0),
      totalIngredientWasteQty: rows.reduce(
        (s, r) => s + r.ingredient_waste_qty,
        0,
      ),
      totalOverPrepQty: rows.reduce((s, r) => s + r.over_prep_qty, 0),
      totalUnderPrepQty: rows.reduce((s, r) => s + r.under_prep_qty, 0),
    },
    charts: { accuracyTrend, worstForecastRows, worstPlanRows },
  };
}

// --- Custom Recharts Tooltip ---
const CustomChartTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className=" border border-slate-200 p-3 rounded-lg shadow-xl text-xs min-w-[150px]">
        <p className="font-semibold  mb-2 pb-2 border-b border-slate-100">
          {label}
        </p>
        {payload.map((entry: any, index: number) => (
          <div
            key={index}
            className="flex items-center justify-between gap-4 mb-1.5 last:mb-0"
          >
            <div className="flex items-center gap-2">
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className=" font-medium">{entry.name}</span>
            </div>
            <span className="font-mono font-medium ">
              {entry.value ? `${entry.value.toFixed(1)}` : "-"}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

// --- Main Component ---
export default function ForecastAccuracyPage() {
  const [dateFrom, setDateFrom] = useState(daysAgoISO(29));
  const [dateTo, setDateTo] = useState(todayISO());
  const [search, setSearch] = useState("");
  const [coverageFilter, setCoverageFilter] = useState<CoverageFilter>("all");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dashboard, setDashboard] = useState<ForecastAccuracyData>({
    rows: [],
    ingredientWasteBreakdown: [],
    kpis: {
      rowCount: 0,
      forecastCoverageCount: 0,
      forecastCoveragePct: null,
      avgForecastAccuracyPct: null,
      avgPlanAccuracyPct: null,
      avgSellThroughPct: null,
      totalActualDemandQty: 0,
      totalSoldQty: 0,
      totalWasteQty: 0,
      totalIngredientWasteQty: 0,
      totalOverPrepQty: 0,
      totalUnderPrepQty: 0,
    },
    charts: { accuracyTrend: [], worstForecastRows: [], worstPlanRows: [] },
  });

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const [productions, wastes, sales, recipeLines] = await Promise.all([
        listProductions({ date_from: dateFrom, date_to: dateTo }),
        listWastes({ date_from: dateFrom, date_to: dateTo }),
        listSales(),
        listAllRecipeLines(),
      ]);
      setDashboard(
        buildDashboardData(
          productions,
          wastes,
          sales,
          recipeLines,
          dateFrom,
          dateTo,
        ),
      );
    } catch (e) {
      setError(parseError(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, [dateFrom, dateTo]);

  const filteredRows = useMemo(() => {
    let rows = dashboard.rows;
    if (coverageFilter === "with_forecast")
      rows = rows.filter((r) => r.forecast_qty != null);
    else if (coverageFilter === "no_forecast")
      rows = rows.filter((r) => r.forecast_qty == null);

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      rows = rows.filter(
        (r) => r.menu_item_name.toLowerCase().includes(q) || r.date.includes(q),
      );
    }
    return rows;
  }, [coverageFilter, dashboard.rows, search]);

  const trendData = useMemo(
    () => dashboard.charts.accuracyTrend.slice(-30),
    [dashboard.charts.accuracyTrend],
  );

  return (
    <div className="min-h-screen p-6 md:p-8 space-y-8 font-sans">
      {/* 1. Header & Global Controls */}
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight ">
            Forecast Accuracy
          </h1>
          <p className="text-sm ">
            Compare predictions against actual demand to optimize kitchen
            production.
          </p>
        </div>

        {/* Sleek Date Range Control Bar */}
        <div className="flex flex-col sm:flex-row gap-3 items-end sm:items-center  p-1.5 rounded-lg border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 px-3 border-r border-slate-100">
            <CalendarRange className="h-4 w-4 text-slate-400" />
            <span className="text-sm font-medium text-slate-600 hidden sm:inline">
              Range:
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Input
              type="date"
              className="h-8 w-36  border-slate-200 text-sm focus-visible:ring-offset-0"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
            <span className="text-slate-400">—</span>
            <Input
              type="date"
              className="h-8 w-36  border-slate-200 text-sm focus-visible:ring-offset-0"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>

          {/* Quick Filters */}
          <div className="hidden md:flex items-center gap-1 border-l border-slate-100 pl-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs  "
              onClick={() => {
                setDateFrom(daysAgoISO(6));
                setDateTo(todayISO());
              }}
            >
              7D
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs  "
              onClick={() => {
                setDateFrom(daysAgoISO(29));
                setDateTo(todayISO());
              }}
            >
              30D
            </Button>
          </div>

          <div className="w-px h-6 bg-slate-200 hidden sm:block mx-1" />

          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-2 text-slate-600  hover:bg-slate-100"
            onClick={() => void loadData()}
            disabled={loading}
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`}
            />
            <span className="sr-only sm:not-sr-only">Refresh</span>
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 flex items-center gap-3 shadow-sm animate-in fade-in">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" /> {error}
        </div>
      )}

      {/* 2. Primary KPI Grid (Percentages) */}
      <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-sm border-slate-200/60 ring-1 ring-transparent hover:ring-indigo-500/10 transition-all ">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium ">Forecast Accuracy</h3>
              <div className="p-1.5 bg-indigo-50 rounded-md ring-1 ring-indigo-100">
                <Target className="h-4 w-4 text-indigo-600" />
              </div>
            </div>
            <div className="text-3xl font-bold  tabular-nums tracking-tight">
              {pct(dashboard.kpis.avgForecastAccuracyPct)}
            </div>
            <p className="text-xs  mt-2 font-medium">
              Coverage: {pct(dashboard.kpis.forecastCoveragePct)} (
              {dashboard.kpis.forecastCoverageCount} rows)
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-slate-200/60 ring-1 ring-transparent hover:ring-emerald-500/10 transition-all ">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium ">Plan Accuracy</h3>
              <div className="p-1.5 bg-emerald-50 rounded-md ring-1 ring-emerald-100">
                <ClipboardList className="h-4 w-4 text-emerald-600" />
              </div>
            </div>
            <div className="text-3xl font-bold  tabular-nums tracking-tight">
              {pct(dashboard.kpis.avgPlanAccuracyPct)}
            </div>
            <p className="text-xs  mt-2 font-medium">
              Planned vs actual demand
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-slate-200/60 ring-1 ring-transparent hover:ring-blue-500/10 transition-all ">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium ">Avg Sell-Through</h3>
              <div className="p-1.5 bg-blue-50 rounded-md ring-1 ring-blue-100">
                <Activity className="h-4 w-4 text-blue-600" />
              </div>
            </div>
            <div className="text-3xl font-bold  tabular-nums tracking-tight">
              {pct(dashboard.kpis.avgSellThroughPct)}
            </div>
            <p className="text-xs  mt-2 font-medium">
              Units sold vs units prepared
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-slate-200/60 ring-1 ring-transparent hover:ring-slate-300 transition-all ">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium ">Records Analyzed</h3>
              <div className="p-1.5 bg-slate-100 rounded-md ring-1 ring-slate-200">
                <Layers className="h-4 w-4 text-slate-600" />
              </div>
            </div>
            <div className="text-3xl font-bold  tabular-nums tracking-tight">
              {dashboard.kpis.rowCount}
            </div>
            <p className="text-xs  mt-2 font-medium">
              Date + menu item combinations
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 3. Secondary KPI Grid (Volumes) */}
      <div className="grid gap-5 grid-cols-1 md:grid-cols-2 xl:grid-cols-4">
        {/* <Card className="shadow-sm border-slate-200/60 bg-slate-900 text-white">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2 text-slate-400 font-medium">
              <Target className="h-4 w-4 text-indigo-400" /> Actual Demand
            </CardDescription>
            <CardTitle className="text-3xl font-bold tracking-tight">
              {fmt(dashboard.kpis.totalActualDemandQty)}
            </CardTitle>
          </CardHeader>
        </Card> */}

        <Card className="shadow-sm border-slate-200/60">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2  font-medium">
              <ShoppingCart className="h-4 w-4 text-emerald-500" /> Units Sold
            </CardDescription>
            <CardTitle className="text-3xl font-bold tracking-tight ">
              {fmt(dashboard.kpis.totalSoldQty)}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card className="shadow-sm border-slate-200/60">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2  font-medium">
              <Trash2 className="h-4 w-4 text-rose-500" /> Waste Qty
            </CardDescription>
            <CardTitle className="text-3xl font-bold tracking-tight ">
              {fmt(dashboard.kpis.totalWasteQty)}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card className="shadow-sm border-slate-200/60">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2  font-medium">
              <ShoppingCart className="h-4 w-4 text-violet-500" /> Ingredient
              Waste Qty
            </CardDescription>
            <CardTitle className="text-3xl font-bold tracking-tight ">
              {fmt(dashboard.kpis.totalIngredientWasteQty)}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card className="shadow-sm border-slate-200/60 bg-amber-5">
          <CardHeader className="pb-1">
            <CardDescription className="flex items-center gap-2 text-amber-800 font-medium">
              <ClipboardList className="h-4 w-4 text-amber-600" /> Prep
              Imbalance
            </CardDescription>
            <CardTitle className="text-3xl font-bold tracking-tight text-amber-900">
              +{fmt(dashboard.kpis.totalOverPrepQty)}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-xs font-medium text-amber-700/80">
            Under-prep: {fmt(dashboard.kpis.totalUnderPrepQty)}
          </CardContent>
        </Card>
      </div>

      {/* 4. Charts Section */}
      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="xl:col-span-2 shadow-sm border-slate-200/60 flex flex-col">
          <CardHeader className="pb-2 border-b border-slate-100/50">
            <CardTitle className="text-base font-semibold ">
              Daily Accuracy Trend
            </CardTitle>
            <CardDescription className="text-xs  mt-1">
              Average forecast vs. planned accuracy over the selected period.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6 pb-2 pl-0 pr-6 flex-1 min-h-[300px]">
            {trendData.length === 0 ? (
              <div className="flex items-center justify-center h-full text-sm text-slate-400">
                No trend data available.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={trendData}
                  margin={{ top: 5, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="4 4"
                    vertical={false}
                    stroke="#e2e8f0"
                  />
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={12}
                    fontSize={11}
                    tick={{ fill: "#64748b" }}
                  />
                  <YAxis
                    domain={[0, 100]}
                    tickLine={false}
                    axisLine={false}
                    tickMargin={12}
                    fontSize={11}
                    tick={{ fill: "#64748b" }}
                  />
                  <Tooltip
                    content={<CustomChartTooltip />}
                    cursor={{
                      stroke: "#cbd5e1",
                      strokeWidth: 1,
                      strokeDasharray: "4 4",
                    }}
                  />
                  <Legend
                    iconType="circle"
                    wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="forecastAccuracy"
                    name="Forecast %"
                    stroke="#6366f1"
                    strokeWidth={3}
                    dot={false}
                    activeDot={{ r: 5 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="planAccuracy"
                    name="Plan %"
                    stroke="#10b981"
                    strokeWidth={3}
                    dot={false}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Informational Sidebar */}
        {/* <Card className="shadow-sm border-slate-200/60 bg-slate-900 text-slate-300 flex flex-col justify-between">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-white flex items-center gap-2">
              <Info className="h-5 w-5 text-indigo-400" />
              How Accuracy is Calculated
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm leading-relaxed">
            <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700">
              <span className="block text-white font-medium mb-1">Forecast Source</span>
              Derived from <code className="text-xs text-indigo-300 bg-indigo-950/50 px-1 py-0.5 rounded">production.suggested_qty</code>.
            </div>
            <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700">
              <span className="block text-white font-medium mb-1">Actual Demand</span>
              The absolute truth: <code className="text-xs text-emerald-300 bg-emerald-950/50 px-1 py-0.5 rounded">sold_qty + waste_qty</code>.
            </div>
            <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700">
              <span className="block text-white font-medium mb-1">Sales Data</span>
              Aggregated from <code className="text-xs text-slate-300 bg-slate-950/50 px-1 py-0.5 rounded">PAID</code> sale items, grouped by date and menu item.
            </div>
          </CardContent>
        </Card> */}
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="shadow-sm border-slate-200/60">
          <CardHeader className="pb-4 border-b border-slate-100/50">
            <CardTitle className="text-base font-semibold  flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-rose-500" /> Worst Forecast
              Misses
            </CardTitle>
            <CardDescription className="text-xs  mt-1">
              Top 10 highest absolute errors (Forecast vs Actual)
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {dashboard.charts.worstForecastRows.length === 0 ? (
              <div className="flex items-center justify-center h-[280px] text-sm text-slate-400">
                No forecast data available.
              </div>
            ) : (
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={dashboard.charts.worstForecastRows}
                    layout="vertical"
                    margin={{ left: 10, right: 20 }}
                  >
                    <CartesianGrid
                      strokeDasharray="4 4"
                      horizontal={false}
                      stroke="#e2e8f0"
                    />
                    <XAxis
                      type="number"
                      tickLine={false}
                      axisLine={false}
                      fontSize={11}
                      tick={{ fill: "#64748b" }}
                    />
                    <YAxis
                      type="category"
                      dataKey="label"
                      width={180}
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 11, fill: "#475569" }}
                    />
                    <Tooltip
                      cursor={{ fill: "#f1f5f9" }}
                      contentStyle={{
                        borderRadius: "8px",
                        border: "1px solid #e2e8f0",
                        fontSize: "12px",
                      }}
                    />
                    <Bar
                      dataKey="error"
                      name="Absolute Error"
                      fill="#f43f5e"
                      radius={[0, 4, 4, 0]}
                      barSize={20}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm border-slate-200/60">
          <CardHeader className="pb-4 border-b border-slate-100/50">
            <CardTitle className="text-base font-semibold  flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-amber-500" /> Worst Plan
              Misses
            </CardTitle>
            <CardDescription className="text-xs  mt-1">
              Top 10 highest absolute errors (Planned vs Actual)
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {dashboard.charts.worstPlanRows.length === 0 ? (
              <div className="flex items-center justify-center h-[280px] text-sm text-slate-400">
                No plan data available.
              </div>
            ) : (
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={dashboard.charts.worstPlanRows}
                    layout="vertical"
                    margin={{ left: 10, right: 20 }}
                  >
                    <CartesianGrid
                      strokeDasharray="4 4"
                      horizontal={false}
                      stroke="#e2e8f0"
                    />
                    <XAxis
                      type="number"
                      tickLine={false}
                      axisLine={false}
                      fontSize={11}
                      tick={{ fill: "#64748b" }}
                    />
                    <YAxis
                      type="category"
                      dataKey="label"
                      width={180}
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 11, fill: "#475569" }}
                    />
                    <Tooltip
                      cursor={{ fill: "#f1f5f9" }}
                      contentStyle={{
                        borderRadius: "8px",
                        border: "1px solid #e2e8f0",
                        fontSize: "12px",
                      }}
                    />
                    <Bar
                      dataKey="error"
                      name="Absolute Error"
                      fill="#f59e0b"
                      radius={[0, 4, 4, 0]}
                      barSize={20}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 5. Data Grid Section */}
      <Card className="shadow-sm border-slate-200/60 overflow-hidden">
        <div className="border-b border-slate-200  p-5 lg:p-6">
          <CardTitle className="text-lg font-semibold ">
            Ingredient Waste Rate Table
          </CardTitle>
          <CardDescription className="text-sm mt-1">
            Ingredient-level waste rates derived from recipe quantities and
            menu-item waste.
          </CardDescription>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-slate-200 hover:bg-transparent">
                <TableHead className="text-xs font-semibold uppercase tracking-wider">
                  Ingredient
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-right">
                  Waste Qty
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-right">
                  Demand Qty
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-center">
                  Waste Rate
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-center pr-6">
                  Menu Coverage
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto text-slate-300" />
                  </TableCell>
                </TableRow>
              ) : dashboard.ingredientWasteBreakdown.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-sm">
                    No ingredient waste data available.
                  </TableCell>
                </TableRow>
              ) : (
                dashboard.ingredientWasteBreakdown.map((row) => (
                  <TableRow
                    key={row.ingredient_id}
                    className="border-b border-slate-100"
                  >
                    <TableCell>
                      <div className="font-medium text-sm">
                        {row.ingredient_name}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5 uppercase">
                        ID:{row.ingredient_id}
                        {row.ingredient_unit ? ` • ${row.ingredient_unit}` : ""}
                      </div>
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-sm text-rose-600 font-medium">
                      {fmt(row.ingredient_waste_qty)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-sm text-slate-600">
                      {fmt(row.ingredient_demand_qty)}
                    </TableCell>
                    <TableCell className="text-center">
                      {percentBadge(row.ingredient_waste_rate_pct)}
                    </TableCell>
                    <TableCell className="text-center pr-6">
                      <Badge
                        variant="outline"
                        className="font-medium text-[10px]"
                      >
                        {row.menu_item_coverage}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      <Card className="shadow-sm border-slate-200/60 overflow-hidden">
        {/* Table Toolbar */}
        <div className="border-b border-slate-200  p-5 lg:p-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div>
              <CardTitle className="text-lg font-semibold ">
                Analysis Data Grid
              </CardTitle>
              <CardDescription className="text-sm mt-1">
                Line-by-line breakdown of {filteredRows.length} aggregated
                records.
              </CardDescription>
            </div>

            <div className="flex flex-wrap items-center gap-3  p-1.5 rounded-lg border border-slate-200">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search item or date..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 h-9  border-slate-200 shadow-sm text-sm focus-visible:ring-offset-0"
                />
              </div>
              <Select
                value={coverageFilter}
                onValueChange={(v) => setCoverageFilter(v as CoverageFilter)}
              >
                <SelectTrigger className="h-9 w-full sm:w-[150px]  text-xs border-slate-200 shadow-sm focus:ring-offset-0">
                  <SelectValue placeholder="Coverage" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Records</SelectItem>
                  <SelectItem value="with_forecast">Has Forecast</SelectItem>
                  <SelectItem value="no_forecast">No Forecast</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table className="">
            <TableHeader className="p-2">
              <TableRow className="border-b border-slate-200 hover:bg-transparent">
                <TableHead className="text-xs font-semibold uppercase  tracking-wider">
                  Date
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase  tracking-wider">
                  Item Details
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase  tracking-wider text-right">
                  Forecast
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase  tracking-wider text-right">
                  Planned
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase  tracking-wider text-right">
                  Prepared
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase  tracking-wider text-right">
                  Sold
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase  tracking-wider text-right">
                  Waste
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase  tracking-wider text-right">
                  Ing. Waste
                </TableHead>
                <TableHead className="text-xs font-bold uppercase text-slate-700 dark:text-slate-300 tracking-wider text-right ">
                  Actual
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase  tracking-wider text-center">
                  Waste Rate
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase  tracking-wider text-center">
                  F-Acc
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase  tracking-wider text-center">
                  P-Acc
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase  tracking-wider text-center">
                  Sell-Thru
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase  tracking-wider text-center pr-6">
                  Variance
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="">
              {loading ? (
                <TableRow>
                  <TableCell colSpan={14} className="h-32 text-center">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto text-slate-300" />
                  </TableCell>
                </TableRow>
              ) : filteredRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={14} className="h-32 text-center text-sm ">
                    No data matches your current filters.
                  </TableCell>
                </TableRow>
              ) : (
                filteredRows.map((row) => (
                  <TableRow
                    key={row.key}
                    className="hover:/50 transition-colors group border-b border-slate-100"
                  >
                    <TableCell className="font-medium text-slate-600 text-sm whitespace-nowrap">
                      {row.date}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium  text-sm">
                        {row.menu_item_name}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5 tracking-tight uppercase">
                        ID:{row.menu_item_id} • P:{row.production_row_count} •
                        S:{row.sales_line_count} • W:{row.waste_entry_count}
                      </div>
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-sm text-slate-600">
                      {fmt(row.forecast_qty)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-sm text-slate-600">
                      {fmt(row.planned_qty)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-sm text-slate-600">
                      {fmt(row.prepared_qty)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-sm text-emerald-600 font-medium">
                      {fmt(row.sold_qty)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-sm text-rose-600 font-medium">
                      {fmt(row.waste_qty)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-sm text-violet-600 font-medium">
                      {fmt(row.ingredient_waste_qty)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-sm font-bold group-hover:bg-transparent bg-slate-100/50 dark:bg-slate-800">
                      {fmt(row.actual_demand_qty)}
                    </TableCell>
                    <TableCell className="text-center">
                      {percentBadge(row.waste_rate_pct)}
                    </TableCell>
                    <TableCell className="text-center">
                      {percentBadge(row.forecast_accuracy_pct)}
                    </TableCell>
                    <TableCell className="text-center">
                      {percentBadge(row.plan_accuracy_pct)}
                    </TableCell>
                    <TableCell className="text-center">
                      {percentBadge(row.sell_through_pct)}
                    </TableCell>
                    <TableCell className="text-center pr-6">
                      {row.over_prep_qty > 0 ? (
                        <Badge
                          variant="outline"
                          className="bg-amber-50 text-amber-700 border-amber-200 font-medium text-[10px]"
                        >
                          Over +{fmt(row.over_prep_qty)}
                        </Badge>
                      ) : row.under_prep_qty > 0 ? (
                        <Badge
                          variant="outline"
                          className="bg-blue-50 text-blue-700 border-blue-200 font-medium text-[10px]"
                        >
                          Under {fmt(row.under_prep_qty)}
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="bg-emerald-50 text-emerald-700 border-emerald-200 font-medium text-[10px]"
                        >
                          Balanced
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
