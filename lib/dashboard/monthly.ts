import { getEmployeeComparisonKey, getStoreComparisonKey } from './comparison';
import { safePercent } from './formatters';
import type {
  DashboardPeriod,
  DashboardPeriodOption,
  EmployeeKpiRow,
  KpiSourceFile,
  StoredWeek,
} from './types';

type MonthGroup = {
  id: string;
  monthKey: string;
  storeKey: string;
  storeName: string;
  weeks: StoredWeek[];
};

type EmployeeAccumulator = EmployeeKpiRow & {
  latestWeekStart: string;
};

const monthLabelFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'long',
  year: 'numeric',
});

function sortWeeksAscending(weeks: StoredWeek[]) {
  return [...weeks].sort((a, b) => {
    const weekStartComparison = a.weekStart.localeCompare(b.weekStart);
    if (weekStartComparison !== 0) return weekStartComparison;

    return a.id.localeCompare(b.id);
  });
}

function sortWeeksDescending(weeks: StoredWeek[]) {
  return [...weeks].sort((a, b) => {
    const weekStartComparison = b.weekStart.localeCompare(a.weekStart);
    if (weekStartComparison !== 0) return weekStartComparison;

    return b.id.localeCompare(a.id);
  });
}

function getLatestWeek(weeks: StoredWeek[]) {
  return sortWeeksDescending(weeks)[0] ?? null;
}

function getWeekMonthKey(weekStart: string) {
  return weekStart.slice(0, 7);
}

function getMonthLabel(monthKey: string) {
  const [year, month] = monthKey.split('-').map(Number);

  if (!year || !month) return monthKey;

  return monthLabelFormatter.format(new Date(year, month - 1, 1));
}

function getMonthGroupId(storeKey: string, monthKey: string) {
  return `${storeKey}:${monthKey}`;
}

function getImportedAt(week: StoredWeek) {
  return week.importedAt ?? week.uploadedAt;
}

function getFallbackSourceFile(week: StoredWeek): KpiSourceFile {
  return {
    fileName: week.fileName,
    importedAt: getImportedAt(week),
  };
}

function groupWeeksByStoreMonth(weeks: StoredWeek[]) {
  const groupsById = new Map<string, MonthGroup>();

  for (const week of weeks) {
    const monthKey = getWeekMonthKey(week.weekStart);
    const storeKey = getStoreComparisonKey(week.storeName);
    const id = getMonthGroupId(storeKey, monthKey);
    const existingGroup = groupsById.get(id);

    if (existingGroup) {
      existingGroup.weeks.push(week);
      continue;
    }

    groupsById.set(id, {
      id,
      monthKey,
      storeKey,
      storeName: week.storeName,
      weeks: [week],
    });
  }

  return [...groupsById.values()];
}

function getMatchingMonthGroup(weeks: StoredWeek[], anchorWeek: StoredWeek) {
  const monthKey = getWeekMonthKey(anchorWeek.weekStart);
  const storeKey = getStoreComparisonKey(anchorWeek.storeName);

  return groupWeeksByStoreMonth(weeks).find(
    (group) => group.monthKey === monthKey && group.storeKey === storeKey,
  );
}

function getPreviousMonthGroup(weeks: StoredWeek[], selectedPeriod: DashboardPeriod) {
  const selectedStoreKey = getStoreComparisonKey(selectedPeriod.storeName);
  const selectedMonthKey = selectedPeriod.monthKey;

  if (!selectedMonthKey) return null;

  return (
    groupWeeksByStoreMonth(weeks)
      .filter((group) => group.storeKey === selectedStoreKey && group.monthKey < selectedMonthKey)
      .sort((a, b) => b.monthKey.localeCompare(a.monthKey))[0] ?? null
  );
}

