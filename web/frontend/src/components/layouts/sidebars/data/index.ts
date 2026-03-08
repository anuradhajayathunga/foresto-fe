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
  LineChart,     // ✅ new icon for Ingredient Tools group
  Calculator,    // ✅ new icon for Menu Calculator
  Database,      // ✅ new icon for Supplier Data
  Star,          // ✅ new icon for Recommend Suppliers
} from "lucide-react";

// Each sub-item in a collapsible group
interface NavItem {
  title: string;
  url: string;
}

// Each section in the sidebar
interface NavSection {
  label: string; // Section name (e.g. "Operations")
  items: Array<{
    title: string; // Item name (e.g. "Menus")
    icon: React.ComponentType; // Icon component
    items: NavItem[]; // Sub-items (if collapsible)
    url?: string; // Direct link (if not collapsible)
  }>;
}

// Main sidebar data array
export const NAV_DATA: NavSection[] = [
  {
    label: "", // Overview section (no label shown)
    items: [
      { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard, items: [] }, // direct link
      { title: "Point of Sale", url: "/sales", icon: ShoppingCart, items: [] },    // direct link
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
      { title: "AI Forecast", url: "/forecasting", icon: Sparkles, items: [] }, // direct link

      // New collapsible group
      {
        title: "Ingredient Tools",
        icon: LineChart, // group icon
        items: [
          { title: "Ingredient Price Predictor", url: "/ingredient-predict" },
          { title: "Menu Price Calculator", url: "/menu-calc" },               
          { title: "Supplier Data", url: "/supplier-data" },                   
          { title: "Recommend Suppliers", url: "/supplier-recommendation" }    
       ],
      },
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
