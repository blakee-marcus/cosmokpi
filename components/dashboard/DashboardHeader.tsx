import Link from 'next/link';

import type { StoredWeek } from '@/lib/dashboard/types';

export function DashboardHeader({
  selectedWeek,
  weeks,
  onWeekChange,
  onExportSelectedWeek,
}: {
  selectedWeek: StoredWeek;
  weeks: StoredWeek[];
  onWeekChange: (weekId: string) => void;
  onExportSelectedWeek: () => void;
}) {
  return (
    <>
      <div className='flex items-center justify-between gap-4'>
        <Link
          href='/'
          className='font-heading text-xl font-black text-cosmo-black focus-visible:rounded-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary-web-red/30'>
          cOSmo KPI
        </Link>
        <Link href='/' className='teg-button-secondary text-sm'>
          Upload another CSV
        </Link>
      </div>

      <header className='rounded-[32px] bg-primary-web-red p-6 text-cosmo-white shadow-[8px_9px_0_0_var(--primary-web-red-dark)] lg:flex lg:items-end lg:justify-between lg:gap-8 lg:p-8'>
        <div>
          <div className='font-tag mb-4 inline-flex rounded-full bg-cosmo-white px-4 py-2 text-sm font-black uppercase text-primary-web-red'>
            {selectedWeek.storeName} leadership snapshot
          </div>
          <h1 className='font-display text-4xl font-black leading-none sm:text-5xl lg:text-6xl'>
            Weekly KPI coaching dashboard
          </h1>
          <p className='mt-4 max-w-3xl text-base font-medium leading-7 text-cosmo-white/90'>
            Viewing {selectedWeek.weekLabel}. Use this data to celebrate strong examples, identify
            coaching opportunities, and prepare a clear FLNL-ready performance snapshot.
          </p>
        </div>

        <div className='mt-6 flex flex-col gap-3 sm:flex-row sm:items-end lg:mt-0'>
          <label className='block'>
            <span className='font-tag mb-2 block text-xs font-black uppercase text-cosmo-white/80'>
              Report week
            </span>
            <select
              value={selectedWeek.id}
              onChange={(event) => onWeekChange(event.target.value)}
              className='h-12 min-w-64 rounded-full border-2 border-cosmo-black bg-cosmo-white px-4 text-sm font-black text-cosmo-black outline-none transition focus-visible:ring-4 focus-visible:ring-cosmo-white/40'>
              {weeks.map((week) => (
                <option key={week.id} value={week.id}>
                  {week.weekLabel} · {week.storeName}
                </option>
              ))}
            </select>
          </label>

          <button
            type='button'
            onClick={onExportSelectedWeek}
            className='teg-button-secondary inline-flex h-12 min-w-[190px] items-center justify-center whitespace-nowrap !rounded-[18px] !px-5 text-sm font-black leading-none'>
            Export selected week
          </button>
        </div>
      </header>
    </>
  );
}
