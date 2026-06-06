import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { buildStoredWeekFromCsvText } from './import-week';
import { EMPTY_STORAGE, STORAGE_KEY } from './constants';
import {
  createEmptyImportSession,
  findStoredWeekForImport,
  getKpiStorage,
  hasImportedFile,
  saveWeekToStorage,
} from './storage';
import type { KpiStorage, StoredWeek } from './types';
import {
  getStorageSnapshot,
  removeStoredWeek,
  writeStorage,
} from '@/lib/dashboard/storage';
import type {
  KpiStorage as DashboardKpiStorage,
  StoredWeek as DashboardStoredWeek,
} from '@/lib/dashboard/types';

function toCsv(headers: string[], rows: Array<Array<string | number>>) {
  return [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
}

function createLocalStorageMock() {
  const store = new Map<string, string>();

  return {
    getItem: vi.fn((key: string) => store.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store.set(key, value);
    }),
    removeItem: vi.fn((key: string) => {
      store.delete(key);
    }),
    clear: vi.fn(() => {
      store.clear();
    }),
  };
}

function installWindow(localStorage = createLocalStorageMock()) {
  vi.stubGlobal('window', {
    localStorage,
    dispatchEvent: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  } as unknown as Window & typeof globalThis);

  return localStorage;
}

function makeWeek(overrides: Partial<StoredWeek> = {}): StoredWeek {
  const week: StoredWeek = {
    id: 'Training Store-2026-02-02',
    weekStart: '2026-02-02',
    weekLabel: 'Feb 2, 2026',
    storeName: 'Training Store',
    fileName: 'fake-game-guide.csv',
    importedAt: '2026-02-03T10:11:12.000Z',
    sourceFiles: [
      {
        fileName: 'fake-game-guide.csv',
        type: 'game-guide',
        reportType: 'game-guide',
        reportTypeLabel: 'Game Guide',
        detectedStore: 'Training Store',
        contentHash: 'hash-one',
        importedAt: '2026-02-03T10:11:12.000Z',
        rowCount: 1,
      },
    ],
    employees: [
      {
        name: 'Alex Guide',
        storeName: 'Training Store',
        role: 'GG',
        totalGames: 4,
        guests: 8,
        replaysSold: 1,
        reviewsAsked: 4,
        sharedReplay: 3,
        replaysSoldPercent: 12.5,
        reviewsAskedPercent: 100,
        sharedReplayPercent: 75,
        SUEs: 2,
        suePercent: 50,
        afterGamePreviews: 2,
        previewsPercent: 50,
      },
    ],
    totals: {
      employees: 1,
      totalGames: 4,
      guests: 8,
      replaysSold: 1,
      reviewsAsked: 4,
      sharedReplay: 3,
      afterGamePreviews: 2,
    },
    ...overrides,
  };

  return week;
}

function makeDashboardWeek(overrides: Partial<DashboardStoredWeek> = {}): DashboardStoredWeek {
  const week = makeWeek(overrides as Partial<StoredWeek>);

  return {
    ...week,
    uploadedAt: week.importedAt,
    sourceFiles: week.sourceFiles?.map((sourceFile) => ({
      fileName: sourceFile.fileName,
      type: sourceFile.type,
      importedAt: sourceFile.importedAt,
    })),
    ...overrides,
  } as unknown as DashboardStoredWeek;
}

