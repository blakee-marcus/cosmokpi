import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { EMPTY_STORAGE, STORAGE_KEY } from './constants';
import { getKpiStorage, saveWeekToStorage } from './storage';
import type { KpiStorage, StoredWeek } from './types';

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
  return {
    id: 'Training Store-2026-02-02',
    weekStart: '2026-02-02',
    weekLabel: 'Feb 2 - Feb 8, 2026',
    storeName: 'Training Store',
    fileName: 'fake-current.csv',
    importedAt: '2026-02-03T10:11:12.000Z',
    sourceFiles: [
      {
        fileName: 'fake-current.csv',
        type: 'game-guide',
        reportType: 'game-guide',
        reportTypeLabel: 'Game Guide',
        detectedStore: 'Training Store',
        contentHash: 'current-hash',
        importedAt: '2026-02-03T10:11:12.000Z',
        rowCount: 1,
      },
    ],
    employees: [
      {
        name: 'Alex Guide',
        storeName: 'Training Store',
        role: 'GG',
        totalGames: 8,
        guests: 16,
        replaysSold: 4,
        reviewsAsked: 7,
        sharedReplay: 6,
        replaysSoldPercent: 25,
        reviewsAskedPercent: 87.5,
        sharedReplayPercent: 75,
        SUEs: 3,
        suePercent: 37.5,
        afterGamePreviews: 5,
        previewsPercent: 62.5,
      },
    ],
    totals: {
      employees: 1,
      totalGames: 8,
      guests: 16,
      replaysSold: 4,
      reviewsAsked: 7,
      sharedReplay: 6,
      afterGamePreviews: 5,
    },
    ...overrides,
  };
}

