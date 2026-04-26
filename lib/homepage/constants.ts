import type { KpiStorage } from './types';

export const STORAGE_KEY = 'employee-kpi-dashboard:v1';

export const EMPTY_STORAGE: KpiStorage = {
  version: 1,
  latestWeekId: null,
  weeks: [],
};

export const CSV_UPLOAD_ACCEPT = '.csv,text/csv';
