'use client';

import type { ChangeEventHandler } from 'react';
import { useCallback, useDeferredValue, useMemo, useState, useSyncExternalStore } from 'react';

import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { EmployeeKpiTable } from '@/components/dashboard/EmployeeKpiTable';
import { EmployeeSpotlightSection } from '@/components/dashboard/EmployeeSpotlightSection';
import { EmptyDashboardState } from '@/components/dashboard/EmptyDashboardState';
import { KpiMetricGrid } from '@/components/dashboard/KpiMetricGrid';
import { StatsGrid } from '@/components/dashboard/StatsGrid';
import { WeekProgressSection } from '@/components/dashboard/WeekProgressSection';
import { getEmployeeComparisonKey } from '@/lib/dashboard/comparison';
import { EMPTY_STORAGE, MINIMUM_GAMES_FOR_RANKING } from '@/lib/dashboard/constants';
import { normalizePercent } from '@/lib/dashboard/formatters';
import {
  buildDashboardMetrics,
  buildWeekProgressMetrics,
  findPreviousWeekForStore,
  getTopEmployee,
} from '@/lib/dashboard/metrics';
import { exportWeekForNewsletter } from '@/lib/dashboard/newsletter-export';
import { getStorageSnapshot, subscribeToStorage } from '@/lib/dashboard/storage';
import type { EmployeeKpiRow, KpiCard, SortKey } from '@/lib/dashboard/types';

type StoredDashboardWeek = (typeof EMPTY_STORAGE)['weeks'][number];

const DEFAULT_SORT_KEY: SortKey = 'replaysSoldPercent';

function getSelectedWeek(
  weeks: StoredDashboardWeek[],
  selectedWeekId: string,
  latestWeekId: string,
) {
  const activeWeekId = selectedWeekId || latestWeekId || weeks[0]?.id || '';

  return weeks.find((week) => week.id === activeWeekId) ?? weeks[0] ?? null;
}

function buildPreviousEmployeeMap(previousWeek: StoredDashboardWeek | null) {
  const employeesByKey = new Map<string, EmployeeKpiRow>();

  previousWeek?.employees.forEach((employee) => {
    employeesByKey.set(getEmployeeComparisonKey(employee), employee);
  });

  return employeesByKey;
}

function getSortValue(employee: EmployeeKpiRow, sortKey: SortKey) {
  const value = Number(employee[sortKey]);

  return sortKey.endsWith('Percent') ? normalizePercent(value) : value;
}

function rankEmployees(employees: EmployeeKpiRow[], sortKey: SortKey) {
  return [...employees]
    .filter((employee) => Number(employee.totalGames) >= MINIMUM_GAMES_FOR_RANKING)
    .sort((a, b) => {
      if (sortKey === 'name') {
        return String(a.name).localeCompare(String(b.name));
      }

      return getSortValue(b, sortKey) - getSortValue(a, sortKey);
    });
}

function filterEmployees(employees: EmployeeKpiRow[], searchTerm: string) {
  const normalizedSearchTerm = searchTerm.trim().toLowerCase();

  if (!normalizedSearchTerm) {
    return employees;
  }

  return employees.filter((employee) =>
    [employee.name, employee.role, employee.storeName]
      .join(' ')
      .toLowerCase()
      .includes(normalizedSearchTerm),
  );
}

export default function DashboardPage() {
  const storage = useSyncExternalStore(subscribeToStorage, getStorageSnapshot, () => EMPTY_STORAGE);

  const [selectedWeekId, setSelectedWeekId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>(DEFAULT_SORT_KEY);

  const deferredSearchTerm = useDeferredValue(searchTerm);

  const selectedWeek = useMemo(
    () => getSelectedWeek(storage.weeks, selectedWeekId, storage.latestWeekId),
    [selectedWeekId, storage.latestWeekId, storage.weeks],
  );

  const previousWeek = useMemo(() => {
    if (!selectedWeek) return null;

    return findPreviousWeekForStore(storage.weeks, selectedWeek);
  }, [selectedWeek, storage.weeks]);

  const dashboardMetrics = useMemo<KpiCard[]>(() => {
    if (!selectedWeek) return [];

    return buildDashboardMetrics(selectedWeek);
  }, [selectedWeek]);

  const weekProgressMetrics = useMemo(() => {
    if (!selectedWeek || !previousWeek) return [];

    return buildWeekProgressMetrics(selectedWeek, previousWeek);
  }, [previousWeek, selectedWeek]);

  const previousEmployeeByKey = useMemo(
    () => buildPreviousEmployeeMap(previousWeek),
    [previousWeek],
  );

  const rankedEmployees = useMemo(() => {
    if (!selectedWeek) return [];

    return rankEmployees(selectedWeek.employees, sortKey);
  }, [selectedWeek, sortKey]);

  const filteredEmployees = useMemo(
    () => filterEmployees(rankedEmployees, deferredSearchTerm),
    [deferredSearchTerm, rankedEmployees],
  );

  const spotlightEmployees = useMemo(
    () => ({
      topReplay: getTopEmployee(rankedEmployees, 'replaysSoldPercent', 'guests'),
      topReviewAsk: getTopEmployee(rankedEmployees, 'reviewsAskedPercent', 'totalGames'),
      topPreview: getTopEmployee(rankedEmployees, 'previewsPercent', 'totalGames'),
    }),
    [rankedEmployees],
  );

  const handleWeekChange = useCallback((nextWeekId: string) => {
    setSelectedWeekId(nextWeekId);
    setSearchTerm('');
    setSortKey(DEFAULT_SORT_KEY);
  }, []);

  const handleSearchTermChange = useCallback<ChangeEventHandler<HTMLInputElement>>((event) => {
    setSearchTerm(event.target.value);
  }, []);

  const handleExportSelectedWeek = useCallback(() => {
    if (!selectedWeek) return;

    exportWeekForNewsletter(selectedWeek);
  }, [selectedWeek]);

  if (!selectedWeek) {
    return <EmptyDashboardState />;
  }

  return (
    <main
      id='main-content'
      className='min-h-dvh bg-off-white px-5 py-6 text-cosmo-black sm:px-8 lg:px-14'>
      <section
        aria-label='Weekly KPI dashboard'
        className='mx-auto w-full max-w-[1440px] space-y-8'>
        <DashboardHeader
          selectedWeek={selectedWeek}
          weeks={storage.weeks}
          onWeekChange={handleWeekChange}
          onExportSelectedWeek={handleExportSelectedWeek}
        />

        <StatsGrid selectedWeek={selectedWeek} />

        <KpiMetricGrid metrics={dashboardMetrics} />

        <WeekProgressSection
          selectedWeek={selectedWeek}
          previousWeek={previousWeek}
          metrics={weekProgressMetrics}
        />

        <EmployeeSpotlightSection
          topReplay={spotlightEmployees.topReplay}
          topReviewAsk={spotlightEmployees.topReviewAsk}
          topPreview={spotlightEmployees.topPreview}
        />

        <EmployeeKpiTable
          filteredEmployees={filteredEmployees}
          previousEmployeeByKey={previousEmployeeByKey}
          previousWeek={previousWeek}
          searchTerm={searchTerm}
          sortKey={sortKey}
          onSearchTermChange={handleSearchTermChange}
          onSortKeyChange={setSortKey}
        />
      </section>
    </main>
  );
}
