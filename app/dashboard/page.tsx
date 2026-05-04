'use client';

import { useCallback, useDeferredValue, useMemo, useState, useSyncExternalStore } from 'react';
import { AnimatePresence } from 'motion/react';
import * as m from 'motion/react-m';

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
import {
  buildMonthlyPeriod,
  buildWeeklyPeriod,
  findPreviousMonthlyPeriod,
  getMonthlyPeriodOptions,
  getWeeklyPeriodOptions,
} from '@/lib/dashboard/monthly';
import { exportWeekForNewsletter } from '@/lib/dashboard/newsletter-export';
import { getStorageSnapshot, subscribeToStorage } from '@/lib/dashboard/storage';
import type {
  DashboardPeriod,
  DashboardPeriodOption,
  DashboardViewMode,
  EmployeeKpiRow,
  KpiCard,
  SortKey,
  StoredWeek,
} from '@/lib/dashboard/types';
import { fadeUp } from '@/lib/motion';

const DEFAULT_SORT_KEY: SortKey = 'replaysSoldPercent';

function getSelectedWeek(
  weeks: StoredWeek[],
  selectedWeekId: string,
  latestWeekId?: string | null,
) {
  const activeWeekId = selectedWeekId || latestWeekId || weeks[0]?.id || '';

  return weeks.find((week) => week.id === activeWeekId) ?? weeks[0] ?? null;
}

