# Engineering Handoff

## App Purpose

cOSmo KPI imports local FLTM-style employee KPI CSV reports and turns them into a dashboard for weekly and monthly store performance review. The app helps leaders inspect employee-level KPI rows, aggregate store totals, compare periods, and export a PNG summary.

## Privacy Model

Employee KPI data is local-first. CSV contents, employee names, KPI values, week IDs, dashboard search terms, localStorage payloads, and export contents must not be sent to APIs, analytics, URLs, cookies, databases, cloud storage, or external services.

Analytics is limited to safe workflow metadata such as upload source, report type, dashboard view mode, sort key, failure reason, and export format. Any analytics change that includes employee data or KPI data should be blocked.

## Data Flow

CSV import -> parse and detect report type -> merge duplicate employee rows -> save to `localStorage` -> dashboard reads saved weeks -> weekly or monthly aggregation -> user-initiated PNG export.

## Business Rules

Storage key: `employee-kpi-dashboard:v1`.

Storage shape: version `1`, `latestWeekId`, and an array of saved weeks. Each week stores date labels, store name, source files, employee rows, and store totals.

Report types: `game-guide`, `ges`, and `unknown`. Header detection is the source of truth.

Required shared columns: `name`, `storeName`, `role`, `totalGames`, `guests`, `replaysSold`, `reviewsAsked`, `sharedReplay`, `replaysSoldPercent`, `reviewsAskedPercent`, and `sharedReplayPercent`.

Game Guide columns include `SUEs`, `suePercent`, `afterGamePreviews`, and `previewsPercent`.

GES columns include `productsSold`, `giftCardsSold`, `postGamePreview`, and `postGamePreviewPercent`.

KPI formulas: replay percent is `replaysSold / guests * 100`; review ask, shared replay, preview, SUE, and post-game preview percentages are count divided by `totalGames` times `100`. Divide-by-zero yields `0`.

Percent normalization: decimal percentage values from CSVs, such as `0.92`, normalize to `92`; whole-number percentages, such as `92`, remain `92`.

Management export compatibility: fake Sprint 5 fixtures cover the observed management CSV header order: `name`, `storeName`, `role`, `totalGames`, `guests`, `replaysSold`, `SUEs`, `reviewsAsked`, `sharedReplay`, `afterGamePreviews`, `replaysSoldPercent`, `suePercent`, `reviewsAskedPercent`, `sharedReplayPercent`, and `previewsPercent`. Percentage columns in that shape are 0-100 values, such as `84.21` for `84.21%`.

Duplicate employee merge behavior: employees merge by normalized name for import merging, with numeric counts summed and percentages recalculated from summed totals. Monthly aggregation merges by normalized employee name and store.

Import-to-storage behavior: `buildStoredWeekFromCsvText` creates one `StoredWeek` for the selected week start and detected store. Source file metadata includes file name, report type, detected store, content hash, import timestamp, and row count. Invalid CSV parsing throws before a storage save should be attempted.

Same-week import product decision: `hasImportedFile` checks content hash only within the matching stored week id. Saving the same week/store with the same content hash is a duplicate no-op and must not rewrite localStorage. Saving the same week/store with different content replaces the stored week deterministically. Replacement preserves the existing week identity, week start, week label, and original `createdAt`, writes the incoming employees/totals/source files without merging rows, and records replacement metadata such as `updatedAt`, `replacedAt`, and `previousImportHash`. There is no multi-file merge behavior and no confirmation UI in Sprint 6.

Monthly aggregation behavior: saved weeks group by normalized store name and `YYYY-MM`; employee rows merge across included weeks; dashboard totals are summed from weekly totals; source file metadata is carried forward for context.

Dashboard comparison behavior: weekly comparisons use the latest older report for the same normalized store. Monthly comparisons use the latest older month for the same normalized store. Progress movement greater than `0.1` points is improved, less than `-0.1` points needs follow-up, and anything between those thresholds is steady.

Dashboard ranking behavior: employee rankings include only rows with at least `5` games for the selected period. Percentage sorts normalize decimal and whole-number percentages, then break ties by games hosted and employee identity. Name sorting still uses the same eligibility filter.

Spotlight behavior: top employee spotlights select the highest normalized percentage among eligible rows. Ties use the relevant denominator for the metric, such as guests for replay conversion and games for review/preview metrics, then employee name.

