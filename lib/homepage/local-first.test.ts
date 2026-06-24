import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

const IMPORT_AND_STORAGE_FILES = [
  'lib/homepage/import-week.ts',
  'lib/homepage/storage.ts',
  'lib/dashboard/storage.ts',
];

const ACTION_PLAN_FILES = [
  'lib/dashboard/coaching.ts',
  'components/dashboard/PerformanceCoachingSection.tsx',
];

const DISALLOWED_PERSISTENCE_PATTERNS = [
  /\bfetch\s*\(/,
  /\bXMLHttpRequest\b/,
  /\bdocument\.cookie\b/,
  /\bwindow\.location\b/,
  /\blocation\.search\b/,
  /\bURLSearchParams\b/,
  /\bindexedDB\b/,
  /@vercel\/analytics/,
  /\btrack\w*\s*\(/,
];

describe('import and storage local-first guardrails', () => {
  it('does not reference network, cookie, URL, database, or analytics APIs', () => {
    for (const relativePath of IMPORT_AND_STORAGE_FILES) {
      const source = readFileSync(resolve(process.cwd(), relativePath), 'utf8');

      for (const pattern of DISALLOWED_PERSISTENCE_PATTERNS) {
        expect(source, `${relativePath} should not match ${pattern}`).not.toMatch(pattern);
      }
    }
  });

  it('does not persist or send action-plan text from the helper or section UI', () => {
    const disallowedActionPlanPatterns = [
      /\bfetch\s*\(/,
      /\bXMLHttpRequest\b/,
      /\bdocument\.cookie\b/,
      /\bwindow\.location\b/,
      /\blocation\.search\b/,
      /\bURLSearchParams\b/,
      /\bindexedDB\b/,
      /\blocalStorage\b/,
      /@vercel\/analytics/,
      /\btrack\w*\s*\(/,
    ];

    for (const relativePath of ACTION_PLAN_FILES) {
      const source = readFileSync(resolve(process.cwd(), relativePath), 'utf8');

      for (const pattern of disallowedActionPlanPatterns) {
        expect(source, `${relativePath} should not match ${pattern}`).not.toMatch(pattern);
      }
    }
  });
});
