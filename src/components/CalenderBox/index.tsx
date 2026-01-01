'use client';

import React, { useMemo, useState, useCallback } from 'react';
import { ChevronUpIcon } from '@/assets/icons';

export interface CalendarEvent {
  id: string;
  title: string;
  startDate: string; // "YYYY-MM-DD" (date-only) OR ISO string
  endDate: string; // "YYYY-MM-DD" (date-only) OR ISO string
  status?: string;
  color?: 'blue' | 'purple' | 'emerald' | 'rose' | 'amber' | 'indigo' | 'slate';
}

interface CalendarDay {
  date: number;
  month: number; // 0-11
  year: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  events?: CalendarEvent[];
}

const colorDotClass: Record<NonNullable<CalendarEvent['color']>, string> = {
  blue: 'bg-blue-600',
  purple: 'bg-purple-600',
  emerald: 'bg-emerald-600',
  rose: 'bg-rose-600',
  amber: 'bg-amber-600',
  indigo: 'bg-indigo-600',
  slate: 'bg-slate-600',
};

const colorTextClass: Record<NonNullable<CalendarEvent['color']>, string> = {
  blue: 'text-blue-600 dark:text-blue-300',
  purple: 'text-purple-600 dark:text-purple-300',
  emerald: 'text-emerald-600 dark:text-emerald-300',
  rose: 'text-rose-600 dark:text-rose-300',
  amber: 'text-amber-600 dark:text-amber-300',
  indigo: 'text-indigo-600 dark:text-indigo-300',
  slate: 'text-slate-600 dark:text-slate-300',
};

/**
 * Parse date-only strings ("YYYY-MM-DD") as LOCAL dates (avoids UTC timezone shift).
 * If an ISO string with time is provided, falls back to Date(value).
 */
const parseDateOnlyLocal = (value: string) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (m) {
    const y = Number(m[1]);
    const mo = Number(m[2]) - 1;
    const d = Number(m[3]);
    return new Date(y, mo, d); // local midnight
  }
  return new Date(value);
};

const startOfDay = (d: Date) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate());
const endOfDay = (d: Date) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);

