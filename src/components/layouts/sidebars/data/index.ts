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
} from 'lucide-react';

export const NAV_DATA = [
  {
    label: '  ',
    items: [
      {
        title: 'Dashboard',
        url: '/dashboard',
        icon: LayoutDashboard,
        items: [],
      },
    ],
  },
  {
    label: 'MENU & KITCHEN',
    items: [
      {
        title: 'Menu Items',
        url: '/menu',
        icon: Utensils,
        items: [],
      },
      {
        title: 'Recipes',
        url: '/recipes',
        icon: CookingPot,
        items: [],
      },
    ],
  },
  {
    label: 'INVENTORY & SUPPLY',
    items: [
      {
        title: 'Inventory',
        url: '/inventory',
        icon: Package,
        items: [],
      },
      {
        title: 'Purchases',
        url: '/purchases',
        icon: ClipboardList,
        items: [],
      },
      { title: 'Suppliers', url: '/suppliers', icon: Truck, items: [] },
    ],
  },
  {
    label: 'Business',
    items: [
      {
        title: 'Sales (POS)',
        url: '/sales',
        icon: Receipt,
        items: [],
      },
      {
        title: 'AI Forecasting',
        url: '/forecating',
        icon: Sparkles,
        items: [],
      },
      // {
      //   title: 'Staff & Users',
      //   icon: UserCog,
      //   items: [{ title: 'Employees', url: '/staff', items: [] }],
      // },

      // {
      //   title: 'Settings',
      //   url: '/settings',
      //   icon: Settings,
      //   items: [],
      // },
    ],
  },
];
