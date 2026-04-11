---
phase: 06-discovery-workspace
plan: 01
subsystem: api
tags: [pytest, fastapi, typescript, nextjs, eslint, pnpm]

# Dependency graph
requires:
  - phase: 05-lead-brief-workspace
    provides: current-resource/version-history/restore patterns and optimistic concurrency semantics
provides:
  - Discovery contract tests that freeze public route drift before backend implementation
  - Shared Discovery DTOs, schemas, and route helpers for current resource, version snapshots, restore, and source notes
  - Workspace lint/tooling fixes so Next lint runs non-interactively in this repo
affects: [06-discovery-workspace wave 2, 06-discovery-workspace wave 3, 06-discovery-workspace wave 4]

# Tech tracking
tech-stack:
  added: [eslint, eslint-config-next]
  patterns: [versioned current-resource DTOs, explicit conflict payloads, source-notes snapshots, app-local Next lint configs]

key-files:
  created: [tests/api/test_discovery_routes_api.py, tests/api/test_discovery_api.py, apps/web/.eslintrc.json, apps/admin/.eslintrc.json]
  modified: [packages/shared-types/index.ts, packages/shared-schemas/index.ts, packages/shared-config/index.ts, package.json, pnpm-lock.yaml, .planning/STATE.md]

key-decisions:
  - "Discovery current-resource and version snapshots carry source_notes alongside the field map so evidence can be restored with the working copy."
  - "Next lint needed app-local ESLint configs plus workspace ESLint packages to run non-interactively in this repo."

patterns-established:
  - "Pattern 1: Discovery follows the same current-resource + immutable-version history vocabulary as Lead Brief."
  - "Pattern 2: Route helpers and API path definitions live in shared-config and are frozen by contract tests."
  - "Pattern 3: Weak evidence is represented as an explicit gate payload rather than a silent failure."

requirements-completed: []

# Metrics
duration: 13 min
completed: 2026-04-11
---

# Phase 06: Discovery Workspace Summary

**Discovery contract freeze with versioned current-resource DTOs, source-note snapshots, and shared route helpers**

## Performance

- **Duration:** 13 min
- **Started:** 2026-04-11T14:01:41Z
- **Completed:** 2026-04-11T14:14:01Z
- **Tasks:** 2
- **Files modified:** 10

## Accomplishments
- Added red Discovery contract tests that freeze the public route surface, current-resource responses, version history, restore, conflict, and weak-evidence expectations.
- Extended shared Discovery types, schemas, and route helpers so the contract now describes current resources, immutable versions, and source-note snapshots.
- Unblocked repo linting by adding app-local ESLint configs plus the missing workspace ESLint packages.

## Task Commits

Each task was committed atomically:

1. **Task 1: Write failing Discovery route and API contract tests first** - `c932115` (test)
2. **Task 2: Extend shared Discovery contracts and route helpers** - `a501635` (feat)

## Files Created/Modified
- `tests/api/test_discovery_routes_api.py` - Discovery route helper contract coverage.
- `tests/api/test_discovery_api.py` - Discovery current-resource, version, restore, conflict, and weak-evidence API coverage.
- `packages/shared-types/index.ts` - Discovery DTOs for current resource, versions, source notes, conflict, and generate responses.
- `packages/shared-schemas/index.ts` - Discovery JSON schemas matching the shared DTO surface.
- `packages/shared-config/index.ts` - Discovery route builders and API path definitions.
- `apps/web/.eslintrc.json` - App-local Next ESLint config.
- `apps/admin/.eslintrc.json` - App-local Next ESLint config.
- `package.json` - Added packageManager plus workspace lint dependencies.
- `pnpm-lock.yaml` - Locked the lint dependencies.
- `.planning/STATE.md` - Execution state updated for Phase 06.

## Decisions Made
- Discovery source notes are part of the current resource and version snapshots, not a separate unversioned side channel.
- The weak-evidence path should return an explicit gate payload with "Needs more evidence" wording rather than a silent block.
- Lint/tooling should be fixed at the workspace level so future phase work can verify cleanly without interactive prompts.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Restored workspace resolution for turbo**
- **Found during:** Task 2 (contract expansion)
- **Issue:** `pnpm lint` could not resolve the workspace because the root `package.json` lacked a `packageManager` field.
- **Fix:** Added `packageManager: "pnpm@10.33.0"` and refreshed the lockfile via `pnpm install`.
- **Files modified:** `package.json`, `pnpm-lock.yaml`
- **Verification:** `pnpm lint` advanced past turbo workspace resolution.
- **Committed in:** `a501635` (part of Task 2 commit)

**2. [Rule 3 - Blocking] Made Next lint non-interactive and resolvable**
- **Found during:** Task 2 (contract expansion)
- **Issue:** `next lint` prompted for ESLint setup and then failed because `eslint` and the Next preset were missing.
- **Fix:** Added app-local `.eslintrc.json` files plus `eslint` and `eslint-config-next` workspace dependencies.
- **Files modified:** `apps/web/.eslintrc.json`, `apps/admin/.eslintrc.json`, `package.json`, `pnpm-lock.yaml`
- **Verification:** `NEXT_PUBLIC_API_BASE_URL=http://localhost:3000 API_BASE_URL=http://localhost:3000 pnpm lint` exits successfully.
- **Committed in:** `a501635` (part of Task 2 commit)

---

**Total deviations:** 2 auto-fixed (2 blocking)
**Impact on plan:** Tooling-only adjustments; no scope change to Discovery behavior.

## Issues Encountered
- The Discovery API remains red by design because the backend route/service layer is still missing. That is the expected handoff to wave 2.
- Next.js still emits a workspace-root warning because a parent `package-lock.json` exists outside this repo checkout; it did not block verification.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Wave 1 has frozen the Discovery contract surface and shared DTOs.
- Wave 2 can implement the backend against `tests/api/test_discovery_api.py`.
- Current blocker for product behavior: Discovery routes and services are still unimplemented, so the four API tests remain red.

## Self-Check: PASSED

---
*Phase: 06-discovery-workspace*
*Completed: 2026-04-11*
