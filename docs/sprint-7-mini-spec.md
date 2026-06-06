# Sprint 7 Mini-Spec: Runtime & Repo Hygiene

## User Story

As a TEG leader using CosmoKPI, I need the app to install, test, build, and run consistently so the tool remains reliable, private, and easy to maintain.

## Sprint Goal

Clean up repository and runtime hygiene without changing product behavior.

## Backlog Items

### 1. Node and npm Runtime Alignment

Acceptance criteria:

- The required Node version is clear in `.nvmrc`, `package.json`, and contributor docs.
- The npm version expectation is documented.
- Any Node version mismatch is either resolved or documented with a clear reason.

### 2. Dependency Tree Hygiene

Acceptance criteria:

- `npm ls --depth=0` has been run and its findings are documented.
- Extraneous packages are removed only if they are proven to be install artifacts or unused dependency drift.
- No new dependencies are added.

### 3. Runtime Warning Review

Acceptance criteria:

- Node 26 deprecation behavior and `NO_COLOR` warning behavior are investigated enough to decide whether action is needed in Sprint 7.
- Any remaining warning is documented as either actionable now or deferred as an environment/runtime artifact.

### 4. Verification Reliability

Acceptance criteria:

- Targeted checks are run before and after each scoped fix.
- Final verification includes `npm run test`, `npm run check`, `npm run test:browser`, and `npm ls --depth=0`.
- Any remaining environment-only warning is captured in the handoff.

### 5. Practical Setup Documentation

Acceptance criteria:

- Setup docs state the expected Node/npm versions and package manager.
- The engineering handoff summarizes Sprint 7 findings, changed files, verification results, risks, and deferred work.
- Documentation stays concise, operational, and aligned with the local-first privacy model.

## Guardrails

- No product feature work, UI redesign, analytics changes, auth, database work, cloud sync, or CSV parser behavior changes.
- No broad dependency upgrades.
- No speculative cleanup.
- No real employee data, real CSV data, secrets, or network persistence added.
