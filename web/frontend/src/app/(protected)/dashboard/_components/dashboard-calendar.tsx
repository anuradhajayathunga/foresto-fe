'use client';

import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const WEEKDAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

type CalendarDay = {
  date: Date;
  isCurrentMonth: boolean;
};

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getDate() === b.getDate() &&
    a.getMonth() === b.getMonth() &&
    a.getFullYear() === b.getFullYear()
  );
}

function getMonthGrid(viewDate: Date): CalendarDay[] {
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDayOfMonth = new Date(year, month, 1);
  const firstGridDay = new Date(year, month, 1 - firstDayOfMonth.getDay());

  return Array.from({ length: 42 }, (_, index) => {
    const day = new Date(firstGridDay);
    day.setDate(firstGridDay.getDate() + index);
    return {
      date: day,
      isCurrentMonth: day.getMonth() === month,
    };
  });
}

export function DashboardCalendar() {
  const [viewDate, setViewDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedDate, setSelectedDate] = useState(() => new Date());

  const today = useMemo(() => new Date(), []);
  const monthGrid = useMemo(() => getMonthGrid(viewDate), [viewDate]);

  const monthName = useMemo(
    () => new Intl.DateTimeFormat('en-US', { month: 'long' }).format(viewDate),
    [viewDate]
  );
  
  const yearName = useMemo(
    () => new Intl.DateTimeFormat('en-US', { year: 'numeric' }).format(viewDate),
    [viewDate]
  );

  return (
    <div className="flex flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-md text-slate-900 dark:text-slate-100 tracking-tight">
          <span className="font-bold">{monthName}</span>{' '}
          <span className="font-medium text-slate-500 dark:text-slate-400">{yearName}</span>
        </h3>
        
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label="Previous month"
            onClick={() => setViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}
            className="inline-flex h-7 w-7 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label="Next month"
            onClick={() => setViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}
            className="inline-flex h-7 w-7 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Days Header */}
      <div className="mb-2 grid grid-cols-7 gap-1">
        {WEEKDAY_LABELS.map((dayLabel) => (
          <div
            key={dayLabel}
            className="text-center text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500"
          >
            {dayLabel}
          </div>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-7 gap-y-1 gap-x-1">
        {monthGrid.map(({ date, isCurrentMonth }) => {
          const isToday = isSameDay(date, today);
          const isSelected = isSameDay(date, selectedDate);

          return (
            <div key={date.toISOString()} className="flex justify-center">
              <button
                type="button"
                onClick={() => setSelectedDate(date)}
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-full text-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500',
                  
                  // Out of month
                  !isCurrentMonth && 'text-slate-300 hover:text-slate-500 dark:text-slate-600 dark:hover:text-slate-400',
                  
                  // Standard in-month day
                  isCurrentMonth && !isSelected && !isToday && 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800',
                  
                  // Today (Not Selected)
                  isToday && !isSelected && 'bg-amber-50 font-semibold text-amber-600 dark:bg-amber-500/10 dark:text-amber-400',
                  
                  // Selected
                  isSelected && 'bg-amber-600 font-semibold text-white shadow-sm hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-600'
                )}
              >
                {date.getDate()}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}