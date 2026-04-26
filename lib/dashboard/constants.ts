import type { EmployeePercentMetricKey, KpiStorage, SortKey } from './types';

export const STORAGE_KEY = 'employee-kpi-dashboard:v1';
export const MINIMUM_GAMES_FOR_RANKING = 5;
export const STEADY_DELTA_THRESHOLD = 0.1;

export const EMPTY_STORAGE: KpiStorage = {
  version: 1,
  latestWeekId: null,
  weeks: [],
};

export const KPI_GOALS = {
  replayPercent: 15,
  reviewsAskedPercent: 90,
  sharedReplayPercent: 90,
  previewsPercent: 90,
};

export const SORT_OPTIONS: { label: string; value: SortKey }[] = [
  { label: 'Replay conversion', value: 'replaysSoldPercent' },
  { label: 'Review ask rate', value: 'reviewsAskedPercent' },
  { label: 'Shared replay rate', value: 'sharedReplayPercent' },
  { label: 'Preview ask rate', value: 'previewsPercent' },
  { label: 'Games hosted', value: 'totalGames' },
  { label: 'Guests served', value: 'guests' },
  { label: 'Name', value: 'name' },
];

export const EMPLOYEE_PROGRESS_METRICS: {
  label: string;
  metric: EmployeePercentMetricKey;
}[] = [
  { label: 'Replay', metric: 'replaysSoldPercent' },
  { label: 'Review', metric: 'reviewsAskedPercent' },
  { label: 'Shared replay', metric: 'sharedReplayPercent' },
  { label: 'Preview', metric: 'previewsPercent' },
];
