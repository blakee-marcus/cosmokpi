'use client';

import { track } from '@vercel/analytics';

import type { DashboardViewMode, SortKey } from '@/lib/dashboard/types';

type UploadSource = 'file_picker' | 'drag_drop';
type UploadFailureReason =
  | 'duplicate_report'
  | 'invalid_csv'
  | 'missing_columns'
  | 'not_csv'
  | 'parse_error'
  | 'unknown';

type ImpactEventProperties = {
  'KPI Report Upload Started': {
    source: UploadSource;
  };
  'KPI Report Upload Rejected': {
    reason: Extract<UploadFailureReason, 'not_csv'>;
    source: UploadSource;
  };
  'KPI Report Upload Failed': {
    reason: Exclude<UploadFailureReason, 'not_csv'>;
    source: UploadSource;
  };
  'KPI Report Validated': {
    source: UploadSource;
    report_type: string;
  };
  'KPI Report Saved': {
    source: UploadSource;
    report_type: string;
    import_mode?: 'new' | 'replace';
  };
  'KPI Report Import Canceled': {
    stage: 'preview' | 'duplicate_preview';
  };
  'Dashboard View Mode Changed': {
    view_mode: DashboardViewMode;
  };
  'Dashboard Period Changed': {
    view_mode: DashboardViewMode;
  };
  'Dashboard Search Used': {
    view_mode: DashboardViewMode;
  };
  'Dashboard Sort Changed': {
    sort_key: SortKey;
    view_mode: DashboardViewMode;
  };
  'FLNL Export Downloaded': {
    export_format: 'png';
    view_mode: DashboardViewMode;
  };
};

export type ImpactEventName = keyof ImpactEventProperties;

const IMPACT_TRACKING_CONTEXT = {
  product_area: 'employee_kpi_dashboard',
  evidence_goal: 'leadership_workflow_impact',
} as const;

function getUploadFailureReason(errorMessage: string): Exclude<UploadFailureReason, 'not_csv'> {
  const normalizedMessage = errorMessage.toLowerCase();

  if (normalizedMessage.includes('already imported')) return 'duplicate_report';
  if (normalizedMessage.includes('missing required columns')) return 'missing_columns';
  if (normalizedMessage.includes('csv')) return 'invalid_csv';
  if (normalizedMessage.includes('parse')) return 'parse_error';

  return 'unknown';
}

export function trackImpactEvent<EventName extends ImpactEventName>(
  eventName: EventName,
  properties: ImpactEventProperties[EventName],
) {
  track(eventName, {
    ...IMPACT_TRACKING_CONTEXT,
    ...properties,
  });
}

export function trackUploadFailure(errorMessage: string, source: UploadSource) {
  trackImpactEvent('KPI Report Upload Failed', {
    reason: getUploadFailureReason(errorMessage),
    source,
  });
}
