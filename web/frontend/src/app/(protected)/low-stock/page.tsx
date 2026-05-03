"use client";

import React, { useState, useEffect } from "react";
import { authFetch } from "@/lib/auth";
import {
  FiAlertCircle,
  FiAlertTriangle,
  FiTrendingUp,
  FiArrowDown,
  FiClock,
  FiCheckCircle,
  FiBell,
  FiX,
} from "react-icons/fi";

interface Alert {
  id: number;
  type: string;
  message: string;
  severity: "info" | "warning" | "critical";
  is_read: boolean;
  created_at: string;
}

export default function Alerts() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const todayStr = new Date().toDateString();

  useEffect(() => {
    authFetch("/api/forecasting/alerts/")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch alerts");
        return res.json();
      })
      .then((data) => {
        const results: Alert[] = Array.isArray(data)
          ? data
          : data?.results || [];
        setAlerts(results);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const markAllRead = () => {
    authFetch("/api/forecasting/alerts/mark_all_read/", { method: "POST" })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to mark as read");
        return res.json();
      })
      .then(() => setAlerts((prev) => prev.map((a) => ({ ...a, is_read: true }))))
      .catch((err) => setError(err.message));
  };

  const dismissAlert = (id: number) => {
    authFetch(`/api/forecasting/alerts/${id}/dismiss/`, { method: "POST" })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to dismiss");
        return res.json();
      })
      .then(() => setAlerts((prev) => prev.filter((a) => a.id !== id)))
      .catch((err) => setError(err.message));
  };

  const resolveAlert = (id: number) => {
    authFetch(`/api/forecasting/alerts/${id}/resolve/`, { method: "POST" })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to resolve");
        return res.json();
      })
      .then(() =>
        setAlerts((prev) =>
          prev.map((a) => (a.id === id ? { ...a, is_read: true } : a))
        )
      )
      .catch((err) => setError(err.message));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-8 text-center text-muted-foreground font-bold">
        Loading Alerts...
      </div>
    );
  }

  const criticalCount = alerts.filter(
    (a) => a.severity === "critical" && !a.is_read
  ).length;
  const warningCount = alerts.filter(
    (a) => a.severity === "warning" && !a.is_read
  ).length;
  const todayCount = alerts.filter(
    (a) => new Date(a.created_at).toDateString() === todayStr
  ).length;

  return (
    <div className="min-h-screen bg-background text-foreground p-8 space-y-10 font-sans">
      <header className="flex justify-between items-center">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">
            Alerts & Notifications
          </h1>
          <p className="text-muted-foreground text-sm">
            Stay informed about critical supply chain events and inventory risks.
          </p>
        </div>
        <button
          onClick={markAllRead}
          className="text-sm font-bold text-primary hover:underline"
        >
          Mark all as read
        </button>
      </header>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-500 px-4 py-3 rounded-2xl text-sm font-medium">
          {error}
        </div>
      )}

      {/* Alert Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatSmall
          title="Critical Risks"
          value={criticalCount}
          color="text-red-500"
          icon={<FiAlertCircle />}
        />
        <StatSmall
          title="Warnings"
          value={warningCount}
          color="text-primary"
          icon={<FiAlertTriangle />}
        />
        <StatSmall
          title="Total Alerts Today"
          value={todayCount}
          color="text-blue-500"
          icon={<FiBell />}
        />
      </div>

      {/* Alerts List */}
      <div className="bg-card rounded-3xl border border-border overflow-hidden shadow-sm">
        <div className="p-6 border-b border-border bg-muted/30">
          <h2 className="font-bold tracking-tight">Recent Alerts History</h2>
        </div>

        <div className="divide-y divide-border">
          {alerts.length > 0 ? (
            alerts.map((alert) => (
              <div
                key={alert.id}
                className={`p-6 flex items-start gap-6 transition-all hover:bg-muted/50 group ${!alert.is_read ? "bg-primary/[0.02]" : ""
                  }`}
              >
                <div
                  className={`p-4 rounded-2xl ${alert.severity === "critical"
                      ? "bg-red-500/10 text-red-500"
                      : alert.severity === "warning"
                        ? "bg-primary/10 text-primary"
                        : "bg-blue-500/10 text-blue-500"
                    }`}
                >
                  {alert.type === "spike" ? (
                    <FiTrendingUp />
                  ) : alert.type === "drop" ? (
                    <FiArrowDown />
                  ) : (
                    <FiAlertCircle />
                  )}
                </div>

                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-foreground group-hover:text-primary transition-colors uppercase tracking-tight">
                      {alert.type}
                    </span>
                    {!alert.is_read && (
                      <span className="w-2 h-2 bg-primary rounded-full" />
                    )}
                  </div>
                  <p className="text-muted-foreground text-sm leading-relaxed font-medium">
                    {alert.message}
                  </p>
                  <div className="flex items-center gap-4 pt-2 text-[10px] text-slate-400 font-black uppercase tracking-widest">
                    <span className="flex items-center gap-1">
                      <FiClock />
                      {new Date(alert.created_at).toLocaleString()}
                    </span>
                    <button
                      onClick={() => dismissAlert(alert.id)}
                      className="flex items-center gap-1 cursor-pointer hover:text-red-400 transition-colors"
                    >
                      <FiX /> Dismiss
                    </button>
                    <button
                      onClick={() => resolveAlert(alert.id)}
                      className="flex items-center gap-1 cursor-pointer hover:text-primary transition-colors"
                    >
                      <FiCheckCircle /> Resolve
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-20 text-center text-muted-foreground">
              No alerts found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatSmall({
  title,
  value,
  color,
  icon,
}: {
  title: string;
  value: number;
  color: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="bg-card p-6 rounded-3xl border border-border flex items-center justify-between shadow-sm">
      <div>
        <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-black mb-1">
          {title}
        </p>
        <p className={`text-3xl font-black ${color}`}>{value}</p>
      </div>
      <div className={`text-3xl opacity-20 ${color}`}>{icon}</div>
    </div>
  );
}