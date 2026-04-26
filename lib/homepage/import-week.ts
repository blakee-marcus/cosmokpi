import { getReportTypeLabel } from '@/lib/csv-detection';
import { mergeEmployeeRecords, calculateStoreTotals } from '@/lib/csv-merger';
import { parseFltmCsv } from '@/lib/csv-parser';
import type { ImportReviewFile, ReportType } from '@/lib/fltm-types';
import { formatWeekLabel } from './dates';
import type { EmployeeKpiRow, StoredWeek, UploadResult } from './types';

function createContentHash(content: string) {
  let hash = 0;

  for (let index = 0; index < content.length; index += 1) {
    hash = (hash << 5) - hash + content.charCodeAt(index);
    hash |= 0;
  }

  return `${content.length}-${Math.abs(hash)}`;
}

function getImportReportType(importFile: ImportReviewFile) {
  const looseImportFile = importFile as ImportReviewFile & {
    reportType?: ReportType;
    type?: ReportType;
  };

  return (looseImportFile.reportType ?? looseImportFile.type ?? 'game-guide') as ReportType;
}

function getStoreName(importFile: ImportReviewFile, employees: EmployeeKpiRow[]) {
  const looseImportFile = importFile as ImportReviewFile & { storeName?: string };
  return employees[0]?.storeName ?? looseImportFile.storeName ?? 'Unknown Store';
}

function parseImportFile(text: string, fileName: string, contentHash: string) {
  const parseCsv = parseFltmCsv as (csvText: string, fileName?: string) => unknown;
  const parsed = parseCsv(text, fileName) as Record<string, unknown>;

  return {
    ...parsed,
    fileName,
    contentHash,
    importedAt: new Date().toISOString(),
  } as unknown as ImportReviewFile;
}

export function isCsvFile(file: File) {
  return file.name.toLowerCase().endsWith('.csv');
}

export async function buildStoredWeekFromCsvText(
  csvText: string,
  fileName: string,
  weekStart: string,
): Promise<{
  week: StoredWeek;
  reportTypeLabel: string;
}> {
  const parsed = await parseFltmCsv(csvText);

  if (parsed.error) {
    throw new Error(parsed.error);
  }

  const employeeMap = mergeEmployeeRecords(parsed.rows, parsed.reportType);
  const employees = Array.from(employeeMap.values());

  const importedAt = new Date().toISOString();
  const weekLabel = formatWeekLabel(weekStart);
  const reportTypeLabel = getReportTypeLabel(parsed.reportType);

  const week: StoredWeek = {
    id: `${parsed.detectedStore}-${weekStart}`,
    weekStart,
    weekLabel,
    storeName: parsed.detectedStore,
    fileName,
    importedAt,
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
  };
}
