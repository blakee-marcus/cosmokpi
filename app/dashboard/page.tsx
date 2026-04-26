'use client';

import { useDeferredValue, useMemo, useState, useSyncExternalStore } from 'react';

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

export default function DashboardPage() {
  const storage = useSyncExternalStore(subscribeToStorage, getStorageSnapshot, () => EMPTY_STORAGE);
  const [selectedWeekId, setSelectedWeekId] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('replaysSoldPercent');
  const deferredSearchTerm = useDeferredValue(searchTerm);

  const selectedWeek = useMemo(() => {
    const activeWeekId = selectedWeekId || storage.latestWeekId || storage.weeks[0]?.id || '';
    return storage.weeks.find((week) => week.id === activeWeekId) ?? storage.weeks[0] ?? null;
  }, [selectedWeekId, storage.latestWeekId, storage.weeks]);

  const previousWeek = useMemo(() => {
    if (!selectedWeek) return null;
    return findPreviousWeekForStore(storage.weeks, selectedWeek);
  }, [selectedWeek, storage.weeks]);

  const weekProgressMetrics = useMemo(() => {
    if (!selectedWeek || !previousWeek) return [];
    return buildWeekProgressMetrics(selectedWeek, previousWeek);
  }, [previousWeek, selectedWeek]);

  const previousEmployeeByKey = useMemo(() => {
    const employeesByKey = new Map<string, EmployeeKpiRow>();

    if (!previousWeek) {
      return employeesByKey;
    }

    previousWeek.employees.forEach((employee) => {
      employeesByKey.set(getEmployeeComparisonKey(employee), employee);
    });

    return employeesByKey;
  }, [previousWeek]);

  const dashboardMetrics = useMemo<KpiCard[]>(() => {
    if (!selectedWeek) return [];
    return buildDashboardMetrics(selectedWeek);
  }, [selectedWeek]);

  const rankedEmployees = useMemo(() => {
    if (!selectedWeek) return [];

    return [...selectedWeek.employees]
      .filter((employee) => Number(employee.totalGames) >= MINIMUM_GAMES_FOR_RANKING)
      .sort((a, b) => {
        if (sortKey === 'name') {
          return String(a.name).localeCompare(String(b.name));
        }

        const aValue = Number(a[sortKey]);
        const bValue = Number(b[sortKey]);
        return (
          (sortKey.endsWith('Percent') ? normalizePercent(bValue) : bValue) -
          (sortKey.endsWith('Percent') ? normalizePercent(aValue) : aValue)
        );
      });
  }, [selectedWeek, sortKey]);

  const filteredEmployees = useMemo(() => {
    const term = deferredSearchTerm.trim().toLowerCase();

    return rankedEmployees.filter((employee) => {
      if (!term) return true;

      return [employee.name, employee.role, employee.storeName]
        .join(' ')
        .toLowerCase()
        .includes(term);
    });
  }, [deferredSearchTerm, rankedEmployees]);

  const spotlightEmployees = useMemo(
    () => ({
      topReplay: getTopEmployee(rankedEmployees, 'replaysSoldPercent', 'guests'),
      topReviewAsk: getTopEmployee(rankedEmployees, 'reviewsAskedPercent', 'totalGames'),
      topPreview: getTopEmployee(rankedEmployees, 'previewsPercent', 'totalGames'),
    }),
    [rankedEmployees],
  );

  if (!selectedWeek) {
    return <EmptyDashboardState />;
  }

  return (
    <main
      id='main-content'
      className='min-h-dvh bg-off-white px-5 py-6 text-cosmo-black sm:px-8 lg:px-14'>
      <section className='mx-auto w-full max-w-[1440px] space-y-8'>
        <DashboardHeader
          selectedWeek={selectedWeek}
          weeks={storage.weeks}
          onWeekChange={setSelectedWeekId}
          onExportSelectedWeek={() => exportWeekForNewsletter(selectedWeek)}
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
          onSearchTermChange={setSearchTerm}
          onSortKeyChange={setSortKey}
        />
      </section>
    </main>
  );
}
