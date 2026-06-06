'use client';

import { useCallback, useDeferredValue, useMemo, useState, useSyncExternalStore } from 'react';
import { AnimatePresence } from 'motion/react';
import * as m from 'motion/react-m';

import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { EmployeeKpiTable } from '@/components/dashboard/EmployeeKpiTable';
import { EmptyDashboardState } from '@/components/dashboard/EmptyDashboardState';
import { KpiMetricGrid } from '@/components/dashboard/KpiMetricGrid';
import { PerformanceCoachingSection } from '@/components/dashboard/PerformanceCoachingSection';
import { StatsGrid } from '@/components/dashboard/StatsGrid';
import { WeekProgressSection } from '@/components/dashboard/WeekProgressSection';
import { trackImpactEvent } from '@/lib/analytics';
import { getEmployeeComparisonKey } from '@/lib/dashboard/comparison';
import { buildPerformanceCoachingViewModel } from '@/lib/dashboard/coaching';
import { EMPTY_STORAGE } from '@/lib/dashboard/constants';
import {
  buildDashboardMetrics,
  buildWeekProgressMetrics,
  findPreviousWeekForStore,
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
import { DEFAULT_SORT_KEY, filterEmployees, rankEmployees } from '@/lib/dashboard/table';
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

  const performanceCoachingView = useMemo(() => {
    if (!selectedPeriod) return null;

    return buildPerformanceCoachingViewModel({
      selectedPeriod,
      previousPeriod,
    });
  }, [previousPeriod, selectedPeriod]);

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

      trackImpactEvent('Dashboard Period Changed', {
        view_mode: viewMode,
      });
    },
    [resetTableControls, storage.weeks, viewMode],
  );

  const handleSelectedWeekChange = useCallback(
    (nextWeekId: string) => {
      setSelectedWeekId(nextWeekId);
      resetTableControls();

      trackImpactEvent('Dashboard Period Changed', {
        view_mode: viewMode,
      });
    },
    [resetTableControls, viewMode],
  );

  const handleViewModeChange = useCallback(
    (nextViewMode: DashboardViewMode) => {
      setViewMode(nextViewMode);
      resetTableControls();

      trackImpactEvent('Dashboard View Mode Changed', {
        view_mode: nextViewMode,
      });
    },
    [resetTableControls],
  );

  const handleSearchTermChange = useCallback(
    (nextSearchTerm: string) => {
      if (!searchTerm.trim() && nextSearchTerm.trim()) {
        trackImpactEvent('Dashboard Search Used', {
          view_mode: viewMode,
        });
      }

      setSearchTerm(nextSearchTerm);
    },
    [searchTerm, viewMode],
  );

  const handleSortKeyChange = useCallback(
    (nextSortKey: SortKey) => {
      if (nextSortKey !== sortKey) {
        trackImpactEvent('Dashboard Sort Changed', {
          sort_key: nextSortKey,
          view_mode: viewMode,
        });
      }

      setSortKey(nextSortKey);
    },
    [sortKey, viewMode],
  );

  const handleExportSelectedWeek = useCallback(() => {
    if (!selectedWeek) return;

    exportWeekForNewsletter(selectedWeek);

    trackImpactEvent('FLNL Export Downloaded', {
      export_format: 'png',
      view_mode: viewMode,
    });
  }, [selectedWeek, viewMode]);

  if (!selectedWeek || !selectedPeriod || !selectedPeriodOption) {
    return <EmptyDashboardState />;
  }

  return (
    <main
      id='main-content'
      className='min-h-[calc(100dvh-82px)] bg-off-white px-5 py-8 text-cosmo-black sm:px-8 lg:px-14'>
      <section
        aria-label='Performance dashboard'
        className='mx-auto w-full max-w-[1440px] space-y-8'>
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

            {performanceCoachingView ? (
              <PerformanceCoachingSection coachingView={performanceCoachingView} />
            ) : null}

            <EmployeeKpiTable
              filteredEmployees={filteredEmployees}
              hasPreviousPeriod={Boolean(previousPeriod)}
              previousEmployeeByKey={previousEmployeeByKey}
              viewMode={viewMode}
              searchTerm={searchTerm}
              sortKey={sortKey}
              onSearchTermChange={handleSearchTermChange}
              onSortKeyChange={handleSortKeyChange}
            />
          </m.div>
        </AnimatePresence>
      </section>
    </main>
  );
}
