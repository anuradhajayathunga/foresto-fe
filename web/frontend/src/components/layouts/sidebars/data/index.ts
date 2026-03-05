import {
  Home,
  UtensilsCrossed,
  ShoppingCart,
  Users,
  BarChart3,
  Settings,
  Package,
  Receipt,
  ChefHat,
  Shield,
  UserCog,
  LayoutDashboard,
  ClipboardList,
  CookingPot,
  icons,
  Truck,
  Utensils,
  Sparkle,
  Sparkles,
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
    label: "MAIN",
    items: [
      {
        title: "Dashboard",
        url: "/dashboard",
        icon: LayoutDashboard,
        items: [],
      },
      { title: "POS", url: "/sales", icon: Receipt, items: [] },
    ],
  },
  {
    label: "RESTAURANT",
    items: [
      { title: "Menu", url: "/menu", icon: Utensils, items: [] },
      { title: "Kitchen", url: "/kitchen", icon: ChefHat, items: [] },
      { title: "Recipes", url: "/recipes", icon: CookingPot, items: [] },
      { title: "Inventory", url: "/inventory", icon: Package, items: [] },
    ],
  },
  {
    label: "PROCUREMENT",
    items: [
      { title: "Purchases", url: "/purchases", icon: ClipboardList, items: [] },
      { title: "Suppliers", url: "/suppliers", icon: Truck, items: [] },
    ],
  },
  {
    label: "INSIGHTS",
    items: [
      {
        title: "AI Forecasting",
        url: "/forecasting",
        icon: Sparkles,
        items: [],
      },
    ],
  },
  {
    label: "SETTINGS",
    items: [
      { title: "Staff & Users", url: "/team", icon: Users, items: [] },
      { title: "Settings", url: "/settings", icon: Settings, items: [] },
    ],
  },
];
