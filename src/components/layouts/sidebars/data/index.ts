
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
} from 'lucide-react';

export const NAV_DATA = [
  {
    label: 'Overview',
    items: [
      {
        title: 'Dashboard',
        url: '/dashboard',
        icon: LayoutDashboard,
        items: [],
      },
      {
        title: 'Sales (POS)',
        url: '/sales',
        icon: Receipt,
        items: [],
      },
    ],
  },
  {
    label: 'Management',
    items: [
      {
        title: 'Menu Items',
        url: '/menu',
        icon: UtensilsCrossed,
        items: [],
      },
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
      {
        title: 'Kitchen',
        url: '/recipes',
        icon: CookingPot,
        items: [],
      },
    ]
  },
  {
    label: 'Business',
    items: [
      {
        title: 'Staff & Users',
        icon: UserCog,
        items: [
          { title: 'Employees', url: '/staff', items: [] },
          { title: 'Suppliers', url: '/suppliers', items: [] },
        ],
      },
      {
        title: 'Analytics',
        url: '/analytics',
        icon: BarChart3,
        items: [],
      },
      {
        title: 'Settings',
        url: '/settings',
        icon: Settings,
        items: [],
      },
    ],
  },
];