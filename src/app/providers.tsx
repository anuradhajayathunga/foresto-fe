'use client';

import { SidebarProvider } from '@/components/layouts/sidebars/sidebar-context';
import { ToastProvider } from '@/components/toast/ToastProvider';
import { ThemeProvider } from 'next-themes';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider defaultTheme='light' attribute='class'>
      <ToastProvider>
        <SidebarProvider>{children}</SidebarProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
