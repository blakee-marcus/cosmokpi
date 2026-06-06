import {
  memo,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from 'react';
import { AnimatePresence } from 'motion/react';
import * as m from 'motion/react-m';

import { getEmployeeComparisonKey } from '@/lib/dashboard/comparison';
import { KPI_GOALS, MINIMUM_GAMES_FOR_RANKING, SORT_OPTIONS } from '@/lib/dashboard/constants';
import { formatNumber, formatPercent, normalizePercent } from '@/lib/dashboard/formatters';
import {
  getEmployeeProgressSummary,
  getGoalStatus,
  getProgressClasses,
  getStatusClasses,
  getStatusLabel,
} from '@/lib/dashboard/metrics';
import type { DashboardViewMode, EmployeeKpiRow, SortKey } from '@/lib/dashboard/types';
import { fadeUp } from '@/lib/motion';

const EmployeePercentCell = memo(function EmployeePercentCell({
  value,
  goal,
}: {
  value: number;
  goal: number;
}) {
  const percent = normalizePercent(value);
  const status = getGoalStatus(percent, goal);
  const classes = getStatusClasses(status);
  const progress = goal ? Math.min((percent / goal) * 100, 100) : 0;

  return (
    <div className='min-w-[9.5rem] rounded-[18px] border border-cosmo-black/10 bg-cosmo-white px-3 py-2 shadow-[2px_3px_0_0_rgba(17,17,17,0.08)]'>
      <div className='flex items-center justify-between gap-2'>
        <span className='font-display text-lg font-black leading-none tabular-nums text-cosmo-black'>
          {formatPercent(percent)}
        </span>

        <span
          className={`font-tag inline-flex h-6 shrink-0 items-center justify-center whitespace-nowrap rounded-full px-2.5 text-[10px] font-black uppercase leading-none ${classes.soft}`}>
          {getStatusLabel(status)}
        </span>
      </div>

      <div className='mt-2 h-2 overflow-hidden rounded-full bg-comic-fog'>
        <div className={`h-full rounded-full ${classes.bar}`} style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
});

const EmployeeProgressCell = memo(function EmployeeProgressCell({
  employee,
  previousEmployee,
  hasPreviousPeriod,
  periodName,
}: {
  employee: EmployeeKpiRow;
  previousEmployee?: EmployeeKpiRow;
  hasPreviousPeriod: boolean;
  periodName: string;
}) {
  const summary = getEmployeeProgressSummary(
    employee,
    previousEmployee,
    hasPreviousPeriod,
    periodName,
  );
  const classes = summary.status ? getProgressClasses(summary.status) : null;

  return (
    <div className='min-w-[10rem]'>
      <span
        className={`font-tag inline-flex min-h-7 items-center rounded-full px-3 text-[11px] font-black uppercase leading-none ${
          classes ? classes.pill : 'bg-comic-fog text-ink-soft'
        }`}>
        {summary.label}
      </span>

      <p className={`mt-2 text-xs font-black ${classes ? classes.text : 'text-ink-soft'}`}>
        {summary.detail}
      </p>
    </div>
  );
});

const EmployeeTableRow = memo(function EmployeeTableRow({
  employee,
  index,
  previousEmployee,
  hasPreviousPeriod,
  periodName,
}: {
  employee: EmployeeKpiRow;
  index: number;
  previousEmployee?: EmployeeKpiRow;
  hasPreviousPeriod: boolean;
  periodName: string;
}) {
  const rowTone = index % 2 === 0 ? 'bg-cosmo-white' : 'bg-off-white';

  return (
    <tr
      tabIndex={0}
      className={`${rowTone} transition-colors hover:bg-comic-fog focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary-web-red/30`}>
      <td className='border-t border-cosmo-black/10 px-5 py-4'>
        <div className='flex items-center gap-3'>
          <div className='font-tag flex size-8 shrink-0 items-center justify-center rounded-full bg-primary-web-red text-xs font-black text-cosmo-white shadow-[2px_3px_0_0_rgba(17,17,17,1)]'>
            {index + 1}
          </div>

          <div className='min-w-0'>
            <p className='truncate font-heading text-base font-black leading-tight text-cosmo-black'>
              {employee.name}
            </p>
            <p className='mt-1 truncate text-xs font-semibold text-ink-soft'>
              {employee.storeName}
            </p>
          </div>
        </div>
      </td>

      <td className='border-t border-cosmo-black/10 px-5 py-4 text-sm font-bold text-ink-soft'>
        {employee.role || 'Team member'}
      </td>

      <td className='border-t border-cosmo-black/10 px-5 py-4 text-center font-display text-xl font-black tabular-nums text-cosmo-black'>
        {formatNumber(Number(employee.totalGames))}
      </td>

      <td className='border-t border-cosmo-black/10 px-5 py-4 text-center font-display text-xl font-black tabular-nums text-cosmo-black'>
        {formatNumber(Number(employee.guests))}
      </td>

      <td className='border-t border-cosmo-black/10 px-5 py-4'>
        <EmployeeProgressCell
          employee={employee}
          previousEmployee={previousEmployee}
          hasPreviousPeriod={hasPreviousPeriod}
          periodName={periodName}
        />
      </td>

      <td className='border-t border-cosmo-black/10 px-5 py-4'>
        <EmployeePercentCell
          value={Number(employee.replaysSoldPercent)}
          goal={KPI_GOALS.replayPercent}
        />
      </td>

      <td className='border-t border-cosmo-black/10 px-5 py-4'>
        <EmployeePercentCell
          value={Number(employee.reviewsAskedPercent)}
          goal={KPI_GOALS.reviewsAskedPercent}
        />
      </td>

      <td className='border-t border-cosmo-black/10 px-5 py-4'>
        <EmployeePercentCell
          value={Number(employee.sharedReplayPercent)}
          goal={KPI_GOALS.sharedReplayPercent}
        />
      </td>

      <td className='border-t border-cosmo-black/10 px-5 py-4'>
        <EmployeePercentCell
          value={Number(employee.previewsPercent)}
          goal={KPI_GOALS.previewsPercent}
        />
      </td>
    </tr>
  );
});

function SearchField({
  searchTerm,
  onSearchTermChange,
}: {
  searchTerm: string;
  onSearchTermChange: (value: string) => void;
}) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const hasSearchTerm = searchTerm.trim().length > 0;

  const clearSearch = useCallback(() => {
    onSearchTermChange();
    inputRef.current?.focus();
  }, [onSearchTermChange]);

  return (
    <div className='relative sm:w-72'>
      <label htmlFor={inputId} className='sr-only'>
        Search team members
      </label>

      <div className='group flex h-12 items-center gap-3 rounded-[18px] border-2 border-cosmo-black bg-cosmo-white px-3 shadow-[4px_5px_0_0_rgba(17,17,17,1)] transition-transform focus-within:-translate-y-0.5 focus-within:ring-4 focus-within:ring-primary-web-red/30 hover:-translate-y-0.5'>
        <span
          aria-hidden='true'
          className='grid size-8 shrink-0 place-items-center rounded-full bg-primary-web-red text-cosmo-white shadow-[2px_3px_0_0_rgba(17,17,17,1)]'>
          <svg
            viewBox='0 0 20 20'
            className='size-4'
            fill='none'
            stroke='currentColor'
            strokeWidth='2'>
            <path d='m14 14 3.5 3.5' strokeLinecap='round' />
            <circle cx='8.5' cy='8.5' r='5.5' />
          </svg>
        </span>

        <input
          ref={inputRef}
          id={inputId}
          type='search'
          value={searchTerm}
          onChange={(event) => onSearchTermChange(event.target.value)}
          placeholder='Search team members'
          className='min-w-0 flex-1 bg-transparent text-sm font-black text-cosmo-black outline-none placeholder:text-ink-soft/70'
        />

        {hasSearchTerm ? (
          <button
            type='button'
            onClick={clearSearch}
            aria-label='Clear team member search'
            className='font-tag shrink-0 rounded-full border-2 border-cosmo-black bg-comic-fog px-3 py-1.5 text-[10px] font-black uppercase leading-none text-cosmo-black shadow-[2px_3px_0_0_rgba(17,17,17,1)] transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary-web-red/30 active:translate-y-0.5 active:shadow-[1px_2px_0_0_rgba(17,17,17,1)]'>
            Clear
          </button>
        ) : null}
      </div>
    </div>
  );
}

function SortDropdown({
  sortKey,
  onSortKeyChange,
}: {
  sortKey: SortKey;
  onSortKeyChange: (value: SortKey) => void;
}) {
  const listboxId = useId();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(() =>
    Math.max(
      SORT_OPTIONS.findIndex((option) => option.value === sortKey),
      0,
    ),
  );

  const selectedOption = useMemo(
    () => SORT_OPTIONS.find((option) => option.value === sortKey) ?? SORT_OPTIONS[0],
    [sortKey],
  );

  const selectOption = useCallback(
    (nextSortKey: SortKey) => {
      onSortKeyChange(nextSortKey);
      setIsOpen(false);
    },
    [onSortKeyChange],
  );

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLButtonElement>) => {
      if (event.key === 'ArrowDown') {
        event.preventDefault();

        if (!isOpen) {
          setIsOpen(true);
          return;
        }

        setActiveIndex((currentIndex) => (currentIndex + 1) % SORT_OPTIONS.length);
      }

      if (event.key === 'ArrowUp') {
        event.preventDefault();

        if (!isOpen) {
          setIsOpen(true);
          return;
        }

        setActiveIndex(
          (currentIndex) => (currentIndex - 1 + SORT_OPTIONS.length) % SORT_OPTIONS.length,
        );
      }

      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();

        if (!isOpen) {
          setIsOpen(true);
          return;
        }

        selectOption(SORT_OPTIONS[activeIndex].value as SortKey);
      }

      if (event.key === 'Escape') {
        event.preventDefault();
        setIsOpen(false);
      }
    },
    [activeIndex, isOpen, selectOption],
  );

  useEffect(() => {
    const selectedIndex = SORT_OPTIONS.findIndex((option) => option.value === sortKey);
    setActiveIndex(Math.max(selectedIndex, 0));
  }, [sortKey]);

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (!dropdownRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('pointerdown', handlePointerDown);

    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, []);

  return (
    <div ref={dropdownRef} className='relative sm:min-w-56'>
      <label htmlFor={listboxId} className='sr-only'>
        Sort team member table
      </label>

      <button
        id={listboxId}
        type='button'
        aria-haspopup='listbox'
        aria-expanded={isOpen}
        aria-controls={`${listboxId}-options`}
        onClick={() => setIsOpen((currentValue) => !currentValue)}
        onKeyDown={handleKeyDown}
        className='group flex h-12 w-full items-center justify-between gap-3 rounded-[18px] border-2 border-cosmo-black bg-cosmo-white px-4 text-left shadow-[4px_5px_0_0_rgba(17,17,17,1)] transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary-web-red/30 active:translate-y-0.5 active:shadow-[2px_3px_0_0_rgba(17,17,17,1)]'>
        <span className='min-w-0'>
          <span className='font-tag block text-[10px] font-black uppercase leading-none text-primary-web-red'>
            Sort by
          </span>
          <span className='mt-1 block truncate text-sm font-black text-cosmo-black'>
            {selectedOption.label}
          </span>
        </span>

        <span
          aria-hidden='true'
          className={`grid size-8 shrink-0 place-items-center rounded-full bg-primary-web-red text-cosmo-white shadow-[2px_3px_0_0_rgba(17,17,17,1)] transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}>
          <svg viewBox='0 0 20 20' className='size-4' fill='currentColor'>
            <path
              fillRule='evenodd'
              d='M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.168l3.71-3.938a.75.75 0 1 1 1.08 1.04l-4.25 4.5a.75.75 0 0 1-1.08 0l-4.25-4.5a.75.75 0 0 1 .02-1.06Z'
              clipRule='evenodd'
            />
          </svg>
        </span>
      </button>

      <AnimatePresence>
        {isOpen ? (
          <m.ul
            id={`${listboxId}-options`}
            role='listbox'
            aria-labelledby={listboxId}
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.16 }}
            className='absolute right-0 z-30 mt-3 max-h-80 w-full min-w-56 overflow-auto rounded-[22px] border-2 border-cosmo-black bg-cosmo-white p-2 shadow-[6px_7px_0_0_rgba(17,17,17,1)]'>
            {SORT_OPTIONS.map((option, index) => {
              const isSelected = option.value === selectedOption.value;
              const isActive = index === activeIndex;

              return (
                <li
                  key={option.value}
                  role='option'
                  aria-selected={isSelected}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => selectOption(option.value as SortKey)}
                  className={`cursor-pointer rounded-[16px] px-3 py-3 text-sm font-black transition-colors ${
                    isSelected
                      ? 'bg-primary-web-red text-cosmo-white'
                      : isActive
                        ? 'bg-comic-fog text-cosmo-black'
                        : 'text-cosmo-black hover:bg-comic-fog'
                  }`}>
                  {option.label}
                </li>
              );
            })}
          </m.ul>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

export function EmployeeKpiTable({
  filteredEmployees,
  previousEmployeeByKey,
  hasPreviousPeriod,
  viewMode,
  searchTerm,
  sortKey,
  onSearchTermChange,
  onSortKeyChange,
}: {
  filteredEmployees: EmployeeKpiRow[];
  previousEmployeeByKey: Map<string, EmployeeKpiRow>;
  hasPreviousPeriod: boolean;
  viewMode: DashboardViewMode;
  searchTerm: string;
  sortKey: SortKey;
  onSearchTermChange: (value: string) => void;
  onSortKeyChange: (value: SortKey) => void;
}) {
  const periodName = viewMode === 'monthly' ? 'month' : 'week';
  const rankingPeriodLabel = viewMode === 'monthly' ? 'this month' : 'this week';

  return (
    <m.section layout className='snappy-section teg-panel overflow-hidden text-cosmo-black'>
      <div className='flex flex-col gap-4 border-b-2 border-cosmo-black/10 bg-comic-fog p-5 lg:flex-row lg:items-center lg:justify-between'>
        <div>
          <p className='font-tag text-sm font-black uppercase text-primary-web-red'>
            Coaching view
          </p>
          <h2 className='font-heading mt-2 text-2xl font-black'>Team performance table</h2>
          <p className='mt-1 max-w-3xl text-sm font-medium text-ink-soft'>
            Use this table to spot who needs recognition, who needs coaching, and where follow-up
            should happen next. Rankings only include team members with at least{' '}
            {MINIMUM_GAMES_FOR_RANKING} games in {rankingPeriodLabel}.
          </p>
        </div>

        <div className='flex flex-col gap-3 sm:flex-row sm:items-center'>
          <SearchField searchTerm={searchTerm} onSearchTermChange={onSearchTermChange} />

          <SortDropdown sortKey={sortKey} onSortKeyChange={onSortKeyChange} />
        </div>
      </div>

      <div className='p-5'>
        <div className='overflow-hidden rounded-[30px] border-2 border-cosmo-black bg-cosmo-white shadow-[6px_7px_0_0_rgba(17,17,17,1)]'>
          <div className='overflow-x-auto'>
            <div aria-live='polite' aria-atomic='true'>
              <table className='w-full min-w-[1240px] border-separate border-spacing-0 text-left text-sm'>
                <thead>
                  <tr className='font-tag text-xs uppercase tracking-wide text-cosmo-white'>
                    <th scope='col' className='bg-primary-web-red px-5 py-4 font-black'>
                      Team member
                    </th>
                    <th scope='col' className='bg-primary-web-red px-5 py-4 font-black'>
                      Role
                    </th>
                    <th scope='col' className='bg-primary-web-red px-5 py-4 text-center font-black'>
                      Games
                    </th>
                    <th scope='col' className='bg-primary-web-red px-5 py-4 text-center font-black'>
                      Guests
                    </th>
                    <th scope='col' className='bg-primary-web-red px-5 py-4 font-black'>
                      Trend
                    </th>
                    <th scope='col' className='bg-primary-web-red px-5 py-4 font-black'>
                      Replay
                    </th>
                    <th scope='col' className='bg-primary-web-red px-5 py-4 font-black'>
                      Review ask
                    </th>
                    <th scope='col' className='bg-primary-web-red px-5 py-4 font-black'>
                      Shared replay
                    </th>
                    <th scope='col' className='bg-primary-web-red px-5 py-4 font-black'>
                      Preview
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredEmployees.map((employee, index) => (
                    <EmployeeTableRow
                      key={`${getEmployeeComparisonKey(employee)}:${String(employee.role)}`}
                      employee={employee}
                      index={index}
                      previousEmployee={previousEmployeeByKey.get(
                        getEmployeeComparisonKey(employee),
                      )}
                      hasPreviousPeriod={hasPreviousPeriod}
                      periodName={periodName}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {!filteredEmployees.length ? (
          <m.div
            key='empty-table-results'
            variants={fadeUp}
            initial='hidden'
            animate='visible'
            exit='hidden'
            className='px-8 pb-8 text-center'>
            <div className='mx-auto max-w-md rounded-[24px] border-2 border-cosmo-black bg-cosmo-white px-5 py-4 shadow-[4px_5px_0_0_rgba(17,17,17,1)]'>
              <p className='font-heading text-lg font-black text-cosmo-black'>No matches found</p>
              <p className='mt-1 text-sm font-semibold text-ink-soft'>
                Try a different search or reset the ranking filter.
              </p>
            </div>
          </m.div>
        ) : null}
      </AnimatePresence>
    </m.section>
  );
}
