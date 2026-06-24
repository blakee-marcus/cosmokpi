import { describe, expect, it } from 'vitest';

import {
  getExportStoreLabel,
  getFrontlineNewsletterRows,
  isManagementRole,
  prepareNewsletterExport,
} from './newsletter-export';
import type { EmployeeKpiRow, StoredWeek } from './types';

function employee(overrides: Partial<EmployeeKpiRow>): EmployeeKpiRow {
  return {
    name: 'Alex Guide',
    storeName: 'The Escape Game Las Vegas - The Forum Shops',
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
    storeName: 'The Escape Game Las Vegas - The Forum Shops',
    totals: {
      employees: employees.length,
      totalGames: employees.reduce((sum, row) => sum + row.totalGames, 0),
      guests: employees.reduce((sum, row) => sum + row.guests, 0),
      replaysSold: employees.reduce((sum, row) => sum + row.replaysSold, 0),
      reviewsAsked: employees.reduce((sum, row) => sum + row.reviewsAsked, 0),
      sharedReplay: employees.reduce((sum, row) => sum + row.sharedReplay, 0),
      afterGamePreviews: employees.reduce((sum, row) => sum + row.afterGamePreviews, 0),
    },
    employees,
    ...overrides,
  };
}

describe('Frontline Newsletter export prep', () => {
  it('normalizes store labels for export filenames and headers', () => {
    expect(getExportStoreLabel('The Escape Game Las Vegas - The Forum Shops')).toBe('Las Vegas');
    expect(getExportStoreLabel('The Escape Game Las Vegas: AREA15')).toBe('Las Vegas');
    expect(getExportStoreLabel('Downtown:')).toBe('Downtown');
  });

  it('detects management roles without excluding frontline roles', () => {
    expect(isManagementRole('General Manager')).toBe(true);
    expect(isManagementRole('Assistant Manager')).toBe(true);
    expect(isManagementRole('Manager in Training')).toBe(true);
    expect(isManagementRole('GG')).toBe(false);
    expect(isManagementRole('Team Leader')).toBe(false);
  });

  it('filters management from export rows and sorts frontline rows by games then name', () => {
    const rows = getFrontlineNewsletterRows(
      week({
        employees: [
          employee({ name: 'General Manager', role: 'General Manager', totalGames: 98 }),
          employee({ name: 'Casey Guide', totalGames: 10 }),
          employee({ name: 'Alex Guide', totalGames: 10 }),
          employee({ name: 'Blair Guide', totalGames: 0 }),
        ],
      }),
    );

    expect(rows.map((row) => row.name)).toEqual(['Alex Guide', 'Casey Guide', 'Blair Guide']);
  });

  it('prepares stable export metadata without rendering canvas', () => {
    const exportPrep = prepareNewsletterExport(
      week({
        weekStart: '2026-05-04',
        weekLabel: 'Week of May 4',
        employees: [employee({ name: 'Alex Guide', totalGames: 8 })],
      }),
    );

    expect(exportPrep).toMatchObject({
      columns: ['Team Member', '# Games', '# Guests', 'Replay', 'Review Ask', 'Preview'],
      filename: 'flnl-kpi-las-vegas-2026-05-04.png',
      storeLabel: 'Las Vegas',
      storeSlug: 'las-vegas',
      weekLabel: 'Week of May 4',
      weekStart: '2026-05-04',
    });
    expect(exportPrep.rows.map((row) => row.name)).toEqual(['Alex Guide']);
  });
});
