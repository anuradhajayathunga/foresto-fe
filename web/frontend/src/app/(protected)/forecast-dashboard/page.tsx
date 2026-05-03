"use client";

import React, { useState, useEffect } from 'react';
import { authFetch } from "@/lib/auth";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  AreaChart,
  Area,
  Line,
  BarChart,
  Bar,
  Cell
} from 'recharts';
import {
  FiTrendingUp,
  FiBox,
  FiAlertTriangle,
  FiArrowUpRight,
  FiArrowDownRight,
  FiDownload,
  FiFilter,
  FiBell,
  FiShield,
  FiActivity
} from 'react-icons/fi';

export default function ForecastDashboard() {
  const [mounted, setMounted] = useState(false);
  const [forecastData, setForecastData] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({
    total_forecasted_demand: 0,
    predicted_stockouts: 0,
    inventory_level: 0,
    low_stock_items: 0
  });

  useEffect(() => {
    setMounted(true);

    // Fetch real data from backend
    authFetch("/api/forecasting/forecasts/")
      .then(res => res.json())
      .then(data => {
        const results = Array.isArray(data) ? data : (data?.results || []);
        if (results.length > 0) {
          // Format data for chart (group by date)
          const formatted = results.reduce((acc: any, curr: any) => {
            const dateObj = new Date(curr.date);
            const date = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            if (!acc[date]) {
              acc[date] = { day: date, historical: 0, forecasted: 0, arima: 0, randomForest: 0 };
            }
            acc[date].historical += curr.historical_value || 0;
            acc[date].forecasted += curr.forecasted_value || 0;
            acc[date].arima += curr.arima_value || 0;
            acc[date].randomForest += curr.random_forest_value || 0;
            return acc;
          }, {});
          setForecastData(Object.values(formatted));
        }
      });

    authFetch("/api/forecasting/alerts/")
      .then(res => res.json())
      .then(data => {
        const results = Array.isArray(data) ? data : (data?.results || []);
        if (results.length > 0) setAlerts(results.slice(0, 5));
      });

    authFetch("/api/forecasting/forecasts/dashboard_stats/")
      .then(res => res.json())
      .then(data => {
        if (data) setStats(data);
      });
  }, []);

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-background text-foreground p-8 space-y-10 font-sans">
      {/* Header Section */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-3 rounded-2xl ring-4 ring-primary/5">
              <FiTrendingUp className="text-primary text-2xl" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">AI Demand Forecast</h1>
          </div>
          <p className="text-muted-foreground text-sm ml-14">Predictive analytics for smart supply chain management</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-2xl shadow-sm">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-xs font-bold text-muted-foreground">SYSTEM LIVE</span>
          </div>
          <button className="p-3 bg-card border border-border rounded-2xl hover:bg-muted transition-all relative">
            <FiBell className="text-muted-foreground" />
            {alerts.length > 0 && <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-primary rounded-full"></span>}
          </button>
        </div>
      </header>

      {/* KPI Summary Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Forecasted Demand"
          value={`${Math.round(stats.total_forecasted_demand)} units`}
          icon={<FiActivity className="text-primary" />}
          subtitle="Next 7 Days"
        />
        <KPICard
          title="Inventory Level"
          value={`${Math.round(stats.inventory_level)} units`}
          icon={<FiBox className="text-blue-500" />}
          subtitle={stats.inventory_level > 0 ? "Status: Active" : "Status: Empty"}
        />
        <KPICard
          title="Low Stock Items"
          value={`${stats.low_stock_items} items`}
          icon={<FiAlertTriangle className="text-amber-500" />}
          subtitle={stats.low_stock_items > 0 ? "Action Required" : "All Levels Healthy"}
        />
        <KPICard
          title="Predicted Stockouts"
          value={stats.predicted_stockouts}
          icon={<FiShield className="text-red-500" />}
          subtitle="Within 72 Hours"
        />
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Demand Forecast Visualization */}
        <div className="xl:col-span-2 bg-card p-8 rounded-3xl border border-border shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-xl font-bold tracking-tight">Demand Forecast Trends</h2>
              <p className="text-muted-foreground text-sm">Historical vs Ensemble Forecast Models</p>
            </div>
            <div className="flex gap-2">
              <button className="flex items-center gap-2 px-4 py-2 bg-muted rounded-xl text-xs font-bold hover:bg-border transition-all">
                <FiFilter /> Filter
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-xs font-bold hover:opacity-90 transition-all shadow-lg shadow-primary/20">
                <FiDownload /> Export
              </button>
            </div>
          </div>

          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={forecastData}>
                <defs>
                  <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis
                  dataKey="day"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderRadius: '16px' }}
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                <Area
                  type="monotone"
                  dataKey="historical"
                  stroke="var(--blue-DEFAULT)"
                  strokeWidth={3}
                  fill="transparent"
                  name="Historical"
                />
                <Area
                  type="monotone"
                  dataKey="forecasted"
                  stroke="var(--primary)"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorForecast)"
                  name="AI Forecast"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Risk Alerts Panel */}
        <div className="bg-card p-8 rounded-3xl border border-border shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-bold tracking-tight">Risk Alerts</h2>
            <span className="bg-primary/10 text-primary text-[10px] px-2 py-1 rounded-lg font-black tracking-widest uppercase">{alerts.length} ACTIVE</span>
          </div>

          <div className="space-y-4 flex-1 overflow-y-auto pr-2 custom-scrollbar">
            {alerts.length > 0 ? alerts.map((alert: any) => (
              <AlertItem
                key={alert.id}
                type={alert.type}
                message={alert.message}
                time={new Date(alert.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                severity={alert.severity}
              />
            )) : (
              <p className="text-center text-muted-foreground text-sm py-10">No active alerts</p>
            )}
          </div>

          <button className="mt-8 w-full py-3 bg-muted rounded-2xl text-xs font-bold hover:bg-border transition-all flex items-center justify-center gap-2">
            See All Notifications
          </button>
        </div>
      </div>
    </div>
  );
}

function KPICard({ title, value, icon, subtitle }: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  subtitle: string;
}) {
  return (
    <div className="bg-card p-6 rounded-3xl border border-border shadow-sm hover:translate-y-[-4px] transition-all duration-300">
      <div className="flex items-center justify-between mb-4">
        <div className="bg-muted p-3 rounded-2xl">{icon}</div>
      </div>
      <div className="space-y-1">
        <h3 className="text-muted-foreground text-[10px] font-black uppercase tracking-widest">{title}</h3>
        <p className="text-2xl font-bold tracking-tight">{value}</p>
        <p className="text-[10px] text-slate-400 font-medium">{subtitle}</p>
      </div>
    </div>
  );
}

function AlertItem({ type, message, time, severity }: any) {
  const getColors = () => {
    switch (severity) {
      case 'critical': return 'bg-red-500/5 border-red-500/10 text-red-500';
      case 'warning': return 'bg-primary/5 border-primary/10 text-primary';
      default: return 'bg-blue-500/5 border-blue-500/10 text-blue-500';
    }
  };

  return (
    <div className={`p-4 rounded-2xl border ${getColors()} space-y-2`}>
      <div className="flex justify-between items-center">
        <span className="text-[10px] font-black uppercase tracking-widest">{type}</span>
        <span className="text-[10px] opacity-60 font-bold">{time}</span>
      </div>
      <p className="text-sm font-semibold text-foreground/90 leading-snug">{message}</p>
    </div>
  );
}
