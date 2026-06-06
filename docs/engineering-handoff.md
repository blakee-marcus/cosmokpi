# Engineering Handoff

## App Purpose

cOSmo KPI imports local FLTM-style employee KPI CSV reports and turns them into a dashboard for weekly and monthly store performance review. The app helps leaders inspect employee-level KPI rows, aggregate store totals, compare periods, and export a PNG summary.

## Privacy Model

Employee KPI data is local-first. CSV contents, employee names, KPI values, week IDs, dashboard search terms, localStorage payloads, and export contents must not be sent to APIs, analytics, URLs, cookies, databases, cloud storage, or external services.

Analytics is limited to safe workflow metadata such as upload source, report type, dashboard view mode, sort key, failure reason, and export format. Any analytics change that includes employee data or KPI data should be blocked.

## Data Flow

CSV import -> parse and detect report type -> merge duplicate employee rows -> preview import -> explicit confirm -> save to `localStorage` -> dashboard reads saved weeks -> weekly or monthly aggregation -> user-initiated PNG export.

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

Same-week import product decision: `hasImportedFile` checks content hash only within the matching stored week id. Saving the same week/store with the same content hash is a duplicate no-op and must not rewrite localStorage. Saving the same week/store with different content replaces the stored week deterministically only after the user confirms the import preview. Replacement preserves the existing week identity, week start, week label, and original `createdAt`, writes the incoming employees/totals/source files without merging rows, and records replacement metadata such as `updatedAt`, `replacedAt`, and `previousImportHash`. There is no multi-file merge behavior.

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

## Runtime and Package Manager

Use Node `22.14.0` from `.nvmrc`. `package.json` declares the supported engine range as Node `>=22 <23` and the expected package manager as npm `10.9.2`.

Install with `npm ci` from the checked-in `package-lock.json`. Do not use Yarn, pnpm, or ad hoc installs for this repo.

If `nvm use` is unavailable on the local machine, Homebrew Node 22 can be used with `PATH=/opt/homebrew/opt/node@22/bin:$PATH`.

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

## Sprint 7 Verification

Sprint 7 reviewed runtime and repository hygiene without changing product behavior. The runtime source of truth remains `.nvmrc` at Node `22.14.0`, `package.json` engines at Node `>=22 <23`, and `packageManager` at npm `10.9.2`.

Findings:

- The default shell was using Node `v26.0.0` and npm `11.12.1`, which does not match the declared project runtime.
- Homebrew Node 22 is installed at `/opt/homebrew/opt/node@22/bin` and reports Node `v22.14.0` with npm `10.9.2`.
- The Node 26 `[DEP0205] module.register()` warning traces to `@tailwindcss/node`; it does not reproduce under Node 22 and is treated as a wrong-runtime artifact.
- The Playwright `NO_COLOR env is ignored due to FORCE_COLOR env being set` warning is a shell/test-output conflict. Unsetting `NO_COLOR` for the browser smoke removes it; no app change is needed.
- The Next browser smoke warning about `scroll-behavior: smooth` was resolved by marking the existing root smooth-scroll behavior with `data-scroll-behavior="smooth"` on `<html>`.
- `npm ls --depth=0` reports optional wasm helper packages as extraneous: `@emnapi/core`, `@emnapi/runtime`, `@emnapi/wasi-threads`, `@napi-rs/wasm-runtime`, and `@tybys/wasm-util`.
- Those packages are lockfile-owned optional/transitive helper packages for wasm32 variants such as Tailwind, Rolldown, Sharp, and resolver bindings. A clean `npm ci` with npm `10.9.2` still reports them, so this is documented as an npm optional-dependency tree reporting artifact rather than dependency drift.

Changed files:

