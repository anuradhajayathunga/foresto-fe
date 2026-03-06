'use client';

import { useEffect, useState } from 'react';

export function DashboardHeader() {
  const [greeting, setGreeting] = useState('Dashboard');
  const [dateStr, setDateStr] = useState('');

  useEffect(() => {
    const now = new Date();
    const hour = now.getHours();
    setGreeting(
      hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening',
    );
    setDateStr(
      now.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
    );
  }, []);

  return (
    <div>
      <h1 className='text-2xl font-bold text-dark dark:text-white'>{greeting}</h1>
      {dateStr && <p className='mt-0.5 text-sm text-muted-foreground'>{dateStr}</p>}
    </div>
  );
}
