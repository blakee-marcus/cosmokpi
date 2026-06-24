import { describe, expect, it } from 'vitest';

import { filterEmployees, getSortValue, rankEmployees } from './table';
import type { EmployeeKpiRow } from './types';

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

describe('dashboard table helpers', () => {
  const employees = [
    employee({
      name: 'Casey Guide',
      role: 'GG',
      totalGames: 8,
      guests: 20,
      replaysSoldPercent: 0.2,
      reviewsAskedPercent: 90,
    }),
    employee({
      name: 'Alex Host',
      role: 'Team Leader',
      storeName: 'Area 15',
      totalGames: 12,
      guests: 24,
      replaysSoldPercent: 20,
      reviewsAskedPercent: 80,
    }),
    employee({
      name: 'Blair Host',
      role: 'GG',
      totalGames: 4,
      guests: 40,
      replaysSoldPercent: 100,
      reviewsAskedPercent: 100,
    }),
    employee({
      name: 'Drew Host',
      role: 'GG',
      totalGames: 8,
      guests: 18,
      replaysSoldPercent: 20,
      reviewsAskedPercent: 95,
    }),
  ];

  const employeesWithManager = [
    ...employees,
    employee({
      name: 'Sam Manager',
      role: 'Management',
      totalGames: 15,
      guests: 40,
      replaysSoldPercent: 25,
      reviewsAskedPercent: 95,
    }),
  ];

  it('excludes management from ranked employees', () => {
    const ranked = rankEmployees(employeesWithManager, 'replaysSoldPercent');
    expect(ranked.map((row) => row.name)).not.toContain('Sam Manager');
  });

  it('normalizes percentage sort values without changing count values', () => {
    expect(getSortValue(employees[0], 'replaysSoldPercent')).toBe(20);
    expect(getSortValue(employees[0], 'totalGames')).toBe(8);
  });

  it('ranks eligible employees by metric, games hosted, and identity', () => {
    expect(rankEmployees(employees, 'replaysSoldPercent').map((row) => row.name)).toEqual([
      'Alex Host',
      'Casey Guide',
      'Drew Host',
    ]);
  });

  it('sorts eligible employees by name when requested', () => {
    expect(rankEmployees(employees, 'name').map((row) => row.name)).toEqual([
      'Alex Host',
      'Casey Guide',
      'Drew Host',
    ]);
  });

  it('searches normalized name, role, and store text without mutating rank order', () => {
    const ranked = rankEmployees(employees, 'replaysSoldPercent');

    expect(filterEmployees(ranked, 'team leader').map((row) => row.name)).toEqual(['Alex Host']);
    expect(filterEmployees(ranked, 'area 15').map((row) => row.name)).toEqual(['Alex Host']);
    expect(filterEmployees(ranked, 'host').map((row) => row.name)).toEqual([
      'Alex Host',
      'Drew Host',
    ]);
    expect(filterEmployees(ranked, '   ')).toBe(ranked);
  });
});
