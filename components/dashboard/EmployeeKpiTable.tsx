import { memo } from 'react';

import { getEmployeeComparisonKey } from '@/lib/dashboard/comparison';
import {
  KPI_GOALS,
  MINIMUM_GAMES_FOR_RANKING,
  SORT_OPTIONS,
} from '@/lib/dashboard/constants';
import { formatNumber, formatPercent, normalizePercent } from '@/lib/dashboard/formatters';
import {
  getEmployeeProgressSummary,
  getGoalStatus,
  getProgressClasses,
  getStatusClasses,
  getStatusLabel,
} from '@/lib/dashboard/metrics';
import type {
  DashboardViewMode,
  EmployeeKpiRow,
  SortKey,
} from '@/lib/dashboard/types';

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
          <div className='font-tag flex size-8 shrink-0 items-center justify-center rounded-full bg-primary-web-red text-xs font-black text-cosmo-white'>
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
    <section className='snappy-section teg-panel overflow-hidden text-cosmo-black'>
      <div className='flex flex-col gap-4 border-b-2 border-cosmo-black/10 bg-comic-fog p-5 lg:flex-row lg:items-center lg:justify-between'>
        <div>
          <p className='font-tag text-sm font-black uppercase text-primary-web-red'>
            Coaching view
          </p>
          <h2 className='font-heading mt-2 text-2xl font-black'>Team member KPI table</h2>
          <p className='mt-1 text-sm font-medium text-ink-soft'>
            Ranking includes team members with at least {MINIMUM_GAMES_FOR_RANKING} games in{' '}
            {rankingPeriodLabel} so follow-up stays fair and useful.
          </p>
        </div>

        <div className='flex flex-col gap-3 sm:flex-row'>
          <label htmlFor='employee-search' className='sr-only'>
            Search team members
          </label>
          <input
            id='employee-search'
            value={searchTerm}
            onChange={(event) => onSearchTermChange(event.target.value)}
            placeholder='Search team members...'
            className='teg-field h-12 px-4 text-sm font-bold outline-none sm:w-64'
          />
          <label htmlFor='sort-select' className='sr-only'>
            Sort by metric
          </label>
          <select
            id='sort-select'
            value={sortKey}
            onChange={(event) => onSortKeyChange(event.target.value as SortKey)}
            className='teg-field h-12 px-4 text-sm font-bold outline-none'>
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                Sort by {option.label}
              </option>
            ))}
          </select>
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
                      Period change
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

      {!filteredEmployees.length ? (
        <div className='p-8 text-center font-semibold text-ink-soft'>
          No team members match the current search or ranking filters.
        </div>
      ) : null}
    </section>
  );
}
