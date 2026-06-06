import { track } from '@vercel/analytics';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { trackImpactEvent, trackUploadFailure } from './analytics';

vi.mock('@vercel/analytics', () => ({
  track: vi.fn(),
}));

const SAFE_KEYS = new Set([
  'product_area',
  'evidence_goal',
  'source',
  'reason',
  'report_type',
  'import_mode',
  'stage',
  'view_mode',
  'sort_key',
  'export_format',
]);

const SENSITIVE_KEYS = [
  'employee',
  'employeeName',
  'employee_name',
  'name',
  'kpiValue',
  'kpi_value',
  'rawCsv',
  'raw_csv',
  'csv',
  'search',
  'searchTerm',
  'search_term',
  'weekId',
  'week_id',
  'localStorage',
  'local_storage',
  'payload',
  'exportContents',
  'export_contents',
];

function trackedProperties() {
  return vi.mocked(track).mock.calls.map(([, properties]) => properties ?? {});
}

describe('analytics privacy safety', () => {
  beforeEach(() => {
    vi.mocked(track).mockClear();
  });

  it('tracks only explicit workflow metadata for allowed events', () => {
    trackImpactEvent('KPI Report Upload Started', { source: 'file_picker' });
    trackImpactEvent('KPI Report Validated', { source: 'file_picker', report_type: 'game-guide' });
    trackImpactEvent('KPI Report Saved', { source: 'drag_drop', report_type: 'game-guide' });
    trackImpactEvent('KPI Report Saved', {
      source: 'drag_drop',
      report_type: 'game-guide',
      import_mode: 'replace',
    });
    trackImpactEvent('KPI Report Import Canceled', { stage: 'duplicate_preview' });
    trackImpactEvent('Dashboard View Mode Changed', { view_mode: 'monthly' });
    trackImpactEvent('Dashboard Period Changed', { view_mode: 'weekly' });
    trackImpactEvent('Dashboard Search Used', { view_mode: 'weekly' });
    trackImpactEvent('Dashboard Sort Changed', {
      sort_key: 'reviewsAskedPercent',
      view_mode: 'monthly',
    });
    trackImpactEvent('FLNL Export Downloaded', { export_format: 'png', view_mode: 'monthly' });

    for (const properties of trackedProperties()) {
      expect(Object.keys(properties).every((key) => SAFE_KEYS.has(key))).toBe(true);
      for (const sensitiveKey of SENSITIVE_KEYS) {
        expect(properties).not.toHaveProperty(sensitiveKey);
      }
    }
  });

  it('maps upload failure messages to safe reason metadata only', () => {
    trackUploadFailure('Missing required columns: name', 'drag_drop');

    expect(vi.mocked(track)).toHaveBeenCalledWith(
      'KPI Report Upload Failed',
      expect.objectContaining({
        product_area: 'employee_kpi_dashboard',
        evidence_goal: 'leadership_workflow_impact',
        reason: 'missing_columns',
        source: 'drag_drop',
      }),
    );

    for (const properties of trackedProperties()) {
      expect(Object.keys(properties).every((key) => SAFE_KEYS.has(key))).toBe(true);
      for (const sensitiveKey of SENSITIVE_KEYS) {
        expect(properties).not.toHaveProperty(sensitiveKey);
      }
    }
  });
});
