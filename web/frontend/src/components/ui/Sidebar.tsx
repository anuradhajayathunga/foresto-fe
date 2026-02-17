"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, ClipboardList, CookingPot, Package, Utensils } from "lucide-react";
import clsx from "clsx";

const items = [
  { href: "/", label: "Dashboard", icon: BarChart3 },
  { href: "/orders", label: "Orders (POS)", icon: ClipboardList },
  { href: "/menu", label: "Menu", icon: Utensils },
  { href: "/inventory", label: "Inventory", icon: Package },
  { href: "/recipes", label: "Recipes", icon: CookingPot },
];

export default function Sidebar() {
  const path = usePathname();
  return (
    <aside className="card p-4">
      <div className="mb-4">
        <div className="text-sm font-semibold">SmartRestaurant AI</div>
        <div className="text-xs text-slate-500">Next.js Dashboard</div>
      </div>
      <nav className="space-y-1">
        {items.map((it) => {
          const Icon = it.icon;
          const active = it.href === "/" ? path === "/" : path.startsWith(it.href);
          return (
            <Link key={it.href} href={it.href}
              className={clsx("flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition",
                active ? "bg-slate-900 text-white" : "hover:bg-slate-50 text-slate-700")}>
              <Icon size={16} /> {it.label}
            </Link>
          );
        })}
      </nav>
      <div className="mt-6 text-xs text-slate-500">Tip: Add menu + ingredients + recipes, then orders and forecasts.</div>
    </aside>
  );
}
