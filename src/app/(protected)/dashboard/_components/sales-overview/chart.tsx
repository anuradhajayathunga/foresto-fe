"use client";

import { useIsMobile } from "@/hooks/use-mobile";
import type { ApexOptions } from "apexcharts";
import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

// Lazy load chart to avoid window is not defined errors
const Chart = dynamic(() => import("react-apexcharts"), { 
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-muted/5 rounded-lg">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  )
});

type Props = {
  loading?: boolean;
  data: {
    revenue: { x: string; y: number }[];
    avgOrder: { x: string; y: number }[];
  };
};

export function SalesOverviewChart({ data, loading }: Props) {
  const isMobile = useIsMobile();

  // THEME COLORS (Matched to your global.css)
  // [0] Primary: Orange-500 (#f97316) - Represents your main KPI (Revenue)
  // [1] Secondary: Slate-500 (#64748b) - Represents secondary context (Avg Order)
  const colors = ["#f97316", "#64748b"]; 

  const options: ApexOptions = {
    chart: {
      type: "area",
      fontFamily: "var(--font-sans, inherit)",
      toolbar: { show: false },
      zoom: { enabled: false },
      animations: { 
        enabled: true, 
        speed: 800 
      },
    },
    colors: colors,
    fill: {
      type: "gradient",
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.45, // Slightly higher opacity for Orange to make it pop
        opacityTo: 0.05,
        stops: [0, 100],
      },
    },
    dataLabels: { enabled: false },
    stroke: {
      curve: "smooth",
      width: 2,
      dashArray: [0, 4], // Solid line for Revenue, Dashed for Avg Order
    },
    grid: {
      borderColor: "rgba(0,0,0,0.05)", // Very subtle grid
      strokeDashArray: 4,
      xaxis: { lines: { show: false } },
      yaxis: { lines: { show: true } },
      padding: { top: 0, right: 0, bottom: 0, left: 10 },
    },
    xaxis: {
      type: "category",
      axisBorder: { show: false },
      axisTicks: { show: false },
      tooltip: { enabled: false },
      labels: {
        style: { colors: "#6b7280", fontSize: "12px" }, // Matches your --muted-foreground
        offsetY: 5,
      },
    },
    yaxis: [
      {
        // Revenue Axis
        labels: {
          style: { colors: "#6b7280", fontSize: "11px", fontFamily: "monospace" },
          formatter: (v) => {
            if (v >= 1000) return `${(v / 1000).toFixed(1)}k`;
            return `${v}`;
          },
        },
      },
      {
        // Avg Order Axis (Hidden)
        show: false, 
      }
    ],
    legend: { show: false },
    tooltip: {
      theme: "light", // ApexCharts doesn't auto-detect Tailwind dark mode well, usually easier to force light or custom
      shared: true,
      intersect: false,
      followCursor: true,
      custom: function ({ series, seriesIndex, dataPointIndex, w }) {
        const date = w.globals.labels[dataPointIndex];
        const revenue = series[0][dataPointIndex];
        const avg = series[1][dataPointIndex];

        // Using your global CSS variables for the tooltip styling via Tailwind classes
        return `
          <div class="px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded shadow-xl text-xs">
            <div class="font-semibold text-gray-900 dark:text-gray-100 mb-2 pb-1 border-b border-gray-100 dark:border-gray-800">${date}</div>
            
            <div class="flex items-center justify-between gap-4 mb-1">
              <span class="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
                <span class="block w-2 h-2 rounded-full" style="background-color: ${colors[0]}"></span>
                Revenue
              </span>
              <span class="font-mono font-medium text-gray-900 dark:text-gray-50">Rs. ${revenue?.toLocaleString() || 0}</span>
            </div>

            <div class="flex items-center justify-between gap-4">
              <span class="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
                <span class="block w-2 h-2 rounded-full" style="background-color: ${colors[1]}"></span>
                Avg Order
              </span>
              <span class="font-mono font-medium text-gray-900 dark:text-gray-50">Rs. ${Math.round(avg || 0).toLocaleString()}</span>
            </div>
          </div>
        `;
      },
    },
  };

  if (loading) {
    return (
      <div className="flex h-[310px] w-full items-center justify-center bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-dashed border-gray-200 dark:border-gray-800">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="w-full h-full relative" style={{ minHeight: 310 }}>
      <Chart
        options={options}
        series={[
          { name: "Revenue", data: data.revenue },
          { name: "Avg Order Value", data: data.avgOrder },
        ]}
        type="area"
        height="100%"
        width="100%"
      />
    </div>
  );
}