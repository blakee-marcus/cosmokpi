export type EmployeeKpiRow = {
  name: string;
  storeName: string;
  role: string;
  totalGames: number;
  guests: number;
  replaysSold: number;
  SUEs: number;
  reviewsAsked: number;
  sharedReplay: number;
  afterGamePreviews: number;
  replaysSoldPercent: number;
  suePercent: number;
  reviewsAskedPercent: number;
  sharedReplayPercent: number;
  previewsPercent: number;
  [key: string]: string | number;
};

export type KpiSourceFile = {
  fileName: string;
  type?: 'game-guide' | 'ges' | 'unknown';
  importedAt?: string;
};

export type StoredWeek = {
  id: string;
  weekStart: string;
  weekLabel: string;

  // Legacy single-file support
  fileName: string;
  uploadedAt: string;

  // New multi-file/import metadata support
  importedAt?: string;
  sourceFiles?: KpiSourceFile[];

  storeName: string;
  totals: {
    employees: number;
    totalGames: number;
    guests: number;
    replaysSold: number;
    SUEs?: number;
    reviewsAsked: number;
    sharedReplay: number;
    afterGamePreviews: number;
  };
  employees: EmployeeKpiRow[];
};

export type KpiStorage = {
  version: 1;
  latestWeekId: string | null;
  weeks: StoredWeek[];
};

export type KpiCard = {
  label: string;
  value: number;
  goal: number;
  detail: string;
  direction: 'higher' | 'lower';
};

export type Status = 'onTrack' | 'watch' | 'needsFocus';
export type ProgressStatus = 'improved' | 'steady' | 'needsFollowUp';

export type StoreKpiRates = {
  replayPercent: number;
  reviewsAskedPercent: number;
  sharedReplayPercent: number;
  previewsPercent: number;
};

export type WeekProgressMetric = {
  label: string;
  value: number;
  previousValue: number;
  delta: number;
  goal: number;
  detail: string;
};

export type EmployeePercentMetricKey =
  | 'replaysSoldPercent'
  | 'reviewsAskedPercent'
  | 'sharedReplayPercent'
  | 'previewsPercent';

export type EmployeeProgressSummary = {
  label: string;
  detail: string;
  status: ProgressStatus | null;
};

export type SortKey =
  | 'name'
  | 'totalGames'
  | 'guests'
  | 'replaysSoldPercent'
  | 'reviewsAskedPercent'
  | 'sharedReplayPercent'
  | 'previewsPercent';
