# AGENTS.md

## Project mission

Build and maintain a local-first Employee KPI Dashboard for The Escape Game leadership use. The app helps store leaders upload cOSmo employee KPI CSV exports, organize those reports by week, review employee performance, and export a clean KPI table for the Frontline Newsletter Store KPI Performance page.

This is not an HR system, payroll system, or source of official employment records. Treat it as a lightweight leadership visibility tool that supports coaching, accountability, and team communication.

## Product context

The dashboard is intended to be used mostly on MacBooks and occasionally on control room TVs. Prioritize:

* Fast local use
* Clear visual hierarchy
* Large, readable UI
* Minimal setup friction
* No backend requirement
* Safe handling of employee KPI data
* Export-ready visuals for newsletter use

The current app flow is:

1. User uploads a cOSmo employee KPI CSV on the homepage.
2. User selects the report week because the sample cOSmo export does not include a date/week field.
3. App parses and validates the CSV in the browser.
4. App stores weekly reports in `localStorage`.
5. Dashboard reads saved weeks from `localStorage`.
6. Dashboard displays weekly store totals, employee KPI cards, rankings, and tables.
7. Dashboard can export a Page 8-ready PNG table for the Frontline Newsletter.

## Current technical stack

* Next.js App Router
* React client components where browser APIs are required
* TypeScript
* Tailwind CSS
* `next/font/google` with Geist and Geist Mono
* Browser `localStorage` as the only persistence layer
* Browser `canvas` API for PNG export

Do not introduce a backend, database, authentication, server actions, external analytics, or third-party charting dependency unless explicitly requested.

## Key files

Expected project files include:

* `app/layout.tsx`

  * Global metadata
  * Geist font setup
  * Global dark dashboard background
  * Full viewport layout support

* `app/page.tsx`

  * Upload-first homepage
  * cOSmo CSV upload UI
  * Report week selector
  * CSV parser
  * CSV schema validation
  * localStorage write path

* `app/dashboard/page.tsx`

  * Client-side dashboard
  * localStorage read path
  * Weekly report selector
  * Store-level KPI metrics
  * Employee leaderboard cards
  * Searchable/sortable employee table
  * FLNL Page 8 PNG export buttons

## Data privacy and safety

Employee KPI data should remain local to the device.

Rules:

* Do not send uploaded CSV contents to an external service.
* Do not add telemetry or analytics around employee names, KPI values, or file contents.
* Do not persist data anywhere except localStorage unless explicitly requested.
* Do not log full employee rows to the browser console in production code.
* Do not include employee KPI data in URLs.
* Do not use cookies for KPI data.
* Do not add cloud sync without explicit approval.

## localStorage contract

The app uses this key:

```ts
const STORAGE_KEY = "employee-kpi-dashboard:v1";
```

Stored shape:

```ts
type EmployeeKpiRow = {
  name: string;
  storeName: string;
  role: string;
  totalGames: number;
  guests: number;
  replaysSold: number;
  SUEs: number;
  reviewsAsked: number;
  sharedReplay: number;
  afterGamePreviews: number;
  replaysSoldPercent: number;
  suePercent: number;
  reviewsAskedPercent: number;
  sharedReplayPercent: number;
  previewsPercent: number;
  [key: string]: string | number;
};

type StoredWeek = {
  id: string;
  weekStart: string;
  weekLabel: string;
  fileName: string;
  uploadedAt: string;
  storeName: string;
  totals: {
    employees: number;
    totalGames: number;
    guests: number;
    replaysSold: number;
    reviewsAsked: number;
    sharedReplay: number;
    afterGamePreviews: number;
  };
  employees: EmployeeKpiRow[];
};

type KpiStorage = {
  version: 1;
  latestWeekId: string | null;
  weeks: StoredWeek[];
};
```

Do not change the storage shape lightly. If a migration is necessary, preserve backwards compatibility for `version: 1` data.

## cOSmo CSV schema

The sample cOSmo export includes employee-level rows with these required columns:

