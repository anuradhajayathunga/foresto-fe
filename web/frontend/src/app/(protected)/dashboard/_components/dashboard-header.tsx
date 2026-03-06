"use client";

import { useEffect, useState, ReactNode } from "react";
import { cn } from "@/lib/utils";
import Image from "next/image";

interface DashboardHeaderProps {
  userName?: string;
  children?: ReactNode;
  className?: string;
  showBackground?: boolean;
  coverImage?: string;
  coverImageDark?: string;
  illustration?: string;
  showIllustration?: boolean;
}

export function DashboardHeader({
  userName,
  children,
  className,
  showBackground = true,
  coverImage = "",
  coverImageDark = "/images/cover/cover-06.png",
  illustration = "/images/illustration/illustration-03.svg",
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

  const hasImage = showBackground && coverImage;
  const currentCoverImage = isDark ? coverImageDark : coverImage;

  return (
    <div
      className={cn(
        "relative w-full overflow-hidden rounded-xl ring-1 ring-inset ring-slate-200/50 dark:ring-slate-800/50 shadow-sm",
        hasImage
          ? "min-h-[160px] sm:min-h-[180px]"
          : "bg-white dark:bg-slate-950",
        className,
      )}
    >
      {/* --- Background Layer --- */}
      {hasImage ? (
        <div className="absolute inset-0 pointer-events-none">
          <Image
            src={currentCoverImage}
            alt="Dashboard Cover"
            fill
            className="object-cover opacity-80 transition-opacity duration-500"
            priority
            quality={85}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-900/40 to-transparent dark:from-slate-950 dark:via-slate-950/60" />
        </div>
      ) : (
        <div className="absolute inset-0 pointer-events-none">
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
      )}
      <div
        className={cn(
          "relative z-10 flex flex-col sm:flex-row sm:items-end justify-between gap-4",
          hasImage
            ? "absolute bottom-0 left-0 w-full p-6 sm:p-8"
            : "p-6 sm:p-8",
        )}
      >
        <div className="flex items-end gap-4 sm:gap-6">
          {/* Illustration on the Left */}
          {showIllustration && illustration && (
            <div className="hidden sm:block flex-shrink-0 opacity-80 dark:opacity-70">
              <Image
                src={illustration}
                alt="Dashboard Illustration"
                width={120}
                height={120}
                className="w-28 h-28 object-contain"
                priority
              />
            </div>
          )}

          {/* Text Content */}
          <div className="space-y-1.5">
            <h1
              className={cn(
                "text-2xl sm:text-3xl font-bold tracking-tight transition-opacity duration-500",
                hasImage ? "text-white" : "text-slate-900 dark:text-slate-50",
              )}
            >
              {mounted ? (
                <>
                  {greeting}
                  {userName ? `, ${userName}` : ""}
                </>
              ) : (
                <span className="opacity-0">Loading...</span>
              )}
            </h1>

            <p
              className={cn(
                "text-sm font-medium h-5",
                hasImage
                  ? "text-slate-300"
                  : "text-slate-500 dark:text-slate-400",
              )}
            >
              {mounted ? dateStr : ""}
            </p>
          </div>
        </div>

        {/* Action Toolbar Area */}
        {children && (
          <div className="flex items-center gap-3 shrink-0 mt-2 sm:mt-0">
            {children}
          </div>
        )}
      </div>
    </div>
  );
}
