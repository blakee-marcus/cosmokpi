export type KpiSourceFile = {
  fileName: string;
  type?: 'game-guide' | 'ges' | 'unknown';
  importedAt?: string;
};

export type EmployeeKpiSource = {
  fileName: string;
  type: 'game-guide' | 'ges' | 'unknown';
  importedAt?: string;
};

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

  // New multi-file/import metadata support
  sources?: EmployeeKpiSource[];

  [key: string]: string | number | EmployeeKpiSource[] | undefined;
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

export type DashboardViewMode = 'weekly' | 'monthly';

export type DashboardPeriod = {
  id: string;
  periodType: DashboardViewMode;
  periodLabel: string;
  storeName: string;
  includedWeekCount: number;
  includedWeekLabels: string[];
  anchorWeekId: string;
  weekIds: string[];
  weeks: StoredWeek[];
  aggregateWeek: StoredWeek;
  totals: StoredWeek['totals'];
  employees: EmployeeKpiRow[];
  monthKey?: string;
};

export type DashboardPeriodOption = {
  id: string;
  label: string;
  storeName: string;
  detail: string;
  anchorWeekId: string;
  periodType: DashboardViewMode;
  period: DashboardPeriod;
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

