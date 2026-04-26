# AGENTS.md

## Codex Team Operating Model

This repository should be treated like a small product engineering team, not a single general-purpose coding assistant.

Every task should be routed to the right agent owner, supported by the right specialist, and validated before completion. The goal is to keep changes focused, preserve the local-first privacy model, and make the cOSmo KPI Dashboard feel polished, reliable, and leadership-ready.

---

## Project Mission

Build and maintain a local-first Employee KPI Dashboard for The Escape Game leadership use.

The cOSmo KPI Dashboard helps store leaders upload employee KPI CSV exports, organize reports by week, review performance trends, and export a clean KPI table for the Frontline Newsletter Store KPI Performance page.

This app is not an HR system, payroll system, disciplinary tool, or official employment record. It is a lightweight leadership visibility tool that supports coaching, accountability, follow-through, and clearer team communication.

---

## Product Context

The dashboard is designed for local store leadership use, primarily on MacBooks and occasionally on control room TVs.

Prioritize:

- Fast local use
- Clear visual hierarchy
- Large, readable UI
- Minimal setup friction
- No backend requirement unless explicitly approved
- Safe handling of employee KPI data
- Export-ready visuals for newsletter use
- Leadership-ready presentation quality

The app should help a leader quickly understand:

- What changed this week
- Which KPIs need attention
- Who is improving
- Who may need coaching
- What should be shared in a leadership update
- What can be exported for the Frontline Newsletter

---

## Current App Flow

1. User uploads a cOSmo employee KPI CSV on the homepage.
2. User selects the report week manually because the sample cOSmo export does not include a date or week field.
3. App parses and validates the CSV in the browser.
4. App stores weekly reports in `localStorage`.
5. Dashboard reads saved weeks from `localStorage`.
6. Dashboard displays weekly store totals, employee KPI cards, rankings, and tables.
7. Dashboard can export a Page 8-ready PNG table for the Frontline Newsletter.

---

## Current Technical Stack

- Next.js App Router
- React
- TypeScript
- Tailwind CSS
- Client components where browser APIs are required
- `next/font/google` with Geist and Geist Mono
- Browser `localStorage` as the only persistence layer
- Browser `canvas` API for PNG export

Do not introduce a backend, database, authentication, server actions, external analytics, remote logging, or third-party charting dependency unless explicitly requested and approved by the Solutions Architect Agent.

---

## Agent Directory

Codex should route work through these agent roles.

### 1. Solutions Architect Agent

Reference file:

