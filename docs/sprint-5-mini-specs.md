# Sprint 5 Mini-Spec: Real CSV Shape Browser Smoke Test

## Scope

Sprint 5 verifies that fake data matching the current management CSV export shape can move through the local-first app path without using real employee data.

Covered path:

- Parse fake CSV fixtures with the management export header order.
- Treat CSV percentage columns as 0-100 values, while preserving existing decimal-ratio normalization.
- Build stored weeks from fake CSV text.
- Smoke test upload, dashboard render, weekly and monthly dashboard modes, ranking/search/sort controls, and FLNL export click behavior in a browser.
- Keep docs current for the new fixtures and smoke command.

Out of scope:

- Real downloaded CSV fixtures.
- Real employee names or KPI values.
- UI redesign, animation changes, analytics changes, auth, database work, cloud sync, or external data calls.

## Real Management CSV Shape

Expected headers:

```text
name,storeName,role,totalGames,guests,replaysSold,SUEs,reviewsAsked,sharedReplay,afterGamePreviews,replaysSoldPercent,suePercent,reviewsAskedPercent,sharedReplayPercent,previewsPercent
```

Percentage columns are already percent values from `0` to `100`. Example: `84.21` means `84.21%`.

## Fake Fixture Rules

Fixtures must:

- Use invented employee names.
- Use invented store names.
- Use invented KPI values.
- Match the management export header order exactly.
- Stay small enough for parser and browser smoke tests to be readable.

Fixtures must not:

- Include real downloaded CSV content.
- Include real employee names.
- Include real KPI values.
- Include secrets, URLs, analytics payloads, or production identifiers.

## Acceptance Criteria

- `npm run test` passes.
- `npm run check` passes.
- Browser smoke command passes.
- Fake management-shaped CSV import produces a saved local week.
- Dashboard renders after import.
- Weekly and monthly modes render when stored data supports them.
- Search and sort controls can be exercised without crashing.
- FLNL export button can be clicked without crashing.