- `.gitignore`: allowlists the Sprint 7 mini-spec under the existing `docs/*` ignore rule.
- `README.md`: documents Node/npm setup expectations and removes career-positioning analytics wording.
- `app/layout.tsx`: declares the existing smooth-scroll behavior for Next route-transition handling.
- `docs/dev-process.md`: adds runtime-doc alignment to cleanup discipline and updates stale browser-coverage guidance.
- `docs/engineering-handoff.md`: records Sprint 7 runtime, dependency, verification, privacy, risk, and deferred-work findings.
- `docs/sprint-7-mini-spec.md`: captures the Sprint 7 scope and backlog acceptance criteria.

Verification run on June 2, 2026:

- `npm run test`: passed, 11 files and 46 tests.
- `npm run check`: passed under Node 22, including lint, typecheck, and production build.
- `npm run test:browser`: passed under Node 22 with `NO_COLOR` unset, 1 Chromium smoke.
- `npm ls --depth=0`: exits successfully but reports the optional wasm helper packages listed above as extraneous.

Privacy review:

- No product behavior, analytics behavior, UI, parser logic, auth, database, cloud sync, or network persistence changed.
- No real CSV files, real employee names, real KPI values, secrets, URLs, or production identifiers were added.
- Sprint 7 documentation keeps the local-first privacy model and setup ownership clear.

Known remaining risks:

- `npm ls --depth=0` output is not visually clean because of npm optional-dependency tree reporting, although it exits successfully.
- Local shells using Node 26 will continue to show unsupported-engine and Node deprecation warnings until the shell PATH or version manager is aligned to Node 22.
- Existing npm audit output still reports dependency vulnerabilities; broad dependency upgrades are intentionally deferred because Sprint 7 did not require them.

Deferred work:

- Decide in a later maintenance sprint whether to adjust the dependency set or npm version after upstream optional-dependency reporting changes.

## Sprint 8 Verification

Sprint 8 made a dependency-maintenance decision under the supported runtime without expanding product scope. The selected outcome was **C. Minimal dependency fix**.

Baseline captured on June 2, 2026 with `PATH=/opt/homebrew/opt/node@22/bin:$PATH`:

- Runtime: Node `v22.14.0`, npm `10.9.2`.
- `git status --short`: existing dirty tree from prior Sprint 7 work before Sprint 8 changes: `.gitignore`, `README.md`, `app/layout.tsx`, `docs/dev-process.md`, `docs/engineering-handoff.md`, and untracked `docs/sprint-7-mini-spec.md`.
- `npm ls --depth=0`: exited successfully, but reported optional wasm helper packages as extraneous: `@emnapi/core`, `@emnapi/runtime`, `@emnapi/wasi-threads`, `@napi-rs/wasm-runtime`, and `@tybys/wasm-util`.
- `npm audit`: failed with 3 reported vulnerabilities: moderate `brace-expansion`, high `next`, and moderate `postcss` through `next`.
- `npm run test`: passed, 11 files and 46 tests.
- `npm run check`: passed under Node 22, including lint, typecheck, and production build.

What was investigated:

- Optional wasm helper package reporting from `npm ls --depth=0`.
- Audit findings for `brace-expansion`, `next`, and bundled `postcss`.
- Runtime consistency under Node `22.14.0` and npm `10.9.2`.
- Verification hygiene after dependency changes.

Root cause findings:

- The optional wasm helper packages are lockfile-owned optional transitive packages for wasm32/native helper paths, including Tailwind/Rolldown-style bindings. `npm explain` still labels the top-level helper nodes as extraneous, so this remains npm optional-dependency tree reporting noise rather than direct dependency drift.
- The `brace-expansion@5.0.5` audit finding came from the TypeScript ESLint transitive tree through `@typescript-eslint/typescript-estree`.
- The high `next@16.2.4` audit finding was in the direct app framework dependency. npm identified `next@16.2.7` as a non-major fix target for the high Next advisories.
- The remaining PostCSS audit finding is from `next/node_modules/postcss@8.4.31`. npm's available fix path requires `npm audit fix --force` and proposes a breaking downgrade to `next@9.3.3`, so it is not an acceptable Sprint 8 change.
- The first post-change `npm run check` attempt failed because ESLint tried to scan missing `test-results` before Playwright recreated the ignored artifact directory. Re-running after the browser smoke created `test-results` passed. This is verification hygiene noise and is not a product behavior issue.