Search behavior: dashboard table search checks employee name, role, and store text case-insensitively. Search terms are UI state only and must not be sent to analytics.

Export exclusions: PNG export is user-initiated and should not send export contents to analytics or remote services.

Frontline Newsletter export prep: export rows exclude management by name and management roles, sort frontline rows by games hosted and name, preserve zero-game frontline rows for display, and create stable `flnl-kpi-{store-slug}-{weekStart}.png` filenames.

## Test Strategy

Run tests with `npm run test`. Run the full release check with `npm run check`.

Run browser smoke coverage with `npm run test:browser`. The Playwright smoke starts or reuses the local Next dev server at `http://localhost:3000`.

Current unit coverage focuses on pure business logic: CSV detection/parsing, employee merge and totals, import-to-storage conversion, localStorage persistence, monthly aggregation, and analytics/privacy safety.

Current test files:

- `lib/csv-parser.test.ts`: BOM headers, quoted cells, report detection, missing shared columns, numeric defaults, percent normalization, and fake management export header compatibility.
- `lib/csv-merger.test.ts`: duplicate employee merge behavior, percentage recalculation, store totals, role/store metadata, and mixed Game Guide/GES fields.
- `lib/homepage/import-week.test.ts`: StoredWeek creation from fake Game Guide, GES, and management-shaped CSV text, source metadata, merged employee rows, calculated totals, and invalid CSV rejection.
- `lib/homepage/storage.test.ts`: v1 storage shape, empty/malformed reads, duplicate content hash detection, same-week replacement behavior, failed-import non-mutation, storage snapshots, and delete behavior.
- `lib/homepage/stored-week-migration.test.ts`: current v1 read compatibility, prior minimal stored week migration, corrupt storage fallback, same-content duplicate no-op behavior, and deterministic same-week replacement metadata.
- `lib/homepage/local-first.test.ts`: source-level guardrail against network, cookie, URL, database, and analytics APIs in import/storage modules.
- `lib/dashboard/monthly.test.ts`: normalized store/month grouping, employee aggregation, monthly totals, recalculated percentages, source file preservation, and previous-month comparison.
- `lib/dashboard/metrics.test.ts`: store KPI rates, dashboard cards, zero-denominator safety, weekly previous-period selection, comparison deltas, progress thresholds, employee progress summaries, goal thresholds, and spotlight tie-breaks.
- `lib/dashboard/table.test.ts`: percentage sort normalization, minimum-game ranking eligibility, rank tie-breaks, name sorting, and search by employee name, role, and store.
- `lib/dashboard/newsletter-export.test.ts`: store label cleanup, management role detection, frontline export row filtering/sorting, and stable export metadata.
- `lib/analytics.test.ts`: privacy-safe analytics payload keys and upload-failure reason mapping.
- `e2e/management-csv-smoke.spec.ts`: browser smoke for fake management CSV drop upload, dashboard render after import, weekly/monthly mode controls, table search/sort, and FLNL export download.

Do not add Cypress, visual regression, auth, database, or cloud sync tests in this sprint. Add future tests close to the logic using `*.test.ts` files unless the coverage must verify real browser APIs.

Future useful tests: explicit multi-file same-week merge behavior only if product scope changes away from replacement, dashboard search/sort extraction after those rules move out of the page component, and broader browser coverage only if product risk justifies it.

## Integration Notes

If this app moves into a company work app, the team needs decisions for authentication, storage ownership, privacy approval, analytics review, migration path from localStorage, and data retention policy.

The app is not production-approved by this document. It documents the current local-first implementation and the engineering guardrails needed before broader adoption.

## Sprint 3 Verification

Sprint 3 added import-to-storage boundary coverage and one scoped implementation fix: merged employee rows now preserve the first display name while still merging by normalized name.

Verification run on June 2, 2026:

- `npm run test`: passed, 7 files and 24 tests.
- `npm run typecheck`: passed.
- `npm run build`: passed.
- `npm run check`: passed.

Known remaining risks:

- Same-week/different-content import replacement is documented and tested as current behavior; product may later choose multi-file merging or user confirmation.
- The dashboard table and export rules now have focused unit coverage; a later browser smoke test should still verify the full upload-to-dashboard-to-export user flow.
- The shell still reports a Node deprecation warning during Vitest/Next commands on Node 26, while the project declares Node `>=22 <23`.

