import { describe, expect, it } from 'vitest';

import {
  buildPerformanceCoachingViewModel,
  getCoachingOpportunities,
  getEmployeeTrendSummary,
  getMetricDelta,
  getMostImprovedInsights,
  getNeedsCoachingAttention,
  getTopPerformerInsights,
  getTrendDirection,
} from './coaching';
import { buildMonthlyPeriod, buildWeeklyPeriod } from './monthly';
import type { EmployeeKpiRow, StoredWeek } from './types';

function employee(overrides: Partial<EmployeeKpiRow>): EmployeeKpiRow {
  return {
    name: 'Alex Guide',
    storeName: 'Test Store',
    role: 'GG',
    totalGames: 10,
    guests: 20,
    replaysSold: 2,
    SUEs: 0,
    reviewsAsked: 8,
    sharedReplay: 8,
    afterGamePreviews: 8,
    replaysSoldPercent: 10,
    suePercent: 0,
    reviewsAskedPercent: 80,
    sharedReplayPercent: 80,
    previewsPercent: 80,
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

describe('performance coaching helpers', () => {
  function expectNoGuidanceFields(value: unknown) {
    const forbiddenTerm = 'act' + 'ion';
    const forbiddenPrefix = 'sug' + 'gested';

    function visit(node: unknown) {
      if (!node || typeof node !== 'object') return;

      Object.entries(node).forEach(([key, child]) => {
        expect(key.toLowerCase()).not.toContain(forbiddenTerm);
        expect(key).not.toMatch(new RegExp(`^${forbiddenPrefix}`));
        visit(child);
      });
    }

    visit(value);
  }

  it('classifies trend direction as up, down, or flat using point deltas', () => {
    expect(getTrendDirection({ currentValue: 12, previousValue: 10, hasPreviousPeriod: true })).toBe(
      'up',
    );
    expect(getTrendDirection({ currentValue: 8, previousValue: 10, hasPreviousPeriod: true })).toBe(
      'down',
    );
    expect(
      getTrendDirection({ currentValue: 10.05, previousValue: 10, hasPreviousPeriod: true }),
    ).toBe('flat');
    expect(getMetricDelta(12, 10)).toBe(2);
  });

  it('handles missing previous periods, matched previous employees, unmatched employees, and zero baselines', () => {
    expect(getTrendDirection({ currentValue: 12, hasPreviousPeriod: false })).toBe(
      'insufficientData',
    );
    expect(getTrendDirection({ currentValue: 12, hasPreviousPeriod: true })).toBe(
      'noPriorBaseline',
    );
    expect(getTrendDirection({ currentValue: 12, previousValue: 0, hasPreviousPeriod: true })).toBe(
      'newActivity',
    );
    expect(getTrendDirection({ currentValue: 0, previousValue: 0, hasPreviousPeriod: true })).toBe(
      'noPriorBaseline',
    );

    expect(
      getEmployeeTrendSummary({
        employee: employee({ replaysSoldPercent: 20 }),
        previousEmployee: employee({ replaysSoldPercent: 10 }),
        hasPreviousPeriod: true,
      }),
    ).toMatchObject({ label: 'Replay conversion +10.0 pts', state: 'up' });

    expect(
      getEmployeeTrendSummary({
        employee: employee({ name: 'New Guide' }),
        hasPreviousPeriod: true,
      }),
    ).toMatchObject({ label: 'New this period', state: 'noPriorBaseline' });
  });

  it('ranks most improved by strongest positive movement with games then name tie-breaking', () => {
    const previous = buildWeeklyPeriod(
      week({
        employees: [
          employee({ name: 'Casey Guide', reviewsAskedPercent: 50, totalGames: 10 }),
          employee({ name: 'Alex Guide', reviewsAskedPercent: 50, totalGames: 12 }),
          employee({ name: 'Blair Guide', reviewsAskedPercent: 80, totalGames: 10 }),
        ],
      }),
    );
    const current = buildWeeklyPeriod(
      week({
        employees: [
          employee({ name: 'Casey Guide', reviewsAskedPercent: 70, totalGames: 10 }),
          employee({ name: 'Alex Guide', reviewsAskedPercent: 70, totalGames: 12 }),
          employee({ name: 'Blair Guide', reviewsAskedPercent: 90, totalGames: 10 }),
          employee({ name: 'New Guide', reviewsAskedPercent: 100, totalGames: 20 }),
        ],
      }),
    );

    const insights = getMostImprovedInsights(current, previous);

    expect(insights.map((insight) => insight.name)).toEqual(['Alex Guide', 'Casey Guide', 'Blair Guide']);
    expect(insights[0]).toMatchObject({
      improvedMetric: 'Review ask consistency',
      currentValue: 70,
      previousValue: 50,
      delta: 20,
      trend: 'up',
    });
  });

  it('builds top performer insights without letting tiny samples dominate', () => {
    const current = buildWeeklyPeriod(
      week({
        employees: [
          employee({ name: 'Tiny Sample', totalGames: 2, guests: 3, replaysSoldPercent: 100 }),
          employee({ name: 'Replay Lead', totalGames: 12, guests: 40, replaysSoldPercent: 30 }),
          employee({ name: 'Review Lead', totalGames: 12, reviewsAskedPercent: 98 }),
        ],
      }),
    );

    const insights = getTopPerformerInsights(current, null);

    expect(insights.map((insight) => insight.name)).toContain('Replay Lead');
    expect(insights.map((insight) => insight.name)).toContain('Review Lead');
    expect(insights.map((insight) => insight.name)).not.toContain('Tiny Sample');
    expect(insights[0]).toEqual(
      expect.objectContaining({
        name: expect.any(String),
        strengthLabel: expect.any(String),
        supportingEvidence: expect.any(String),
        trend: expect.any(String),
      }),
    );
    expectNoGuidanceFields(insights);
  });

  it('generates coaching opportunities from behavior gaps', () => {
    const current = buildWeeklyPeriod(
      week({
        employees: [
          employee({ name: 'Review Support', reviewsAskedPercent: 55, totalGames: 10 }),
          employee({ name: 'Preview Support', previewsPercent: 50, totalGames: 9 }),
          employee({ name: 'Replay Support', replaysSoldPercent: 2, guests: 35, totalGames: 10 }),
        ],
      }),
    );

    const opportunities = getCoachingOpportunities(current);

    expect(opportunities.map((opportunity) => opportunity.coachingFocus)).toContain('Review asks');
    expect(opportunities[0]).toEqual(
      expect.objectContaining({
        coachingFocus: expect.any(String),
        supportingEvidence: expect.any(String),
        teamMembers: expect.any(Array),
      }),
    );
    expect(opportunities.flatMap((opportunity) => opportunity.teamMembers)).toContain(
      'Review Support',
    );
    expectNoGuidanceFields(opportunities);
  });

  it('shows needs coaching attention only when the eligible sample is fair', () => {
    const current = buildWeeklyPeriod(
      week({
        employees: [
          employee({ name: 'Alex Guide', totalGames: 10, reviewsAskedPercent: 40 }),
          employee({ name: 'Blair Guide', totalGames: 10, reviewsAskedPercent: 60 }),
          employee({ name: 'Casey Guide', totalGames: 10, reviewsAskedPercent: 80 }),
          employee({ name: 'Drew Guide', totalGames: 10, reviewsAskedPercent: 95 }),
        ],
      }),
    );
    const smallSample = buildWeeklyPeriod(
      week({
        employees: [
          employee({ name: 'Alex Guide', totalGames: 10, reviewsAskedPercent: 40 }),
          employee({ name: 'Blair Guide', totalGames: 10, reviewsAskedPercent: 60 }),
          employee({ name: 'Casey Guide', totalGames: 10, reviewsAskedPercent: 80 }),
        ],
      }),
    );

    expect(getNeedsCoachingAttention(current).items).toEqual([
      expect.objectContaining({
        name: 'Alex Guide',
        metricArea: 'Review asks',
        supportingEvidence: expect.any(String),
      }),
    ]);
    expectNoGuidanceFields(getNeedsCoachingAttention(current));
    expect(getNeedsCoachingAttention(smallSample)).toEqual({
      items: [],
      message: 'Not enough eligible team members for a fair bottom-quartile view.',
    });
  });

  it('does not mutate input employee arrays', () => {
    const employees = [
      employee({ name: 'Blair Guide', totalGames: 8 }),
      employee({ name: 'Alex Guide', totalGames: 12 }),
    ];
    const originalOrder = employees.map((row) => row.name);

    getTopPerformerInsights(buildWeeklyPeriod(week({ employees })), null);
    getNeedsCoachingAttention(buildWeeklyPeriod(week({ employees })));

    expect(employees.map((row) => row.name)).toEqual(originalOrder);
  });

  it('builds a full weekly and monthly coaching view model', () => {
    const april = week({
      id: 'april',
      weekStart: '2026-04-06',
      weekLabel: 'Apr 6',
      employees: [employee({ name: 'Alex Guide', reviewsAskedPercent: 50, totalGames: 10 })],
    });
    const mayOne = week({
      id: 'may-1',
      weekStart: '2026-05-04',
      weekLabel: 'May 4',
      employees: [employee({ name: 'Alex Guide', reviewsAskedPercent: 75, totalGames: 10 })],
    });
    const mayTwo = week({
      id: 'may-2',
      weekStart: '2026-05-11',
      weekLabel: 'May 11',
      employees: [employee({ name: 'Alex Guide', reviewsAskedPercent: 95, totalGames: 10 })],
    });
    const monthly = buildMonthlyPeriod([april, mayOne, mayTwo], mayTwo);
    const previousMonthly = monthly ? buildMonthlyPeriod([april], april) : null;

    const weeklyView = buildPerformanceCoachingViewModel({
      selectedPeriod: buildWeeklyPeriod(mayTwo),
      previousPeriod: buildWeeklyPeriod(mayOne),
    });

    expect(weeklyView.hasEnoughData).toBe(true);
    expectNoGuidanceFields(weeklyView);
    expect(monthly).not.toBeNull();
    expect(
      buildPerformanceCoachingViewModel({
        selectedPeriod: monthly!,
        previousPeriod: previousMonthly,
      }).periodType,
    ).toBe('monthly');
  });
});
