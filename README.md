# cOSmo Employee KPI Dashboard

[![CI](https://github.com/blakee-marcus/cosmokpi/actions/workflows/ci.yml/badge.svg)](https://github.com/blakee-marcus/cosmokpi/actions/workflows/ci.yml)
[![Next.js](https://img.shields.io/badge/Next.js-16.2.4-000000?logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2.4-149ECA?logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Local First](https://img.shields.io/badge/data-localStorage_only-2E69FF)](#privacy-model)

A local-first KPI dashboard for reviewing weekly cOSmo employee KPI CSV exports and generating a Frontline Newsletter-ready KPI table.

The app is designed for store leadership workflows where employee KPI data should remain in the browser. CSV reports are parsed client-side, saved to `localStorage`, and exported from the dashboard as a PNG for internal newsletter use.

## Purpose

Store leaders need a fast, repeatable way to turn weekly cOSmo exports into useful KPI visibility. This project supports that workflow by giving developers a clear technical foundation for upload validation, local report storage, KPI calculation, dashboard review, and newsletter export generation.

Primary outcomes:

- Convert weekly cOSmo CSV exports into structured local reports.
- Surface store-level and employee-level KPI performance.
- Support coaching, follow-up, and celebration through clear data presentation.
- Generate a clean Frontline Newsletter KPI export without adding cloud storage or external data services.

## Features

- Upload weekly cOSmo employee KPI CSV exports in the browser.
- Assign a report week manually because cOSmo exports do not include a reliable week/date field.
- Validate required CSV columns before saving a report.
- Save weekly reports to browser `localStorage`.
- Review store-level KPI totals against current goals.
- Review employee-level KPI performance.
- Search, sort, and compare weekly performance.
- Highlight strong performance and coaching opportunities.
- Export a newsletter-ready PNG table for the Frontline Newsletter KPI section.

## Tech Stack

- Next.js App Router
- React
- TypeScript
- Tailwind CSS 4
- Browser `localStorage`
- Browser `canvas` API for PNG export
- Vercel Web Analytics for route-level page views and privacy-safe workflow events
- npm with checked-in `package-lock.json`

## Architecture

The app runs as a client-first dashboard. CSV files are parsed in the browser, normalized into typed report data, stored locally, and rendered on the dashboard. The export flow uses browser canvas APIs to generate a PNG from the selected report data.

Current architecture constraints:

- No backend database.
- No authentication layer.
- Vercel Web Analytics is limited to page-level route visits and privacy-safe workflow events.
- No server-side employee KPI reporting.
- No external storage for uploaded CSV data.
- No employee KPI values in URLs, logs, cookies, analytics events, or deployment output.

Any change to those constraints should be reviewed as a product and architecture decision before implementation.

## Privacy Model

Employee KPI data stays on the device.

- CSV files are parsed in the browser.
- Weekly report data is saved under `employee-kpi-dashboard:v1` in `localStorage`.
- Uploaded reports are excluded from GitHub Actions, Vercel storage, custom analytics events, cookies, URLs, logs, and external services.
- Vercel Web Analytics may record route visits such as `/` and `/dashboard` plus privacy-safe workflow events, but must not receive uploaded CSV contents, employee names, KPI values, search terms, week IDs, `localStorage` data, or export contents.
- CI validates source code only.

Keep this model intact unless the product direction intentionally changes. Any cloud persistence, KPI-specific analytics, authentication, or server-side reporting should be treated as a major scope change.

## Impact Analytics

Analytics are intended to help demonstrate leadership workflow impact without exposing employee KPI data.

Tracked events:

- `KPI Report Upload Started`
- `KPI Report Upload Rejected`
- `KPI Report Upload Failed`
- `KPI Report Saved`
- `Dashboard View Mode Changed`
- `Dashboard Period Changed`
- `Dashboard Search Used`
- `Dashboard Sort Changed`
- `FLNL Export Downloaded`

These events can support a promotion or raise conversation by showing dashboard adoption, successful report processing, manager review behavior, and newsletter export usage. Event properties are limited to safe workflow metadata such as upload source, report type, failure category, dashboard view mode, sort key, and export format.

## Project Structure

```text
app/
  layout.tsx            Global metadata and app shell
  page.tsx              Upload-first homepage, CSV parser, validation, localStorage write path
  dashboard/page.tsx    Dashboard, localStorage read path, KPI calculations, table, PNG export
  globals.css           Tailwind theme tokens and shared utility classes

.github/
  workflows/ci.yml      Lint, typecheck, and build gate
  dependabot.yml        Weekly npm and GitHub Actions updates
```

## Local Development

Use the Node version from `.nvmrc` and install dependencies from the lockfile.

```bash
nvm use
npm ci
npm run dev
```

Open the app locally:

```text
http://localhost:3000
```

Upload a cOSmo KPI CSV from the homepage. After at least one report is saved locally, open:

```text
http://localhost:3000/dashboard
```

## Quality Commands

```bash
npm run test
npm run lint
npm run typecheck
npm run build
npm run check
```

`npm run test` runs focused Vitest unit tests for business logic. `npm run check` runs linting, TypeScript validation, and the production Next.js build in the same order used by CI.

## Data Contract

The app currently stores version 1 report data under this key:

```ts
const STORAGE_KEY = "employee-kpi-dashboard:v1";
```

Stored reports include:

- Report week
- Source filename
- Upload timestamp
- Store totals
- Employee rows

Preserve backwards compatibility for existing `version: 1` data if the storage shape changes.

## CSV Contract

Required cOSmo columns:

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

Parser requirements:

- Support standard CSV quoting.
- Trim headers and cell values.
- Strip a UTF-8 BOM from the first header.
- Convert numeric KPI fields to numbers.
- Treat missing numeric values as `0`.
- Show clear errors for missing columns or empty employee data.
- Normalize percentage display when cOSmo sends decimals such as `0.92` instead of `92`.

## KPI Rules

Current goal constants:

```ts
const KPI_GOALS = {
  replayPercent: 15,
  reviewsAskedPercent: 90,
  sharedReplayPercent: 90,
  previewsPercent: 90,
};
```

Store-level calculations:

```ts
replayPercent = (replaysSold / guests) * 100;
reviewsAskedPercent = (reviewsAsked / totalGames) * 100;
sharedReplayPercent = (sharedReplay / totalGames) * 100;
previewsPercent = (afterGamePreviews / totalGames) * 100;
```

Employee rows display the percentage values provided by cOSmo.

Rankings use this minimum sample size:

```ts
const MINIMUM_GAMES_FOR_RANKING = 5;
```

This keeps very small samples from dominating the ranking views.

## Frontline Newsletter PNG Export

The dashboard exports a newsletter-ready PNG from the browser.

The export includes:

- Store KPI Performance title
- Team Member
- # of Games
- # of Guests
- Replay %
- Review Ask %
- Preview %

Export rules:

- Team members display by first name.
- KPI values use goal-based color coding.
- Shared replay is excluded because the current newsletter table format uses Replay %, Review Ask %, and Preview %.
- Filenames follow this format:

```text
flnl-kpi-las-vegas-2026-04-20.png
```

## CI/CD

The repository uses a lean cOSmo KPI quality gate: GitHub Actions validates source code, and Vercel Git handles deployments. The pipeline does not upload CSV files, export artifacts, use deployment tokens, or handle employee KPI data.

GitHub Actions runs on pull requests, pushes to `main`, and manual workflow dispatches. The quality gate installs from the lockfile with Node from `.nvmrc`, then runs:

```bash
npm ci
npm run lint
npm run typecheck
npm run build
```

`npm run check` runs the same lint, typecheck, and production build sequence locally.

Recommended Vercel Git deployment path:

- Pull requests create preview deployments.
- Merges or pushes to `main` create production deployments.
- GitHub Actions does not need `VERCEL_TOKEN`, `VERCEL_ORG_ID`, or `VERCEL_PROJECT_ID` secrets for this setup.
- Use Vercel Deployment Protection if preview or production URLs should be limited to approved viewers.

Recommended branch protection for `main`:

- Require pull requests before merge.
- Require the cOSmo KPI Quality Gate check.
- Require Vercel deployment checks if Vercel exposes them on the repository.
- Block force pushes.

Release and rollback expectations:

- Review the Vercel preview before merging.
- Confirm no real employee KPI data appears in preview testing, logs, or shared screenshots.
- Roll back production by reverting the merged commit or promoting the previous stable Vercel deployment.

## Dependency Updates

Dependabot checks npm packages and GitHub Actions weekly.

Updates are grouped by:

- Next.js
- React
- Tooling
- GitHub Actions

## Contributor Notes

Implementation guardrails:

- Keep browser-only APIs inside client components or guard them with `typeof window !== "undefined"`.
- Do not log full employee rows.
- Do not place employee KPI data in URLs.
- Maintain the local-first data model unless the product direction changes.
- Preserve the manual report week selector unless cOSmo starts exporting a reliable date field.
- Keep the Frontline Newsletter export format stable while improving dashboard visuals.
- Prefer small helpers for parsing, formatting, ranking, and exporting.
- Run `npm run check` before opening a pull request.

## Product Direction

Keep the app focused on weekly KPI review, leadership visibility, and Frontline Newsletter export support.

Recommended additions:

- Better week-to-week comparisons
- Clearer coaching and celebration indicators
- Improved empty states and validation messages
- Stronger export polish
- Safer local data migration handling

Avoid adding:

- HR-style performance records
- Payroll logic
- Cloud sync
- Authentication
- KPI-specific analytics events
- Long-term employee recordkeeping
- Features that make the tool feel punitive instead of coaching-oriented

## License

Personal/internal portfolio project by Blake Marcus.

This repository references operational workflows from The Escape Game. Keep any future implementation aligned with the local-first privacy model and developer guardrails documented above.