describe('homepage KPI storage', () => {
  beforeEach(() => {
    installWindow();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns an empty v1 storage shape for empty or malformed storage', () => {
    expect(getKpiStorage()).toEqual(EMPTY_STORAGE);

    window.localStorage.setItem(STORAGE_KEY, 'not-json');

    expect(getKpiStorage()).toEqual({
      version: 1,
      latestWeekId: null,
      weeks: [],
    });
  });

  it('reads valid v1 storage and saves with version 1 and the latest week id', () => {
    const olderWeek = makeWeek({
      id: 'Training Store-2026-01-26',
      weekStart: '2026-01-26',
      sourceFiles: [{ ...makeWeek().sourceFiles![0], contentHash: 'older-hash' }],
    });
    const storage: KpiStorage = {
      version: 1,
      latestWeekId: olderWeek.id,
      weeks: [olderWeek],
    };

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(storage));

    expect(getKpiStorage()).toEqual(storage);

    const newWeek = makeWeek();
    const saved = saveWeekToStorage(newWeek);

    expect(saved).toMatchObject({
      version: 1,
      latestWeekId: newWeek.id,
    });
    expect(saved.weeks.map((week) => week.id)).toEqual([newWeek.id, olderWeek.id]);
    expect(JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '{}')).toEqual(saved);
  });

  it('detects duplicate content hashes only within the matching stored week', () => {
    const week = makeWeek();
    const otherWeek = makeWeek({
      id: 'Training Store-2026-02-09',
      weekStart: '2026-02-09',
      sourceFiles: [{ ...week.sourceFiles![0], contentHash: 'hash-one' }],
    });

    saveWeekToStorage(week);

    expect(hasImportedFile(week.id, 'hash-one')).toBe(true);
    expect(hasImportedFile(week.id, 'hash-two')).toBe(false);
    expect(hasImportedFile(otherWeek.id, 'hash-one')).toBe(false);
  });

  it('requires explicit overwrite confirmation before replacing the same store/week', () => {
    const originalWeek = makeWeek();
    const replacementWeek = makeWeek({
      sourceFiles: [{ ...originalWeek.sourceFiles![0], contentHash: 'hash-two' }],
    });

    saveWeekToStorage(originalWeek);

    expect(findStoredWeekForImport(replacementWeek)).toMatchObject({
      id: originalWeek.id,
      sourceFiles: [expect.objectContaining({ contentHash: 'hash-one' })],
    });
    expect(() => saveWeekToStorage(replacementWeek)).toThrow(
      'Data already exists for this week. Confirming will replace the saved report for this week.',
    );

    saveWeekToStorage(replacementWeek, { allowOverwrite: true });

    expect(hasImportedFile(originalWeek.id, 'hash-one')).toBe(false);
    expect(hasImportedFile(originalWeek.id, 'hash-two')).toBe(true);
    expect(getKpiStorage().weeks).toHaveLength(1);
  });

  it('canceling a pending preview leaves saved data unchanged', () => {
    const originalWeek = makeWeek();
    const replacementWeek = makeWeek({
      sourceFiles: [{ ...originalWeek.sourceFiles![0], contentHash: 'hash-two' }],
    });

    saveWeekToStorage(originalWeek);
    const rawBeforeCancel = window.localStorage.getItem(STORAGE_KEY);
    const session = createEmptyImportSession({
      selectedFileName: replacementWeek.fileName,
      pendingImport: {
        selectedFileName: replacementWeek.fileName,
        reportTypeLabel: 'Game Guide',
        week: replacementWeek,
        existingWeek: originalWeek,
        warnings: [],
      },
    });

    const canceled = session.cancel();

    expect(canceled.pendingImport).toBeNull();
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe(rawBeforeCancel);
  });

  it('does not mutate storage after failed import parsing', async () => {
    const originalWeek = makeWeek();

    saveWeekToStorage(originalWeek);

    const rawBeforeFailedImport = window.localStorage.getItem(STORAGE_KEY);
    const invalidCsv = toCsv(
      ['name', 'storeName', 'role', 'totalGames', 'SUEs'],
      [['Taylor Fake', 'Training Store', 'GG', 3, 2]],
    );

    await expect(
      buildStoredWeekFromCsvText(invalidCsv, 'invalid.csv', '2026-02-02'),
    ).rejects.toMatchObject({ validationError: { code: 'missing_required_columns' } });

    expect(window.localStorage.getItem(STORAGE_KEY)).toBe(rawBeforeFailedImport);
  });
});

describe('dashboard KPI storage snapshots and deletes', () => {
  beforeEach(() => {
    installWindow();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('reads malformed storage safely and writes only the v1 storage shape', () => {
    window.localStorage.setItem(STORAGE_KEY, '{bad json');

    expect(getStorageSnapshot()).toEqual(EMPTY_STORAGE);

    const storage: DashboardKpiStorage = {
      version: 1,
      latestWeekId: null,
      weeks: [],
    };

    writeStorage(storage);

    expect(JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '{}')).toEqual(storage);
  });

  it('removes only the requested week and updates latestWeekId predictably', () => {
    const oldestWeek = makeDashboardWeek({
      id: 'Training Store-2026-01-26',
      weekStart: '2026-01-26',
    });
    const middleWeek = makeDashboardWeek({
      id: 'Training Store-2026-02-02',
      weekStart: '2026-02-02',
    });
    const latestWeek = makeDashboardWeek({
      id: 'Training Store-2026-02-09',
      weekStart: '2026-02-09',
    });

    writeStorage({
      version: 1,
      latestWeekId: latestWeek.id,
      weeks: [latestWeek, middleWeek, oldestWeek],
    });

    const afterPreferredDelete = removeStoredWeek(latestWeek.id, middleWeek.id);

    expect(afterPreferredDelete.latestWeekId).toBe(middleWeek.id);
    expect(afterPreferredDelete.weeks.map((week) => week.id)).toEqual([
      middleWeek.id,
      oldestWeek.id,
    ]);

    const afterRegularDelete = removeStoredWeek(middleWeek.id);

    expect(afterRegularDelete.latestWeekId).toBe(oldestWeek.id);
    expect(afterRegularDelete.weeks.map((week) => week.id)).toEqual([oldestWeek.id]);

    const afterFinalDelete = removeStoredWeek(oldestWeek.id);

    expect(afterFinalDelete).toEqual({
      version: 1,
      latestWeekId: null,
      weeks: [],
    });
  });
});
