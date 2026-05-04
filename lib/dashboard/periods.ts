import type {
  DashboardPeriod,
  DashboardPeriodOption,
  DashboardViewMode,
  EmployeeKpiRow,
  StoredWeek,
} from '@/lib/dashboard/types';

const MONTH_FORMATTER = new Intl.DateTimeFormat('en-US', {
  month: 'long',
  year: 'numeric',
});

const SHORT_DATE_FORMATTER = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
});

function parseLocalDate(dateValue: string) {
  return new Date(`${dateValue}T00:00:00`);
}

function getMonthKey(week: StoredWeek) {
  const date = parseLocalDate(week.weekStart);
  const month = `${date.getMonth() + 1}`.padStart(2, '0');

  return `${date.getFullYear()}-${month}`;
}

function getMonthLabel(monthKey: string) {
  const [year, month] = monthKey.split('-').map(Number);

  return MONTH_FORMATTER.format(new Date(year, month - 1, 1));
}

function formatDateRange(weeks: StoredWeek[]) {
  const sortedWeeks = [...weeks].sort((a, b) => a.weekStart.localeCompare(b.weekStart));
  const firstWeek = sortedWeeks[0];
  const lastWeek = sortedWeeks[sortedWeeks.length - 1];

  if (!firstWeek || !lastWeek) return 'No reports';

  const firstDate = SHORT_DATE_FORMATTER.format(parseLocalDate(firstWeek.weekStart));
  const lastDate = SHORT_DATE_FORMATTER.format(parseLocalDate(lastWeek.weekStart));

  if (firstDate === lastDate) return firstDate;

  return `${firstDate} - ${lastDate}`;
}

function percentage(numerator: number, denominator: number) {
  if (denominator <= 0) return 0;

  return (numerator / denominator) * 100;
}

function getEmployeeKey(employee: EmployeeKpiRow) {
  return `${employee.name.trim().toLowerCase()}::${employee.storeName.trim().toLowerCase()}`;
}

function aggregateEmployees(weeks: StoredWeek[]) {
  const employeesByKey = new Map<string, EmployeeKpiRow>();

  weeks.forEach((week) => {
    week.employees.forEach((employee) => {
      const key = getEmployeeKey(employee);
      const current = employeesByKey.get(key);

      if (!current) {
        employeesByKey.set(key, { ...employee });
        return;
      }

      const nextTotalGames = current.totalGames + employee.totalGames;
      const nextGuests = current.guests + employee.guests;
      const nextReplaysSold = current.replaysSold + employee.replaysSold;
      const nextSues = current.SUEs + employee.SUEs;
      const nextReviewsAsked = current.reviewsAsked + employee.reviewsAsked;
      const nextSharedReplay = current.sharedReplay + employee.sharedReplay;
      const nextAfterGamePreviews = current.afterGamePreviews + employee.afterGamePreviews;

      employeesByKey.set(key, {
        ...current,
        role: current.role || employee.role,
        totalGames: nextTotalGames,
        guests: nextGuests,
        replaysSold: nextReplaysSold,
        SUEs: nextSues,
        reviewsAsked: nextReviewsAsked,
        sharedReplay: nextSharedReplay,
        afterGamePreviews: nextAfterGamePreviews,
        replaysSoldPercent: percentage(nextReplaysSold, nextGuests),
        suePercent: percentage(nextSues, nextTotalGames),
        reviewsAskedPercent: percentage(nextReviewsAsked, nextTotalGames),
        sharedReplayPercent: percentage(nextSharedReplay, nextTotalGames),
        previewsPercent: percentage(nextAfterGamePreviews, nextTotalGames),
      });
    });
  });

  return [...employeesByKey.values()].sort((a, b) => a.name.localeCompare(b.name));
}

