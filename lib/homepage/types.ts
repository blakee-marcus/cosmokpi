import type {
  EmployeeKpiRowWithSources,
  StoredWeekExtended,
} from '@/lib/fltm-types';

export type EmployeeKpiRow = EmployeeKpiRowWithSources;

export type StoredWeek = StoredWeekExtended & {
  fileName: string;
};

export type KpiStorage = {
  version: 1;
  latestWeekId: string | null;
  weeks: StoredWeek[];
};

export type UploadResult = {
  reportTypeLabel: string;
  week: StoredWeek;
};