const toKey = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const CalendarBox: React.FC<{ events: CalendarEvent[] }> = ({ events }) => {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showEventModal, setShowEventModal] = useState<boolean>(false);

  const today = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  const monthNames = useMemo(
    () => [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ],
    []
  );

  const dayNames = useMemo(
    () => [
      { full: 'Sunday', short: 'Sun' },
      { full: 'Monday', short: 'Mon' },
      { full: 'Tuesday', short: 'Tue' },
      { full: 'Wednesday', short: 'Wed' },
      { full: 'Thursday', short: 'Thu' },
      { full: 'Friday', short: 'Fri' },
      { full: 'Saturday', short: 'Sat' },
    ],
    []
  );

  const isTodayFn = useCallback(
    (date: number, month: number, year: number) =>
      date === today.getDate() &&
      month === today.getMonth() &&
      year === today.getFullYear(),
    [today]
  );

  const goToPreviousMonth = useCallback(() => {
    setCurrentDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  }, []);

  const goToNextMonth = useCallback(() => {
    setCurrentDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1));
  }, []);

  const goToToday = useCallback(() => setCurrentDate(new Date()), []);

  /**
   * Build an index: dayKey ("YYYY-MM-DD") -> events on that day.
   * This avoids filtering all events for each calendar cell.
   */
  const eventsByDay = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();

    for (const ev of events) {
      const rawStart = parseDateOnlyLocal(ev.startDate);
      const rawEnd = parseDateOnlyLocal(ev.endDate);

      if (isNaN(rawStart.getTime()) || isNaN(rawEnd.getTime())) continue;

      const s0 = startOfDay(rawStart);
      const e0 = endOfDay(rawEnd);

      const start = s0 <= e0 ? s0 : startOfDay(rawEnd);
      const end = s0 <= e0 ? e0 : endOfDay(rawStart);

      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const key = toKey(d);
        const arr = map.get(key) ?? [];
        arr.push(ev);
        map.set(key, arr);
      }
    }

    return map;
  }, [events]);

  const getEventsForDate = useCallback(
    (date: number, month: number, year: number): CalendarEvent[] => {
      const key = toKey(new Date(year, month, date));
      return eventsByDay.get(key) ?? [];
    },
    [eventsByDay]
  );

  const generateCalendarDays = useCallback((): CalendarDay[] => {
    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();

    const days: CalendarDay[] = [];

    // Previous month
    for (let i = firstDay - 1; i >= 0; i--) {
      const date = daysInPrevMonth - i;
      const prevMonth = currentMonth - 1;
      const year = prevMonth < 0 ? currentYear - 1 : currentYear;
      const actualMonth = prevMonth < 0 ? 11 : prevMonth;

      days.push({
        date,
        month: actualMonth,
        year,
        isCurrentMonth: false,
        isToday: isTodayFn(date, actualMonth, year),
        events: getEventsForDate(date, actualMonth, year),
      });
    }

    // Current month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        date: i,
        month: currentMonth,
        year: currentYear,
        isCurrentMonth: true,
        isToday: isTodayFn(i, currentMonth, currentYear),
        events: getEventsForDate(i, currentMonth, currentYear),
      });
    }

    // Next month (fill to 6 rows = 42 cells)
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      const nextMonth = currentMonth + 1;
      const year = nextMonth > 11 ? currentYear + 1 : currentYear;
      const actualMonth = nextMonth > 11 ? 0 : nextMonth;

      days.push({
        date: i,
        month: actualMonth,
        year,
        isCurrentMonth: false,
        isToday: isTodayFn(i, actualMonth, year),
        events: getEventsForDate(i, actualMonth, year),
      });
    }

    return days;
  }, [currentYear, currentMonth, isTodayFn, getEventsForDate]);

  const calendarDays = useMemo(
    () => generateCalendarDays(),
    [generateCalendarDays]
  );

  const handleDayClick = useCallback((day: CalendarDay) => {
    const d = new Date(day.year, day.month, day.date);
    setSelectedDate(d);
    if (day.events && day.events.length > 0) setShowEventModal(true);
  }, []);

  const selectedEvents = useMemo(() => {
    if (!selectedDate) return [];
    return getEventsForDate(
      selectedDate.getDate(),
      selectedDate.getMonth(),
      selectedDate.getFullYear()
    );
  }, [selectedDate, getEventsForDate]);

  return (
    <div className='w-full max-w-11/12 mx-auto rounded-2xl shadow-lg dark:shadow-black/30 p-6 bg-white dark:bg-slate-950'>
      {/* Header */}
      <div className='mb-6 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center'>
        <div>
          <h2 className='text-3xl font-bold text-slate-900 dark:text-slate-50'>
            {monthNames[currentMonth]} {currentYear}
          </h2>
          <p className='mt-1 text-sm text-slate-500 dark:text-slate-400'>
            {today.toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>

        <div className='flex items-center gap-2'>
          <button
            onClick={goToPreviousMonth}
            className='inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white
            text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500
            dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800'
            aria-label='Previous month'
            type='button'
          >
            <ChevronUpIcon className='-rotate-90' />
          </button>

          <button
            onClick={goToToday}
            className='h-10 rounded-lg bg-indigo-600 px-4 text-sm font-semibold text-white
            transition hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-400'
            type='button'
          >
            Today
          </button>

          <button
            onClick={goToNextMonth}
            className='inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white
            text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500
            dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800'
            aria-label='Next month'
            type='button'
          >
            <ChevronUpIcon className='rotate-90' />
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className='overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800'>
        <div className='grid grid-cols-7 border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/60'>
          {dayNames.map((day) => (
            <div key={day.full} className='py-2 md:py-3 text-center'>
              <span className='text-[11px] md:text-sm font-semibold text-slate-600 dark:text-slate-200'>
                <span className='md:hidden'>{day.short}</span>
                <span className='hidden md:inline'>{day.full}</span>
              </span>
            </div>
          ))}
        </div>

        <div className='grid grid-cols-7'>
          {calendarDays.map((day) => {
            const isSelected =
              selectedDate &&
              selectedDate.getDate() === day.date &&
              selectedDate.getMonth() === day.month &&
              selectedDate.getFullYear() === day.year;

            return (
              <button
                type='button'
                key={`${day.year}-${day.month}-${day.date}`} // ✅ stable key
                onClick={() => handleDayClick(day)}
                className={[
                  'relative w-full text-left',
                  'min-h-[64px] md:min-h-[120px] p-1.5 md:p-3',
                  'border-r border-b border-slate-200 dark:border-slate-800',
                  'bg-white dark:bg-slate-950',
                  'hover:bg-slate-50 dark:hover:bg-slate-900/50 transition',
                  !day.isCurrentMonth
                    ? 'bg-slate-50/60 dark:bg-slate-900/30'
                    : '',
                  isSelected ? 'bg-indigo-50 dark:bg-indigo-500/10' : '',
                  day.isToday ? 'ring-2 ring-inset ring-indigo-500' : '',
                ].join(' ')}
              >
                <div className='flex items-start justify-between'>
                  <span
                    className={[
                      'inline-flex items-center justify-center rounded-full font-bold',
                      'h-7 w-7 text-[12px] md:h-9 md:w-9 md:text-sm',
                      day.isToday
                        ? 'bg-indigo-600 text-white'
                        : day.isCurrentMonth
                        ? 'text-slate-900 dark:text-slate-100'
                        : 'text-slate-400 dark:text-slate-500',
                    ].join(' ')}
                  >
                    {day.date}
                  </span>
                </div>

                {day.events?.length ? (
                  <>
                    {/* Mobile: dots */}
                    <div className='mt-1 flex flex-wrap gap-1 md:hidden'>
                      {day.events.slice(0, 4).map((event) => (
                        <span
                          key={event.id}
                          className={[
                            'h-1.5 w-1.5 rounded-full',
                            colorDotClass[event.color ?? 'indigo'],
                          ].join(' ')}
                          aria-label={event.title}
                          title={event.title}
                        />
                      ))}
                      {day.events.length > 4 && (
                        <span className='text-[10px] font-semibold text-indigo-600 dark:text-indigo-300'>
                          +{day.events.length - 4}
                        </span>
                      )}
                    </div>

                    {/* Desktop: pills */}
                    <div className='mt-2 hidden space-y-1.5 md:block'>
                      {day.events.slice(0, 2).map((event) => (
                        <div
                          key={event.id}
                          className='flex items-center gap-2 rounded-md px-2 py-1 text-sm font-medium
                                     bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-100'
                        >
                          <span
                            className={[
                              'h-2.5 w-2.5 rounded-full flex-shrink-0',
                              colorDotClass[event.color ?? 'indigo'],
                            ].join(' ')}
                          />
                          <span className='truncate'>{event.title}</span>
                        </div>
                      ))}
                      {day.events.length > 2 && (
                        <div className='text-xs font-semibold text-indigo-600 dark:text-indigo-300'>
                          +{day.events.length - 2} more
                        </div>
                      )}
                    </div>
                  </>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      {/* Modal */}
      {showEventModal && selectedDate && (
        <div className='fixed inset-0 z-50 bg-black/70'>
          <button
            aria-label='Close overlay'
            className='absolute inset-0 w-full h-full'
            onClick={() => setShowEventModal(false)}
            type='button'
          />

          <div className='fixed bottom-0 left-0 right-0 md:inset-0 md:flex md:items-center md:justify-center'>
            <div
              className='relative w-full rounded-t-2xl md:rounded-2xl border border-slate-200 dark:border-slate-800
                         bg-white dark:bg-slate-950 p-5 md:p-6 shadow-2xl md:max-w-md
                         max-h-[80vh] md:max-h-[70vh] overflow-y-auto'
              onClick={(e) => e.stopPropagation()}
            >
              <div className='mx-auto mb-3 h-1.5 w-10 rounded-full bg-slate-200 dark:bg-slate-800 md:hidden' />

              <div className='mb-4 flex items-center justify-between'>
                <h3 className='text-base md:text-lg font-bold text-slate-900 dark:text-slate-50'>
                  Events for{' '}
                  {selectedDate.toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </h3>

                <button
                  onClick={() => setShowEventModal(false)}
                  className='rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600
                             dark:hover:bg-slate-900 dark:hover:text-slate-200'
                  aria-label='Close'
                  type='button'
                >
                  ✕
                </button>
              </div>

              <div className='space-y-3'>
                {selectedEvents.map((event) => (
                  <div
                    key={event.id}
                    className='flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-3
                               dark:border-slate-800 dark:bg-slate-900/40'
                  >
                    <div className='flex items-center gap-3'>
                      <span
                        className={[
                          'h-3 w-3 rounded-full flex-shrink-0',
                          colorDotClass[event.color ?? 'indigo'],
                        ].join(' ')}
                      />
                      <div>
                        <p className='font-semibold text-slate-900 dark:text-slate-50'>
                          {event.title}
                        </p>
                        <p className='text-xs text-slate-500 dark:text-slate-400'>
                          {parseDateOnlyLocal(
                            event.startDate
                          ).toLocaleDateString()}{' '}
                          –{' '}
                          {parseDateOnlyLocal(
                            event.endDate
                          ).toLocaleDateString()}
                        </p>
                        {event.status && (
                          <p
                            className={[
                              'text-xs',
                              colorTextClass[event.color ?? 'indigo'],
                            ].join(' ')}
                          >
                            Status: {event.status}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {selectedEvents.length === 0 && (
                  <p className='py-8 text-center text-sm text-slate-500 dark:text-slate-400'>
                    No events for this day
                  </p>
                )}
              </div>

              <button
                onClick={() => setShowEventModal(false)}
                className='mt-5 w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white
                           transition hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-400'
                type='button'
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Legend */}
      <div className='mt-6 flex flex-wrap items-center gap-6 text-sm'>
        <div className='flex items-center gap-2 text-slate-600 dark:text-slate-300'>
          <span className='h-3 w-3 rounded bg-emerald-600' />
          <span>Delivered</span>
        </div>
        <div className='flex items-center gap-2 text-slate-600 dark:text-slate-300'>
          <span className='h-3 w-3 rounded bg-amber-600' />
          <span>Pending</span>
        </div>
        <div className='flex items-center gap-2 text-slate-600 dark:text-slate-300'>
          <span className='h-3 w-3 rounded bg-rose-600' />
          <span>cancelled</span>
        </div>
      </div>
    </div>
  );
};

export default CalendarBox;
