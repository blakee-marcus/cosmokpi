/**
 * Shared FLTM / cOSmo KPI types
 * Solutions Architect owns the data model
 */

export type ReportType = 'game-guide' | 'ges' | 'unknown';

export type CsvDetectionResult = {
  type: ReportType;
  hasGameGuideColumns: boolean;
  hasGesColumns: boolean;
  headers: string[];
  columnMapping: Record<string, string>;
  error?: string;
};

export type SourceBreakdown = {
  reportType: ReportType;
  originalRole: string;
  name?: string;
  storeName?: string;
  role?: string;

  totalGames?: number;
  guests?: number;
  replaysSold?: number;
  reviewsAsked?: number;
  sharedReplay?: number;

  replaysSoldPercent?: number;
  reviewsAskedPercent?: number;
  sharedReplayPercent?: number;

  SUEs?: number;
  suePercent?: number;
  afterGamePreviews?: number;
  previewsPercent?: number;

  productsSold?: number;
  giftCardsSold?: number;
  postGamePreview?: number;
  postGamePreviewPercent?: number;

  [key: string]: string | number | undefined;
};

export type EmployeeKpiRowWithSources = {
  name: string;
  storeName: string;
  role: string;

  totalGames: number;
  guests: number;
  replaysSold: number;
  reviewsAsked: number;
  sharedReplay: number;

  replaysSoldPercent: number;
  reviewsAskedPercent: number;
  sharedReplayPercent: number;

  // Game Guide report fields
  SUEs?: number;
  suePercent?: number;
  afterGamePreviews?: number;
  previewsPercent?: number;

  // GES report fields
  productsSold?: number;
  giftCardsSold?: number;
  postGamePreview?: number;
  postGamePreviewPercent?: number;

  // Source tracking for merged rows
  sources?: SourceBreakdown[];

  // Allows future FLTM columns without breaking parsing
  [key: string]: string | number | SourceBreakdown[] | undefined;
};

export type ImportReviewFile = {
  fileName: string;
  reportType: ReportType;
  reportTypeLabel?: string;
  detectedStore: string;
  contentHash: string;
  importedAt: string;
  rowCount: number;
  error?: string;
};

export type SourceFileRecord = {
  fileName: string;
  type: ReportType;
  reportType?: ReportType;
  reportTypeLabel?: string;
  detectedStore?: string;
  contentHash: string;
  importedAt: string;
  rowCount?: number;
};

export type ImportSummary = {
  weekId: string;
  weekStart: string;
  weekLabel: string;
  storeName: string;
  files: ImportReviewFile[];
  employees: number;
  totalGames: number;
  guests: number;
  replaysSold: number;
  reviewsAsked: number;
  sharedReplay: number;
  afterGamePreviews: number;
};

export type StoreTotals = {
  employees: number;
  totalGames: number;
  guests: number;
  replaysSold: number;
  reviewsAsked: number;
  sharedReplay: number;
  afterGamePreviews: number;
};

export type StoredWeekExtended = {
  id: string;
  weekStart: string;
  weekLabel: string;
  storeName: string;
  importedAt: string;
  createdAt?: string;
  updatedAt?: string;
  replacedAt?: string;
  importHash?: string;
  previousImportHash?: string;

  // Backward compatibility with earlier single-file imports
  fileName?: string;

  // New multi-source import support
  sourceFiles?: SourceFileRecord[];

  employees: EmployeeKpiRowWithSources[];
  totals: StoreTotals;
};

export function normalizePersonName(name: unknown): string {
  return String(name ?? '')
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase();
}

export function getDisplayRole(roles: string[]): string {
  const normalizedRoles = roles.map((role) => role.trim().toLowerCase());

  if (normalizedRoles.some((role) => role === 'ges' || role.includes('guest experience'))) {
    return 'GES';
  }

  if (normalizedRoles.some((role) => role === 'tl' || role.includes('team leader'))) {
    return 'TL';
  }

  if (normalizedRoles.some((role) => role === 'gg' || role.includes('game guide'))) {
    return 'GG';
  }

  return roles.find(Boolean) ?? 'Unknown';
}