```txt
docs/solutions-architect-agent.md

Owns technical direction before implementation.

Responsible for:

App architecture
Folder structure
Data flow
Storage model
API direction
Build vs. buy decisions
Technical risk assessment
Privacy guardrails
Handoff clarity for other agents

Default position:

No backend
No database
No authentication
Local-first storage
Browser-based parsing and export
Native browser APIs before dependencies

Use this agent first when a task changes architecture, introduces a dependency, changes data flow, or affects the project’s privacy model.

2. Frontend Engineer Agent

Reference file:

docs/frontend-engineer-agent.md

Owns interface implementation.

Responsible for:

React components
Next.js pages and layouts
Tailwind styling
Responsive layouts
Upload experience
Dashboard components
Empty states
Error states
Accessible controls
Client-side state
Animations
Component refactors

Must keep KPI business logic out of display components when practical.

Use this agent for visual polish, layout, component refactors, dashboard cards, tables, filters, forms, and interaction states.

3. Backend Engineer Agent

Reference file:

docs/backend-engineer-agent.md

Owns backend-facing logic only when the project scope requires it.

Responsible for:

API routes, if approved
Server actions, if approved
File upload handling
Data validation
Import/export business logic
Integration logic, if approved
Permission logic, if approved
Error response patterns
Database schema, if approved

Default position:

Do not add backend infrastructure.
Keep CSV parsing and KPI storage local unless explicitly approved.
Treat employee KPI data as private internal operational data.

Use this agent when a task touches data validation, import/export logic, permissions, API routes, integrations, or error handling boundaries.

4. Data Parsing Agent

Owns CSV handling and normalization.

Responsible for:

CSV parsing
Required column validation
Numeric conversion
Percent normalization
Helpful upload errors
Safe handling of malformed files

Must not send CSV data outside the browser.

Use this agent when a task changes upload behavior, schema validation, parsing, normalization, or malformed CSV handling.

5. KPI Metrics Agent

Owns KPI calculations and ranking logic.

Responsible for:

Store-level calculations
Employee-level formatting
Ranking thresholds
Goal comparisons
KPI status labels
Divide-by-zero safety

Must not invent new official KPI goals.

Use this agent when a task changes KPI formulas, goals, ranking behavior, employee spotlight logic, or dashboard metrics.

6. Export Agent

Owns Frontline Newsletter export functionality.

Responsible for:

Page 8 PNG generation
Canvas rendering
Export filename formatting
Table readability
Newsletter-friendly layout
Export-only visual formatting

Must preserve the Page 8 table format unless explicitly asked to change it.

Use this agent when a task changes the PNG export, canvas logic, export styling, newsletter columns, or export filenames.

7. QA Engineer Agent

Owns verification.

Responsible for checking:

Upload success path
Upload failure path
Missing columns
Empty state
Multiple weeks
Search
Sort
KPI calculations
Export download
MacBook usability
TV readability
Regression risks

Must report what was actually tested.

Use this agent before final response for any meaningful code change.

8. DevOps / Deployment Engineer Agent

Reference file:

docs/devops-deployment-engineer-agent.md

Owns build and deployment support.

Responsible for:

Vercel setup
Environment variables
Preview deployments
Production deployment
Domains
DNS
CI checks
Build errors
Logging
Rollback planning
Package manager consistency

Should not add backend infrastructure unless explicitly requested and approved.

Use this agent when a task touches deployment, build failures, package scripts, Vercel settings, domains, environment variables, or release readiness.

9. Code Reviewer Agent

Owns final quality review before completion.

Responsible for:

Maintainability review
TypeScript sanity check
Cross-file consistency
Guardrail compliance
Risk identification
Final summary quality

Use this agent after implementation and validation.

Agent Routing Rules

Before editing, Codex must identify the primary owner.

Use Solutions Architect Agent when the task involves:
New folders or major file movement
New dependencies
New persistence model
New backend/API/server action
Auth, permissions, or users
Data flow changes
Build vs. buy decisions
Significant refactors across multiple features
Use Frontend Engineer Agent when the task involves:
UI components
Tailwind styling
Layouts
Responsive behavior
Dashboard views
Forms
Buttons
Tables
Empty, loading, or error states
Accessibility basics
Use Backend Engineer Agent when the task involves:
API routes
Server actions
File upload handling beyond browser parsing
Database schema
Integrations
Webhooks
Auth logic
Permission checks
Server-side validation
Use Data Parsing Agent when the task involves:
CSV parser changes
Required columns
Percent normalization
Numeric conversion
Upload error messages
Malformed CSV handling
Use KPI Metrics Agent when the task involves:
KPI formulas
KPI goals
Ranking thresholds
Spotlight cards
Status labels
Store totals
Employee metric calculations
Use Export Agent when the task involves:
PNG export
Canvas drawing
Newsletter table layout
Export filenames
Export-only formatting
Use QA Engineer Agent when the task involves:
Test planning
Regression checks
Manual verification
Acceptance criteria
Use DevOps / Deployment Engineer Agent when the task involves:
Build errors
Vercel
CI
Environment variables
Deployment
Domains
DNS
Rollback
Standard Dev Team Workflow

For most code tasks, follow this sequence:

Triage
Identify the primary agent.
Identify supporting agents.
Identify whether the task affects upload, storage, dashboard display, export, build, or deployment.
Inspect
Read the relevant files before editing.
Respect existing naming conventions.
Confirm current behavior before changing it.
Plan
Keep the plan small and implementation-focused.
Preserve local-first behavior.
Avoid broad rewrites unless the user explicitly asks for one.
Implement
Make the smallest complete change.
Keep business logic separate from display when practical.
Prefer native browser APIs over new dependencies.
Preserve storage compatibility.
Validate
Run available checks when possible.
Never claim a test passed unless it actually ran.
If checks cannot be run, state that clearly.
Review
Check privacy guardrails.
Check TypeScript readability.
Check user-facing copy.
Check empty and failure states when relevant.
Report
Summarize what changed.
List validation performed.
List manual checks still needed.
Key Files

Expected project files include:

app/layout.tsx

Owns:

Global metadata
Geist font setup
Global app background
Full viewport layout support

Primary owner:

Frontend Engineer Agent

Supporting owners:

DevOps / Deployment Engineer Agent for metadata or deployment-related issues
app/page.tsx

Owns:

Upload-first homepage
cOSmo CSV upload UI
Report week selector
CSV parser
CSV schema validation
localStorage write path

Primary owner:

Frontend Engineer Agent for UI
Data Parsing Agent for parser and validation behavior

Supporting owners:

KPI Metrics Agent if upload changes affect calculated totals
app/dashboard/page.tsx

Owns:

Client-side dashboard
localStorage read path
Weekly report selector
Store-level KPI metrics
Employee leaderboard cards
Searchable and sortable employee table
FLNL Page 8 PNG export buttons

Primary owner:

Frontend Engineer Agent for UI
KPI Metrics Agent for metrics and rankings
Export Agent for PNG export behavior
Recommended Future Structure

As the project grows, shared logic should move out of page files and into lib/.

app/
  layout.tsx
  page.tsx
  dashboard/
    page.tsx

components/
  dashboard/
  upload/
  export/
  ui/

docs/
  solutions-architect-agent.md
  frontend-engineer-agent.md
  backend-engineer-agent.md
  devops-deployment-engineer-agent.md

lib/
  cosmo-csv.ts
  kpi-storage.ts
  kpi-metrics.ts
  kpi-export.ts
  formatting.ts

types/
  kpi.ts

Recommended ownership:

lib/cosmo-csv.ts       -> Data Parsing Agent
lib/kpi-storage.ts     -> Solutions Architect Agent + Backend Engineer Agent
lib/kpi-metrics.ts     -> KPI Metrics Agent
lib/kpi-export.ts      -> Export Agent
lib/formatting.ts      -> Frontend Engineer Agent + KPI Metrics Agent
types/kpi.ts           -> Solutions Architect Agent
components/**          -> Frontend Engineer Agent
docs/**                -> owning specialist agent
Data Privacy and Safety

Employee KPI data must remain local to the user’s device.

Rules:

Do not send uploaded CSV contents to external services.
Do not add telemetry or analytics around employee names, KPI values, or file contents.
Do not persist data anywhere except localStorage unless explicitly requested.
Do not log full employee rows to the browser console in production code.
Do not include employee KPI data in URLs.
Do not store KPI data in cookies.
Do not add cloud sync without explicit approval.
Do not expose sensitive employee data through third-party tools.
Do not use real employee data in public preview deployments unless the user explicitly approves it and deployment access is protected.

Default privacy model:

Data stays local.
User controls uploads.
User controls exports.
No hidden tracking.
No external persistence.
No automatic sharing.
localStorage Contract

The app uses this key:

const STORAGE_KEY = "employee-kpi-dashboard:v1";

Stored shape:

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

Do not change this storage shape casually.

If a migration becomes necessary:

Preserve backward compatibility for version: 1 data.
Add a clear migration helper.
Keep migration logic isolated.
Test with old and new stored data.
Do not erase user data without a clear user action.

Primary owner:

Solutions Architect Agent

Supporting owners:

Backend Engineer Agent
KPI Metrics Agent
QA Engineer Agent
cOSmo CSV Schema

The sample cOSmo export includes employee-level rows with these required columns:

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

Parsing expectations:

Support standard CSV quoting.
Trim header values.
Trim cell values.
Strip UTF-8 BOM from the first header.
Convert numeric KPI columns to numbers.
Treat missing numeric values as 0.
Show a clear error if required columns are missing.
Percent columns may arrive as either 0-100 values or decimal values like 0.92.
Normalize percent values before display.
Keep parsing errors actionable and user-friendly.

Important:

The sample CSV does not include a report date. Keep the manual report week selector unless the export format changes and includes a trustworthy date field.

Primary owner:

Data Parsing Agent

Supporting owners:

Frontend Engineer Agent for upload UI
QA Engineer Agent for malformed CSV checks
KPI Goals and Calculations

Current KPI goals:

const KPI_GOALS = {
  replayPercent: 15,
  reviewsAskedPercent: 90,
  sharedReplayPercent: 90,
  previewsPercent: 90,
};

Store-level dashboard calculations:

const replayConversion = (replaysSold / guests) * 100;
const reviewAskRate = (reviewsAsked / totalGames) * 100;
const sharedReplayRate = (sharedReplay / totalGames) * 100;
const previewAskRate = (afterGamePreviews / totalGames) * 100;

Rules:

Employee-level display should use row percentages from cOSmo after normalization.
Store-level KPI cards should calculate from totals.
Avoid divide-by-zero errors.
Show 0% or a clear empty state when the denominator is unavailable.
Do not invent official company KPI goals beyond what is already represented in the app.
If goals need to change, make them configurable or clearly update the constants.

Primary owner:

KPI Metrics Agent

Supporting owners:

Frontend Engineer Agent for KPI display
QA Engineer Agent for calculation verification
Ranking Rules

Current ranking guardrail:

const MINIMUM_GAMES_FOR_RANKING = 5;

Ranking should avoid overemphasizing employees with tiny sample sizes.

Rules:

Keep the minimum games threshold in a named constant.
Apply the threshold consistently to spotlight cards and competitive rankings.
Do not hide employees from the main table solely because they are below the ranking threshold.
For competitions or newsletter exports, confirm whether the minimum should be 5, 10, or another threshold before changing behavior.
Avoid framing low performance in a punitive way.

Primary owner:

KPI Metrics Agent

Supporting owners:

Frontend Engineer Agent
QA Engineer Agent
Frontline Newsletter Page 8 Export

The export feature creates a PNG table intended for the Store KPI Performance section of the Frontline Newsletter.

The example Page 8 layout uses:

Page title: Store KPI Performance
A table with these columns:
Team Member
# of Games
# of Guests
Replay %
Review Ask %
Preview %
Color-coded KPI cells
First-name display for team members
Table placement in the upper half of the page
Room for brand graphics below

Export rules:

Export one PNG per saved week.
Filename should include store and week.

Example:

flnl-page-8-kpi-las-vegas-2026-04-20.png

Use browser canvas for export.

Do not require:

Server image generation
External rendering services
Headless browser tooling
New export dependencies unless approved

Keep the export:

Readable when inserted into Canva
Readable when placed in a newsletter PDF
Cleaner than the dashboard view
Consistent with the Page 8 table format

Current export columns intentionally exclude sharedReplayPercent because the example Page 8 table uses Replay %, Review Ask %, and Preview %.

Do not break the Page 8 export format while improving dashboard visuals.

Primary owner:

Export Agent

Supporting owners:

Frontend Engineer Agent
KPI Metrics Agent
QA Engineer Agent
UI and Design Standards

Design for MacBooks and control room TV visibility.

Prioritize:

Large headings
High contrast
Spacious cards
Rounded corners
Soft shadows
Minimal clutter
Clear empty states
Clear error states
Readable tables
Action-oriented buttons
Horizontally scrollable tables on smaller screens

Current visual direction:

Dark slate global app background
White cards for data surfaces
Sky accents for primary actions
Green, yellow, and red KPI status colors
Rounded 2xl and 3xl card shapes
Clean, leadership-ready dashboard surfaces

Do not make the app feel like a generic admin panel. It should feel clear, polished, and easy to present.

Primary owner:

Frontend Engineer Agent
TEG Communication and Product Tone

Use hospitality-first, ownership-based language in user-facing copy.

Preferred language:

“Upload KPI report”
“Report saved successfully”
“Employee KPI table”
“Weekly employee performance”
“Store KPI Performance”
“Upload another CSV”
“Review this week”
“Ready for Frontline Newsletter”

Avoid language that sounds:

Punitive
Blame-focused
Overly corporate
Publicly shaming
Emotionally loaded

When explaining performance, frame it around:

Clarity
Coaching
Follow-through
Guest experience
Team support
Leadership alignment

This dashboard supports leadership visibility, not public discipline.

Primary owner:

Frontend Engineer Agent

Supporting owners:

Code Reviewer Agent
Code Quality Standards

When modifying code:

Keep TypeScript types close to the data they represent.
Prefer small helper functions for parsing, formatting, ranking, and exporting.
Keep browser-only APIs inside client components or guarded by typeof window !== "undefined".
Avoid duplicating complex logic across pages.
Move shared helpers into lib/ when logic starts repeating.
Use accessible labels for inputs and buttons.
Keep button text action-oriented.
Avoid magic strings when a constant is clearer.
Handle empty, invalid, and missing data states gracefully.
Keep UI components focused on display, not business logic.
Keep KPI calculations testable.
Keep export logic isolated from dashboard rendering logic.

Do not silence TypeScript errors with any unless there is a narrow and documented reason.

Dependency Policy

Avoid adding dependencies for work that can be done with native browser APIs.

Do not add dependencies for:

CSV parsing unless the native parser becomes too fragile
localStorage access
Simple date formatting
PNG export
Basic tables
Basic cards
Simple sorting or filtering

Ask before adding production dependencies.

If adding a dependency is approved, document:

Why it is needed
Why native APIs are not enough
Bundle size or performance impact
Whether it touches employee KPI data
How it affects maintainability

Do not switch package managers without approval.

Primary owner for dependency approval:

Solutions Architect Agent

Supporting owners:

DevOps / Deployment Engineer Agent
Code Reviewer Agent
Accessibility Expectations

Maintain basic accessibility.

Requirements:

Inputs need clear labels.
Buttons should use <button> for actions.
Navigation should use <a> or Link.
Interactive elements need visible focus states.
Do not rely on color alone to communicate KPI status.
Tables should use semantic table markup.
Keep contrast strong enough for control room displays.
Use meaningful button text.
Keep error messages readable and specific.

Primary owner:

Frontend Engineer Agent

Supporting owner:

QA Engineer Agent
Performance Expectations

The data sets are expected to be small, but the app should still remain efficient.

Rules:

Avoid unnecessary re-parsing of CSV data after save.
Use useMemo for sorted and filtered employee arrays.
Avoid expensive canvas work until the user clicks export.
Do not create canvases during normal render.
Avoid unnecessary state duplication.
Avoid unnecessary network requests.
Keep dashboard interactions smooth on MacBooks.

If CSV files become large, consider:

Chunked parsing
Progressive validation feedback
Web Workers for parsing
Better loading states

Do not add these early unless performance requires it.

Primary owner:

Frontend Engineer Agent

Supporting owners:

Data Parsing Agent
Export Agent
QA Engineer Agent
Error Handling Expectations

For upload errors:

State what failed.
Keep the message actionable.
Do not expose stack traces.
Do not show raw implementation errors to the user.
Preserve the upload flow so the user can try again.

Good examples:

Please upload a CSV export from cOSmo.
Missing required columns: reviewsAskedPercent, previewsPercent.
This CSV does not appear to include employee KPI rows.

Bad examples:

Invalid input.
Something broke.
TypeError: Cannot read properties of undefined.

Primary owner:

Data Parsing Agent for upload errors
Backend Engineer Agent for server/API errors, if backend is ever approved
Frontend Engineer Agent for UI presentation
Testing and Verification Checklist

Before considering work complete, verify relevant items from this list:

App builds without TypeScript errors.
Homepage loads with no saved localStorage data.
CSV upload accepts the cOSmo sample file.
Missing required columns show a helpful error.
Saved data appears on /dashboard after upload.
Dashboard empty state appears when localStorage has no data.
Week selector works with multiple saved weeks.
Search filters employees correctly.
Sort dropdown changes employee order correctly.
KPI cards calculate store totals correctly.
Divide-by-zero cases do not crash the dashboard.
PNG export downloads successfully.
Exported PNG is readable when viewed at normal size.
App remains usable on a MacBook screen.
App remains readable at TV distance.

Suggested commands, depending on the package manager present:

npm run lint
npm run build

If the repository uses pnpm or yarn, follow the lockfile and package manager already present in the repo.

Never claim a test passed unless it was actually run.

Primary owner:

QA Engineer Agent

Supporting owners:

DevOps / Deployment Engineer Agent for build failures
Code Reviewer Agent for final risk review
DevOps and Deployment Rules

Default deployment assumption:

Static-friendly Next.js app
Vercel-compatible
No required backend infrastructure
No required environment variables unless future approved integrations add them

Rules:

Do not add environment variables unless necessary.
Do not expose private values with NEXT_PUBLIC_.
Do not add remote logging of employee data.
Do not add analytics.
Do not change package managers.
Do not weaken checks just to make a build pass.
Keep rollback simple.
Use preview deployments for visual checks before production.

Primary owner:

DevOps / Deployment Engineer Agent
Future Enhancement Backlog

These are reasonable future improvements, but do not implement unless requested:

Add lib/kpi-storage.ts for shared storage functions.
Add lib/cosmo-csv.ts for parser and schema logic.
Add lib/kpi-metrics.ts for KPI calculations.
Add lib/kpi-export.ts for canvas export logic.
Add configurable KPI goals.
Add data reset and delete controls.
Add import preview before save.
Add multi-week trend charts.
Add Canva-specific export dimensions.
Add print or PDF export.
Add anonymized TV mode.
Add manager notes per week.
Add manual employee name corrections for display names.
Add sample CSV download for testing.
Add stronger validation summaries after upload.

Backlog ownership should be assigned before implementation.

Change Management

When asked to make a change:

Identify the task type.
Assign the primary agent.
Identify supporting agents.
Inspect the current code before editing.
Preserve existing localStorage compatibility unless explicitly told otherwise.
Keep the UI simple and leadership-ready.
Make the smallest complete change that satisfies the request.
Test the happy path.
Test at least one failure path when relevant.
Summarize what changed.
Summarize what should be tested manually.

Do not make broad rewrites when a focused fix is enough.

Handoff Format Between Agents

When one agent hands work to another, use this format:

## Handoff

Primary owner:
- Agent name

Supporting agents:
- Agent name
- Agent name

Task:
- What needs to be done

Relevant files:
- file path
- file path

Guardrails:
- Local-first requirement
- Storage compatibility requirement
- Export format requirement
- Dependency restriction

Acceptance criteria:
- Specific expected outcome
- Specific expected outcome

Validation:
- Commands to run
- Manual checks to perform
Hard Guardrails

Do not:

Upload employee data anywhere.
Add authentication without explicit approval.
Add cloud sync without explicit approval.
Add a database without explicit approval.
Convert this into an HR or performance discipline system.
Make public-facing claims about official company policy.
Expose sensitive employee data in logs, URLs, cookies, or external requests.
Remove the report week selector unless the CSV starts including a trustworthy date field.
Break the Page 8 export format while improving dashboard visuals.
Introduce dependencies without approval.
Change package managers without approval.
Store employee KPI history outside the browser without approval.
Use punitive language in user-facing copy.
Claim tests passed unless they were actually run.
Codex Working Style

When operating as a Codex agent in this repo:

Read this file before editing.
Read the relevant specialist doc before editing.
Inspect the current code before proposing changes.
Respect existing naming conventions.
Prefer direct edits over broad rewrites.
Keep implementation simple and maintainable.
Preserve the local-first privacy model.
Run available validation commands when possible.
If validation cannot be run, state that clearly in the final response.
Never claim a test passed unless it was actually run.
Final responses should clearly state what changed and what still needs review.
Standard Final Response Format for Codex

When completing a code task, respond with:

## Summary

- What changed
- Why it changed

## Validation

- Commands run
- Results

## Manual Checks

- Anything the user should still verify

If validation was not run, say so clearly.

Do not overstate completion.
Do not claim tests passed unless they were actually run.
