'use client';

import { EMPTY_STORAGE, STORAGE_KEY } from './constants';
import type { KpiStorage, StoredWeek } from './types';
import { migrateKpiStorage, resolveWeekForStorage } from './storage-migration';

function isSameStoreWeek(storedWeek: StoredWeek, week: StoredWeek) {
  return (
    storedWeek.id === week.id ||
    (storedWeek.storeName === week.storeName && storedWeek.weekStart === week.weekStart)
  );
}

export function getKpiStorage(): KpiStorage {
  if (typeof window === 'undefined') {
    return EMPTY_STORAGE;
  }

  let stored: string | null;

  try {
    stored = window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return EMPTY_STORAGE;
  }

  if (!stored) {
    return EMPTY_STORAGE;
  }

  try {
    return migrateKpiStorage(JSON.parse(stored));
  } catch {
    return EMPTY_STORAGE;
  }
}

export function saveWeekToStorage(week: StoredWeek) {
  const currentStorage = getKpiStorage();
  const existingWeek = currentStorage.weeks.find((storedWeek) => isSameStoreWeek(storedWeek, week));
  const weekForStorage = resolveWeekForStorage(week, existingWeek);

  if (existingWeek === weekForStorage) {
    return currentStorage;
  }

  const weeks = currentStorage.weeks.filter((storedWeek) => !isSameStoreWeek(storedWeek, week));
  weeks.unshift(weekForStorage);
  weeks.sort((a, b) => b.weekStart.localeCompare(a.weekStart));

  const nextStorage: KpiStorage = {
    version: 1,
    latestWeekId: weekForStorage.id,
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
