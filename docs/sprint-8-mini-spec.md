# Sprint 8 Mini-Spec: Dependency Maintenance Decision

## User Story

As the maintainer of cOSmo KPI, I want the dependency-maintenance state reviewed under the supported Node/npm runtime so that npm optional-dependency noise, audit findings, and verification hygiene are either fixed minimally or documented clearly without changing product behavior.

## Sprint Goal

Resolve or document the current dependency-maintenance state for npm optional-dependency reporting noise, npm audit findings, runtime consistency, and verification hygiene under Node `22.14.0` and npm `10.9.2`.

Decision: **C. Minimal dependency fix.**

## Scope

- Capture baseline `git status --short`, `npm ls --depth=0`, `npm audit`, `npm run test`, and `npm run check` with `PATH=/opt/homebrew/opt/node@22/bin:$PATH`.
- Investigate npm's optional wasm helper package reporting.
- Investigate npm audit findings and root causes.
- Keep dependency changes minimal and scoped to audit findings.
- Re-run verification under Node `22.14.0` and npm `10.9.2`.
- Update the engineering handoff with findings, changes, deferrals, verification, and remaining risks.

## Out of Scope

- Product behavior changes.
- UI, parser, export, auth, database, cloud, analytics, or unrelated dependency work.
- Broad `npm update`.
- New dependencies.
- Package upgrades made only because newer versions exist.

## Acceptance Criteria

- Mini-spec exists at `docs/sprint-8-mini-spec.md`.
- Baseline is captured and summarized in the handoff.
- Maintenance decision is documented.
- Optional wasm helper package reporting has a root-cause finding.
- Audit findings have root-cause findings and either minimal fixes or accepted residual risk.
- Full verification is completed or the limitation is documented.
- No product behavior changes are made.

## Risks and Rollback Notes

- `npm ls --depth=0` still reports optional wasm helper packages as extraneous even though they are lockfile-owned optional transitive packages; this is accepted as npm reporting noise unless a future npm release or dependency tree removes the noise cleanly.
- `npm audit` still reports moderate PostCSS-related advisories through `next` and `@vercel/analytics`; npm's proposed force fix is a breaking downgrade to `next@9.3.3`, so it is intentionally deferred.
- Rollback for dependency changes is to restore `package.json` and `package-lock.json` to the previous `next@16.2.4`, `eslint-config-next@16.2.4`, and `brace-expansion@5.0.5` lock state.
- Future maintenance should revisit this if Next publishes a non-breaking release that bundles `postcss >=8.5.10`, npm resolves the optional-dependency reporting artifact, or audit severity increases.
