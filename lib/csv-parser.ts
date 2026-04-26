/**
 * Flexible CSV parser for FLTM exports
 * Data Parsing Agent owns this file
 */

import {
  computeFileHash,
  detectReportType,
  extractHeaders,
  getNumericColumnsForType,
  parseCsvRaw,
} from './csv-detection';
import type { EmployeeKpiRowWithSources, ReportType } from './fltm-types';

export type ParsedCsvResult = {
  reportType: ReportType;
  detectedStore: string;
  rows: EmployeeKpiRowWithSources[];
  contentHash: string;
  error?: string;
};

/**
 * Parse CSV file content and detect report type
 * Supports flexible columns based on Game Guide vs GES format
 */
export async function parseFltmCsv(fileContent: string): Promise<ParsedCsvResult> {
  try {
    // Parse raw CSV
    const rawRows = parseCsvRaw(fileContent);

    if (rawRows.length < 2) {
      return {
        reportType: 'unknown',
        detectedStore: 'Unknown',
        rows: [],
        contentHash: await computeFileHash(fileContent),
        error: 'This CSV does not include the team KPI rows we need.',
      };
    }

    // Extract and clean headers
    const headers = extractHeaders(rawRows);

    // Detect report type
    const detection = detectReportType(headers);

    if (detection.error) {
      return {
        reportType: 'unknown',
        detectedStore: 'Unknown',
        rows: [],
        contentHash: await computeFileHash(fileContent),
        error: detection.error,
      };
    }

    // Get numeric columns for this report type
    const numericColumns = getNumericColumnsForType(detection.type);

    // Parse data rows
    const rows = rawRows.slice(1).map((row) => {
      const record = headers.reduce<Record<string, string | number>>((acc, header, index) => {
        const rawValue = row[index] ?? '';
        acc[header] = numericColumns.has(header) ? Number(rawValue || 0) : rawValue;
        return acc;
      }, {});

      return record as EmployeeKpiRowWithSources;
    });

    // Extract detected store name from first row
    const detectedStore = rows[0]?.storeName ? String(rows[0].storeName) : 'Unknown';

    // Compute content hash for deduplication
    const contentHash = await computeFileHash(fileContent);

    return {
      reportType: detection.type,
      detectedStore,
      rows,
      contentHash,
    };
  } catch (error) {
    return {
      reportType: 'unknown',
      detectedStore: 'Unknown',
      rows: [],
      contentHash: 'error',
      error:
        error instanceof Error ? error.message : 'Something went wrong while parsing this CSV.',
    };
  }
}
