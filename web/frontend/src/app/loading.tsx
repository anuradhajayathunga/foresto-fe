'use client';
import { useEffect, useState } from 'react';

export default function RootLoading() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 4000); 
    return () => clearTimeout(t);
  }, []);

  if (!loading) return null;
  return (
    <div className='fixed inset-0 z-[9999] grid place-items-center bg-background/70 backdrop-blur-sm'>
      <div
        role='status'
        aria-live='polite'
        aria-busy='true'
        className='flex flex-col items-center gap-3'
      >
        {/* Simple spinner */}
        <div className='h-10 w-10 animate-spin rounded-full border-2 border-border border-t-primary' />

        {/* Simple dot animation */}
        <div className='flex items-center gap-1.5'>
          <span className='h-1.5 w-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.2s]' />
          <span className='h-1.5 w-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.1s]' />
          <span className='h-1.5 w-1.5 rounded-full bg-primary animate-bounce' />
        </div>

        <p className='text-sm font-medium text-muted-foreground'>Loading</p>
      </div>
    </div>
  );
}
