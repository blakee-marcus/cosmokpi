import { getReportTypeLabel } from '@/lib/csv-detection';
import { mergeEmployeeRecords, calculateStoreTotals } from '@/lib/csv-merger';
import { parseFltmCsv } from '@/lib/csv-parser';
import { formatWeekLabel } from './dates';
import type { StoredWeek } from './types';

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
  };
}
