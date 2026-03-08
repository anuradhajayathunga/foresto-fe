import {
  Settings,
  Package,
  Receipt,
  ChefHat,
  Users,
  LayoutDashboard,
  ClipboardList,
  CookingPot,
  Truck,
  Utensils,
  Sparkles,
  Store,
  Tablet,
  ShoppingBag,
  ShoppingCart, 
} from "lucide-react";

interface NavItem {
  title: string;
  url: string;
}

interface NavSection {
  label: string;
  items: Array<{
    title: string;
    icon: React.ComponentType;
    items: NavItem[];
    url?: string;
  }>;
}

export const NAV_DATA: NavSection[] = [
  {
    label: "",//Overview
    items: [
      { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard, items: [] },
      { title: "Point of Sale", url: "/sales", icon: ShoppingCart, items: [] }, 
    ],
  },
  {
    label: "Operations",
    items: [
      { title: "Menus", url: "/menu", icon: Utensils, items: [] },
      { title: "Recipes", url: "/recipes", icon: CookingPot, items: [] },
      { title: "Kitchen Prep", url: "/kitchen", icon: ChefHat, items: [] },
    ],
  },
  {
    label: "Supply Chain",
    items: [
      { title: "Inventory", url: "/inventory", icon: Package, items: [] },
      { title: "Purchase Orders", url: "/purchases", icon: ClipboardList, items: [] },
      { title: "Suppliers", url: "/suppliers", icon: Truck, items: [] },
    ],
  },
  {
    label: "Analytics & Intelligence",
    items: [
      { title: "AI Forecast", url: "/forecasting", icon: Sparkles, items: [] },
    ],
  },
  {
    label: "Administration",
    items: [
      { title: "Team & Roles", url: "/team", icon: Users, items: [] },
      { title: "Settings", url: "/settings", icon: Settings, items: [] },
    ],
  },
];