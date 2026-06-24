# Sprint 11 Mini-Spec: Copyable Leadership Action Plan

## User Story

As a manager reviewing CosmoKPI, I want to click `Copy action plan` in the Recognition and Coaching area and receive a concise huddle-ready recap that celebrates wins, identifies improvement, and gives one clear team focus.

## Problem Statement

The dashboard already helps leaders identify recognition and coaching patterns, but a manager still has to translate that view into short spoken notes for a huddle. Sprint 11 adds one local-only copy action that turns the existing coaching view model into plain text without redesigning dashboard controls or creating a new coaching system.

## Acceptance Criteria

- `PerformanceCoachingSection` includes a `Copy action plan` action.
- Clipboard write happens only after the user clicks.
- Successful copy shows visible success status.
- Clipboard failure shows visible fallback/error status and does not silently fail.
- Weekly copy uses `This Week’s Team Focus` and weekly huddle wording.
- Monthly copy uses `This Month’s Team Focus` and monthly huddle wording.
- Copy includes store name and period label when available.
- Copy uses the existing coaching/dashboard view model and does not mutate it.
- Limited data produces neutral natural copy and avoids the phrase `insufficient data`.
- Copied text is not saved to localStorage.
- Analytics tracks only workflow metadata such as `copy_action_plan_clicked`.

## Out Of Scope

- Dashboard redesign.
- New coaching system.
- New page, modal, route, auth, database, cloud service, Slack/email integration, export system, chart, KPI formula change, or saved action-plan storage.
- Rebuilding existing dashboard controls.

## Brand And Copy Requirements

- Keep it short.
- Use `we`, `our`, and `let’s`.
- Connect focus to guests, team, games, service, or follow-through.
- Celebrate specific wins when appropriate.
- Coach behaviors, not personalities.
- Keep individual follow-up manager-only.
- Do not publicly call out a team member negatively.
- Avoid blame, shame, ranking language, fake certainty, corporate wording, and dashboard/product wording.
- Avoid forbidden phrases listed in the Sprint 11 prompt, including `Based on the data`, `Selected period`, `Insight`, `Utilize`, `Drive performance`, `Insufficient data`, and `CosmoKPI Action Plan`.

## Privacy Requirements

- No employee data leaves the browser.
- No KPI data leaves the browser.
- No CSV contents, row data, employee names, search terms, copied text, or report payloads in analytics.
- No copied text, employee names, KPI values, row data, CSV contents, search terms, or report payloads in URLs, APIs, cookies, logs, cloud storage, or localStorage.
- No auth, database, cloud sync, server storage, or external service is added.

## TDD Plan

- Add failing unit tests for weekly copy, monthly copy, limited-data neutral copy, no mutation, and forbidden phrase avoidance.
- Add privacy/static guardrail coverage for the pure helper and UI when existing source-level patterns support it.
- Add analytics privacy coverage for the safe workflow metadata event.
- Add browser smoke coverage for click-to-copy success status.

## Definition Of Done

- Mini-spec exists and is linked by `.gitignore` allowlist.
- Pure helper builds action-plan text from the existing coaching view model.
- UI copies only on click and reports success/failure visibly.
- Analytics remains workflow-only.
- Browser smoke covers the copy path.
- `docs/engineering-handoff.md` records Sprint 11 behavior, privacy, verification, and risk notes.
- `npm run test`, `npm run check`, and `npm run test:browser` pass under Node 22, or exact blockers are documented.

## Risks

- Clipboard APIs can fail because of browser permissions or secure-context rules; the UI must show fallback status.
- The existing fake browser fixture has limited period history, so smoke coverage should verify interaction rather than exhaustive copy quality.
- Copy can accidentally become too product-like or expose manager-only follow-up publicly; tests and helper wording should keep manager notes separate from huddle text.
