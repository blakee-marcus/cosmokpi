'use client';

import { useEffect, useId, useRef, useState } from 'react';

import { removeStoredWeek } from '@/lib/dashboard/storage';
import type {
  DashboardPeriod,
  DashboardPeriodOption,
  DashboardViewMode,
  StoredWeek,
} from '@/lib/dashboard/types';

function getNextWeekIdAfterDelete(weeks: StoredWeek[], deletedWeekId: string) {
  const deletedIndex = weeks.findIndex((week) => week.id === deletedWeekId);

  if (deletedIndex === -1) {
    return weeks[0]?.id ?? null;
  }

  return weeks[deletedIndex + 1]?.id ?? weeks[deletedIndex - 1]?.id ?? null;
}

function ViewModeToggle({
  viewMode,
  onViewModeChange,
}: {
  viewMode: DashboardViewMode;
  onViewModeChange: (viewMode: DashboardViewMode) => void;
}) {
  const options: {
    label: string;
    description: string;
    value: DashboardViewMode;
  }[] = [
    {
      label: 'Weekly',
      description: 'Recap the week',
      value: 'weekly',
    },
    {
      label: 'Monthly',
      description: 'Spot the trend',
      value: 'monthly',
    },
  ];

  return (
    <div
      className='grid gap-2 rounded-[24px] border-2 border-cosmo-black/10 bg-cosmo-white p-2 text-cosmo-black sm:grid-cols-2'
      aria-label='Dashboard view mode'>
      {options.map((option) => {
        const isSelected = option.value === viewMode;

        return (
          <button
            key={option.value}
            type='button'
            aria-pressed={isSelected}
            onClick={() => onViewModeChange(option.value)}
            className={`rounded-[18px] px-4 py-3 text-left transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary-web-red/25 ${
              isSelected
                ? 'bg-primary-web-red text-cosmo-white shadow-[3px_4px_0_0_var(--primary-web-red-dark)]'
                : 'bg-off-white text-cosmo-black hover:-translate-y-0.5 hover:bg-cosmo-white hover:shadow-[3px_4px_0_0_rgba(0,0,0,0.10)]'
            }`}>
            <span className='font-tag block text-xs font-black uppercase leading-none'>
              {option.label}
            </span>
            <span
              className={`mt-1 block text-xs font-bold leading-4 ${
                isSelected ? 'text-cosmo-white/80' : 'text-cosmo-black/55'
              }`}>
              {option.description}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function ReportPeriodPicker({
  selectedOption,
  options,
  viewMode,
  onOptionChange,
}: {
  selectedOption: DashboardPeriodOption;
  options: DashboardPeriodOption[];
  viewMode: DashboardViewMode;
  onOptionChange: (option: DashboardPeriodOption) => void;
}) {
  const labelId = useId();
  const listboxId = useId();
  const pickerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const listboxRef = useRef<HTMLUListElement>(null);
  const selectedIndex = Math.max(
    options.findIndex((option) => option.id === selectedOption.id),
    0,
  );

  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(selectedIndex);

  useEffect(() => {
    setActiveIndex(selectedIndex);
  }, [selectedIndex, viewMode]);

  useEffect(() => {
    if (!isOpen) return;

    requestAnimationFrame(() => {
      listboxRef.current?.focus();
    });
  }, [isOpen]);

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

  function handleSelectOption(option: DashboardPeriodOption) {
    if (option.id !== selectedOption.id) {
      onOptionChange(option);
    }

    setIsOpen(false);
    buttonRef.current?.focus();
  }

  function openListbox() {
    setActiveIndex(selectedIndex);
    setIsOpen(true);
  }

  function moveActiveOption(direction: 1 | -1) {
    if (options.length === 0) return;

    setActiveIndex((currentIndex) => {
      const nextIndex = currentIndex + direction;

      if (nextIndex < 0) return options.length - 1;
      if (nextIndex >= options.length) return 0;

      return nextIndex;
    });
  }

  function handleButtonKeyDown(event: React.KeyboardEvent<HTMLButtonElement>) {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      openListbox();
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
      setActiveIndex(Math.max(options.length - 1, 0));
      return;
    }

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      const activeOption = options[activeIndex];
      if (activeOption) handleSelectOption(activeOption);
    }
  }

  const pickerLabel = viewMode === 'monthly' ? 'Active month' : 'Active week';

  return (
    <div ref={pickerRef} className='relative'>
      <span
        id={labelId}
        className='font-tag mb-2 block text-xs font-black uppercase text-cosmo-white/75'>
        {pickerLabel}
      </span>

      <button
        ref={buttonRef}
        type='button'
        aria-labelledby={labelId}
        aria-haspopup='listbox'
        aria-expanded={isOpen}
        aria-controls={listboxId}
        onClick={() => {
          if (isOpen) {
            setIsOpen(false);
            return;
          }

          openListbox();
        }}
        onKeyDown={handleButtonKeyDown}
        className='group flex h-14 w-full items-center justify-between gap-3 rounded-[20px] border-2 border-cosmo-black bg-cosmo-white px-4 text-left text-cosmo-black shadow-[4px_5px_0_0_rgba(0,0,0,0.20)] transition hover:-translate-y-0.5 hover:shadow-[5px_6px_0_0_rgba(0,0,0,0.22)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cosmo-white/45'>
        <span className='min-w-0'>
          <span className='block truncate text-sm font-black leading-none'>
            {selectedOption.label}
          </span>
          <span className='mt-1 block truncate text-xs font-bold leading-none text-cosmo-black/60'>
            {selectedOption.detail}
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
              Choose {viewMode === 'monthly' ? 'month' : 'week'}
            </p>
            <p className='mt-1 text-xs font-bold text-cosmo-black/60'>
              {viewMode === 'monthly'
                ? 'Monthly view groups saved weekly reports into one trend snapshot.'
                : 'Weekly view focuses the dashboard on one saved report.'}
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
            {options.map((option, index) => {
              const isSelected = option.id === selectedOption.id;
              const isActive = index === activeIndex;

              return (
                <li
                  id={`${listboxId}-option-${index}`}
                  key={option.id}
                  role='option'
                  aria-selected={isSelected}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => handleSelectOption(option)}
                  className={`flex cursor-pointer items-center justify-between gap-3 rounded-[18px] px-4 py-3 transition ${
                    isSelected
                      ? 'bg-primary-web-red text-cosmo-white shadow-[3px_4px_0_0_var(--primary-web-red-dark)]'
                      : isActive
                        ? 'bg-off-white text-cosmo-black'
                        : 'text-cosmo-black hover:bg-off-white'
                  }`}>
                  <span className='min-w-0'>
                    <span className='block truncate text-sm font-black leading-none'>
                      {option.label}
                    </span>
                    <span
                      className={`mt-1 block truncate text-xs font-bold leading-none ${
                        isSelected ? 'text-cosmo-white/75' : 'text-cosmo-black/55'
                      }`}>
                      {option.detail}
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
  selectedPeriod,
  selectedWeek,
  weeks,
  viewMode,
  periodOptions,
  selectedPeriodOption,
  onViewModeChange,
  onPeriodOptionChange,
  onSelectedWeekChange,
  onExportSelectedWeek,
}: {
  selectedPeriod: DashboardPeriod;
  selectedWeek: StoredWeek;
  weeks: StoredWeek[];
  viewMode: DashboardViewMode;
  periodOptions: DashboardPeriodOption[];
  selectedPeriodOption: DashboardPeriodOption;
  onViewModeChange: (viewMode: DashboardViewMode) => void;
  onPeriodOptionChange: (option: DashboardPeriodOption) => void;
  onSelectedWeekChange: (weekId: string) => void;
  onExportSelectedWeek: () => void;
}) {
  const [isRemoveModalOpen, setIsRemoveModalOpen] = useState(false);

  function handleConfirmRemoveWeek() {
    const nextWeekId = getNextWeekIdAfterDelete(weeks, selectedWeek.id);
    const nextStorage = removeStoredWeek(selectedWeek.id, nextWeekId);

    setIsRemoveModalOpen(false);

    if (nextStorage.latestWeekId) {
      onSelectedWeekChange(nextStorage.latestWeekId);
    }
  }

  const isMonthly = selectedPeriod.periodType === 'monthly';
  const periodDescriptor = isMonthly ? 'monthly' : 'weekly';
  const reportCountLabel =
    selectedPeriod.includedWeekCount === 1
      ? '1 saved report'
      : `${selectedPeriod.includedWeekCount} saved reports`;

  return (
    <>
      <header className='teg-hero-panel overflow-visible p-5 sm:p-6 lg:p-8'>
        <div className='grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px] xl:items-end'>
          <div>
            <div className='teg-eyebrow teg-eyebrow-white mb-4'>
              {selectedPeriod.storeName} {periodDescriptor} KPI review
            </div>

            <h1 className='font-display text-4xl font-black leading-none sm:text-5xl lg:text-6xl'>
              {isMonthly ? 'Spot the trend' : 'Recap the week'}
            </h1>

            <p className='mt-4 max-w-3xl text-base font-medium leading-7 text-cosmo-white/90'>
              {isMonthly
                ? `Viewing ${selectedPeriod.periodLabel} across ${reportCountLabel}. Use this view to see what is changing, where we are winning, and what needs a clearer leadership focus.`
                : `Viewing ${selectedWeek.weekLabel}. Use this view to celebrate wins, identify the clearest follow-up, and turn weekly results into focused team communication.`}
            </p>

            {isMonthly ? (
              <div className='mt-5 rounded-[24px] border-2 border-cosmo-white/20 bg-cosmo-white/10 p-4'>
                <p className='font-tag text-xs font-black uppercase text-cosmo-white/70'>
                  Weekly report still selected
                </p>
                <p className='mt-1 text-sm font-bold leading-6 text-cosmo-white/90'>
                  Export and cleanup actions apply to {selectedWeek.weekLabel}. Monthly view is for
                  trend review only.
                </p>
              </div>
            ) : null}
          </div>

          <div className='rounded-[30px] border-2 border-cosmo-white/25 bg-cosmo-black/15 p-4 backdrop-blur'>
            <div className='mb-4'>
              <p className='font-tag text-xs font-black uppercase text-cosmo-white/70'>
                Review mode
              </p>
              <p className='mt-1 text-sm font-bold leading-5 text-cosmo-white/90'>
                Choose a weekly recap or monthly trend view before taking action.
              </p>
            </div>

            <ViewModeToggle viewMode={viewMode} onViewModeChange={onViewModeChange} />

            <div className='mt-4'>
              <ReportPeriodPicker
                selectedOption={selectedPeriodOption}
                options={periodOptions}
                viewMode={viewMode}
                onOptionChange={onPeriodOptionChange}
              />
            </div>

            <div className='mt-4 rounded-[24px] border-2 border-cosmo-white/20 bg-cosmo-white/10 p-3'>
              <p className='font-tag text-xs font-black uppercase text-cosmo-white/70'>
                Report actions
              </p>
              <p className='mt-1 truncate text-sm font-black text-cosmo-white'>
                {selectedWeek.weekLabel}
              </p>

              <div className='mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-1'>
                <button
                  type='button'
                  onClick={onExportSelectedWeek}
                  className='inline-flex h-12 items-center justify-center rounded-[18px] border-2 border-cosmo-black bg-cosmo-white px-4 text-sm font-black leading-none text-primary-web-red shadow-[3px_4px_0_0_rgba(0,0,0,0.18)] transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cosmo-white/45'>
                  Export weekly recap
                </button>

                <button
                  type='button'
                  onClick={() => setIsRemoveModalOpen(true)}
                  className='inline-flex h-12 items-center justify-center rounded-[18px] border-2 border-cosmo-white/40 bg-cosmo-black/20 px-4 text-sm font-black leading-none text-cosmo-white transition hover:bg-cosmo-black/30 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cosmo-white/35'>
                  Remove local report
                </button>
              </div>
            </div>
          </div>
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
              Remove this saved report?
            </h2>

            <p
              id='remove-week-description'
              className='mt-4 text-sm font-semibold leading-6 text-cosmo-black/70'>
              This only removes the report from this browser. Your original CSV, company systems,
              and source data will stay unchanged.
            </p>

            <div className='mt-6 rounded-[22px] border-2 border-cosmo-black/10 bg-off-white p-4'>
              <p className='font-tag text-xs font-black uppercase tracking-wide text-cosmo-black/60'>
                Selected report
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
                Remove report
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}