```ts
const REQUIRED_COLUMNS = [
  "name",
  "storeName",
  "role",
  "totalGames",
  "guests",
  "replaysSold",
  "SUEs",
  "reviewsAsked",
  "sharedReplay",
  "afterGamePreviews",
  "replaysSoldPercent",
  "suePercent",
  "reviewsAskedPercent",
  "sharedReplayPercent",
  "previewsPercent",
];
```

Parsing expectations:

* Support standard CSV quoting.
* Trim header values and cell values.
* Strip UTF-8 BOM from the first header.
* Convert numeric KPI columns to numbers.
* Treat missing numeric values as `0`.
* Show a clear error if required columns are missing.
* Percent columns may arrive as either `0-100` values or decimal values like `0.92`; normalize before display.

Important: the sample CSV does not include a report date. Keep the manual report week selector unless the export format changes.

## KPI goals and calculations

Current goals:

```ts
const KPI_GOALS = {
  replayPercent: 15,
  reviewsAskedPercent: 90,
  sharedReplayPercent: 90,
  previewsPercent: 90,
};
```

Store-level dashboard calculations:

* Replay conversion = `replaysSold / guests * 100`
* Review ask rate = `reviewsAsked / totalGames * 100`
* Shared replay rate = `sharedReplay / totalGames * 100`
* Preview ask rate = `afterGamePreviews / totalGames * 100`

Employee-level display should use the row percentages from cOSmo, normalized when needed.

Do not invent official company KPI goals beyond what is already represented in the app. If goals need to change, make them configurable or clearly update the constants.

## Ranking rules

Current ranking guardrail:

```ts
const MINIMUM_GAMES_FOR_RANKING = 5;
```

The dashboard table and spotlight cards should avoid overemphasizing employees with tiny sample sizes. For competitions or newsletter exports, confirm whether the minimum should be 5, 10, or another threshold before changing behavior.

## Frontline Newsletter Page 8 export

The export feature creates a PNG table intended for the Store KPI Performance section of the Frontline Newsletter.

The example Page 8 layout shows:

* Page title: Store KPI Performance
* A table with these columns:

  * Team Member
  * # of Games
  * # of Guests
  * Replay %
  * Review Ask %
  * Preview %
* Color-coded KPI cells
* First-name display for team members
* The table placed in the upper half of the page with room for brand graphics below

Export rules:

* Export one PNG per saved week.
* Filename should include store and week, for example:

  * `flnl-page-8-kpi-las-vegas-2026-04-20.png`
* Use browser canvas for export.
* Do not require a server dependency for image generation.
* Keep the export readable when inserted into Canva or a newsletter PDF.
* Preserve the newsletter-friendly table format over dashboard styling.

Current export columns intentionally exclude `sharedReplayPercent` because the example Page 8 table uses Replay %, Review Ask %, and Preview %.

## UI and design standards

Design for MacBooks and TV visibility:

* Large headings
* High contrast
* Spacious cards
* Rounded corners
* Soft shadows
* Minimal clutter
* Avoid tiny dense controls
* Keep tables horizontally scrollable on smaller screens
* Use clear empty states
* Use clear error states

Current visual direction:

* Dark slate global app background
* White cards for data surfaces
* Sky accents for primary actions
* Green/yellow/red KPI status colors
* Rounded `2xl` and `3xl` card shapes

Do not make the app feel like a generic admin panel. It should feel clean, leadership-ready, and easy to present on a control room display.

## TEG communication and product tone

Use hospitality-first, ownership-based language in user-facing copy.

Preferred language:

* “Upload KPI report”
* “Report saved successfully”
* “Employee KPI table”
* “Weekly employee performance”
* “Store KPI Performance”
* “Upload another CSV”

Avoid language that sounds punitive, blame-focused, or overly corporate.

When explaining performance, frame it around clarity, coaching, and guest experience. This dashboard supports leadership follow-through, not public shaming.

## Code quality standards

When modifying code:

* Keep TypeScript types close to the data they represent.
* Prefer small helper functions for parsing, formatting, ranking, and exporting.
* Keep browser-only APIs inside client components or guarded by `typeof window !== "undefined"`.
* Avoid duplicating complex logic across pages.
* If shared helpers grow, move them into `lib/` with clear names.
* Use accessible labels for inputs and buttons.
* Keep button text action-oriented.
* Avoid magic strings when a constant is clearer.
* Handle empty, invalid, and missing data states gracefully.