describe('stored week migration contract', () => {
  beforeEach(() => {
    installWindow();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('loads current v1 storage without rewriting or dropping import metadata', () => {
    const currentWeek = makeWeek({
      createdAt: '2026-02-03T10:11:12.000Z',
      importHash: 'current-import-hash',
    } as Partial<StoredWeek>);
    const storage: KpiStorage = {
      version: 1,
      latestWeekId: currentWeek.id,
      weeks: [currentWeek],
    };

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(storage));
    const setItemCalls = vi.mocked(window.localStorage.setItem).mock.calls.length;

    expect(getKpiStorage()).toEqual(storage);
    expect(window.localStorage.setItem).toHaveBeenCalledTimes(setItemCalls);
  });

  it('migrates prior minimal stored week shapes while preserving dates, view fields, KPI rows, and source metadata', () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: 1,
        latestWeekId: 'legacy-training-store-week',
        weeks: [
          {
            id: 'legacy-training-store-week',
            storeName: 'Training Store',
            date: '2026-02-02',
            week: '2026-W06',
            mode: 'weekly',
            month: '2026-02',
            fileName: 'legacy-fake.csv',
            importedAt: '2026-02-03T09:00:00.000Z',
            importHash: 'legacy-import-hash',
            sourceFiles: [
              {
                fileName: 'legacy-fake.csv',
                type: 'game-guide',
                reportType: 'game-guide',
                reportTypeLabel: 'Game Guide',
                detectedStore: 'Training Store',
                contentHash: 'legacy-content-hash',
                importedAt: '2026-02-03T09:00:00.000Z',
                rowCount: 1,
              },
            ],
            kpiRows: [
              {
                name: 'Legacy Guide',
                storeName: 'Training Store',
                role: 'GG',
                totalGames: 5,
                guests: 10,
                replaysSold: 2,
                reviewsAsked: 4,
                sharedReplay: 3,
                afterGamePreviews: 1,
                replaysSoldPercent: 20,
                reviewsAskedPercent: 80,
                sharedReplayPercent: 60,
                previewsPercent: 20,
              },
            ],
          },
        ],
      }),
    );

    expect(getKpiStorage()).toEqual({
      version: 1,
      latestWeekId: 'legacy-training-store-week',
      weeks: [
        expect.objectContaining({
          id: 'legacy-training-store-week',
          weekStart: '2026-02-02',
          weekLabel: expect.stringContaining('2026'),
          storeName: 'Training Store',
          fileName: 'legacy-fake.csv',
          importedAt: '2026-02-03T09:00:00.000Z',
          importHash: 'legacy-import-hash',
          date: '2026-02-02',
          week: '2026-W06',
          mode: 'weekly',
          month: '2026-02',
          sourceFiles: [
            expect.objectContaining({
              fileName: 'legacy-fake.csv',
              contentHash: 'legacy-content-hash',
              detectedStore: 'Training Store',
              reportTypeLabel: 'Game Guide',
              rowCount: 1,
            }),
          ],
          employees: [
            expect.objectContaining({
              name: 'Legacy Guide',
              totalGames: 5,
              replaysSold: 2,
              reviewsAsked: 4,
              sharedReplay: 3,
              afterGamePreviews: 1,
            }),
          ],
          totals: {
            employees: 1,
            totalGames: 5,
            guests: 10,
            replaysSold: 2,
            reviewsAsked: 4,
            sharedReplay: 3,
            afterGamePreviews: 1,
          },
        }),
      ],
    });
  });

  it('fails safely when localStorage contains corrupt or structurally invalid storage', () => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, weeks: 'not-an-array' }));

    expect(getKpiStorage()).toEqual(EMPTY_STORAGE);

    vi.mocked(window.localStorage.getItem).mockImplementationOnce(() => {
      throw new Error('localStorage unavailable');
    });

    expect(getKpiStorage()).toEqual(EMPTY_STORAGE);
  });

  it('treats the same week with the same content hash as a duplicate no-op', () => {
    const week = makeWeek({
      createdAt: '2026-02-03T10:11:12.000Z',
      importHash: 'current-hash',
    } as Partial<StoredWeek>);

    saveWeekToStorage(week);
    const rawBeforeDuplicate = window.localStorage.getItem(STORAGE_KEY);
    const setItemCalls = vi.mocked(window.localStorage.setItem).mock.calls.length;

    const duplicateResult = saveWeekToStorage({
      ...week,
      importedAt: '2026-02-04T10:11:12.000Z',
    } as StoredWeek);

    expect(duplicateResult).toEqual(JSON.parse(rawBeforeDuplicate ?? '{}'));
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe(rawBeforeDuplicate);
    expect(window.localStorage.setItem).toHaveBeenCalledTimes(setItemCalls);
  });

  it('replaces same-week different content deterministically without merging rows and records replacement metadata', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-02-05T12:13:14.000Z'));

    const originalWeek = makeWeek({
      createdAt: '2026-02-03T10:11:12.000Z',
      importHash: 'original-import-hash',
    } as Partial<StoredWeek>);
    const replacementWeek = makeWeek({
      importedAt: '2026-02-04T10:11:12.000Z',
      importHash: 'replacement-import-hash',
      sourceFiles: [
        {
          ...makeWeek().sourceFiles![0],
          fileName: 'fake-replacement.csv',
          contentHash: 'replacement-content-hash',
          importedAt: '2026-02-04T10:11:12.000Z',
        },
      ],
      employees: [
        {
          ...makeWeek().employees[0],
          name: 'Replacement Guide',
          totalGames: 3,
          guests: 6,
          replaysSold: 3,
          reviewsAsked: 3,
          sharedReplay: 2,
          afterGamePreviews: 2,
          replaysSoldPercent: 50,
          reviewsAskedPercent: 100,
          sharedReplayPercent: 66.67,
          previewsPercent: 66.67,
        },
      ],
      totals: {
        employees: 1,
        totalGames: 3,
        guests: 6,
        replaysSold: 3,
        reviewsAsked: 3,
        sharedReplay: 2,
        afterGamePreviews: 2,
      },
    } as Partial<StoredWeek>);

    saveWeekToStorage(originalWeek);
    const saved = saveWeekToStorage(replacementWeek, { allowOverwrite: true });

    expect(saved.latestWeekId).toBe(originalWeek.id);
    expect(saved.weeks).toHaveLength(1);
    expect(saved.weeks[0]).toEqual(
      expect.objectContaining({
        id: originalWeek.id,
        weekStart: originalWeek.weekStart,
        weekLabel: originalWeek.weekLabel,
        createdAt: '2026-02-03T10:11:12.000Z',
        importedAt: '2026-02-04T10:11:12.000Z',
        updatedAt: '2026-02-05T12:13:14.000Z',
        replacedAt: '2026-02-05T12:13:14.000Z',
        importHash: 'replacement-import-hash',
        previousImportHash: 'original-import-hash',
        sourceFiles: [
          expect.objectContaining({
            fileName: 'fake-replacement.csv',
            contentHash: 'replacement-content-hash',
          }),
        ],
        employees: [
          expect.objectContaining({
            name: 'Replacement Guide',
            totalGames: 3,
            replaysSold: 3,
            reviewsAskedPercent: 100,
          }),
        ],
        totals: {
          employees: 1,
          totalGames: 3,
          guests: 6,
          replaysSold: 3,
          reviewsAsked: 3,
          sharedReplay: 2,
          afterGamePreviews: 2,
        },
      }),
    );
    expect(saved.weeks[0].employees).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ name: 'Alex Guide' })]),
    );
  });
});