function mergeEmployeeIntoAccumulator(
  employeesByKey: Map<string, EmployeeAccumulator>,
  employee: EmployeeKpiRow,
  weekStart: string,
) {
  const employeeKey = getEmployeeComparisonKey(employee);
  const existingEmployee = employeesByKey.get(employeeKey);

  if (!existingEmployee) {
    employeesByKey.set(employeeKey, {
      ...employee,
      SUEs: Number(employee.SUEs),
      afterGamePreviews: Number(employee.afterGamePreviews),
      guests: Number(employee.guests),
      replaysSold: Number(employee.replaysSold),
      reviewsAsked: Number(employee.reviewsAsked),
      sharedReplay: Number(employee.sharedReplay),
      totalGames: Number(employee.totalGames),
      sources: employee.sources ? [...employee.sources] : undefined,
      latestWeekStart: weekStart,
    });
    return;
  }

  const shouldUseLatestMetadata = weekStart >= existingEmployee.latestWeekStart;

  existingEmployee.totalGames += Number(employee.totalGames);
  existingEmployee.guests += Number(employee.guests);
  existingEmployee.replaysSold += Number(employee.replaysSold);
  existingEmployee.SUEs += Number(employee.SUEs);
  existingEmployee.reviewsAsked += Number(employee.reviewsAsked);
  existingEmployee.sharedReplay += Number(employee.sharedReplay);
  existingEmployee.afterGamePreviews += Number(employee.afterGamePreviews);
  existingEmployee.sources = [...(existingEmployee.sources ?? []), ...(employee.sources ?? [])];

  if (shouldUseLatestMetadata) {
    existingEmployee.name = employee.name;
    existingEmployee.storeName = employee.storeName;
    existingEmployee.role = employee.role;
    existingEmployee.latestWeekStart = weekStart;
  }
}

function buildMonthlyEmployees(weeks: StoredWeek[]) {
  const employeesByKey = new Map<string, EmployeeAccumulator>();

  for (const week of sortWeeksAscending(weeks)) {
    for (const employee of week.employees) {
      mergeEmployeeIntoAccumulator(employeesByKey, employee, week.weekStart);
    }
  }

  return [...employeesByKey.values()].map((employee) => ({
    name: employee.name,
    storeName: employee.storeName,
    role: employee.role,
    totalGames: employee.totalGames,
    guests: employee.guests,
    replaysSold: employee.replaysSold,
    SUEs: employee.SUEs,
    reviewsAsked: employee.reviewsAsked,
    sharedReplay: employee.sharedReplay,
    afterGamePreviews: employee.afterGamePreviews,
    replaysSoldPercent: safePercent(employee.replaysSold, employee.guests),
    suePercent: safePercent(employee.SUEs, employee.totalGames),
    reviewsAskedPercent: safePercent(employee.reviewsAsked, employee.totalGames),
    sharedReplayPercent: safePercent(employee.sharedReplay, employee.totalGames),
    previewsPercent: safePercent(employee.afterGamePreviews, employee.totalGames),
    sources: employee.sources,
  }));
}

function buildMonthlyTotals(weeks: StoredWeek[], employees: EmployeeKpiRow[]) {
  return {
    employees: employees.length,
    totalGames: weeks.reduce((sum, week) => sum + Number(week.totals.totalGames), 0),
    guests: weeks.reduce((sum, week) => sum + Number(week.totals.guests), 0),
    replaysSold: weeks.reduce((sum, week) => sum + Number(week.totals.replaysSold), 0),
    SUEs: employees.reduce((sum, employee) => sum + Number(employee.SUEs), 0),
    reviewsAsked: weeks.reduce((sum, week) => sum + Number(week.totals.reviewsAsked), 0),
    sharedReplay: weeks.reduce((sum, week) => sum + Number(week.totals.sharedReplay), 0),
    afterGamePreviews: weeks.reduce((sum, week) => sum + Number(week.totals.afterGamePreviews), 0),
  };
}

