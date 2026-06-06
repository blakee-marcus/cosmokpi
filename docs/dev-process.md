# cOSmo KPI Development Process

This project is in product stabilization. The delivery goal is fewer KPI workflow bugs, better confidence in local-only data handling, and faster maintenance without adding speculative architecture.

## Mini Spec Template

Keep this under 10 lines before coding:

- Problem: what is broken or risky?
- User-facing outcome: which leader workflow improves?
- Business rule: what KPI, import, comparison, storage, or export rule applies?
- Data flow: where does data enter, transform, persist, and render?
- Privacy implication: could employee data leave the browser?
- Expected behavior: what should happen?
- Test plan: what proves it?

## Definition of Ready

Work is ready when:

- Problem identified.
- User story identified.
- Acceptance criteria written.
- Test approach known.
- Privacy impact understood.
- Existing code path and owner module identified.

## Definition of Done

Work is done when:

- Tests pass.
- Typecheck passes.
- Build passes.
- Privacy review complete.
- No unnecessary scope expansion.
- No employee KPI data is added to analytics, logs, cookies, URLs, APIs, or cloud storage.
- Any changed behavior is documented in the PR or handoff note.

## TDD Loop

Use this loop for business logic, especially CSV detection, CSV parsing, percentage normalization, employee merging, store totals, monthly aggregation, dashboard metrics, storage serialization, storage migrations, and analytics safety.

- Red: add the smallest failing test that describes the expected behavior.
- Green: make the smallest implementation change that passes the test.
- Refactor: simplify only after tests pass and only inside the touched behavior.

For presentation-only work, use the narrowest useful verification instead of inventing tests with low value.

## Unit Test Foundation

Run focused business-logic tests with:

```bash
npm run test
```

Use `*.test.ts` files close to the pure logic they cover. Keep the current scope on CSV parsing/detection, merge and totals logic, monthly aggregation, storage serialization or migrations, dashboard metrics, and analytics privacy safety.

Do not add browser automation, Playwright, Cypress, visual regression, auth, database, or cloud sync tests until a later sprint explicitly scopes that work.

## Privacy Review

Before finishing, verify:

- No employee data leaves the browser.
- Analytics remain safe workflow analytics only.
- Exports remain local and user-initiated.
- Imported CSV contents, employee names, KPI values, search terms, week IDs, localStorage contents, and export images are not sent to telemetry or network requests.
- Browser storage remains limited to the established local KPI storage contract unless a migration is intentionally scoped.

## Bloat Review

Before adding a hook, utility, type, component, context, provider, service, or dependency, verify at least two are true:

- It removes duplication found in three or more places.
- It reduces measurable complexity.
- It improves testability.
- It directly supports the current import, review, comparison, storage, or FLNL export story.

If fewer than two are true, do not add it.

## Cleanup Backlog

### Critical

- Keep the unit test runner and `npm test` script healthy as business logic changes.
- Keep `.nvmrc`, `package.json` engines, `packageManager`, CI setup, and README setup docs aligned.
- Keep privacy-safety tests for `lib/analytics.ts` constrained to workflow metadata and never employee names, KPI values, file contents, week IDs, search text, or localStorage payloads.
- Keep import-to-storage coverage healthy for `lib/homepage/import-week.ts`, `lib/homepage/storage.ts`, and `lib/dashboard/storage.ts`: stored week creation, duplicate content hash detection, storage shape, malformed storage fallback, delete behavior, and localStorage-only guardrails.

### Important

- Move dashboard search, sorting, and ranking behavior out of `app/dashboard/page.tsx` only after tests exist. The current inline functions are understandable, but they are business rules and should become easier to test once behavior is locked.
- Audit and remove or reconcile `lib/dashboard/periods.ts`. It appears unused while `lib/dashboard/monthly.ts` owns the live period flow, which is vibe-coded complexity because it duplicates monthly aggregation concepts without serving the current app.
- Align docs that recommend a future `src/` folder structure with the actual root-level `app/`, `components/`, and `lib/` structure so future agents do not reorganize the repo unnecessarily.

### Deferred

- Broaden browser or visual coverage only when product risk justifies it.
- Add storage migration tests if the `employee-kpi-dashboard:v1` schema changes.
- Decide whether same-week/different-content imports should replace the prior stored week, merge multiple source files, or prompt the user before changing the saved record.
- Consider removing old agent persona docs if `docs/dev-process.md` becomes the source of truth for delivery discipline.
- Add sample CSV fixtures for local testing only, with fake employee data and no real KPI records.

## Vibe-Coded Complexity Watchlist

- Multiple agent role documents can encourage process sprawl if they conflict with the stabilization goal. Prefer this document for daily delivery checks.
- Duplicate monthly/period aggregation modules should not both survive unless each has a clear caller and tested business responsibility.
- New abstractions around analytics, storage, or exports should be blocked unless they make privacy easier to audit or behavior easier to test.
