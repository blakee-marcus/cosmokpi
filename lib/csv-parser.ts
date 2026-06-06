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

export type CsvValidationErrorCode =
  | 'missing_required_columns'
  | 'unsupported_report_type'
  | 'no_team_members'
  | 'invalid_numeric_values'
  | 'empty_csv'
  | 'could_not_detect_store'
  | 'not_csv'
  | 'unknown';

export type CsvValidationError = {
  code: CsvValidationErrorCode;
  title: string;
  message: string;
  nextStep: string;
};

export type ParsedCsvResult = {
  reportType: ReportType;
  detectedStore: string;
  rows: EmployeeKpiRowWithSources[];
  contentHash: string;
  error?: string;
  validationError?: CsvValidationError;
};

const PERCENTAGE_COLUMNS = new Set([
  'replaysSoldPercent',
  'reviewsAskedPercent',
  'sharedReplayPercent',
  'suePercent',
  'previewsPercent',
  'postGamePreviewPercent',
]);

const VALIDATION_ERROR_COPY: Record<CsvValidationErrorCode, CsvValidationError> = {
  missing_required_columns: {
    code: 'missing_required_columns',
    title: 'Required columns are missing',
    message: 'Required columns are missing. Check that this is the weekly Game Guide CSV.',
    nextStep: 'Export the weekly cOSmo FLTM Game Guide CSV again, then upload it here.',
  },
  unsupported_report_type: {
    code: 'unsupported_report_type',
    title: 'Unsupported report type',
    message:
      'This CSV has the shared KPI columns, but it does not look like a supported Game Guide or GES report.',
    nextStep: 'Export the weekly Game Guide or GES KPI report from cOSmo FLTM Reports.',
  },
  no_team_members: {
    code: 'no_team_members',
    title: 'No valid team member rows found',
    message: 'No valid team member rows were found. Check the export and try again.',
    nextStep: 'Make sure the CSV includes employee names and KPI rows before uploading.',
  },
  invalid_numeric_values: {
    code: 'invalid_numeric_values',
    title: 'Invalid numbers found',
    message: 'Some rows have invalid numbers. Fix the CSV values, then upload it again.',
    nextStep: 'Review the KPI number columns in the CSV export before trying again.',
  },
  empty_csv: {
    code: 'empty_csv',
    title: 'Empty CSV',
    message: 'This CSV is empty. Export the report again and upload the new file.',
    nextStep: 'Export a fresh weekly cOSmo FLTM Game Guide CSV, then upload it here.',
  },
  could_not_detect_store: {
    code: 'could_not_detect_store',
    title: 'Could not detect store',
    message: 'The team member rows do not include a store name.',
    nextStep: 'Export the report with the store column included, then upload it again.',
  },
  not_csv: {
    code: 'not_csv',
    title: 'File is not a CSV',
    message: 'This file is not a CSV. Upload the weekly cOSmo FLTM Game Guide CSV.',
    nextStep: 'Choose the .csv file downloaded from cOSmo FLTM Reports.',
  },
  unknown: {
    code: 'unknown',
    title: 'Import failed',
    message: 'Something went wrong while preparing this report.',
    nextStep: 'Check the CSV export and try uploading it again.',
  },
};

export function getCsvValidationError(code: CsvValidationErrorCode): CsvValidationError {
  const baseError = VALIDATION_ERROR_COPY[code];

  return {
    ...baseError,
  };
}

function buildErrorResult(
  code: CsvValidationErrorCode,
  contentHash: string,
): ParsedCsvResult {
  const validationError = getCsvValidationError(code);

  return {
    reportType: 'unknown',
    detectedStore: 'Unknown',
    rows: [],
    contentHash,
    error: validationError.message,
    validationError,
  };
}

function parseNumericCsvValue(header: string, rawValue: string) {
  if (!rawValue) {
    return 0;
  }

  const value = Number(rawValue || 0);

  if (!Number.isFinite(value)) {
    throw new Error(`Column ${header} contains a non-numeric value.`);
  }

  if (PERCENTAGE_COLUMNS.has(header) && value >= 0 && value <= 1) {
    return value * 100;
  }

  return value;
}

/**
 * Parse CSV file content and detect report type
 * Supports flexible columns based on Game Guide vs GES format
 */
export async function parseFltmCsv(fileContent: string): Promise<ParsedCsvResult> {
  try {
    const contentHash = await computeFileHash(fileContent);

    if (!fileContent.trim()) {
      return buildErrorResult('empty_csv', contentHash);
    }

    // Parse raw CSV
    const rawRows = parseCsvRaw(fileContent);

    if (rawRows.length === 0) {
      return buildErrorResult('empty_csv', contentHash);
    }

    // Extract and clean headers
    const headers = extractHeaders(rawRows);

    if (headers.length === 0 || headers.every((header) => !header)) {
      return buildErrorResult('empty_csv', contentHash);
    }

    // Detect report type
    const detection = detectReportType(headers);

    if (detection.error) {
      return buildErrorResult('missing_required_columns', contentHash);
    }

    if (detection.type === 'unknown') {
      return buildErrorResult('unsupported_report_type', contentHash);
    }

    // Get numeric columns for this report type
    const numericColumns = getNumericColumnsForType(detection.type);

    // Parse data rows
    const rows: EmployeeKpiRowWithSources[] = [];

    for (const row of rawRows.slice(1)) {
      try {
        const record = headers.reduce<Record<string, string | number>>((acc, header, index) => {
          const rawValue = row[index] ?? '';
          acc[header] = numericColumns.has(header)
            ? parseNumericCsvValue(header, rawValue)
            : rawValue;
          return acc;
        }, {});

        rows.push(record as EmployeeKpiRowWithSources);
      } catch {
        return buildErrorResult('invalid_numeric_values', contentHash);
      }
    }

    const teamRows = rows.filter((row) => String(row.name ?? '').trim());

    if (teamRows.length === 0) {
      return buildErrorResult('no_team_members', contentHash);
    }

    // Extract detected store name from first row
    const detectedStore = teamRows.find((row) => String(row.storeName ?? '').trim())?.storeName
      ? String(teamRows.find((row) => String(row.storeName ?? '').trim())?.storeName)
      : 'Unknown';

    if (detectedStore === 'Unknown') {
      return buildErrorResult('could_not_detect_store', contentHash);
    }

    return {
      reportType: detection.type,
      detectedStore,
      rows: teamRows,
      contentHash,
    };
  } catch {
    const validationError = getCsvValidationError('unknown');

    return {
      reportType: 'unknown',
      detectedStore: 'Unknown',
      rows: [],
      contentHash: 'error',
      error: validationError.message,
      validationError,
    };
  }
}
