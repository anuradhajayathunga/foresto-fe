import type { PropsWithChildren } from 'react';
import { Sidebar } from '@/components/layouts/sidebars';
import { Header } from '@/components/layouts/headers';
import RootLoading from '../loading';

export default function AdminLayout({ children }: PropsWithChildren) {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-muted/10 dark:bg-background">
      <aside className="hidden md:flex flex-col z-20 border-r bg-background">
        <Sidebar />
      </aside>
      <div className="flex flex-col flex-1 h-full min-w-0 overflow-hidden">
        <header className="flex-none z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <Header />
        </header>

        <main className="flex-1 overflow-y-auto overflow-x-hidden scroll-smooth">
          <div className="mx-auto w-full max-w-[1600px] p-4 md:p-6 lg:p-8 animate-in fade-in duration-500">
            <RootLoading />
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
