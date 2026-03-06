"use client";

import { useEffect, useState, ReactNode } from "react";
import { cn } from "@/lib/utils";
import Image from "next/image";

interface DashboardHeaderProps {
  userName?: string;
  children?: ReactNode;
  className?: string;
  illustration?: string;
  darkIllustration?: string;
  showIllustration?: boolean;
}

export function DashboardHeader({
  userName,
  children,
  className,
  illustration = "/images/illustration/Business Plan.svg",
  darkIllustration = "/images/illustration/Business Plan Dark.svg",
  showIllustration = true,
}: DashboardHeaderProps) {
  const [greeting, setGreeting] = useState("Welcome");
  const [dateStr, setDateStr] = useState("");
  const [mounted, setMounted] = useState(false);
  const [isDark, setIsDark] = useState(false);

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

    const checkDarkMode = () => {
      const isDarkMode = document.documentElement.classList.contains("dark");
      setIsDark(isDarkMode);
    };

    checkDarkMode();

    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleMediaChange = (e: MediaQueryListEvent) => {
      if (!document.documentElement.classList.contains("dark")) {
        setIsDark(e.matches);
      }
    };
    mediaQuery.addEventListener("change", handleMediaChange);

    return () => {
      observer.disconnect();
      mediaQuery.removeEventListener("change", handleMediaChange);
    };
  }, []);

  const currentIllustration = isDark ? darkIllustration : illustration;

  return (
    <div
      className={cn(
        "relative w-full overflow-hidden rounded-xl ring-1 ring-inset ring-slate-200/50 dark:ring-slate-800/50 shadow-sm",
        "bg-white dark:bg-slate-950",
        className,
      )}
    >
      {/* --- Background Layer --- */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800" />

      {/* Decorative Background Elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] -translate-y-1/2 bg-indigo-500/5 dark:bg-indigo-500/10 rounded-full blur-[80px]" />
        <svg
          className="absolute inset-0 w-full h-full opacity-[0.4] dark:opacity-[0.2]"
          style={{
            maskImage: "linear-gradient(to bottom, white, transparent)",
          }}
        >
          <defs>
            <pattern
              id="dot-pattern"
              width="16"
              height="16"
              patternUnits="userSpaceOnUse"
            >
              <circle
                cx="1.5"
                cy="1.5"
                r="1.5"
                className="fill-slate-300 dark:fill-slate-700"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dot-pattern)" />
        </svg>
      </div>

      {/* Floating Illustration */}
      {showIllustration && currentIllustration && (
        <div className="absolute bottom-0 right-0 z-0 w-full h-full max-w-[280px] sm:max-w-[350px] lg:max-w-[400px] opacity-40 sm:opacity-90 dark:sm:opacity-80 pointer-events-none transition-opacity duration-500">
          <Image
            src={currentIllustration}
            alt="Dashboard Illustration"
            fill
            className="object-contain object-bottom sm:object-right-bottom sm:translate-x-4 sm:translate-y-2"
            priority
            quality={90}
          />
        </div>
      )}

      {/* Content Layer */}
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-end justify-between gap-6 p-6 sm:p-8 min-h-[160px] sm:min-h-[200px]">
        {/* Greeting & Date */}
        <div className="space-y-2 max-w-xl">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-50 transition-opacity duration-500">
            {mounted ? (
              <>
                {greeting}
                {userName ? (
                  <span className="text-indigo-600 dark:text-indigo-400">
                    , {userName}
                  </span>
                ) : (
                  ""
                )}
              </>
            ) : (
              <span className="opacity-0">Loading...</span>
            )}
          </h1>

          <p className="text-sm sm:text-base font-medium text-slate-500 dark:text-slate-400">
            {mounted ? dateStr : ""}
          </p>
        </div>

        {/* Action Buttons Area */}
        {children && (
          <div className="flex flex-wrap items-center gap-3 shrink-0 mt-2 sm:mt-0">
            {children}
          </div>
        )}
      </div>
    </div>
  );
}
