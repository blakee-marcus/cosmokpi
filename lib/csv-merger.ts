/**
 * CSV merging and KPI calculation utilities
 * KPI Metrics Agent owns this file
 */

import type { EmployeeKpiRowWithSources, ReportType, SourceBreakdown } from './fltm-types';
import { getDisplayRole, normalizePersonName } from './fltm-types';

/**
 * Merge multiple employee records by normalized name
 * Recalculates percentages from merged counts instead of averaging
 */
export function mergeEmployeeRecords(
  records: EmployeeKpiRowWithSources[],
  recordType: ReportType,
): Map<string, EmployeeKpiRowWithSources> {
  const merged = new Map<string, EmployeeKpiRowWithSources>();

  for (const record of records) {
    const nameKey = normalizePersonName(record.name);
    const existing = merged.get(nameKey);

    if (!existing) {
      // First occurrence: initialize with source tracking
      const sourceList: SourceBreakdown[] = [
        {
          reportType: recordType,
          originalRole: record.role,
          ...copyRecordForSource(record),
        },
      ];

      merged.set(nameKey, {
        ...record,
        sources: sourceList,
      });
      continue;
    }

    // Merge with existing record
    const existingSources = existing.sources || [];
    const newSource: SourceBreakdown = {
      reportType: recordType,
      originalRole: record.role,
      ...copyRecordForSource(record),
    };

    // Sum numeric values
    const merged_record: EmployeeKpiRowWithSources = {
      ...existing,
      name: record.name, // Prefer current name
      storeName: record.storeName || existing.storeName,
      totalGames: (existing.totalGames || 0) + (record.totalGames || 0),
      guests: (existing.guests || 0) + (record.guests || 0),
      replaysSold: (existing.replaysSold || 0) + (record.replaysSold || 0),
      reviewsAsked: (existing.reviewsAsked || 0) + (record.reviewsAsked || 0),
      sharedReplay: (existing.sharedReplay || 0) + (record.sharedReplay || 0),
      sources: [...existingSources, newSource],
    };

    // Recalculate percentages from merged counts
    recalculatePercentages(merged_record);

    // Handle optional GG columns
    if (record.SUEs !== undefined) {
      merged_record.SUEs = (existing.SUEs || 0) + (record.SUEs || 0);
    }
    if (record.afterGamePreviews !== undefined) {
      merged_record.afterGamePreviews =
        (existing.afterGamePreviews || 0) + (record.afterGamePreviews || 0);
    }

    // Handle optional GES columns
    if (record.productsSold !== undefined) {
      merged_record.productsSold = (existing.productsSold || 0) + (record.productsSold || 0);
    }
    if (record.giftCardsSold !== undefined) {
      merged_record.giftCardsSold = (existing.giftCardsSold || 0) + (record.giftCardsSold || 0);
    }
    if (record.postGamePreview !== undefined) {
      merged_record.postGamePreview =
        (existing.postGamePreview || 0) + (record.postGamePreview || 0);
    }

    // Update display role using priority
    const roles = existingSources.map((s) => s.originalRole as string);
    roles.push(record.role);
    merged_record.role = getDisplayRole(roles);

    merged.set(nameKey, merged_record);
  }

  return merged;
}

/**
 * Recalculate all percentage fields from count fields
 * Never average percentages; always recalculate from totals
 */
export function recalculatePercentages(record: EmployeeKpiRowWithSources): void {
  // Guard against divide-by-zero
  if (record.guests && record.guests > 0) {
    record.replaysSoldPercent = (record.replaysSold / record.guests) * 100;
  } else {
    record.replaysSoldPercent = 0;
  }

  if (record.totalGames && record.totalGames > 0) {
    record.reviewsAskedPercent = (record.reviewsAsked / record.totalGames) * 100;
    record.sharedReplayPercent = (record.sharedReplay / record.totalGames) * 100;
  } else {
    record.reviewsAskedPercent = 0;
    record.sharedReplayPercent = 0;
  }

  // GES-specific percentages if present
  if (record.postGamePreview !== undefined && record.totalGames && record.totalGames > 0) {
    record.postGamePreviewPercent = (record.postGamePreview / record.totalGames) * 100;
  }

  // Game Guide-specific percentages if present
  if (record.SUEs !== undefined && record.totalGames && record.totalGames > 0) {
    record.suePercent = (record.SUEs / record.totalGames) * 100;
  }

  if (record.afterGamePreviews !== undefined && record.totalGames && record.totalGames > 0) {
    record.previewsPercent = (record.afterGamePreviews / record.totalGames) * 100;
  }
}

/**
 * Copy record data for source tracking
 * Exclude internal metadata fields
 */
function copyRecordForSource(record: EmployeeKpiRowWithSources): Record<string, string | number> {
  const { sources, ...data } = record;
  return data;
}

/**
 * Calculate store-level totals from merged employee records
 */
export function calculateStoreTotals(employees: EmployeeKpiRowWithSources[]): {
  employees: number;
  totalGames: number;
  guests: number;
  replaysSold: number;
  reviewsAsked: number;
  sharedReplay: number;
  afterGamePreviews: number;
} {
  return employees.reduce(
    (summary, row) => {
      summary.totalGames += Number(row.totalGames || 0);
      summary.guests += Number(row.guests || 0);
      summary.replaysSold += Number(row.replaysSold || 0);
      summary.reviewsAsked += Number(row.reviewsAsked || 0);
      summary.sharedReplay += Number(row.sharedReplay || 0);
      summary.afterGamePreviews += Number(row.afterGamePreviews || 0);
      return summary;
    },
    {
      employees: employees.length,
      totalGames: 0,
      guests: 0,
      replaysSold: 0,
      reviewsAsked: 0,
      sharedReplay: 0,
      afterGamePreviews: 0,
    },
  );
}
