'use client';

import { useEffect, useId, useRef, useState } from 'react';
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

function ReportWeekPicker({
  selectedWeek,
  weeks,
  onWeekChange,
}: {
  selectedWeek: StoredWeek;
  weeks: StoredWeek[];
  onWeekChange: (weekId: string) => void;
}) {
  const labelId = useId();
  const listboxId = useId();
  const pickerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const listboxRef = useRef<HTMLUListElement>(null);
  const selectedIndex = Math.max(
    weeks.findIndex((week) => week.id === selectedWeek.id),
    0,
  );

  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(selectedIndex);

  useEffect(() => {
    if (!isOpen) return;

    setActiveIndex(selectedIndex);

    requestAnimationFrame(() => {
      listboxRef.current?.focus();
    });
  }, [isOpen, selectedIndex]);

  useEffect(() => {
    if (!isOpen) return;

    function handlePointerDown(event: PointerEvent) {
      if (!pickerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [isOpen]);

  function handleSelectWeek(weekId: string) {
    if (weekId !== selectedWeek.id) {
      onWeekChange(weekId);
    }

    setIsOpen(false);
    buttonRef.current?.focus();
  }

  function moveActiveOption(direction: 1 | -1) {
    if (weeks.length === 0) return;

    setActiveIndex((currentIndex) => {
      const nextIndex = currentIndex + direction;

      if (nextIndex < 0) return weeks.length - 1;
      if (nextIndex >= weeks.length) return 0;

      return nextIndex;
    });
  }

  function handleButtonKeyDown(event: React.KeyboardEvent<HTMLButtonElement>) {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      setIsOpen(true);
    }
  }

  function handleListboxKeyDown(event: React.KeyboardEvent<HTMLUListElement>) {
    if (event.key === 'Escape') {
      event.preventDefault();
      setIsOpen(false);
      buttonRef.current?.focus();
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      moveActiveOption(1);
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      moveActiveOption(-1);
      return;
    }

    if (event.key === 'Home') {
      event.preventDefault();
      setActiveIndex(0);
      return;
    }

    if (event.key === 'End') {
      event.preventDefault();
      setActiveIndex(Math.max(weeks.length - 1, 0));
      return;
    }

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      const activeWeek = weeks[activeIndex];
      if (activeWeek) handleSelectWeek(activeWeek.id);
    }
  }

  return (
    <div ref={pickerRef} className='relative w-full sm:w-72'>
      <span
        id={labelId}
        className='font-tag mb-2 block text-xs font-black uppercase text-cosmo-white/80'>
        Report week
      </span>

      <button
        ref={buttonRef}
        type='button'
        aria-labelledby={labelId}
        aria-haspopup='listbox'
        aria-expanded={isOpen}
        aria-controls={listboxId}
        onClick={() => setIsOpen((current) => !current)}
        onKeyDown={handleButtonKeyDown}
        className='group flex h-14 w-full items-center justify-between gap-3 rounded-[20px] border-2 border-cosmo-black bg-cosmo-white px-4 text-left text-cosmo-black shadow-[4px_5px_0_0_rgba(0,0,0,0.20)] transition hover:-translate-y-0.5 hover:shadow-[5px_6px_0_0_rgba(0,0,0,0.22)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cosmo-white/45'>
        <span className='min-w-0'>
          <span className='block truncate text-sm font-black leading-none'>
            {selectedWeek.weekLabel}
          </span>
          <span className='mt-1 block truncate text-xs font-bold leading-none text-cosmo-black/60'>
            {selectedWeek.storeName}
          </span>
        </span>

        <span className='grid size-8 shrink-0 place-items-center rounded-full bg-primary-web-red text-cosmo-white shadow-[2px_3px_0_0_var(--primary-web-red-dark)] transition group-hover:rotate-3'>
          <svg
            aria-hidden='true'
            viewBox='0 0 20 20'
            className={`size-4 transition ${isOpen ? 'rotate-180' : ''}`}>
            <path
              fill='currentColor'
              d='M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.17l3.71-3.94a.75.75 0 1 1 1.08 1.04l-4.25 4.5a.75.75 0 0 1-1.08 0l-4.25-4.5a.75.75 0 0 1 .02-1.06Z'
            />
          </svg>
        </span>
      </button>

      {isOpen ? (
        <div className='absolute right-0 z-30 mt-3 w-full min-w-[18rem] rounded-[28px] border-2 border-cosmo-black bg-cosmo-white p-2 text-cosmo-black shadow-[7px_8px_0_0_rgba(0,0,0,0.22)]'>
          <div className='border-b-2 border-cosmo-black/10 px-4 py-3'>
            <p className='font-tag text-xs font-black uppercase tracking-wide text-primary-web-red'>
              Choose snapshot
            </p>
            <p className='mt-1 text-xs font-bold text-cosmo-black/60'>
              Switch between saved weekly reports.
            </p>
          </div>

          <ul
            ref={listboxRef}
            id={listboxId}
            role='listbox'
            tabIndex={-1}
            aria-labelledby={labelId}
            aria-activedescendant={`${listboxId}-option-${activeIndex}`}
            onKeyDown={handleListboxKeyDown}
            className='mt-2 max-h-72 overflow-y-auto rounded-[20px] p-1 focus-visible:outline-none'>
            {weeks.map((week, index) => {
              const isSelected = week.id === selectedWeek.id;
              const isActive = index === activeIndex;

              return (
                <li
                  id={`${listboxId}-option-${index}`}
                  key={week.id}
                  role='option'
                  aria-selected={isSelected}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => handleSelectWeek(week.id)}
                  className={`flex cursor-pointer items-center justify-between gap-3 rounded-[18px] px-4 py-3 transition ${
                    isSelected
                      ? 'bg-primary-web-red text-cosmo-white shadow-[3px_4px_0_0_var(--primary-web-red-dark)]'
                      : isActive
                        ? 'bg-off-white text-cosmo-black'
                        : 'text-cosmo-black hover:bg-off-white'
                  }`}>
                  <span className='min-w-0'>
                    <span className='block truncate text-sm font-black leading-none'>
                      {week.weekLabel}
                    </span>
                    <span
                      className={`mt-1 block truncate text-xs font-bold leading-none ${
                        isSelected ? 'text-cosmo-white/75' : 'text-cosmo-black/55'
                      }`}>
                      {week.storeName}
                    </span>
                  </span>

                  {isSelected ? (
                    <span className='grid size-7 shrink-0 place-items-center rounded-full bg-cosmo-white text-primary-web-red'>
                      <svg aria-hidden='true' viewBox='0 0 20 20' className='size-4'>
                        <path
                          fill='currentColor'
                          d='M16.7 5.3a1 1 0 0 1 0 1.4l-7.25 7.25a1 1 0 0 1-1.42 0L3.3 9.2a1 1 0 1 1 1.4-1.4l4.04 4.03L15.3 5.3a1 1 0 0 1 1.4 0Z'
                        />
                      </svg>
                    </span>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </div>
  );
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
          <ReportWeekPicker selectedWeek={selectedWeek} weeks={weeks} onWeekChange={onWeekChange} />

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
