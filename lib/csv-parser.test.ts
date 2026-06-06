import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { detectReportType, extractHeaders, parseCsvRaw } from './csv-detection';
import { parseFltmCsv } from './csv-parser';

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

const MANAGEMENT_EXPORT_HEADERS = [
  'name',
  'storeName',
  'role',
  'totalGames',
  'guests',
  'replaysSold',
  'SUEs',
  'reviewsAsked',
  'sharedReplay',
  'afterGamePreviews',
  'replaysSoldPercent',
  'suePercent',
  'reviewsAskedPercent',
  'sharedReplayPercent',
  'previewsPercent',
];

function readFixture(name: string) {
  return readFileSync(join(process.cwd(), 'test/fixtures/csv', name), 'utf8');
}

function toCsv(headers: string[], rows: Array<Array<string | number>>) {
  return [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
}

describe('CSV detection and parsing', () => {
  it('strips a UTF-8 BOM from the first header', () => {
    const headers = extractHeaders([['\uFEFFname', 'storeName']]);

    expect(headers).toEqual(['name', 'storeName']);
  });

  it('parses quoted CSV values with commas and escaped quotes', () => {
    const rows = parseCsvRaw('name,storeName,role\n"Alex, Guide","Store ""A""",GG');

    expect(rows).toEqual([
      ['name', 'storeName', 'role'],
      ['Alex, Guide', 'Store "A"', 'GG'],
    ]);
  });

  it('detects Game Guide reports by headers', () => {
    expect(detectReportType(GAME_GUIDE_HEADERS)).toMatchObject({
      type: 'game-guide',
      hasGameGuideColumns: true,
      hasGesColumns: false,
    });
  });

  it('detects GES reports by headers', () => {
    expect(detectReportType(GES_HEADERS)).toMatchObject({
      type: 'ges',
      hasGameGuideColumns: false,
      hasGesColumns: true,
    });
  });

  it('rejects files missing required shared columns', async () => {
    const csv = toCsv(
      ['name', 'storeName', 'role', 'totalGames', 'SUEs'],
      [['Alex Guide', 'Test Store', 'GG', 10, 8]],
    );

    const result = await parseFltmCsv(csv);

    expect(result.error).toBe('Required columns are missing. Check that this is the weekly Game Guide CSV.');
    expect(result.rows).toEqual([]);
    expect(result.reportType).toBe('unknown');
  });

  it('normalizes decimal percentages, preserves whole-number percentages, and defaults empty numeric fields to 0', async () => {
    const csv = toCsv(GAME_GUIDE_HEADERS, [
      [
        'Alex Guide',
        'Test Store',
        'GG',
        10,
        25,
        5,
        9,
        8,
        0.2,
        90,
        0.8,
        '',
        0.92,
        7,
        70,
      ],
    ]);

    const result = await parseFltmCsv(csv);

    expect(result.error).toBeUndefined();
    expect(result.reportType).toBe('game-guide');
    expect(result.detectedStore).toBe('Test Store');
    expect(result.rows[0]).toMatchObject({
      name: 'Alex Guide',
      storeName: 'Test Store',
      replaysSoldPercent: 20,
      reviewsAskedPercent: 90,
      sharedReplayPercent: 80,
      SUEs: 0,
      suePercent: 92,
      afterGamePreviews: 7,
      previewsPercent: 70,
    });
  });

  it('parses the fake management export shape with 0-100 percentage values preserved', async () => {
    const csv = readFixture('fake-management-week-2026-05-04.csv');
    const rawRows = parseCsvRaw(csv);

    expect(extractHeaders(rawRows)).toEqual(MANAGEMENT_EXPORT_HEADERS);

    const result = await parseFltmCsv(csv);

    expect(result.error).toBeUndefined();
    expect(result.reportType).toBe('game-guide');
    expect(result.detectedStore).toBe('Training Store North');
    expect(result.rows).toHaveLength(4);
    expect(result.rows[0]).toMatchObject({
      name: 'Alex Arcade',
      storeName: 'Training Store North',
      role: 'Game Guide',
      totalGames: 12,
      guests: 28,
      replaysSold: 5,
      SUEs: 9,
      reviewsAsked: 11,
      sharedReplay: 10,
      afterGamePreviews: 8,
      replaysSoldPercent: 17.86,
      suePercent: 75,
      reviewsAskedPercent: 91.67,
      sharedReplayPercent: 83.33,
      previewsPercent: 66.67,
    });
  });
});
