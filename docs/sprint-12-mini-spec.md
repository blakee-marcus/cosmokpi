# Sprint 12 Mini-Spec: Brand-Aligned FLNL Export

## User Story

As a store leader preparing a Frontline Newsletter (FLNL) KPI snapshot, I want the export image to look polished and brand-aligned, with summary highlights and management excluded, so that I can paste it directly into FLNL or team communication channels without further editing.

## Problem Statement

The existing FLNL export showed a raw KPI table with no visual framing. Management roles appeared in the table despite not being frontline. The export needed brand tokens, a goals strip, summary cards, and management exclusion to look professional enough for FLNL without manual post-processing.

## Acceptance Criteria

- Management roles (`Management`, `General Manager`, `Assistant Manager`, `GM`, `GMIT`, `AM`, `AMIT`, and case-insensitive variants) are excluded from the coaching section, ranked table, and FLNL export rows.
- `isManagementRole()` is extracted into a shared `lib/dashboard/roles.ts` module and used consistently across coaching, ranking, and export boundaries.
- Store-level KPI totals remain unchanged (management exclusion applies only to per-employee views).
- The FLNL export canvas includes summary cards for biggest win, biggest focus, games hosted, and guests served.
- Summary cards use `getStoreKpiRates` for team-level metric computation.
- The export uses existing brand tokens (`TEG_CANVAS_COLORS`, `TEG_CANVAS_FONT`).
- Copy action plan text (from Sprint 11) remains huddle-ready and functional.
- Unit tests cover export row filtering, role detection, and summary data.
- `npm run test`, `npm run check`, and `npm run build` pass.

## Out Of Scope

- Charts, graphs, or new visualization types.
- Auth, database, cloud sync, or external services.
- New KPI formulas or CSV format changes.
- Dashboard redesign.
- Saved export storage or localStorage changes.
- PDF export (PNG only).
- AI-generated copy.

## Changed Files

- `lib/dashboard/roles.ts` — shared `isManagementRole()` predicate
- `lib/dashboard/roles.test.ts` — 4 tests for role detection
- `lib/dashboard/coaching.ts` — management exclusion in coaching eligibility
- `lib/dashboard/coaching.test.ts` — management exclusion tests in coaching
- `lib/dashboard/metrics.ts` — management exclusion in metrics
- `lib/dashboard/table.ts` — management exclusion in ranked table
- `lib/dashboard/table.test.ts` — management exclusion tests in table
- `lib/dashboard/newsletter-export.ts` — summary cards on canvas, role-based filtering
- `lib/dashboard/newsletter-export.test.ts` — summary data test, role-based filter test
- `app/dashboard/page.tsx` — wiring updates (Sprint 11 baseline)

## Definition Of Done

- ✅ Export uses existing brand tokens
- ✅ Management excluded from exported table
- ✅ Store-level totals unchanged
- ✅ Copy huddle recap text (from Sprint 11, functional)
- ✅ Summary cards on canvas (biggest win, biggest focus, games hosted, guests served)
- ✅ Unit tests for filtering, role detection, and recap text (71 tests passing)
- ✅ `npm run test`, `npm run check`, and `npm run build` pass
- ✅ Pushed to `origin/main`

## Privacy Review

- No real CSV files, real employee names, real KPI values, secrets, URLs, or production identifiers were added.
- Employee KPI data remains local to the browser.
- No auth, database, cloud sync, server storage, new services, or external data calls were added.
- Analytics remain workflow-only and do not include employee names, KPI values, row data, CSV contents, search terms, week IDs, localStorage payloads, report payloads, or export contents.

## Known Remaining Risks

- Browser smoke covers the upload-to-dashboard path but does not visually verify the canvas export output.
- Management role detection uses string matching; new role variants would need to be added to `MANAGEMENT_ROLE_LABELS`.
- The Node 26 deprecation warning for `module.register()` is an upstream Tailwind artifact and does not affect the supported Node 22 runtime.