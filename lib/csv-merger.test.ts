import { describe, expect, it } from 'vitest';

import { calculateStoreTotals, mergeEmployeeRecords } from './csv-merger';
import type { EmployeeKpiRowWithSources } from './fltm-types';

function row(overrides: Partial<EmployeeKpiRowWithSources>): EmployeeKpiRowWithSources {
  return {
    name: 'Alex Guide',
    storeName: 'Test Store',
    role: 'GG',
    totalGames: 0,
    guests: 0,
    replaysSold: 0,
    reviewsAsked: 0,
    sharedReplay: 0,
    replaysSoldPercent: 0,
    reviewsAskedPercent: 0,
    sharedReplayPercent: 0,
    ...overrides,
  };
}

describe('employee merge and store totals', () => {
  it('merges duplicate employee rows by normalized name and recalculates percentages from summed counts', () => {
    const merged = mergeEmployeeRecords(
      [
        row({
          name: 'Alex Guide',
          role: 'GG',
          totalGames: 10,
          guests: 20,
          replaysSold: 4,
          reviewsAsked: 8,
          sharedReplay: 7,
          SUEs: 6,
          afterGamePreviews: 5,
        }),
        row({
          name: ' alex   guide ',
          role: 'Team Leader',
          totalGames: 5,
          guests: 10,
          replaysSold: 2,
          reviewsAsked: 4,
          sharedReplay: 5,
          SUEs: 3,
          afterGamePreviews: 4,
        }),
      ],
      'game-guide',
    );

    expect(merged.size).toBe(1);

    const employee = [...merged.values()][0];

    expect(employee).toMatchObject({
      totalGames: 15,
      guests: 30,
      replaysSold: 6,
      reviewsAsked: 12,
      sharedReplay: 12,
      SUEs: 9,
      afterGamePreviews: 9,
      role: 'TL',
      storeName: 'Test Store',
      replaysSoldPercent: 20,
      reviewsAskedPercent: 80,
      sharedReplayPercent: 80,
      suePercent: 60,
      previewsPercent: 60,
    });
    expect(employee.sources).toHaveLength(2);
  });

  it('recalculates store totals from employee rows', () => {
    const totals = calculateStoreTotals([
      row({
        name: 'Alex Guide',
        totalGames: 10,
        guests: 20,
        replaysSold: 4,
        reviewsAsked: 8,
        sharedReplay: 7,
        afterGamePreviews: 5,
      }),
      row({
        name: 'Jordan Host',
        totalGames: 6,
        guests: 12,
        replaysSold: 3,
        reviewsAsked: 6,
        sharedReplay: 6,
        afterGamePreviews: 4,
      }),
    ]);

    expect(totals).toEqual({
      employees: 2,
      totalGames: 16,
      guests: 32,
      replaysSold: 7,
      reviewsAsked: 14,
      sharedReplay: 13,
      afterGamePreviews: 9,
    });
  });

  it('keeps shared fields intact for minimum viable mixed Game Guide and GES rows', () => {
    const gameGuide = mergeEmployeeRecords(
      [
        row({
          name: 'Casey Lead',
          role: 'GG',
          totalGames: 10,
          guests: 20,
          replaysSold: 2,
          reviewsAsked: 9,
          sharedReplay: 8,
          SUEs: 7,
          afterGamePreviews: 6,
        }),
      ],
      'game-guide',
    ).get('casey lead');

    const ges = mergeEmployeeRecords(
      [
        row({
          name: 'Casey Lead',
          role: 'GES',
          totalGames: 4,
          guests: 8,
          replaysSold: 1,
          reviewsAsked: 4,
          sharedReplay: 4,
          productsSold: 3,
          giftCardsSold: 2,
          postGamePreview: 4,
        }),
      ],
      'ges',
    ).get('casey lead');

    expect(gameGuide).toMatchObject({
      name: 'Casey Lead',
      storeName: 'Test Store',
      role: 'GG',
      totalGames: 10,
      SUEs: 7,
      afterGamePreviews: 6,
    });
    expect(ges).toMatchObject({
      name: 'Casey Lead',
      storeName: 'Test Store',
      role: 'GES',
      totalGames: 4,
      productsSold: 3,
      giftCardsSold: 2,
      postGamePreview: 4,
    });
  });
});
