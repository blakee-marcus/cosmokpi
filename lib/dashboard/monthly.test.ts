import { describe, expect, it } from 'vitest';

import {
  buildMonthlyPeriod,
  findPreviousMonthlyPeriod,
  getMonthlyPeriodOptions,
} from './monthly';
import type { EmployeeKpiRow, StoredWeek } from './types';

function employee(overrides: Partial<EmployeeKpiRow>): EmployeeKpiRow {
  return {
    name: 'Alex Guide',
    storeName: 'Test Store',
    role: 'GG',
    totalGames: 0,
    guests: 0,
    replaysSold: 0,
    SUEs: 0,
    reviewsAsked: 0,
    sharedReplay: 0,
    afterGamePreviews: 0,
    replaysSoldPercent: 0,
    suePercent: 0,
    reviewsAskedPercent: 0,
    sharedReplayPercent: 0,
    previewsPercent: 0,
    ...overrides,
  };
}

function week(overrides: Partial<StoredWeek>): StoredWeek {
  const employees = overrides.employees ?? [];

  return {
    id: 'week-1',
    weekStart: '2026-05-04',
    weekLabel: 'May 4',
    fileName: 'fake.csv',
    uploadedAt: '2026-05-04T00:00:00.000Z',
    importedAt: '2026-05-04T00:00:00.000Z',
    sourceFiles: [{ fileName: 'fake.csv', type: 'game-guide', importedAt: '2026-05-04T00:00:00.000Z' }],
    storeName: 'Test Store',
    totals: {
      employees: employees.length,
      totalGames: employees.reduce((sum, row) => sum + row.totalGames, 0),
      guests: employees.reduce((sum, row) => sum + row.guests, 0),
      replaysSold: employees.reduce((sum, row) => sum + row.replaysSold, 0),
      SUEs: employees.reduce((sum, row) => sum + row.SUEs, 0),
      reviewsAsked: employees.reduce((sum, row) => sum + row.reviewsAsked, 0),
      sharedReplay: employees.reduce((sum, row) => sum + row.sharedReplay, 0),
      afterGamePreviews: employees.reduce((sum, row) => sum + row.afterGamePreviews, 0),
    },
    employees,
    ...overrides,
  };
}

describe('monthly dashboard aggregation', () => {
  const mayWeekOne = week({
    id: 'may-1',
    weekStart: '2026-05-04',
    weekLabel: 'May 4',
    storeName: 'Test Store',
    sourceFiles: [{ fileName: 'may-1.csv', type: 'game-guide', importedAt: '2026-05-04T00:00:00.000Z' }],
    employees: [
      employee({
        name: 'Alex Guide',
        totalGames: 10,
        guests: 20,
        replaysSold: 4,
        SUEs: 6,
        reviewsAsked: 8,
        sharedReplay: 7,
        afterGamePreviews: 5,
      }),
    ],
  });
  const mayWeekTwo = week({
    id: 'may-2',
    weekStart: '2026-05-11',
    weekLabel: 'May 11',
    storeName: ' test   store ',
    sourceFiles: [{ fileName: 'may-2.csv', type: 'ges', importedAt: '2026-05-11T00:00:00.000Z' }],
    employees: [
      employee({
        name: 'alex   guide',
        storeName: ' test   store ',
        role: 'GES',
        totalGames: 5,
        guests: 10,
        replaysSold: 2,
        SUEs: 3,
        reviewsAsked: 4,
        sharedReplay: 5,
        afterGamePreviews: 4,
      }),
      employee({
        name: 'Jordan Host',
        storeName: ' test   store ',
        totalGames: 4,
        guests: 8,
        replaysSold: 1,
        SUEs: 2,
        reviewsAsked: 4,
        sharedReplay: 4,
        afterGamePreviews: 3,
      }),
    ],
  });
  const aprilWeek = week({
    id: 'april-1',
    weekStart: '2026-04-20',
    weekLabel: 'Apr 20',
    storeName: 'Test Store',
    employees: [
      employee({
        name: 'Alex Guide',
        totalGames: 8,
        guests: 16,
        replaysSold: 2,
        SUEs: 4,
        reviewsAsked: 8,
        sharedReplay: 8,
        afterGamePreviews: 8,
      }),
    ],
  });

  it('groups weeks by normalized store and YYYY-MM for monthly options', () => {
    const options = getMonthlyPeriodOptions([mayWeekOne, mayWeekTwo, aprilWeek]);

    expect(options.map((option) => option.id)).toEqual(['test store:2026-05', 'test store:2026-04']);
    expect(options[0].period.includedWeekCount).toBe(2);
    expect(options[0].period.weekIds).toEqual(['may-1', 'may-2']);
  });

  it('merges monthly employee rows, recalculates totals and percentages, and preserves source files', () => {
    const period = buildMonthlyPeriod([mayWeekOne, mayWeekTwo, aprilWeek], mayWeekTwo);

    expect(period).not.toBeNull();
    expect(period?.employees).toHaveLength(2);
    expect(period?.totals).toMatchObject({
      employees: 2,
      totalGames: 19,
      guests: 38,
      replaysSold: 7,
      SUEs: 11,
      reviewsAsked: 16,
      sharedReplay: 16,
      afterGamePreviews: 12,
    });

    const alex = period?.employees.find((row) => row.name === 'alex   guide');

    expect(alex).toMatchObject({
      totalGames: 15,
      guests: 30,
      replaysSold: 6,
      SUEs: 9,
      reviewsAsked: 12,
      sharedReplay: 12,
      afterGamePreviews: 9,
      replaysSoldPercent: 20,
      suePercent: 60,
      reviewsAskedPercent: 80,
      sharedReplayPercent: 80,
      previewsPercent: 60,
    });
    expect(period?.aggregateWeek.sourceFiles?.map((source) => source.fileName)).toEqual([
      'may-1.csv',
      'may-2.csv',
    ]);
  });

  it('selects the previous month for the same store', () => {
    const selected = buildMonthlyPeriod([mayWeekOne, mayWeekTwo, aprilWeek], mayWeekTwo);
    const previous = selected
      ? findPreviousMonthlyPeriod([mayWeekOne, mayWeekTwo, aprilWeek], selected)
      : null;

    expect(previous?.monthKey).toBe('2026-04');
    expect(previous?.storeName).toBe('Test Store');
  });
});