Do not silence TypeScript errors with `any` unless there is a narrow and documented reason.

## Testing and verification checklist

Before considering work complete, verify:

* App builds without TypeScript errors.
* Homepage loads with no saved localStorage data.
* CSV upload accepts the cOSmo sample file.
* Missing required columns show a helpful error.
* Saved data appears on `/dashboard` after upload.
* Dashboard empty state appears when localStorage has no data.
* Week selector works with multiple saved weeks.
* Search filters employees correctly.
* Sort dropdown changes employee order correctly.
* KPI cards calculate store totals correctly.
* PNG export downloads successfully.
* Exported PNG is readable when viewed at normal size.
* App remains usable on a MacBook screen.
* App remains readable at TV distance.

Suggested commands, depending on the package manager present:

```bash
npm run lint
npm run build
```

If the repository uses `pnpm` or `yarn`, follow the lockfile/package manager already present in the repo. Do not switch package managers without approval.

## Dependency policy

Avoid adding dependencies for work that can be done with native browser APIs.

Do not add dependencies for:

* CSV parsing unless the native parser becomes too fragile
* localStorage access
* Simple date formatting
* PNG export
* Basic tables or cards

Ask before adding production dependencies. If adding a dependency is approved, explain why native APIs are not enough.

## Accessibility expectations

Maintain basic accessibility:

* Inputs need clear labels.
* Buttons should use `<button>` for actions and `<a>`/`Link` for navigation.
* Interactive elements need visible focus states.
* Do not rely on color alone to communicate KPI status.
* Tables should use semantic table markup.
* Keep contrast strong enough for control room displays.

## Performance expectations

The data sets are expected to be small, but still keep the app efficient:

* Avoid unnecessary re-parsing of CSV data after save.
* Use `useMemo` for sorted/filtered employee arrays.
* Avoid expensive canvas work until the user clicks export.
* Do not create canvases during normal render.

## Error handling expectations

For upload errors:

* State what failed.
* Keep the message actionable.
* Do not expose stack traces.

Good examples:

* “Please upload a CSV export from cOSmo.”
* “Missing required columns: reviewsAskedPercent, previewsPercent”
* “This CSV does not appear to include employee KPI rows.”

Bad examples:

* “Invalid input.”
* “Something broke.”
* Raw exception text with implementation details.

## Future enhancement backlog

These are reasonable next steps, but do not implement unless requested:

* Add a `lib/kpi-storage.ts` module for shared storage functions.
* Add a `lib/cosmo-csv.ts` module for parser/schema logic.
* Add a configurable goals settings panel.
* Add data reset/delete controls.
* Add import preview before save.
* Add multi-week trend charts.
* Add Canva-specific export dimensions.
* Add print/PDF export.
* Add anonymized TV mode.
* Add manager notes per week.
* Add manual employee name corrections for display names.

## Change management

When asked to make a change:

1. Identify whether it affects upload, storage, dashboard display, or export.
2. Preserve existing localStorage compatibility unless explicitly told otherwise.
3. Keep the UI simple and leadership-ready.
4. Test the happy path and at least one failure path.
5. Summarize what changed and what should be tested manually.

## Hard guardrails

* Do not upload employee data anywhere.
* Do not add authentication or cloud sync without explicit approval.
* Do not convert this into an HR/performance discipline system.
* Do not make public-facing claims about official company policy.
* Do not expose sensitive employee data in logs, URLs, or external requests.
* Do not remove the report week selector unless the CSV starts including a trustworthy date field.
* Do not break the Page 8 export format while improving dashboard visuals.
* Do not introduce dependencies or package manager changes without approval.

## Codex working style

When operating as a Codex agent in this repo:

* Read this file before editing.
* Inspect the current code before proposing changes.
* Make the smallest complete change that satisfies the request.
* Prefer direct edits over broad rewrites.
* Preserve naming conventions already used in the app.
* Run available validation commands when possible.
* If validation cannot be run, state that clearly in the final response.
* Never claim a test passed unless it was actually run.
