import { ThemeToggle } from '@/components/ui/ThemeToggle';
import type { PropsWithChildren } from 'react';

export default function AuthLayout({ children }: PropsWithChildren) {
  return (
    <div className='min-h-screen bg-background text-foreground'>
      <div className='min-h-screen'>{children}</div>
      <ThemeToggle />
    </div>
  );
}
