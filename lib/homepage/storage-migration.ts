import { formatWeekLabel } from './dates';
import type { EmployeeKpiRow, KpiStorage, StoredWeek } from './types';

type LegacyWeek = Partial<StoredWeek> & {
  date?: string;
  week?: string;
  mode?: string;
  month?: string;
  kpiRows?: EmployeeKpiRow[];
  uploadedAt?: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function getString(value: unknown) {
  return typeof value === 'string' ? value : '';
}

function getNumber(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function getWeekImportHash(week: Pick<StoredWeek, 'importHash' | 'sourceFiles'>) {
  return week.importHash || week.sourceFiles?.find((sourceFile) => sourceFile.contentHash)?.contentHash || '';
}

function getEmployees(week: LegacyWeek) {
  if (Array.isArray(week.employees)) return week.employees;
  if (Array.isArray(week.kpiRows)) return week.kpiRows;
  return null;
}

function getTotals(week: LegacyWeek, employees: EmployeeKpiRow[]) {
  if (isRecord(week.totals)) {
    return {
      employees: getNumber(week.totals.employees) || employees.length,
      totalGames: getNumber(week.totals.totalGames),
      guests: getNumber(week.totals.guests),
      replaysSold: getNumber(week.totals.replaysSold),
      reviewsAsked: getNumber(week.totals.reviewsAsked),
      sharedReplay: getNumber(week.totals.sharedReplay),
      afterGamePreviews: getNumber(week.totals.afterGamePreviews),
    };
  }

  return {
    employees: employees.length,
    totalGames: employees.reduce((sum, employee) => sum + Number(employee.totalGames), 0),
    guests: employees.reduce((sum, employee) => sum + Number(employee.guests), 0),
    replaysSold: employees.reduce((sum, employee) => sum + Number(employee.replaysSold), 0),
    reviewsAsked: employees.reduce((sum, employee) => sum + Number(employee.reviewsAsked), 0),
    sharedReplay: employees.reduce((sum, employee) => sum + Number(employee.sharedReplay), 0),
    afterGamePreviews: employees.reduce(
      (sum, employee) => sum + Number(employee.afterGamePreviews ?? 0),
      0,
    ),
  };
}

function migrateStoredWeek(rawWeek: unknown): StoredWeek | null {
  if (!isRecord(rawWeek)) return null;

  const week = rawWeek as LegacyWeek;
  const id = getString(week.id);
  const weekStart = getString(week.weekStart) || getString(week.date);
  const storeName = getString(week.storeName);
  const importedAt = getString(week.importedAt) || getString(week.uploadedAt);
  const employees = getEmployees(week);

  if (!id || !weekStart || !storeName || !importedAt || !employees) {
    return null;
  }

  const migratedWeek: StoredWeek = {
    id,
    weekStart,
    weekLabel: getString(week.weekLabel) || formatWeekLabel(weekStart),
    storeName,
    fileName: getString(week.fileName) || 'unknown.csv',
    importedAt,
    createdAt: getString(week.createdAt) || undefined,
    updatedAt: getString(week.updatedAt) || undefined,
    replacedAt: getString(week.replacedAt) || undefined,
    importHash: getString(week.importHash) || undefined,
    previousImportHash: getString(week.previousImportHash) || undefined,
    date: getString(week.date) || undefined,
    week: getString(week.week) || undefined,
    mode: getString(week.mode) || undefined,
    month: getString(week.month) || undefined,
    sourceFiles: Array.isArray(week.sourceFiles) ? week.sourceFiles : undefined,
    employees,
    totals: getTotals(week, employees),
  } as StoredWeek;

  return migratedWeek;
}

export function migrateKpiStorage(rawStorage: unknown): KpiStorage {
  if (!isRecord(rawStorage) || !Array.isArray(rawStorage.weeks)) {
    throw new Error('Invalid KPI storage shape');
  }

  const weeks = rawStorage.weeks.map(migrateStoredWeek);

  if (weeks.some((week) => !week)) {
    throw new Error('Invalid stored week shape');
  }

  const migratedWeeks = weeks as StoredWeek[];
  const rawLatestWeekId = getString(rawStorage.latestWeekId);
  const latestWeekId =
    rawLatestWeekId && migratedWeeks.some((week) => week.id === rawLatestWeekId)
      ? rawLatestWeekId
      : migratedWeeks[0]?.id ?? null;

  return {
    version: 1,
    latestWeekId,
    weeks: migratedWeeks,
  };
}

export function resolveWeekForStorage(incomingWeek: StoredWeek, existingWeek?: StoredWeek) {
  const incomingImportHash = getWeekImportHash(incomingWeek);
  const normalizedIncomingWeek: StoredWeek = {
    ...incomingWeek,
    importHash: incomingWeek.importHash || incomingImportHash || undefined,
    createdAt: incomingWeek.createdAt ?? incomingWeek.importedAt,
  };

  if (!existingWeek) {
    return normalizedIncomingWeek;
  }

  const existingImportHash = getWeekImportHash(existingWeek);

  if (existingImportHash && incomingImportHash && existingImportHash === incomingImportHash) {
    return existingWeek;
  }

  const now = new Date().toISOString();

  return {
    ...normalizedIncomingWeek,
    id: existingWeek.id,
    weekStart: existingWeek.weekStart,
    weekLabel: existingWeek.weekLabel,
    createdAt: existingWeek.createdAt ?? existingWeek.importedAt,
    updatedAt: now,
    replacedAt: now,
    previousImportHash: existingImportHash || undefined,
  };
}
