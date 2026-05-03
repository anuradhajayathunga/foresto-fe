"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import logo from "@/assets/logo/logo-v1.svg";
import {
  FiHome,
  FiBox,
  FiAlertCircle,
  FiRefreshCcw,
  FiTrendingUp,
  FiDatabase,
  FiFileText,
  FiSettings,
  FiTruck
} from "react-icons/fi";

export default function Sidebar() {
  const pathname = usePathname();

  const menuItems = [
    { name: "Dashboard Overview", icon: <FiHome />, path: "/dashboard" },
    { name: "Demand Forecasting", icon: <FiTrendingUp />, path: "/forecast-dashboard" },
    { name: "Inventory Management", icon: <FiBox />, path: "/inventory" },
    { name: "Reorder Recommendations", icon: <FiRefreshCcw />, path: "/reorder" },
    { name: "Alerts & Notifications", icon: <FiAlertCircle />, path: "/low-stock" },
    { name: "Data Management", icon: <FiDatabase />, path: "/data-management" },
    { name: "Reports & Export", icon: <FiFileText />, path: "/reports" },
    { name: "User Settings", icon: <FiSettings />, path: "/settings" },
    { name: "Supplier Hub", icon: <FiTruck />, path: "/supplier-dashboard" },
  ];

  return (
    <aside className="w-72 bg-restaurant-sidebar border-r border-white/5 min-h-screen p-8 flex flex-col shadow-2xl relative overflow-hidden">
      {/* Glow effect matching login page */}
      <div className="absolute -top-24 -left-28 h-64 w-64 rounded-full blur-3xl bg-[color:var(--restaurant-primary)]/10 pointer-events-none" />

      {/* Logo Section matching Login Page */}
      <div className="flex items-center gap-3 mb-12 relative z-10">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 backdrop-blur border border-white/15">
          <Image
            src={logo}
            alt="Foresto"
            width="40"
            height="40"
            className="p-[10%]"
            priority
          />
        </div>
        <div className="leading-tight">
          <div className="text-2xl font-bold tracking-tight text-white leading-none">
            foresto
            <span className="text-[color:var(--restaurant-primary)]">.</span>
          </div>
          <div className="text-[10px] text-white/50 font-medium uppercase tracking-widest mt-1">
            Supplier Suite
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto custom-scrollbar relative z-10">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const isActive = pathname === item.path;
            return (
              <li key={item.name}>
                <Link
                  href={item.path}
                  className={`flex items-center gap-4 p-4 rounded-2xl text-sm font-semibold transition-all duration-300
                  ${
                    isActive
                      ? "bg-[color:var(--restaurant-primary)] text-white shadow-lg shadow-[color:var(--restaurant-primary)]/20"
                      : "text-white/60 hover:bg-white/5 hover:text-white"
                  }
                  `}
                >
                  <span className="text-xl">
                    {item.icon}
                  </span>
                  <span>
                    {item.name}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer matching Login Page style */}
      <div className="mt-8 pt-6 border-t border-white/10 text-white/40 text-xs font-medium relative z-10">
        <p>© {new Date().getFullYear()} Restaurant Admin</p>
        <p className="mt-1 text-[10px] opacity-60 uppercase tracking-widest">Protocol v2.5.1</p>
      </div>
    </aside>
  );
}