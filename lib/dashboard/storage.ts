'use client';

import { EMPTY_STORAGE, STORAGE_KEY } from './constants';
import type { KpiStorage } from './types';

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
  return () => window.removeEventListener('storage', onStoreChange);
}