What changed:

- `package.json`: updated `next` from `16.2.4` to `16.2.7` and `eslint-config-next` from `16.2.4` to `16.2.7`.
- `package-lock.json`: updated matching Next packages, Next SWC optional packages, `@next/eslint-plugin-next`, and the transitive `brace-expansion` lock entry from `5.0.5` to `5.0.6`.
- `.gitignore`: allowlists `docs/sprint-8-mini-spec.md` under the existing `docs/*` ignore rule.
- `docs/sprint-8-mini-spec.md`: records the Sprint 8 maintenance decision, scope, acceptance criteria, risks, and rollback notes.
- `docs/engineering-handoff.md`: records Sprint 8 findings, changes, verification, deferrals, and remaining risks.

What was intentionally deferred:

- No broad dependency update was run.
- No new dependencies were added.
- No forced audit fix was run because npm proposes a breaking downgrade to `next@9.3.3`.
- No product behavior, UI, parser, export, auth, database, cloud, analytics, or unrelated dependency work was performed.
- The npm optional-dependency `extraneous` labels were documented instead of worked around.

Verification run after the dependency fix on June 2, 2026:

- `npm run test`: passed, 11 files and 46 tests.
- `npm run check`: passed under Node 22, including lint, typecheck, and production build with Next `16.2.7`.
- `npm run test:browser`: passed, 1 Chromium smoke. The shell still emitted the known `NO_COLOR`/`FORCE_COLOR` warning during Playwright output.
- `npm ls --depth=0`: exits successfully but still reports the optional wasm helper packages as extraneous.
- `npm audit`: now reports 3 moderate vulnerabilities, all from the remaining `postcss <8.5.10` path through `next` and `@vercel/analytics`; high Next and moderate `brace-expansion` findings are resolved.

Remaining risks:

- `npm audit` is not clean because current Next still bundles vulnerable-range PostCSS according to npm audit metadata.
- The accepted PostCSS risk should be revisited when a non-breaking Next release resolves the bundled PostCSS advisory.
- `npm ls --depth=0` output is still not visually clean because of optional dependency reporting noise.
- ESLint can fail if an ignored artifact directory named in its search set is absent; this was observed once for `test-results` and passed after Playwright recreated the directory.

Recommended future maintenance trigger:

- Open a follow-up maintenance sprint when npm audit offers a non-breaking Next/PostCSS remediation, when npm changes optional-dependency reporting behavior, when the remaining audit severity increases, or when verification hygiene around ignored artifact directories starts blocking repeatable local checks.

## Sprint 10 Verification

Sprint 10 hardens the weekly import flow with a required preview and explicit confirm step before localStorage writes.

Changed behavior:

- Uploading a CSV parses and validates the file, then shows a preview before saving.
- Preview includes file name, chosen report week, saved week label, detected row count, team member count, duplicate employee rows merged, warning count, and duplicate-week status.
- Same store/week replacement requires explicit confirmation. Unconfirmed replacement attempts throw the same user-facing overwrite message shown in the UI.
- Canceling the preview clears the pending import without mutating saved localStorage.
- Validation errors now use short recovery copy for wrong file type, empty CSV, missing required columns, invalid numbers, and no valid team member rows.
- Success state shows the saved week, employee count, `Review dashboard`, and `Import another week`.

Privacy review:

- Imported KPI data remains local to the browser.
- No auth, database, cloud sync, new services, or network persistence was added.
- Analytics remain workflow-only and do not include employee names, KPI values, row data, file contents, localStorage payloads, or report contents.

Verification commands:

- `npm run test`
- `npm run check`
- `npm run test:browser`

Known remaining risks:

- Browser smoke covers the happy path with fake data and is not comprehensive visual regression coverage.
- Node 26 still prints a `module.register()` deprecation warning in this shell; the repo runtime remains documented as Node 22.
