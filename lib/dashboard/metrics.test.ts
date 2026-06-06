import { describe, expect, it } from 'vitest';

import {
  buildDashboardMetrics,
  buildWeekProgressMetrics,
  findPreviousWeekForStore,
  getEmployeeProgressSummary,
  getGoalStatus,
  getProgressStatus,
  getProgressSummary,
  getStoreKpiRates,
  getTopEmployee,
} from './metrics';
import { buildWeeklyPeriod } from './monthly';
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
  return {
    id: 'week-1',
    weekStart: '2026-05-04',
    weekLabel: 'May 4',
    fileName: 'fake.csv',
    uploadedAt: '2026-05-04T00:00:00.000Z',
    storeName: 'Test Store',
    totals: {
      employees: 2,
      totalGames: 20,
      guests: 50,
      replaysSold: 10,
      SUEs: 12,
      reviewsAsked: 18,
      sharedReplay: 16,
      afterGamePreviews: 14,
    },
    employees: [],
    ...overrides,
  };
}

describe('dashboard KPI metrics', () => {
  it('calculates store rates and dashboard cards from period totals', () => {
    const period = buildWeeklyPeriod(week({}));
    const rates = getStoreKpiRates(period);
    const cards = buildDashboardMetrics(period);

    expect(rates).toEqual({
      replayPercent: 20,
      reviewsAskedPercent: 90,
      sharedReplayPercent: 80,
      previewsPercent: 70,
    });
    expect(cards.map((card) => [card.label, card.value, card.goal])).toEqual([
      ['Replay discount rate', 20, 15],
      ['Review ask rate', 90, 90],
      ['Shared replay rate', 80, 90],
      ['Preview ask rate', 70, 90],
    ]);
    expect(cards[0].detail).toBe('10 replay discounts used by 50 guests.');
  });

  it('uses zero-denominator safety for empty dashboard periods', () => {
    const rates = getStoreKpiRates(
      buildWeeklyPeriod(
        week({
          totals: {
            employees: 0,
            totalGames: 0,
            guests: 0,
            replaysSold: 0,
            reviewsAsked: 0,
            sharedReplay: 0,
            afterGamePreviews: 0,
          },
        }),
      ),
    );

    expect(rates).toEqual({
      replayPercent: 0,
      reviewsAskedPercent: 0,
      sharedReplayPercent: 0,
      previewsPercent: 0,
    });
  });

  it('selects the latest older weekly report for the same normalized store', () => {
    const selected = week({
      id: 'selected',
      weekStart: '2026-05-18',
      storeName: 'Test Store',
    });
    const previousSameStore = week({
      id: 'previous',
      weekStart: '2026-05-11',
      storeName: ' test   store ',
    });
    const olderSameStore = week({
      id: 'older',
      weekStart: '2026-05-04',
      storeName: 'Test Store',
    });
    const otherStore = week({
      id: 'other-store',
      weekStart: '2026-05-15',
      storeName: 'Other Store',
    });

    expect(
      findPreviousWeekForStore([olderSameStore, otherStore, selected, previousSameStore], selected)
        ?.id,
    ).toBe('previous');
  });

  it('builds comparison metrics and summarizes strongest gains and priority follow-up', () => {
    const previous = buildWeeklyPeriod(
      week({
        id: 'previous',
        totals: {
          employees: 2,
          totalGames: 20,
          guests: 50,
          replaysSold: 8,
          reviewsAsked: 19,
          sharedReplay: 17,
          afterGamePreviews: 18,
        },
      }),
    );
    const selected = buildWeeklyPeriod(week({ id: 'selected' }));
    const metrics = buildWeekProgressMetrics(selected, previous);
    const summary = getProgressSummary(metrics);

    expect(metrics.map((metric) => [metric.label, metric.delta])).toEqual([
      ['Replay discount rate', 4],
      ['Review ask rate', -5],
      ['Shared replay rate', -5],
      ['Preview ask rate', -20],
    ]);
    expect(summary).toMatchObject({
      improvedCount: 1,
      steadyCount: 0,
      needsFollowUpCount: 3,
    });
    expect(summary.strongestGain?.label).toBe('Replay discount rate');
    expect(summary.priorityFollowUp?.label).toBe('Preview ask rate');
  });

  it('classifies progress and goal thresholds predictably', () => {
    expect(getProgressStatus(0.11)).toBe('improved');
    expect(getProgressStatus(0.1)).toBe('steady');
    expect(getProgressStatus(-0.1)).toBe('steady');
    expect(getProgressStatus(-0.11)).toBe('needsFollowUp');

    expect(getGoalStatus(90, 90)).toBe('onTrack');
    expect(getGoalStatus(81, 90)).toBe('watch');
    expect(getGoalStatus(80.9, 90)).toBe('needsFocus');
    expect(getGoalStatus(10, 10, 'lower')).toBe('onTrack');
    expect(getGoalStatus(11.5, 10, 'lower')).toBe('watch');
    expect(getGoalStatus(11.6, 10, 'lower')).toBe('needsFocus');
  });

  it('matches employees by normalized name and store for progress summaries', () => {
    const summary = getEmployeeProgressSummary(
      employee({
        name: 'ALEX GUIDE',
        storeName: ' Test   Store ',
        replaysSoldPercent: 24,
        reviewsAskedPercent: 90,
        sharedReplayPercent: 90,
        previewsPercent: 90,
      }),
      employee({
        name: 'alex guide',
        storeName: 'test store',
        replaysSoldPercent: 20,
        reviewsAskedPercent: 90,
        sharedReplayPercent: 90,
        previewsPercent: 90,
      }),
      true,
    );

    expect(summary).toEqual({
      label: 'Replay +4.0 pts',
      detail: 'Improved',
      status: 'improved',
    });
  });

  it('selects spotlight winners by metric, relevant denominator, and name', () => {
    const employees = [
      employee({
        name: 'Blair Guide',
        totalGames: 50,
        guests: 10,
        replaysSoldPercent: 30,
      }),
      employee({
        name: 'Casey Guide',
        totalGames: 20,
        guests: 30,
        replaysSoldPercent: 30,
      }),
      employee({
        name: 'Avery Guide',
        totalGames: 20,
        guests: 30,
        replaysSoldPercent: 30,
      }),
    ];

    expect(getTopEmployee(employees, 'replaysSoldPercent', 'guests')?.name).toBe('Avery Guide');
  });
});
