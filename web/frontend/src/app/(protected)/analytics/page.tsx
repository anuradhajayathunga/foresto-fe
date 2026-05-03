import { Suspense } from "react";
import {
  fetchRestaurants,
  fetchItems,
  fetchHolidays,
  fetchMonthlyPattern,
  fetchCalendar,
} from "@/lib/api";
import { SimpleBarChart } from "@/components/Charts/Charts";
import { CalendarDays, Zap, TrendingUp } from "lucide-react";

export const dynamic = "force-dynamic";

interface RestaurantRow {
  restaurant: string;
  location: string;
  total_revenue: number;
  total_qty: number;
  avg_daily_sales: number;
}
interface ItemRow {
  item: string;
  total_revenue: number;
  total_qty: number;
  avg_qty: number;
}
interface HolidayRow {
  holiday_name: string;
  quantity_sold: number;
  vs_normal_pct: number;
}
interface MonthRow {
  month: number;
  month_name: string;
  quantity_sold: number;
}
interface CalendarEvent {
  date: string;
  event_name: string;
  multiplier: number;
  impact_level: string;
}

const IMPACT_COLORS: Record<string, string> = {
  High: "bg-red-100 text-red-600",
  Medium: "bg-orange-100 text-orange-600",
  Low: "bg-green-100 text-green-600",
};

