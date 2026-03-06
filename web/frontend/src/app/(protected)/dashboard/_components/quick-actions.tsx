'use client';

import Link from 'next/link';
import { ShoppingCart, ChefHat, Package, Boxes } from 'lucide-react';

const QUICK_ACTIONS = [
  {
    title: 'New Sale',
    description: 'Record a transaction',
    href: '/sales/new',
    icon: <ShoppingCart className='h-6 w-6' />,
  },
  {
    title: 'Plan Production',
    description: 'Schedule kitchen prep',
    href: '/kitchen',
    icon: <ChefHat className='h-6 w-6' />,
  },
  {
    title: 'Check Inventory',
    description: 'View stock levels',
    href: '/inventory',
    icon: <Package className='h-6 w-6' />,
  },
  {
    title: 'Purchase Requests',
    description: 'Manage supplier orders',
    href: '/kitchen/requests',
    icon: <Boxes className='h-6 w-6' />,
  },
];

export function QuickActionsRow() {
  return (
    <div>
      <h2 className='mb-4 text-sm font-semibold tracking-wide text-muted-foreground'>
        QUICK ACTIONS
      </h2>
      <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4'>
        {QUICK_ACTIONS.map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className='group flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-5 transition-all duration-300 hover:border-primary/50 hover:shadow-md hover:shadow-primary/10 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-primary/40'
          >
            <div className='flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors duration-300 group-hover:bg-primary/20'>
              {action.icon}
            </div>
            <div>
              <p className='text-sm font-semibold text-dark dark:text-white'>
                {action.title}
              </p>
              <p className='mt-1 text-xs text-muted-foreground'>
                {action.description}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
