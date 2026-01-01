import type { PropsWithChildren } from 'react';
import { Sidebar } from '@/components/layouts/sidebars';
import { Header } from '@/components/layouts/headers';

export default function AdminLayout({ children }: PropsWithChildren) {
  return (
    // 1. Viewport Container: 
    // - h-screen: Forces the app to fill the window exactly.
    // - overflow-hidden: Prevents the "bounce" scroll on the whole body.
    // - bg-muted/10: Adds a very subtle tint to the background for depth.
    <div className="flex h-screen w-full overflow-hidden bg-muted/10 dark:bg-background">
      
      {/* 2. Sidebar Area */}
      {/* Assuming your Sidebar component handles its own responsive width/collapsing */}
      <aside className="hidden md:flex flex-col z-20 border-r bg-background">
        <Sidebar />
      </aside>

      {/* 3. Main Content Wrapper */}
      <div className="flex flex-col flex-1 h-full min-w-0 overflow-hidden">
        
        {/* 4. Header Area */}
        {/* Sticky top ensures it stays visible or sits nicely above scroll area */}
        <header className="flex-none z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
           <Header />
        </header>

        {/* 5. Scrollable Content Area */}
        {/* This is the only part of the page that scrolls */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden scroll-smooth">
          
          {/* 6. Content Constraint */}
          {/* Replaces max-w-11/12 with a standard large monitor width constraints */}
          <div className="mx-auto w-full max-w-[1600px] p-4 md:p-6 lg:p-8 animate-in fade-in duration-500">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}