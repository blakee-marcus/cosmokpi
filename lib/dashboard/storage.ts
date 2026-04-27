'use client';

import { EMPTY_STORAGE, STORAGE_KEY } from './constants';
import type { KpiStorage } from './types';

const KPI_STORAGE_CHANGED_EVENT = 'cosmo-kpi-storage-changed';

let cachedStorageRaw: string | null = null;
let cachedStorageSnapshot: KpiStorage = EMPTY_STORAGE;

function getStorage(): KpiStorage {
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

function emitStorageChange() {
  if (typeof window === 'undefined') return;

  window.dispatchEvent(new Event(KPI_STORAGE_CHANGED_EVENT));
}

export function writeStorage(storage: KpiStorage) {
  if (typeof window === 'undefined') return;

  const nextStorageRaw = JSON.stringify(storage);

  window.localStorage.setItem(STORAGE_KEY, nextStorageRaw);

  cachedStorageRaw = nextStorageRaw;
  cachedStorageSnapshot = storage;

  emitStorageChange();
}

export function getStorageSnapshot() {
  if (typeof window === 'undefined') {
    return EMPTY_STORAGE;
  }

  const stored = window.localStorage.getItem(STORAGE_KEY);

  if (stored === cachedStorageRaw) {
    return cachedStorageSnapshot;
  }

  cachedStorageRaw = stored;
  cachedStorageSnapshot = getStorage();

  return cachedStorageSnapshot;
}

export function subscribeToStorage(onStoreChange: () => void) {
  if (typeof window === 'undefined') {
    return () => {};
  }

  window.addEventListener('storage', onStoreChange);
  window.addEventListener(KPI_STORAGE_CHANGED_EVENT, onStoreChange);

  return () => {
    window.removeEventListener('storage', onStoreChange);
    window.removeEventListener(KPI_STORAGE_CHANGED_EVENT, onStoreChange);
  };
}

export function removeStoredWeek(weekId: string, preferredNextWeekId?: string | null) {
  const currentStorage = getStorage();

  const remainingWeeks = currentStorage.weeks.filter((week) => week.id !== weekId);

  const preferredWeekStillExists = remainingWeeks.some((week) => week.id === preferredNextWeekId);
  const currentLatestStillExists = remainingWeeks.some(
    (week) => week.id === currentStorage.latestWeekId,
  );

  const latestWeekId =
    remainingWeeks.length === 0
      ? null
      : preferredWeekStillExists
        ? preferredNextWeekId!
        : currentLatestStillExists
          ? currentStorage.latestWeekId
          : remainingWeeks[0].id;

  const nextStorage: KpiStorage = {
    ...currentStorage,
    latestWeekId,
    weeks: remainingWeeks,
  };

  writeStorage(nextStorage);

  return nextStorage;
}