async function AnalyticsContent() {
  const [restData, itemData, holidayData, monthlyData, calendarData] =
    await Promise.all([
      fetchRestaurants().catch(() => ({ restaurants: [] })),
      fetchItems().catch(() => ({ items: [] })),
      fetchHolidays().catch(() => ({ normal_day_avg: 0, holidays: [] })),
      fetchMonthlyPattern().catch(() => ({ monthly_pattern: [] })),
      fetchCalendar().catch(() => ({ holidays: [] })),
    ]);

  const restaurants: RestaurantRow[] = restData?.restaurants ?? [];
  const items: ItemRow[] = (itemData?.items ?? []).slice(0, 15);
  const holidays: HolidayRow[] = holidayData?.holidays ?? [];
  const monthly: MonthRow[] = monthlyData?.monthly_pattern ?? [];
  const calendarEvents: CalendarEvent[] = (calendarData?.holidays ?? []).sort(
    (a: CalendarEvent, b: CalendarEvent) => a.date.localeCompare(b.date),
  );

  const monthChart = monthly.map((m: MonthRow) => ({
    month: m.month_name,
    avg: Number(m.quantity_sold).toFixed(1),
  }));

  const holidayChart = holidays.slice(0, 10).map((h: HolidayRow) => ({
    name:
      h.holiday_name.length > 16
        ? h.holiday_name.slice(0, 14) + "…"
        : h.holiday_name,
    boost: Number(h.vs_normal_pct).toFixed(1),
  }));

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          In-depth breakdown by restaurant, item, holiday, and season
        </p>
      </div>

      {/* Restaurants Table */}
      <div className="section-card">
        <h2 className="text-sm font-semibold text-gray-800 mb-4">
          Performance by Restaurant
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-100">
                {[
                  "Restaurant",
                  "Location",
                  "Total Revenue (LKR)",
                  "Total Qty Sold",
                  "Avg Daily Sales",
                ].map((h) => (
                  <th
                    key={h}
                    className="text-left text-gray-400 font-medium pb-3 pr-6 whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {restaurants.map((r: RestaurantRow, i: number) => (
                <tr
                  key={i}
                  className="border-b border-gray-50 hover:bg-orange-50 transition-colors"
                >
                  <td className="py-3 pr-6 font-semibold text-gray-800">
                    {r.restaurant}
                  </td>
                  <td className="py-3 pr-6 text-gray-500">{r.location}</td>
                  <td className="py-3 pr-6 text-orange-600 font-medium">
                    {Number(r.total_revenue).toLocaleString("en-LK", {
                      maximumFractionDigits: 0,
                    })}
                  </td>
                  <td className="py-3 pr-6 text-gray-700">
                    {Number(r.total_qty).toLocaleString()}
                  </td>
                  <td className="py-3 pr-6 text-gray-700">
                    {Number(r.avg_daily_sales).toFixed(1)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Monthly Pattern + Holiday Impact side by side */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="section-card">
          <h2 className="text-sm font-semibold text-gray-800 mb-1">
            Monthly Sales Pattern
          </h2>
          <p className="text-xs text-gray-400 mb-4">
            Average units sold per month
          </p>
          {monthChart.length > 0 ? (
            <SimpleBarChart
              data={monthChart}
              xKey="month"
              bars={[{ key: "avg", color: "#f97316", label: "Avg Qty" }]}
              height={240}
            />
          ) : (
            <div className="h-56 flex items-center justify-center text-gray-400 text-sm">
              No data
            </div>
          )}
        </div>

        <div className="section-card">
          <h2 className="text-sm font-semibold text-gray-800 mb-1">
            Holiday Sales Boost
          </h2>
          <p className="text-xs text-gray-400 mb-4">
            % increase vs normal days · Normal avg:{" "}
            {holidayData?.normal_day_avg ?? "—"}
          </p>
          {holidayChart.length > 0 ? (
            <SimpleBarChart
              data={holidayChart}
              xKey="name"
              bars={[{ key: "boost", color: "#fb923c", label: "% Boost" }]}
              height={240}
            />
          ) : (
            <div className="h-56 flex items-center justify-center text-gray-400 text-sm">
              No data
            </div>
          )}
        </div>
      </div>

      {/* Top Items Table */}
      <div className="section-card">
        <h2 className="text-sm font-semibold text-gray-800 mb-4">
          Top Menu Items by Revenue
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-100">
                {[
                  "#",
                  "Item",
                  "Total Revenue (LKR)",
                  "Total Qty",
                  "Avg Qty/Day",
                ].map((h) => (
                  <th
                    key={h}
                    className="text-left text-gray-400 font-medium pb-3 pr-6 whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((item: ItemRow, i: number) => (
                <tr
                  key={i}
                  className="border-b border-gray-50 hover:bg-orange-50 transition-colors"
                >
                  <td className="py-3 pr-6 text-gray-400 font-medium">
                    {i + 1}
                  </td>
                  <td className="py-3 pr-6 font-semibold text-gray-800">
                    {item.item}
                  </td>
                  <td className="py-3 pr-6 text-orange-600 font-medium">
                    {Number(item.total_revenue).toLocaleString("en-LK", {
                      maximumFractionDigits: 0,
                    })}
                  </td>
                  <td className="py-3 pr-6 text-gray-700">
                    {Number(item.total_qty).toLocaleString()}
                  </td>
                  <td className="py-3 pr-6 text-gray-700">
                    {Number(item.avg_qty).toFixed(1)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Holiday Impact Detail */}
      {holidays.length > 0 && (
        <div className="section-card">
          <h2 className="text-sm font-semibold text-gray-800 mb-4">
            Holiday Impact Detail
          </h2>
          <div className="grid grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3">
            {holidays.map((h: HolidayRow, i: number) => (
              <div
                key={i}
                className="rounded-xl border border-gray-100 p-3 hover:border-orange-200 transition-colors"
              >
                <p className="text-xs font-semibold text-gray-700 leading-tight">
                  {h.holiday_name}
                </p>
                <p className="text-lg font-bold text-orange-500 mt-1">
                  {Number(h.quantity_sold).toFixed(1)}
                </p>
                <p className="text-[10px] text-gray-400">
                  avg units &nbsp;
                  <span
                    className={
                      h.vs_normal_pct >= 0
                        ? "text-green-600 font-medium"
                        : "text-red-500 font-medium"
                    }
                  >
                    {h.vs_normal_pct >= 0 ? "+" : ""}
                    {Number(h.vs_normal_pct).toFixed(1)}%
                  </span>
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cultural Events Calendar */}
      {calendarEvents.length > 0 && (
        <div className="section-card">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-7 h-7 rounded-lg bg-orange-500 flex items-center justify-center flex-shrink-0">
              <CalendarDays size={14} className="text-white" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-gray-800">
                Sri Lankan Cultural Events Calendar
              </h2>
              <p className="text-xs text-gray-400">
                Demand multipliers applied by the rule engine on event days
              </p>
            </div>
          </div>

          {/* Summary KPIs */}
          <div className="grid grid-cols-3 gap-3 mb-5">
            <div className="rounded-xl bg-orange-50 border border-orange-100 p-3 text-center">
              <p className="text-2xl font-bold text-orange-500">
                {
                  Array.from(new Set(calendarEvents.map((e) => e.event_name)))
                    .length
                }
              </p>
              <p className="text-[11px] text-gray-500 mt-0.5">Unique Events</p>
            </div>
            <div className="rounded-xl bg-red-50 border border-red-100 p-3 text-center">
              <p className="text-2xl font-bold text-red-500">
                {calendarEvents.filter((e) => e.impact_level === "High").length}
              </p>
              <p className="text-[11px] text-gray-500 mt-0.5">
                High Impact Days
              </p>
            </div>
            <div className="rounded-xl bg-green-50 border border-green-100 p-3 text-center">
              <p className="text-2xl font-bold text-green-600">
                ×
                {Math.max(...calendarEvents.map((e) => e.multiplier)).toFixed(
                  1,
                )}
              </p>
              <p className="text-[11px] text-gray-500 mt-0.5">
                Peak Multiplier
              </p>
            </div>
          </div>

          {/* Events Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-100">
                  {[
                    "Date",
                    "Event",
                    "Impact Level",
                    "Demand Multiplier",
                    "Expected Effect",
                  ].map((h) => (
                    <th
                      key={h}
                      className="text-left text-gray-400 font-medium pb-3 pr-6 whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {calendarEvents.map((ev: CalendarEvent, i: number) => (
                  <tr
                    key={i}
                    className="border-b border-gray-50 hover:bg-orange-50 transition-colors"
                  >
                    <td className="py-3 pr-6 text-gray-500 whitespace-nowrap">
                      {ev.date}
                    </td>
                    <td className="py-3 pr-6 font-semibold text-gray-800 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <CalendarDays
                          size={12}
                          className="text-orange-400 flex-shrink-0"
                        />
                        {ev.event_name}
                      </div>
                    </td>
                    <td className="py-3 pr-6">
                      <span
                        className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                          IMPACT_COLORS[ev.impact_level] ??
                          "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {ev.impact_level === "High" && <Zap size={10} />}
                        {ev.impact_level === "Medium" && (
                          <TrendingUp size={10} />
                        )}
                        {ev.impact_level}
                      </span>
                    </td>
                    <td className="py-3 pr-6">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-gray-100 rounded-full max-w-[80px]">
                          <div
                            className="h-1.5 bg-orange-400 rounded-full"
                            style={{
                              width: `${Math.min(((ev.multiplier - 1) / 1.5) * 100, 100)}%`,
                            }}
                          />
                        </div>
                        <span className="font-bold text-orange-600">
                          ×{ev.multiplier.toFixed(1)}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 pr-6 text-gray-500">
                      +{((ev.multiplier - 1) * 100).toFixed(0)}% vs normal
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AnalyticsPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 space-y-6 animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-40" />
          <div className="h-64 bg-gray-200 rounded-2xl" />
          <div className="grid grid-cols-2 gap-6">
            <div className="h-64 bg-gray-200 rounded-2xl" />
            <div className="h-64 bg-gray-200 rounded-2xl" />
          </div>
        </div>
      }
    >
      <AnalyticsContent />
    </Suspense>
  );
}
