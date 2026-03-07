"use client";

import { useEffect, useState, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuthToken";

interface DashboardHeaderProps {
  children?: ReactNode;
  className?: string;
}

export function DashboardHeader({
  children,
  className,
}: DashboardHeaderProps) {
  const { user } = useAuth();
  const [greeting, setGreeting] = useState("Welcome");
  const [dateStr, setDateStr] = useState("");
  const [mounted, setMounted] = useState(false);

  const displayName = user?.first_name || user?.username;

  useEffect(() => {
    setMounted(true);
    const now = new Date();
    const hour = now.getHours();

    if (hour < 12) setGreeting("Good morning");
    else if (hour < 17) setGreeting("Good afternoon");
    else setGreeting("Good evening");

    setDateStr(
      now.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
    );
  }, []);

  return (
    <div
      className={cn(
        "relative w-full overflow-hidden rounded-2xl border border-slate-200/20 bg-white/10 backdrop-blur-xl p-6 sm:p-8 shadow-sm transition-all dark:border-slate-800/80 dark:bg-slate-950/60",
        className,
      )}
    >
      {/* --- Subtle SaaS Background Accents --- */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Soft dual-tone radial glows */}
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/10 blur-[80px] dark:bg-primary/20" />
        <div className="absolute -bottom-32 left-1/4 h-64 w-64 rounded-full bg-secondary/5 blur-[80px] dark:bg-secondary/10" />

        {/* Minimalist Tech Dot Matrix fading out */}
        <svg
          className="absolute right-0 top-0 h-full w-2/3 opacity-[0.15] dark:opacity-[0.07]"
          style={{
            maskImage: "linear-gradient(to left, white, transparent)",
            WebkitMaskImage: "linear-gradient(to left, white, transparent)",
          }}
        >
          <defs>
            <pattern
              id="dashboard-dots"
              width="20"
              height="20"
              patternUnits="userSpaceOnUse"
            >
              <circle
                cx="2"
                cy="2"
                r="1"
                className="fill-slate-800 dark:fill-slate-200"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dashboard-dots)" />
        </svg>
      </div>

      {/* --- Content Layer --- */}
      <div className="relative z-10 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        
        {/* Greeting & Date */}
        <div className="space-y-1.5 min-h-[60px] flex flex-col justify-center">
          {mounted ? (
            <>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight animate-in fade-in slide-in-from-bottom-1 duration-500">
                {greeting}
                {displayName ? (
                  <>
                    <span className="text-slate-400 dark:text-slate-500">, </span>
                    <span className="text-primary/90 capitalize">{displayName}</span>
                  </>
                ) : (
                  ""
                )}
              </h1>

              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 animate-in fade-in slide-in-from-bottom-2 duration-700">
                {dateStr}
              </p>
            </>
          ) : (
            /* Professional Skeleton State */
            <div className="space-y-3 py-1">
              <div className="h-8 w-48 sm:w-64 animate-pulse rounded-md bg-slate-200 dark:bg-slate-800" />
              <div className="h-4 w-32 animate-pulse rounded-md bg-slate-100 dark:bg-slate-800/50" />
            </div>
          )}
        </div>

        {/* Action Buttons Area */}
        {children && (
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {children}
          </div>
        )}
      </div>
    </div>
  );
}