function buildMonthlyPeriodFromGroup(group: MonthGroup): DashboardPeriod | null {
  const sortedWeeks = sortWeeksAscending(group.weeks);
  const latestWeek = getLatestWeek(sortedWeeks);

  if (!latestWeek) return null;

  const employees = buildMonthlyEmployees(sortedWeeks);
  const totals = buildMonthlyTotals(sortedWeeks, employees);
  const periodLabel = getMonthLabel(group.monthKey);
  const importedAt = getImportedAt(latestWeek);
  const sourceFiles = sortedWeeks.flatMap(
    (week) => week.sourceFiles ?? [getFallbackSourceFile(week)],
  );

  const aggregateWeek: StoredWeek = {
    ...latestWeek,
    id: group.id,
    weekStart: `${group.monthKey}-01`,
    weekLabel: periodLabel,
    fileName: `${sortedWeeks.length} saved reports`,
    uploadedAt: importedAt,
    importedAt,
    sourceFiles,
    storeName: latestWeek.storeName,
    totals,
    employees,
  };

  return {
    id: group.id,
    storeName: latestWeek.storeName,
    totals,
    employees,
    periodType: 'monthly',
    periodLabel,
    includedWeekCount: sortedWeeks.length,
    includedWeekLabels: sortedWeeks.map((week) => week.weekLabel),
    anchorWeekId: latestWeek.id,
    monthKey: group.monthKey,
    weekIds: sortedWeeks.map((week) => week.id),
    weeks: sortedWeeks,
    aggregateWeek,
  };
}

export function buildWeeklyPeriod(week: StoredWeek): DashboardPeriod {
  return {
    ...week,
    periodType: 'weekly',
    periodLabel: week.weekLabel,
    includedWeekCount: 1,
    includedWeekLabels: [week.weekLabel],
    anchorWeekId: week.id,
    monthKey: getWeekMonthKey(week.weekStart),
    weekIds: [week.id],
    weeks: [week],
    aggregateWeek: week,
  };
}

export function buildMonthlyPeriod(weeks: StoredWeek[], anchorWeek: StoredWeek) {
  const group = getMatchingMonthGroup(weeks, anchorWeek);

  return group ? buildMonthlyPeriodFromGroup(group) : null;
}

export function findPreviousMonthlyPeriod(weeks: StoredWeek[], selectedPeriod: DashboardPeriod) {
  const previousGroup = getPreviousMonthGroup(weeks, selectedPeriod);

  return previousGroup ? buildMonthlyPeriodFromGroup(previousGroup) : null;
}

export function getWeeklyPeriodOptions(weeks: StoredWeek[]): DashboardPeriodOption[] {
  return weeks.map((week) => {
    const period = buildWeeklyPeriod(week);

    return {
      id: period.id,
      label: period.periodLabel,
      storeName: period.storeName,
      detail: period.storeName,
      anchorWeekId: period.anchorWeekId,
      periodType: period.periodType,
      period,
    };
  });
}

export function getMonthlyPeriodOptions(weeks: StoredWeek[]): DashboardPeriodOption[] {
  return groupWeeksByStoreMonth(weeks)
    .sort((a, b) => {
      const monthComparison = b.monthKey.localeCompare(a.monthKey);
      if (monthComparison !== 0) return monthComparison;

      return a.storeName.localeCompare(b.storeName);
    })
    .flatMap((group): DashboardPeriodOption[] => {
      const period = buildMonthlyPeriodFromGroup(group);

      if (!period) return [];

      const reportCountLabel =
        period.includedWeekCount === 1
          ? '1 saved weekly report'
          : `${period.includedWeekCount} saved weekly reports`;

      return [
        {
          id: period.id,
          label: period.periodLabel,
          storeName: period.storeName,
          detail: `${period.storeName} · ${reportCountLabel}`,
          anchorWeekId: period.anchorWeekId,
          periodType: period.periodType,
          period,
        },
      ];
    });
}
