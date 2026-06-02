import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

const IMPORT_AND_STORAGE_FILES = [
  'lib/homepage/import-week.ts',
  'lib/homepage/storage.ts',
  'lib/dashboard/storage.ts',
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
});
