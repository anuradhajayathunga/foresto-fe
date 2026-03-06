import Link from 'next/link';
import type { ReactNode } from 'react';

export type QuickActionItem = {
  title: string;
  description: string;
  href: string;
  icon: ReactNode;
};

type Props = { actions: QuickActionItem[] };

export function QuickActionsSection({ actions }: Props) {
  return (
    <div>
      <h2 className='mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground'>
        Quick Actions
      </h2>
      <div className='grid grid-cols-2 gap-3 sm:grid-cols-4'>
        {actions.map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className='flex flex-col gap-2 rounded-[10px] bg-white p-4 shadow-1 transition-shadow hover:shadow-md dark:bg-gray-dark dark:shadow-card'
          >
            <div className='flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary'>
              {action.icon}
            </div>
            <div>
              <p className='text-sm font-medium text-dark dark:text-white'>{action.title}</p>
              <p className='text-xs text-muted-foreground'>{action.description}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
