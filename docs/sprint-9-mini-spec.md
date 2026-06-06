# Sprint 9 Mini Spec: Performance Coaching Views

- Problem: Store leaders have KPI evidence, but the dashboard does not yet translate weekly or monthly movement into concise coaching decisions.
- User-facing outcome: Leaders can see who to celebrate, who is improving, who may need fair support, and which behavior to reinforce next from the selected period.
- Business rule: Respect `MINIMUM_GAMES_FOR_RANKING`, compare employees by the existing normalized comparison key, use point deltas for percentage KPIs, avoid percent-change from zero baselines, and keep language neutral and non-disciplinary.
- Data flow: Saved local reports load from browser `localStorage`, weekly/monthly periods are built in `lib/dashboard/monthly.ts`, pure coaching helpers derive view-models from current and prior periods, and the dashboard renders the result without changing storage.
- Privacy implication: Employee names and KPI values remain in browser memory/localStorage only; no coaching output, KPI data, search text, week IDs, CSV content, or localStorage payloads are sent to analytics or network calls.
- Expected behavior: Show Performance Coaching when the selected weekly/monthly period has enough employee data; otherwise show graceful insufficient-data copy, including the fair bottom-quartile message when eligible samples are too small.
- Test plan: Add TDD coverage for trend states, matched/unmatched prior employees, zero baselines, top performers, most improved, coaching opportunities, fair coaching attention eligibility, tie-breaking, no input mutation, and monthly period compatibility.