function aggregateWeeks(weeks: StoredWeek[], periodLabel: string): StoredWeek {
  const sortedWeeks = [...weeks].sort((a, b) => b.weekStart.localeCompare(a.weekStart));
  const latestWeek = sortedWeeks[0];

  if (!latestWeek) {
    throw new Error('Cannot aggregate an empty dashboard period.');
  }

  const employees = aggregateEmployees(sortedWeeks);

  const totals = sortedWeeks.reduce(
    (nextTotals, week) => ({
      employees: employees.length,
      totalGames: nextTotals.totalGames + week.totals.totalGames,
      guests: nextTotals.guests + week.totals.guests,
      replaysSold: nextTotals.replaysSold + week.totals.replaysSold,
      reviewsAsked: nextTotals.reviewsAsked + week.totals.reviewsAsked,
      sharedReplay: nextTotals.sharedReplay + week.totals.sharedReplay,
      afterGamePreviews: nextTotals.afterGamePreviews + week.totals.afterGamePreviews,
    }),
    {
      employees: employees.length,
      totalGames: 0,
      guests: 0,
      replaysSold: 0,
      reviewsAsked: 0,
      sharedReplay: 0,
      afterGamePreviews: 0,
    } satisfies StoredWeek['totals'],
  );

  return {
    ...latestWeek,
    id: `month:${getMonthKey(latestWeek)}`,
    weekStart: sortedWeeks[sortedWeeks.length - 1]?.weekStart ?? latestWeek.weekStart,
    weekLabel: periodLabel,
    fileName: `${periodLabel} KPI aggregate`,
    uploadedAt: latestWeek.uploadedAt,
    totals,
    employees,
  };
}

function createWeeklyPeriod(week: StoredWeek): DashboardPeriod {
  return {
    id: `week:${week.id}`,
    periodType: 'weekly',
    periodLabel: week.weekLabel,
    storeName: week.storeName,
    includedWeekCount: 1,
    includedWeekLabels: [week.weekLabel],
    anchorWeekId: week.id,
    weekIds: [week.id],
    weeks: [week],
    aggregateWeek: week,
    totals: week.totals,
    employees: week.employees,
  };
}

function createMonthlyPeriod(monthKey: string, weeks: StoredWeek[]): DashboardPeriod {
  const sortedWeeks = [...weeks].sort((a, b) => b.weekStart.localeCompare(a.weekStart));
  const latestWeek = sortedWeeks[0];
  const periodLabel = getMonthLabel(monthKey);

  if (!latestWeek) {
    throw new Error('Cannot create a monthly dashboard period without reports.');
  }

  const aggregateWeek = aggregateWeeks(sortedWeeks, periodLabel);

  return {
    id: `month:${monthKey}`,
    periodType: 'monthly',
    periodLabel,
    storeName: latestWeek.storeName,
    includedWeekCount: sortedWeeks.length,
    includedWeekLabels: sortedWeeks.map((week) => week.weekLabel),
    anchorWeekId: latestWeek.id,
    monthKey,
    weekIds: sortedWeeks.map((week) => week.id),
    weeks: sortedWeeks,
    aggregateWeek,
    totals: aggregateWeek.totals,
    employees: aggregateWeek.employees,
  };
}

function createWeeklyOption(week: StoredWeek): DashboardPeriodOption {
  const period = createWeeklyPeriod(week);
  const gamesLabel = week.totals.totalGames === 1 ? '1 game' : `${week.totals.totalGames} games`;

  return {
    id: period.id,
    label: week.weekLabel,
    storeName: week.storeName,
    detail: `${week.employees.length} team members · ${gamesLabel}`,
    anchorWeekId: week.id,
    periodType: 'weekly',
    period,
  };
}

function createMonthlyOption(monthKey: string, weeks: StoredWeek[]): DashboardPeriodOption {
  const period = createMonthlyPeriod(monthKey, weeks);
  const reportLabel =
    period.includedWeekCount === 1 ? '1 saved report' : `${period.includedWeekCount} saved reports`;

  return {
    id: period.id,
    label: period.periodLabel,
    storeName: period.storeName,
    detail: `${reportLabel} · ${formatDateRange(weeks)}`,
    anchorWeekId: period.anchorWeekId,
    periodType: 'monthly',
    period,
  };
}

export function buildDashboardPeriodOptions(
  weeks: StoredWeek[],
  viewMode: DashboardViewMode,
): DashboardPeriodOption[] {
  const sortedWeeks = [...weeks].sort((a, b) => b.weekStart.localeCompare(a.weekStart));

  if (viewMode === 'weekly') {
    return sortedWeeks.map(createWeeklyOption);
  }

  const weeksByMonth = new Map<string, StoredWeek[]>();

  sortedWeeks.forEach((week) => {
    const monthKey = getMonthKey(week);
    const monthWeeks = weeksByMonth.get(monthKey) ?? [];

    weeksByMonth.set(monthKey, [...monthWeeks, week]);
  });

  return [...weeksByMonth.entries()]
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([monthKey, monthWeeks]) => createMonthlyOption(monthKey, monthWeeks));
}
