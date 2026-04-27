'use client';

import { useMemo, useState } from 'react';

type WeekPickerProps = {
  weekLabel: string;
  weekStart: string;
  onWeekStartChange: (weekStart: string) => void;
};

const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const monthFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'long',
  year: 'numeric',
});

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});

function parseDateString(value: string) {
  const [year, month, day] = value.split('-').map(Number);

  if (!year || !month || !day) {
    return new Date();
  }

  return new Date(year, month - 1, day);
}

function formatDateString(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function getMonday(date: Date) {
  const nextDate = new Date(date);
  const day = nextDate.getDay();
  const diff = day === 0 ? -6 : 1 - day;

  nextDate.setDate(nextDate.getDate() + diff);
  nextDate.setHours(0, 0, 0, 0);

  return nextDate;
}

function addMonths(date: Date, amount: number) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

function getCalendarDays(monthDate: Date) {
  const firstOfMonth = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
  const calendarStart = getMonday(firstOfMonth);

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(calendarStart);
    date.setDate(calendarStart.getDate() + index);
    return date;
  });
}

function isSameDay(a: Date, b: Date) {
  return formatDateString(a) === formatDateString(b);
}

function isSameWeek(a: Date, b: Date) {
  return formatDateString(getMonday(a)) === formatDateString(getMonday(b));
}

export function WeekPicker({ weekLabel, weekStart, onWeekStartChange }: WeekPickerProps) {
  const selectedDate = useMemo(() => parseDateString(weekStart), [weekStart]);
  const selectedWeekStart = useMemo(() => getMonday(selectedDate), [selectedDate]);

  const [isOpen, setIsOpen] = useState(false);
  const [visibleMonth, setVisibleMonth] = useState(() => selectedWeekStart);

  const calendarDays = useMemo(() => getCalendarDays(visibleMonth), [visibleMonth]);
  const today = new Date();

  function handleSelectDate(date: Date) {
    onWeekStartChange(formatDateString(getMonday(date)));
    setIsOpen(false);
  }

  function handleSelectToday() {
    const todayWeekStart = getMonday(new Date());

    onWeekStartChange(formatDateString(todayWeekStart));
    setVisibleMonth(todayWeekStart);
    setIsOpen(false);
  }

  return (
    <div className='relative mb-5'>
      <span className='font-tag mb-2 block text-sm font-black text-cosmo-black'>Report week</span>

      <button
        type='button'
        aria-expanded={isOpen}
        onClick={() => setIsOpen((current) => !current)}
        className='teg-field flex h-12 w-full items-center justify-between gap-3 px-4 text-left text-sm font-bold outline-none transition hover:border-primary-web-red focus-visible:ring-4 focus-visible:ring-primary-web-red/20'>
        <span>{dateFormatter.format(selectedWeekStart)}</span>
        <span className='font-tag rounded-full bg-comic-fog px-3 py-1 text-[11px] font-black uppercase text-primary-web-red'>
          Choose week
        </span>
      </button>

      <input type='hidden' value={weekStart} readOnly />

      {isOpen ? (
        <div className='absolute left-0 top-[76px] z-30 w-full overflow-hidden rounded-[28px] border-2 border-cosmo-black/10 bg-cosmo-white shadow-[6px_7px_0_0_rgba(0,0,0,0.10)] sm:w-[380px]'>
          <div className='flex items-center justify-between gap-3 border-b-2 border-cosmo-black/10 bg-comic-fog p-4'>
            <button
              type='button'
              onClick={() => setVisibleMonth((current) => addMonths(current, -1))}
              className='flex size-10 items-center justify-center rounded-full border-2 border-cosmo-black/10 bg-cosmo-white font-black transition hover:-translate-y-0.5 hover:border-primary-web-red'
              aria-label='Previous month'>
              ‹
            </button>

            <p className='font-heading text-lg font-black text-cosmo-black'>
              {monthFormatter.format(visibleMonth)}
            </p>

            <button
              type='button'
              onClick={() => setVisibleMonth((current) => addMonths(current, 1))}
              className='flex size-10 items-center justify-center rounded-full border-2 border-cosmo-black/10 bg-cosmo-white font-black transition hover:-translate-y-0.5 hover:border-primary-web-red'
              aria-label='Next month'>
              ›
            </button>
          </div>

          <div className='p-4'>
            <div className='mb-2 grid grid-cols-7 gap-1'>
              {dayLabels.map((day) => (
                <div
                  key={day}
                  className='font-tag text-center text-[11px] font-black uppercase text-ink-soft'>
                  {day}
                </div>
              ))}
            </div>

            <div className='grid grid-cols-7 gap-1'>
              {calendarDays.map((date) => {
                const dateString = formatDateString(date);
                const isCurrentMonth = date.getMonth() === visibleMonth.getMonth();
                const isSelectedWeek = isSameWeek(date, selectedWeekStart);
                const isSelectedStart = isSameDay(date, selectedWeekStart);
                const isToday = isSameDay(date, today);

                return (
                  <button
                    key={dateString}
                    type='button'
                    onClick={() => handleSelectDate(date)}
                    className={[
                      'relative flex h-10 items-center justify-center rounded-[14px] text-sm font-black transition',
                      isCurrentMonth ? 'text-cosmo-black' : 'text-ink-soft/40',
                      isSelectedWeek
                        ? 'bg-primary-web-red/10 text-primary-web-red'
                        : 'hover:bg-comic-fog',
                      isSelectedStart
                        ? 'bg-primary-web-red text-cosmo-white shadow-[3px_4px_0_0_var(--primary-web-red-dark)]'
                        : '',
                    ].join(' ')}
                    aria-label={`Select week of ${dateFormatter.format(getMonday(date))}`}>
                    {date.getDate()}

                    {isToday && !isSelectedStart ? (
                      <span className='absolute bottom-1 size-1 rounded-full bg-primary-web-red' />
                    ) : null}
                  </button>
                );
              })}
            </div>

            <div className='mt-4 flex items-center justify-between gap-3 border-t-2 border-cosmo-black/10 pt-4'>
              <button
                type='button'
                onClick={handleSelectToday}
                className='font-tag rounded-full bg-comic-fog px-4 py-2 text-xs font-black uppercase text-cosmo-black transition hover:bg-cosmo-black hover:text-cosmo-white'>
                This week
              </button>

              <button
                type='button'
                onClick={() => setIsOpen(false)}
                className='font-tag rounded-full bg-primary-web-red px-4 py-2 text-xs font-black uppercase text-cosmo-white transition hover:-translate-y-0.5'>
                Done
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <span className='mt-2 block text-xs font-semibold text-ink-soft'>
        Report will be saved as {weekLabel}
      </span>
    </div>
  );
}
