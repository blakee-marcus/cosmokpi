import { afterEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { buildStoredWeekFromCsvText } from './import-week';

const SHARED_HEADERS = [
  'name',
  'storeName',
  'role',
  'totalGames',
  'guests',
  'replaysSold',
  'reviewsAsked',
  'sharedReplay',
  'replaysSoldPercent',
  'reviewsAskedPercent',
  'sharedReplayPercent',
];

const GAME_GUIDE_HEADERS = [
  ...SHARED_HEADERS,
  'SUEs',
  'suePercent',
  'afterGamePreviews',
  'previewsPercent',
];

const GES_HEADERS = [
  ...SHARED_HEADERS,
  'productsSold',
  'giftCardsSold',
  'postGamePreview',
  'postGamePreviewPercent',
];

function toCsv(headers: string[], rows: Array<Array<string | number>>) {
  return [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
}

function readFixture(name: string) {
  return readFileSync(join(process.cwd(), 'test/fixtures/csv', name), 'utf8');
}

describe('buildStoredWeekFromCsvText', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('creates a StoredWeek from Game Guide CSV text with merged employees, totals, and source metadata', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-02-03T10:11:12.000Z'));

    const csv = toCsv(GAME_GUIDE_HEADERS, [
      ['Alex Guide', 'Training Store', 'GG', 10, 20, 4, 9, 8, 20, 90, 80, 7, 70, 6, 60],
      [' alex   guide ', 'Training Store', 'Team Leader', 5, 10, 2, 4, 4, 20, 80, 80, 3, 60, 3, 60],
      ['Jordan Host', 'Training Store', 'GG', 4, 8, 1, 4, 3, 25, 100, 75, 2, 50, 2, 50],
    ]);

    const result = await buildStoredWeekFromCsvText(
      csv,
      'fake-game-guide.csv',
      '2026-02-02',
    );

    expect(result.reportTypeLabel).toBe('Game Guide');
    expect(result.week).toMatchObject({
      id: 'Training Store-2026-02-02',
      weekStart: '2026-02-02',
      storeName: 'Training Store',
      fileName: 'fake-game-guide.csv',
      importedAt: '2026-02-03T10:11:12.000Z',
      totals: {
        employees: 2,
        totalGames: 19,
        guests: 38,
        replaysSold: 7,
        reviewsAsked: 17,
        sharedReplay: 15,
        afterGamePreviews: 11,
      },
    });
    expect(result.week.weekLabel).toContain('Feb');
    expect(result.week.employees).toHaveLength(2);
    expect(result.week.employees[0]).toMatchObject({
      name: 'Alex Guide',
      role: 'TL',
      totalGames: 15,
      guests: 30,
      replaysSold: 6,
      reviewsAsked: 13,
      sharedReplay: 12,
      SUEs: 10,
      afterGamePreviews: 9,
      replaysSoldPercent: 20,
      sharedReplayPercent: 80,
      previewsPercent: 60,
    });
    expect(result.week.employees[0].reviewsAskedPercent).toBeCloseTo(86.67, 2);
    expect(result.week.employees[0].suePercent).toBeCloseTo(66.67, 2);
    expect(result.week.sourceFiles).toEqual([
      expect.objectContaining({
        fileName: 'fake-game-guide.csv',
        type: 'game-guide',
        reportType: 'game-guide',
        reportTypeLabel: 'Game Guide',
        detectedStore: 'Training Store',
        importedAt: '2026-02-03T10:11:12.000Z',
        rowCount: 3,
      }),
    ]);
    expect(result.week.sourceFiles?.[0].contentHash).toMatch(/^[a-f0-9]{64}$/);
  });

  it('creates a StoredWeek from GES CSV text with the assigned week start preserved', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-04T10:11:12.000Z'));

    const csv = toCsv(GES_HEADERS, [
      ['Riley Specialist', 'Practice Store', 'GES', 8, 16, 2, 8, 7, 25, 100, 87.5, 3, 2, 6, 75],
    ]);

    const result = await buildStoredWeekFromCsvText(csv, 'fake-ges.csv', '2026-03-02');

    expect(result.reportTypeLabel).toBe('GES / Guest Experience Specialist');
    expect(result.week).toMatchObject({
      id: 'Practice Store-2026-03-02',
      weekStart: '2026-03-02',
      storeName: 'Practice Store',
      fileName: 'fake-ges.csv',
      totals: {
        employees: 1,
        totalGames: 8,
        guests: 16,
        replaysSold: 2,
        reviewsAsked: 8,
        sharedReplay: 7,
        afterGamePreviews: 0,
      },
    });
    expect(result.week.sourceFiles?.[0]).toMatchObject({
      fileName: 'fake-ges.csv',
      type: 'ges',
      reportType: 'ges',
      detectedStore: 'Practice Store',
      rowCount: 1,
    });
    expect(result.week.employees[0]).toMatchObject({
      name: 'Riley Specialist',
      role: 'GES',
      productsSold: 3,
      giftCardsSold: 2,
      postGamePreview: 6,
      postGamePreviewPercent: 75,
    });
  });

  it('rejects invalid CSV text before returning partial storage data', async () => {
    const invalidCsv = toCsv(
      ['name', 'storeName', 'role', 'totalGames', 'SUEs'],
      [['Taylor Fake', 'Training Store', 'GG', 3, 2]],
    );

    await expect(
      buildStoredWeekFromCsvText(invalidCsv, 'invalid.csv', '2026-04-06'),
    ).rejects.toThrow('Missing required columns');
  });

  it('creates a StoredWeek from the fake management export CSV shape', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-12T10:11:12.000Z'));

    const result = await buildStoredWeekFromCsvText(
      readFixture('fake-management-week-2026-05-11.csv'),
      'fake-management-week-2026-05-11.csv',
      '2026-05-11',
    );

    expect(result.reportTypeLabel).toBe('Game Guide');
    expect(result.week).toMatchObject({
      id: 'Training Store North-2026-05-11',
      weekStart: '2026-05-11',
      weekLabel: 'May 11 - May 17, 2026',
      storeName: 'Training Store North',
      fileName: 'fake-management-week-2026-05-11.csv',
      importedAt: '2026-05-12T10:11:12.000Z',
      totals: {
        employees: 4,
        totalGames: 36,
        guests: 84,
        replaysSold: 17,
        reviewsAsked: 35,
        sharedReplay: 33,
        afterGamePreviews: 33,
      },
    });
    expect(result.week.sourceFiles?.[0]).toMatchObject({
      fileName: 'fake-management-week-2026-05-11.csv',
      type: 'game-guide',
      reportType: 'game-guide',
      detectedStore: 'Training Store North',
      rowCount: 4,
    });
    expect(result.week.employees.find((employee) => employee.name === 'Morgan Mentor')).toMatchObject({
      role: 'Assistant Manager',
      totalGames: 5,
      previewsPercent: 100,
    });
  });
});
