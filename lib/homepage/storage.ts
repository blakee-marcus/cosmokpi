'use client';

import { EMPTY_STORAGE, STORAGE_KEY } from './constants';
import type { KpiStorage, StoredWeek } from './types';

export function getKpiStorage(): KpiStorage {
  if (typeof window === 'undefined') {
    return EMPTY_STORAGE;
  }

  const stored = window.localStorage.getItem(STORAGE_KEY);

  if (!stored) {
    return EMPTY_STORAGE;
  }

  try {
    return JSON.parse(stored) as KpiStorage;
  } catch {
    return EMPTY_STORAGE;
  }
}

export function saveWeekToStorage(week: StoredWeek) {
  const currentStorage = getKpiStorage();
  const weeks = currentStorage.weeks.filter((storedWeek) => storedWeek.id !== week.id);
  weeks.unshift(week);
  weeks.sort((a, b) => b.weekStart.localeCompare(a.weekStart));

  const nextStorage: KpiStorage = {
    version: 1,
    latestWeekId: week.id,
    weeks,
  };

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextStorage));
  return nextStorage;
}

export function hasImportedFile(weekId: string, contentHash: string) {
  const week = getKpiStorage().weeks.find((storedWeek) => storedWeek.id === weekId);

  if (!week?.sourceFiles) {
    return false;
  }

  return week.sourceFiles.some((sourceFile) => sourceFile.contentHash === contentHash);
}
