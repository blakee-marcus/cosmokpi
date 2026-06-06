# Sprint 10 Mini-Spec: Import Trust & Recovery

- Problem: weekly CSV imports can still feel too easy to misuse when a manager picks the wrong week, replaces a saved report, or hits a vague validation failure.
- Smallest vertical slice: choose report week -> upload CSV -> preview parsed import -> confirm save -> local save -> success state with dashboard handoff.
- Preview states: waiting, checking file, recoverable error, ready-to-save preview, duplicate-week replacement preview, saved success.
- Validation states: wrong file type, empty CSV, missing required columns, invalid numeric values, and no valid team member rows each explain what happened and the next action.
- Duplicate-week behavior: if the same store/week already exists, show `Data already exists for this week. Confirming will replace the saved report for this week.` and save only after explicit confirmation.
- Success state: show saved week label, employee count, `Review dashboard`, and optional `Import another week`.
- Cancel/no-save behavior: canceling preview clears the pending import and leaves saved localStorage unchanged.
- Privacy: no employee KPI data leaves the browser; no cloud sync, auth, database, KPI analytics, row-level analytics, file contents, or report data.
