import { ThemeToggle } from '@/components/ui/ThemeToggle';
import type { PropsWithChildren } from 'react';

export default function AuthLayout({ children }: PropsWithChildren) {
  return (
    <>
      <div>{children}</div>
              <ThemeToggle />
      
    </>
  );
}
