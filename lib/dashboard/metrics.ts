import { EMPLOYEE_PROGRESS_METRICS, KPI_GOALS, STEADY_DELTA_THRESHOLD } from './constants';
import { getEmployeeComparisonKey, getStoreComparisonKey } from './comparison';
import { formatPointDelta, normalizePercent, safePercent } from './formatters';
import type {
  EmployeeKpiRow,
  EmployeePercentMetricKey,
  EmployeeProgressSummary,
  ProgressStatus,
  Status,
  StoreKpiRates,
  StoredWeek,
  WeekProgressMetric,
} from './types';

export function getStoreKpiRates(week: StoredWeek): StoreKpiRates {
  return {
    replayPercent: safePercent(week.totals.replaysSold, week.totals.guests),
    reviewsAskedPercent: safePercent(week.totals.reviewsAsked, week.totals.totalGames),
    sharedReplayPercent: safePercent(week.totals.sharedReplay, week.totals.totalGames),
    previewsPercent: safePercent(week.totals.afterGamePreviews, week.totals.totalGames),
  };
}

export function findPreviousWeekForStore(weeks: StoredWeek[], selectedWeek: StoredWeek) {
  const selectedStoreKey = getStoreComparisonKey(selectedWeek.storeName);
  let previousWeek: StoredWeek | null = null;

  for (const week of weeks) {
    const isOlderSameStore =
      week.id !== selectedWeek.id &&
      getStoreComparisonKey(week.storeName) === selectedStoreKey &&
      week.weekStart < selectedWeek.weekStart;

    if (isOlderSameStore && (!previousWeek || week.weekStart > previousWeek.weekStart)) {
      previousWeek = week;
    }
  }

  return previousWeek;
}

export function getProgressStatus(delta: number): ProgressStatus {
  if (delta > STEADY_DELTA_THRESHOLD) return 'improved';
  if (delta < -STEADY_DELTA_THRESHOLD) return 'needsFollowUp';
  return 'steady';
}

export function getProgressLabel(status: ProgressStatus) {
  switch (status) {
    case 'improved':
      return 'Improved';
    case 'steady':
      return 'Held steady';
    default:
      return 'Needs follow-up';
  }
}

export function getProgressClasses(status: ProgressStatus) {
  switch (status) {
    case 'improved':
      return {
        card: 'border-kpi-green/50 bg-[#E5F9D7] text-cosmo-black',
        pill: 'bg-kpi-green text-cosmo-white',
        text: 'text-kpi-green',
      };
    case 'steady':
      return {
        card: 'border-kpi-yellow/70 bg-[#F9E8A5] text-cosmo-black',
        pill: 'bg-kpi-yellow text-cosmo-black',
        text: 'text-[#7A5A00]',
      };
    default:
      return {
        card: 'border-kpi-red/50 bg-[#FCCFCD] text-cosmo-black',
        pill: 'bg-kpi-red text-cosmo-white',
        text: 'text-kpi-red',
      };
  }
}

export function buildWeekProgressMetrics(
  selectedWeek: StoredWeek,
  previousWeek: StoredWeek,
): WeekProgressMetric[] {
  const currentRates = getStoreKpiRates(selectedWeek);
  const previousRates = getStoreKpiRates(previousWeek);

  return [
    {
      label: 'Replay conversion',
      value: currentRates.replayPercent,
      previousValue: previousRates.replayPercent,
      delta: currentRates.replayPercent - previousRates.replayPercent,
      goal: KPI_GOALS.replayPercent,
      detail: 'Replay sales compared with guest volume.',
    },
    {
      label: 'Review ask rate',
      value: currentRates.reviewsAskedPercent,
      previousValue: previousRates.reviewsAskedPercent,
      delta: currentRates.reviewsAskedPercent - previousRates.reviewsAskedPercent,
      goal: KPI_GOALS.reviewsAskedPercent,
      detail: 'Review asks compared with games hosted.',
    },
    {
      label: 'Shared replay rate',
      value: currentRates.sharedReplayPercent,
      previousValue: previousRates.sharedReplayPercent,
      delta: currentRates.sharedReplayPercent - previousRates.sharedReplayPercent,
      goal: KPI_GOALS.sharedReplayPercent,
      detail: 'Shared replay moments compared with games hosted.',
    },
    {
      label: 'Preview ask rate',
      value: currentRates.previewsPercent,
      previousValue: previousRates.previewsPercent,
      delta: currentRates.previewsPercent - previousRates.previewsPercent,
      goal: KPI_GOALS.previewsPercent,
      detail: 'Preview asks compared with games hosted.',
    },
  ];
}

export function getProgressSummary(metrics: WeekProgressMetric[]) {
  let improvedCount = 0;
  let steadyCount = 0;
  let needsFollowUpCount = 0;
  let strongestGain: WeekProgressMetric | null = null;
  let priorityFollowUp: WeekProgressMetric | null = null;

  for (const metric of metrics) {
    const status = getProgressStatus(metric.delta);

    if (status === 'improved') {
      improvedCount += 1;
      if (!strongestGain || metric.delta > strongestGain.delta) {
        strongestGain = metric;
      }
      continue;
    }

    if (status === 'steady') {
      steadyCount += 1;
      continue;
    }

    needsFollowUpCount += 1;
    if (!priorityFollowUp || metric.delta < priorityFollowUp.delta) {
      priorityFollowUp = metric;
    }
  }

  return {
    improvedCount,
    steadyCount,
    needsFollowUpCount,
    strongestGain,
    priorityFollowUp,
  };
}

