'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const DAYS_OF_WEEK = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

export function DashboardCalendar() {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth);

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const isToday = (day: number) =>
    day === today.getDate() &&
    viewMonth === today.getMonth() &&
    viewYear === today.getFullYear();

  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  // Pad to full rows of 7
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <Card className='rounded-xl'>
      <div className='px-6 pb-6 pt-5'>
        {/* Header */}
        <div className='mb-4 flex items-center justify-between'>
          <div className='flex items-center gap-2'>
            <CalendarDays className='h-4 w-4 text-primary' />
            <h2 className='text-sm font-semibold text-dark dark:text-white'>
              Calendar
            </h2>
          </div>
          <div className='flex items-center gap-1'>
            <button
              onClick={prevMonth}
              aria-label='Previous month'
              className='flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground'
            >
              <ChevronLeft className='h-4 w-4' />
            </button>
            <span className='min-w-[110px] text-center text-xs font-semibold text-dark dark:text-white'>
              {MONTHS[viewMonth]} {viewYear}
            </span>
            <button
              onClick={nextMonth}
              aria-label='Next month'
              className='flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground'
            >
              <ChevronRight className='h-4 w-4' />
            </button>
          </div>
        </div>

        {/* Day labels */}
        <div className='mb-1 grid grid-cols-7 text-center'>
          {DAYS_OF_WEEK.map((d) => (
            <div
              key={d}
              className='py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground'
            >
              {d}
            </div>
          ))}
        </div>

        {/* Date grid */}
        <div className='grid grid-cols-7 gap-y-1 text-center'>
          {cells.map((day, idx) => (
            <div key={idx} className='flex items-center justify-center py-0.5'>
              {day !== null ? (
                <span
                  className={cn(
                    'flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium transition-colors',
                    isToday(day)
                      ? 'bg-primary text-white'
                      : 'text-dark hover:bg-muted dark:text-white',
                  )}
                >
                  {day}
                </span>
              ) : null}
            </div>
          ))}
        </div>

        {/* Today label */}
        <div className='mt-4 flex items-center gap-2 border-t border-slate-100 pt-3 dark:border-slate-800'>
          <span className='flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white'>
            {today.getDate()}
          </span>
          <span className='text-xs text-muted-foreground'>
            Today — {MONTHS[today.getMonth()]} {today.getDate()},{' '}
            {today.getFullYear()}
          </span>
        </div>
      </div>
    </Card>
  );
}
