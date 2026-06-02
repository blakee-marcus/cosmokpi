import { describe, expect, it } from 'vitest';

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

    expect(result.error).toContain('Missing required columns');
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
});