function buildPreviousEmployeeMap(previousPeriod: DashboardPeriod | null) {
  const employeesByKey = new Map<string, EmployeeKpiRow>();

  previousPeriod?.employees.forEach((employee) => {
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

  const [viewMode, setViewMode] = useState<DashboardViewMode>('weekly');
  const [selectedWeekId, setSelectedWeekId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>(DEFAULT_SORT_KEY);

  const deferredSearchTerm = useDeferredValue(searchTerm);

  const selectedWeek = useMemo(
    () => getSelectedWeek(storage.weeks, selectedWeekId, storage.latestWeekId),
    [selectedWeekId, storage.latestWeekId, storage.weeks],
  );

  const selectedPeriod = useMemo<DashboardPeriod | null>(() => {
    if (!selectedWeek) return null;

    if (viewMode === 'monthly') {
      return buildMonthlyPeriod(storage.weeks, selectedWeek);
    }

    return buildWeeklyPeriod(selectedWeek);
  }, [selectedWeek, storage.weeks, viewMode]);

  const previousPeriod = useMemo<DashboardPeriod | null>(() => {
    if (!selectedWeek || !selectedPeriod) return null;

    if (viewMode === 'monthly') {
      return findPreviousMonthlyPeriod(storage.weeks, selectedPeriod);
    }

    const previousWeek = findPreviousWeekForStore(storage.weeks, selectedWeek);

    return previousWeek ? buildWeeklyPeriod(previousWeek) : null;
  }, [selectedPeriod, selectedWeek, storage.weeks, viewMode]);

  const periodOptions = useMemo<DashboardPeriodOption[]>(() => {
    if (viewMode === 'monthly') {
      return getMonthlyPeriodOptions(storage.weeks);
    }

    return getWeeklyPeriodOptions(storage.weeks);
  }, [storage.weeks, viewMode]);

  const selectedPeriodOption = useMemo(() => {
    if (!selectedPeriod) return periodOptions[0] ?? null;

    return (
      periodOptions.find((option) => option.id === selectedPeriod.id) ?? periodOptions[0] ?? null
    );
  }, [periodOptions, selectedPeriod]);

  const dashboardMetrics = useMemo<KpiCard[]>(() => {
    if (!selectedPeriod) return [];

    return buildDashboardMetrics(selectedPeriod);
  }, [selectedPeriod]);

  const weekProgressMetrics = useMemo(() => {
    if (!selectedPeriod || !previousPeriod) return [];

    return buildWeekProgressMetrics(selectedPeriod, previousPeriod);
  }, [previousPeriod, selectedPeriod]);

  const previousEmployeeByKey = useMemo(
    () => buildPreviousEmployeeMap(previousPeriod),
    [previousPeriod],
  );

  const rankedEmployees = useMemo(() => {
    if (!selectedPeriod) return [];

    return rankEmployees(selectedPeriod.employees, sortKey);
  }, [selectedPeriod, sortKey]);

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

  const resetTableControls = useCallback(() => {
    setSearchTerm('');
    setSortKey(DEFAULT_SORT_KEY);
  }, []);

  const handlePeriodOptionChange = useCallback(
    (option: DashboardPeriodOption) => {
      const nextSelectedWeek = storage.weeks.find((week) => {
        if (viewMode === 'monthly') {
          return buildMonthlyPeriod(storage.weeks, week)?.id === option.id;
        }

        return buildWeeklyPeriod(week).id === option.id;
      });

      if (!nextSelectedWeek) return;

      setSelectedWeekId(nextSelectedWeek.id);
      resetTableControls();
    },
    [resetTableControls, storage.weeks, viewMode],
  );

  const handleSelectedWeekChange = useCallback(
    (nextWeekId: string) => {
      setSelectedWeekId(nextWeekId);
      resetTableControls();
    },
    [resetTableControls],
  );

  const handleViewModeChange = useCallback(
    (nextViewMode: DashboardViewMode) => {
      setViewMode(nextViewMode);
      resetTableControls();
    },
    [resetTableControls],
  );

  const handleSearchTermChange = useCallback((nextSearchTerm: string) => {
    setSearchTerm(nextSearchTerm);
  }, []);

  const handleExportSelectedWeek = useCallback(() => {
    if (!selectedWeek) return;

    exportWeekForNewsletter(selectedWeek);
  }, [selectedWeek]);

  if (!selectedWeek || !selectedPeriod || !selectedPeriodOption) {
    return <EmptyDashboardState />;
  }

  return (
    <main
      id='main-content'
      className='min-h-[calc(100dvh-82px)] bg-off-white px-5 py-8 text-cosmo-black sm:px-8 lg:px-14'>
      <section aria-label='KPI dashboard' className='mx-auto w-full max-w-[1440px] space-y-8'>
        <DashboardHeader
          selectedPeriod={selectedPeriod}
          selectedWeek={selectedWeek}
          weeks={storage.weeks}
          viewMode={viewMode}
          periodOptions={periodOptions}
          selectedPeriodOption={selectedPeriodOption}
          onViewModeChange={handleViewModeChange}
          onPeriodOptionChange={handlePeriodOptionChange}
          onSelectedWeekChange={handleSelectedWeekChange}
          onExportSelectedWeek={handleExportSelectedWeek}
        />

        <AnimatePresence initial={false} mode='wait'>
          <m.div
            key={`${viewMode}:${selectedPeriod.id}`}
            variants={fadeUp}
            initial={false}
            animate='visible'
            exit='hidden'
            className='space-y-8'>
            <StatsGrid selectedPeriod={selectedPeriod} />

            <KpiMetricGrid metrics={dashboardMetrics} />

            <WeekProgressSection
              selectedPeriod={selectedPeriod}
              previousPeriod={previousPeriod}
              metrics={weekProgressMetrics}
            />

            <EmployeeSpotlightSection
              topReplay={spotlightEmployees.topReplay}
              topReviewAsk={spotlightEmployees.topReviewAsk}
              topPreview={spotlightEmployees.topPreview}
            />

            <EmployeeKpiTable
              filteredEmployees={filteredEmployees}
              hasPreviousPeriod={Boolean(previousPeriod)}
              previousEmployeeByKey={previousEmployeeByKey}
              viewMode={viewMode}
              searchTerm={searchTerm}
              sortKey={sortKey}
              onSearchTermChange={handleSearchTermChange}
              onSortKeyChange={setSortKey}
            />
          </m.div>
        </AnimatePresence>
      </section>
    </main>
  );
}