## Sprint 4 Verification

Sprint 4 added dashboard logic hardening coverage and one scoped implementation fix: replay spotlights now break ties by guest count, because replay conversion is guest-denominated, instead of using total games for every spotlight metric.

Verification run on June 2, 2026:

- `npx vitest run lib/dashboard/metrics.test.ts lib/dashboard/table.test.ts lib/dashboard/newsletter-export.test.ts lib/dashboard/monthly.test.ts`: passed, 4 files and 18 tests.
- `npm run test`: passed, 10 files and 39 tests.
- `npm run check`: passed, including lint, typecheck, and production build.

Known remaining risks:

- Product may later define different tie-break rules for recognition spotlights, such as most recent improvement or leader-selected highlights. Current behavior is metric percentage, relevant denominator, then name.
- Current Sprint 4 coverage is pure business logic; it does not visually inspect the browser canvas export.

## Sprint 5 Verification

Sprint 5 added fake management-shaped CSV fixtures, parser/import coverage for the observed real export schema, and a scoped Playwright browser smoke for the local-first upload-to-dashboard-to-export path. The fixture files are fake-only and live under `test/fixtures/csv/`.

Verification run on June 2, 2026:

- `npm run test`: passed, 10 files and 41 tests.
- `npm run check`: passed, including lint, typecheck, and production build.
- `npm run test:browser`: passed, 1 Chromium smoke.

Implementation notes:

- No app parser compatibility fix was required; the existing parser already supports the management export header order and 0-100 percentage values.
- Playwright is configured to use `http://localhost:3000` because an existing Next dev server for this repo blocks starting a second dev server on another port.
- Playwright artifacts are ignored via `.gitignore`.

Privacy review:

- No real CSV files were added.
- No real employee names were added.
- No real KPI values were added.
- No analytics, network, auth, database, cloud sync, or external data changes were added.

Known remaining risks:

- Browser smoke covers one fake management-shaped import and exercises one dashboard state; it is not comprehensive visual regression coverage.
- The smoke uses drag/drop because that is the most stable browser path for the current hidden file input implementation.
- The shell still reports a Node deprecation warning during Vitest/Playwright commands on Node 26, while the project declares Node `>=22 <23`.

## Sprint 6 Verification

Sprint 6 locks the same-week import product decision and adds storage migration coverage for legacy localStorage shapes. The supported behavior is replace, not merge: same week/store plus same content is a duplicate no-op; same week/store plus different content replaces deterministically and preserves replacement metadata.

Migration coverage summary:

- Current v1 storage loads without rewriting or dropping import metadata.
- Prior minimal stored week shapes migrate while preserving dates, dashboard view fields, KPI rows, source metadata, and calculated totals.
- Corrupt or structurally invalid localStorage fails safely to empty storage.
- Same-content duplicate imports return the existing storage snapshot without another write.
- Different-content replacement keeps the stable week identity and original creation timestamp, writes incoming rows/totals/source files, records `updatedAt`, `replacedAt`, and `previousImportHash`, and does not merge old employee rows.

Tests added:

- `lib/homepage/stored-week-migration.test.ts`

Expected commands:

- `npm run test`
- `npm run check`
- `npm run test:browser`

Privacy review:

- Coverage uses fake store names, fake employee names, fake hashes, and fake KPI values only.
- No real CSV files, real employee names, real KPI values, secrets, URLs, or production identifiers were added.
- No analytics, network, auth, database, cloud sync, or external data changes were added.
- Replacement metadata is operational localStorage metadata only and must not include raw CSV content, employee KPI values, dashboard search terms, or export contents.

Known remaining risks:

- Product may later choose multi-file same-week imports or a confirmation UI, but that is explicitly out of scope for Sprint 6 and would require new UX, tests, and privacy review.
- Migration coverage exercises localStorage contracts in unit tests; it does not cover every historically possible malformed user payload.
- Browser smoke still covers one fake management-shaped import path and is not comprehensive visual regression coverage.
- The shell still reports a Node deprecation warning during Vitest/Playwright commands on Node 26, while the project declares Node `>=22 <23`.
