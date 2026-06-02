# Sprint 6 Mini-Spec: Same-Week Import Replacement and Storage Migration

## Goal

Sprint 6 makes same-week import behavior explicit and verifies that localStorage migration keeps existing fake KPI records usable.

The product decision is:

- Same week/store plus same content is a duplicate no-op.
- Same week/store plus different content replaces the stored week deterministically.
- Replacement preserves replacement metadata.
- Replacement does not merge old and new employee rows.
- Replacement does not ask for confirmation in the UI.

## Scope

Covered behavior:

- Read current v1 KPI storage without rewriting it or dropping import metadata.
- Migrate prior minimal stored week shapes into the current `StoredWeek` contract.
- Preserve dates, dashboard view fields, KPI rows, source file metadata, and calculated totals during migration.
- Fail safely to empty storage when localStorage is corrupt or structurally invalid.
- Treat same-week same-content imports as duplicate no-ops.
- Treat same-week different-content imports as deterministic replacement.
- Preserve replacement metadata including `updatedAt`, `replacedAt`, `previousImportHash`, original week identity, original week start, original week label, and original `createdAt`.

Out of scope:

- Real downloaded CSV fixtures.
- Real employee names or KPI values.
- Multi-file same-week merge behavior.
- User confirmation UI before replacement.
- Auth, database work, cloud sync, analytics changes, or external data calls.

## Import Decision Details

Same content is determined from import hash/content hash for the matching stored week.

When the incoming week matches an existing same week/store and the content hash matches, storage must stay unchanged. The save result should return the existing storage snapshot and must not perform another localStorage write.

When the incoming week matches an existing same week/store and the content differs, the incoming week replaces the previous row set and totals. The replacement must retain the stable week id and original date labeling, record the previous import hash, and timestamp the replacement. Old employee rows are not merged into the replacement.

## Migration Coverage Summary

The storage migration contract covers:

- Current v1 read compatibility.
- Legacy/minimal week shape migration from fields such as `date`, `week`, `month`, `mode`, and `kpiRows`.
- Source file metadata preservation.
- Totals reconstruction from employee KPI rows when totals are absent.
- Safe fallback for corrupt storage.
- Duplicate no-op behavior.
- Replacement metadata behavior.

## Fake Fixture Rules

Tests and docs must use:

- Invented employee names.
- Invented store names.
- Invented hashes.
- Invented KPI values.
- Small records that make migration expectations readable.

Tests and docs must not use:

- Real downloaded CSV content.
- Real employee names.
- Real KPI values.
- Secrets, URLs, production identifiers, analytics payload details, or external service data.

## Tests Added

- `lib/homepage/stored-week-migration.test.ts`

## Expected Commands

- `npm run test`
- `npm run check`
- `npm run test:browser`

## Privacy Review

The Sprint 6 coverage is localStorage-only and uses fake data. It does not introduce analytics, network requests, cookies, URL persistence, database writes, cloud sync, auth, or export-content handling.

Replacement metadata is allowed only as local operational metadata. It must not include raw CSV contents, employee KPI values, dashboard search text, localStorage payloads outside the app storage contract, or PNG export contents.

## Remaining Risks

- Product could later choose multi-file merging or a confirmation UI; either change would need new mini-spec coverage and privacy review.
- Migration coverage does not guarantee every malformed historical payload can be recovered.
- Browser smoke coverage remains intentionally narrow and does not provide visual regression coverage.
