'use client';

import { useState } from 'react';
import Link from 'next/link';

import { removeStoredWeek } from '@/lib/dashboard/storage';
import type { StoredWeek } from '@/lib/dashboard/types';

function getNextWeekIdAfterDelete(weeks: StoredWeek[], deletedWeekId: string) {
  const deletedIndex = weeks.findIndex((week) => week.id === deletedWeekId);

  if (deletedIndex === -1) {
    return weeks[0]?.id ?? null;
  }

  return weeks[deletedIndex + 1]?.id ?? weeks[deletedIndex - 1]?.id ?? null;
}

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
  const [isRemoveModalOpen, setIsRemoveModalOpen] = useState(false);

  function handleConfirmRemoveWeek() {
    const nextWeekId = getNextWeekIdAfterDelete(weeks, selectedWeek.id);
    const nextStorage = removeStoredWeek(selectedWeek.id, nextWeekId);

    setIsRemoveModalOpen(false);

    if (nextStorage.latestWeekId) {
      onWeekChange(nextStorage.latestWeekId);
    }
  }

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

      <header className='rounded-[32px] bg-primary-web-red p-6 text-cosmo-white shadow-teg-card-red lg:flex lg:items-end lg:justify-between lg:gap-8 lg:p-8'>
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

          <button
            type='button'
            onClick={() => setIsRemoveModalOpen(true)}
            className='inline-flex h-12 min-w-[140px] items-center justify-center whitespace-nowrap rounded-[18px] border-2 border-cosmo-white/70 bg-transparent px-5 text-sm font-black leading-none text-cosmo-white transition hover:bg-cosmo-white hover:text-primary-web-red focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cosmo-white/40'>
            Remove week
          </button>
        </div>
      </header>

      {isRemoveModalOpen ? (
        <div
          className='fixed inset-0 z-50 flex items-center justify-center bg-cosmo-black/60 px-4 py-6'
          role='presentation'
          onClick={() => setIsRemoveModalOpen(false)}>
          <section
            role='dialog'
            aria-modal='true'
            aria-labelledby='remove-week-title'
            aria-describedby='remove-week-description'
            className='w-full max-w-lg rounded-[32px] border-2 border-cosmo-black bg-cosmo-white p-6 text-cosmo-black shadow-[8px_10px_0_0_rgba(0,0,0,0.22)]'
            onClick={(event) => event.stopPropagation()}>
            <p className='font-tag text-sm font-black uppercase tracking-wide text-primary-web-red'>
              Local report cleanup
            </p>

            <h2 id='remove-week-title' className='font-display mt-3 text-3xl font-black'>
              Remove {selectedWeek.weekLabel}?
            </h2>

            <p
              id='remove-week-description'
              className='mt-4 text-sm font-semibold leading-6 text-cosmo-black/70'>
              This will only remove the saved report from this browser. It will not affect the
              original CSV, company systems, or any source data.
            </p>

            <div className='mt-6 rounded-[22px] border-2 border-cosmo-black/10 bg-off-white p-4'>
              <p className='font-tag text-xs font-black uppercase tracking-wide text-cosmo-black/60'>
                Report being removed
              </p>
              <p className='mt-1 font-heading text-lg font-black text-cosmo-black'>
                {selectedWeek.weekLabel} · {selectedWeek.storeName}
              </p>
            </div>

            <div className='mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end'>
              <button
                type='button'
                onClick={() => setIsRemoveModalOpen(false)}
                className='teg-button-secondary inline-flex h-12 items-center justify-center !rounded-[18px] px-5 text-sm font-black'>
                Keep report
              </button>

              <button
                type='button'
                onClick={handleConfirmRemoveWeek}
                className='inline-flex h-12 items-center justify-center rounded-[18px] border-2 border-cosmo-black bg-primary-web-red px-5 text-sm font-black text-cosmo-white shadow-[4px_5px_0_0_rgba(0,0,0,0.18)] transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary-web-red/30'>
                Yes, remove week
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}