export function getEmployeeProgressSummary(
  employee: EmployeeKpiRow,
  previousEmployee: EmployeeKpiRow | undefined,
  hasPreviousWeek: boolean,
): EmployeeProgressSummary {
  if (!hasPreviousWeek) {
    return {
      label: 'No prior week',
      detail: 'Add another report',
      status: null,
    };
  }

  if (!previousEmployee) {
    return {
      label: 'New this week',
      detail: 'No matched prior row',
      status: null,
    };
  }

  const movements = EMPLOYEE_PROGRESS_METRICS.map(({ label, metric }) => {
    const currentValue = normalizePercent(Number(employee[metric]));
    const previousValue = normalizePercent(Number(previousEmployee[metric]));

    return {
      label,
      delta: currentValue - previousValue,
    };
  });

  const largestMovement = [...movements].sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))[0];

  if (!largestMovement || Math.abs(largestMovement.delta) <= STEADY_DELTA_THRESHOLD) {
    return {
      label: 'Held steady',
      detail: 'No major KPI movement',
      status: 'steady',
    };
  }

  const status = getProgressStatus(largestMovement.delta);

  return {
    label: `${largestMovement.label} ${formatPointDelta(largestMovement.delta)}`,
    detail: getProgressLabel(status),
    status,
  };
}

export function getGoalStatus(
  value: number,
  goal: number,
  direction: 'higher' | 'lower' = 'higher',
): Status {
  if (direction === 'lower') {
    if (value <= goal) return 'onTrack';
    if (value <= goal * 1.15) return 'watch';
    return 'needsFocus';
  }

  if (value >= goal) return 'onTrack';
  if (value >= goal * 0.9) return 'watch';
  return 'needsFocus';
}

export function getStatusLabel(status: Status) {
  switch (status) {
    case 'onTrack':
      return 'On track';
    case 'watch':
      return 'Watch';
    default:
      return 'Needs focus';
  }
}

export function getStatusClasses(status: Status) {
  switch (status) {
    case 'onTrack':
      return {
        card: 'border-kpi-green/50 bg-[#E5F9D7] text-cosmo-black',
        pill: 'bg-kpi-green text-cosmo-white',
        bar: 'bg-kpi-green',
        soft: 'bg-[#E5F9D7] text-cosmo-black',
      };
    case 'watch':
      return {
        card: 'border-kpi-yellow/70 bg-[#F9E8A5] text-cosmo-black',
        pill: 'bg-kpi-yellow text-cosmo-black',
        bar: 'bg-kpi-yellow',
        soft: 'bg-[#F9E8A5] text-cosmo-black',
      };
    default:
      return {
        card: 'border-kpi-red/50 bg-[#FCCFCD] text-cosmo-black',
        pill: 'bg-kpi-red text-cosmo-white',
        bar: 'bg-kpi-red',
        soft: 'bg-[#FCCFCD] text-cosmo-black',
      };
  }
}

export function getNewsletterCellColor(value: number, goal: number) {
  const percent = normalizePercent(value);
  const status = getGoalStatus(percent, goal);

  switch (status) {
    case 'onTrack':
      return '#29892A';
    case 'watch':
      return '#E8C349';
    default:
      return '#B3261E';
  }
}

export function getNewsletterRows(week: StoredWeek) {
  return week.employees
    .filter((employee) => {
      const name = String(employee.name ?? '')
        .trim()
        .toLowerCase();
      return name !== 'management';
    })
    .sort((a, b) => {
      const gamesDifference = Number(b.totalGames) - Number(a.totalGames);
      if (gamesDifference !== 0) return gamesDifference;

      return String(a.name).localeCompare(String(b.name));
    });
}

export function getTopEmployee(
  employees: EmployeeKpiRow[],
  metric: EmployeePercentMetricKey,
  minimumCount: 'guests' | 'totalGames',
) {
  let topEmployee: EmployeeKpiRow | undefined;

  employees.forEach((employee) => {
    if (Number(employee[minimumCount]) <= 0) return;

    const currentValue = normalizePercent(Number(employee[metric]));
    const topValue = topEmployee ? normalizePercent(Number(topEmployee[metric])) : -Infinity;

    if (
      !topEmployee ||
      currentValue > topValue ||
      (currentValue === topValue && Number(employee.totalGames) > Number(topEmployee.totalGames))
    ) {
      topEmployee = employee;
    }
  });

  return topEmployee;
}

export function buildDashboardMetrics(selectedWeek: StoredWeek) {
  const { totals } = selectedWeek;
  const rates = getStoreKpiRates(selectedWeek);

  return [
    {
      label: 'Replay conversion',
      value: rates.replayPercent,
      goal: KPI_GOALS.replayPercent,
      detail: `${totals.replaysSold.toLocaleString('en-US')} replays sold from ${totals.guests.toLocaleString(
        'en-US',
      )} guests served.`,
      direction: 'higher' as const,
    },
    {
      label: 'Review ask rate',
      value: rates.reviewsAskedPercent,
      goal: KPI_GOALS.reviewsAskedPercent,
      detail: `${totals.reviewsAsked.toLocaleString('en-US')} review asks across ${totals.totalGames.toLocaleString(
        'en-US',
      )} games.`,
      direction: 'higher' as const,
    },
    {
      label: 'Shared replay rate',
      value: rates.sharedReplayPercent,
      goal: KPI_GOALS.sharedReplayPercent,
      detail: `${totals.sharedReplay.toLocaleString('en-US')} shared replay moments across ${totals.totalGames.toLocaleString(
        'en-US',
      )} games.`,
      direction: 'higher' as const,
    },
    {
      label: 'Preview ask rate',
      value: rates.previewsPercent,
      goal: KPI_GOALS.previewsPercent,
      detail: `${totals.afterGamePreviews.toLocaleString('en-US')} previews shared across ${totals.totalGames.toLocaleString(
        'en-US',
      )} games.`,
      direction: 'higher' as const,
    },
  ];
}

export { getEmployeeComparisonKey };
