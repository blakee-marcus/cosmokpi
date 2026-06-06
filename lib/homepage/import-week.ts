import { getReportTypeLabel } from '@/lib/csv-detection';
import { mergeEmployeeRecords, calculateStoreTotals } from '@/lib/csv-merger';
import {
  getCsvValidationError,
  parseFltmCsv,
  type CsvValidationError,
} from '@/lib/csv-parser';
import { formatWeekLabel } from './dates';
import type { StoredWeek } from './types';

export type ImportWarning = {
  code: 'week_mismatch';
  title: string;
  message: string;
  nextStep: string;
};

export type ImportPreview = {
  fileName: string;
  selectedWeekLabel: string;
  savedWeekLabel: string;
  detectedRowCount: number;
  teamMemberCount: number;
  duplicateEmployeeRows: number;
  validationWarnings: ImportWarning[];
};

export class CsvImportError extends Error {
  validationError: CsvValidationError;

  constructor(validationError: CsvValidationError) {
    super(validationError.message);
    this.name = 'CsvImportError';
    this.validationError = validationError;
  }
}

export function isCsvFile(file: File) {
  return file.name.toLowerCase().endsWith('.csv');
}

export function getFileTypeValidationError() {
  return getCsvValidationError('not_csv');
}

function parseDateString(value: string) {
  const [year, month, day] = value.split('-').map(Number);

  if (!year || !month || !day) {
    return null;
  }

  return new Date(year, month - 1, day);
}

function extractIsoDateFromText(value: string) {
  const match = value.match(/\b(20\d{2})[-_](\d{2})[-_](\d{2})\b/);

  return match ? `${match[1]}-${match[2]}-${match[3]}` : null;
}

function isDateWithinSelectedWeek(dateString: string, weekStart: string) {
  const date = parseDateString(dateString);
  const start = parseDateString(weekStart);

  if (!date || !start) {
    return true;
  }

  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);

  return date >= start && date <= end;
}

function buildImportWarnings(fileName: string, weekStart: string): ImportWarning[] {
  const detectedDate = extractIsoDateFromText(fileName);

  if (!detectedDate || isDateWithinSelectedWeek(detectedDate, weekStart)) {
    return [];
  }

  return [
    {
      code: 'week_mismatch',
      title: 'Report week needs confirmation',
      message:
        'This file may not match the selected report week. Please confirm the report date range before saving.',
      nextStep: 'Proceed only if the selected report week is correct, or cancel and choose a different week.',
    },
  ];
}

export async function buildStoredWeekFromCsvText(
  csvText: string,
  fileName: string,
  weekStart: string,
): Promise<{
  week: StoredWeek;
  reportTypeLabel: string;
  preview: ImportPreview;
  warnings: ImportWarning[];
}> {
  const parsed = await parseFltmCsv(csvText);

  if (parsed.error) {
    throw new CsvImportError(parsed.validationError ?? getCsvValidationError('unknown'));
  }

  const employeeMap = mergeEmployeeRecords(parsed.rows, parsed.reportType);
  const employees = Array.from(employeeMap.values());

  if (employees.length === 0) {
    throw new CsvImportError(getCsvValidationError('no_team_members'));
  }

  const importedAt = new Date().toISOString();
  const weekLabel = formatWeekLabel(weekStart);
  const reportTypeLabel = getReportTypeLabel(parsed.reportType);
  const warnings = buildImportWarnings(fileName, weekStart);
  const preview: ImportPreview = {
    fileName,
    selectedWeekLabel: weekLabel,
    savedWeekLabel: weekLabel,
    detectedRowCount: parsed.rows.length,
    teamMemberCount: employees.length,
    duplicateEmployeeRows: Math.max(parsed.rows.length - employees.length, 0),
    validationWarnings: warnings,
  };

  const week: StoredWeek = {
    id: `${parsed.detectedStore}-${weekStart}`,
    weekStart,
    weekLabel,
    storeName: parsed.detectedStore,
    fileName,
    importedAt,
    createdAt: importedAt,
    importHash: parsed.contentHash,
    sourceFiles: [
      {
        fileName,
        type: parsed.reportType,
        reportType: parsed.reportType,
        reportTypeLabel,
        detectedStore: parsed.detectedStore,
        contentHash: parsed.contentHash,
        importedAt,
        rowCount: parsed.rows.length,
      },
    ],
    employees,
    totals: calculateStoreTotals(employees),
  };

  return {
    week,
    reportTypeLabel,
    preview,
    warnings,
  };
}
