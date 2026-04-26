/**
 * CSV detection and parsing utilities
 * Data Parsing Agent owns this file
 */

import type { CsvDetectionResult, ReportType } from './fltm-types';

// Column indicators for each report type
const GAME_GUIDE_INDICATORS = ['SUEs', 'afterGamePreviews', 'suePercent', 'previewsPercent'];
const GES_INDICATORS = [
  'productsSold',
  'giftCardsSold',
  'postGamePreview',
  'postGamePreviewPercent',
];

// Core shared columns that should be present in all valid exports
const SHARED_REQUIRED_COLUMNS = [
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

/**
 * Detect report type from CSV headers
 * Header detection is the source of truth; filename is only a fallback hint
 */
export function detectReportType(headers: string[]): CsvDetectionResult {
  const headerSet = new Set(headers);
  const hasGameGuideColumns = GAME_GUIDE_INDICATORS.some((col) => headerSet.has(col));
  const hasGesColumns = GES_INDICATORS.some((col) => headerSet.has(col));

  // Check for missing shared required columns
  const missingShared = SHARED_REQUIRED_COLUMNS.filter((col) => !headerSet.has(col));

  if (missingShared.length > 0) {
    return {
      type: 'unknown',
      hasGameGuideColumns,
      hasGesColumns,
      headers,
      columnMapping: {},
      error: `Missing required columns: ${missingShared.join(', ')}`,
    };
  }

  // Determine type based on specific indicators
  let type: ReportType = 'unknown';
  if (hasGameGuideColumns && !hasGesColumns) {
    type = 'game-guide';
  } else if (hasGesColumns && !hasGameGuideColumns) {
    type = 'ges';
  } else if (hasGameGuideColumns && hasGesColumns) {
    // Both indicators present - likely a combined export or unclear format
    // Prefer game-guide as primary, but note the ambiguity
    type = 'game-guide';
  }

  // Build column mapping for flexible parsing
  const columnMapping: Record<string, string> = {};
  for (const header of headers) {
    columnMapping[header] = header;
  }

  return {
    type,
    hasGameGuideColumns,
    hasGesColumns,
    headers,
    columnMapping,
  };
}

/**
 * Get human-readable report type label
 */
export function getReportTypeLabel(type: ReportType): string {
  switch (type) {
    case 'game-guide':
      return 'Game Guide';
    case 'ges':
      return 'GES / Guest Experience Specialist';
    case 'unknown':
      return 'Unknown report type';
  }
}

/**
 * Parse CSV text into raw rows, handling quotes and newlines
 */
export function parseCsvRaw(text: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = '';
  let insideQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const character = text[i];
    const nextCharacter = text[i + 1];

    if (character === '"' && nextCharacter === '"' && insideQuotes) {
      currentCell += '"';
      i += 1;
      continue;
    }

    if (character === '"') {
      insideQuotes = !insideQuotes;
      continue;
    }

    if (character === ',' && !insideQuotes) {
      currentRow.push(currentCell.trim());
      currentCell = '';
      continue;
    }

    if ((character === '\n' || character === '\r') && !insideQuotes) {
      if (character === '\r' && nextCharacter === '\n') {
        i += 1;
      }

      currentRow.push(currentCell.trim());
      if (currentRow.some(Boolean)) {
        rows.push(currentRow);
      }
      currentRow = [];
      currentCell = '';
      continue;
    }

    currentCell += character;
  }

  if (currentCell || currentRow.length) {
    currentRow.push(currentCell.trim());
    if (currentRow.some(Boolean)) {
      rows.push(currentRow);
    }
  }

  return rows;
}

/**
 * Extract headers from raw CSV rows, handling BOM
 */
export function extractHeaders(rows: string[][]): string[] {
  if (rows.length === 0) {
    return [];
  }

  return rows[0].map((header) => header.replace(/^\uFEFF/, ''));
}

/**
 * Compute SHA-256 hash of file content (browser-compatible)
 * Used for deduplication
 */
export async function computeFileHash(content: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(content);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Get numeric columns for flexible parsing
 * Game Guide + GES columns combined
 */
export function getNumericColumnsForType(reportType: ReportType): Set<string> {
  const numericColumns = new Set([
    'totalGames',
    'guests',
    'replaysSold',
    'reviewsAsked',
    'sharedReplay',
    'replaysSoldPercent',
    'reviewsAskedPercent',
    'sharedReplayPercent',
  ]);

  // Add type-specific numeric columns
  if (reportType === 'game-guide' || reportType === 'unknown') {
    numericColumns.add('SUEs');
    numericColumns.add('suePercent');
    numericColumns.add('afterGamePreviews');
    numericColumns.add('previewsPercent');
  }

  if (reportType === 'ges' || reportType === 'unknown') {
    numericColumns.add('productsSold');
    numericColumns.add('giftCardsSold');
    numericColumns.add('postGamePreview');
    numericColumns.add('postGamePreviewPercent');
  }

  return numericColumns;
}
