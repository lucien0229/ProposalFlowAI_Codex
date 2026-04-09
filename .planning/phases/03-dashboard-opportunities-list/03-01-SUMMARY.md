---
phase: 03-dashboard-opportunities-list
plan: 01
subsystem: contracts
tags: [typescript, fastapi, pytest, playwright, shared-config, shared-types]
requires:
  - phase: 02-auth-workspace-setup
    provides: guarded customer shell, auth bootstrap expectations, workspace setup entry
provides:
  - Frozen opportunity and dashboard shared contracts
  - Phase 3 API test scaffolding and browser helper scaffolding
  - Workspace shared type exports needed by existing config imports
affects: [03-02-PLAN.md, 03-03-PLAN.md, 03-04-PLAN.md, 03-05-PLAN.md, 03-06-PLAN.md]
tech-stack:
  added: []
  patterns:
    - contract-first shared package expansion before backend and UI work
    - pytest API fixtures for session/csrf/workspace bootstrap
key-files:
  created:
    - tests/api/test_dashboard_opportunities_api.py
    - tests/e2e/helpers/opportunities.ts
    - .planning/phases/03-dashboard-opportunities-list/03-01-SUMMARY.md
  modified:
    - packages/shared-types/index.ts
    - packages/shared-schemas/index.ts
    - packages/shared-config/index.ts
    - tests/conftest.py
key-decisions:
  - "Froze the Phase 3 list/dashboard vocabulary in shared packages before backend/UI implementation."
  - "Added missing workspace shared-type exports as a blocking repair because shared-config already depended on them."
patterns-established:
  - "Phase 3 APIs and browser specs should share session/csrf/workspace fixtures from tests/conftest.py."
  - "Opportunity list query semantics are centralized in shared-config/shared-schemas, not page-local constants."
requirements-completed: [DASH-01, OPP-01, UI-02]
duration: 8min
completed: 2026-04-09
---

# Phase 3 Plan 01 Summary

**Shared opportunity/dashboard contracts and Phase 3 API/browser test entrypoints now exist, giving later backend and UI waves a frozen vocabulary instead of ad hoc page-local guesses.**

## Performance

- **Duration:** 8 min
- **Started:** 2026-04-09T08:55:14Z
- **Completed:** 2026-04-09T09:03:12Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments

- Added shared opportunity status, step, summary, billing, and create/archive DTOs in `packages/shared-types`.
- Added explicit list-query and dashboard-summary schemas plus route/query constants and frozen sort presets.
- Created reusable pytest fixtures and canonical API/browser helper scaffolding for Phase 3 TDD.

## Task Commits

None in this session. Work is present in the current working tree and intentionally isolated from unrelated pre-existing planning/doc edits.

## Files Created/Modified

- `packages/shared-types/index.ts` - Phase 3 opportunity/dashboard/shared workspace contract exports.
- `packages/shared-schemas/index.ts` - Query and response schemas for opportunities and dashboard summary.
- `packages/shared-config/index.ts` - API route paths, list query names, default limit, and sort presets.
- `tests/conftest.py` - API bootstrap fixtures, authenticated browser session fixture, and payload builders.
- `tests/api/test_dashboard_opportunities_api.py` - Failing contract tests for create/list/detail/archive/dashboard summary.
- `tests/e2e/helpers/opportunities.ts` - Deterministic browser helpers for create and toolbar interactions.

## Decisions Made

- Kept the contract surface explicit and Phase-3-specific instead of introducing generic list abstractions.
- Chose three frozen sort presets only: `Recently updated`, `Oldest updated`, and `Recently created`.
- Kept the browser helper layer lightweight so later specs can stay intent-focused.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Restored missing workspace shared-type exports**
- **Found during:** Task 1 (shared contracts)
- **Issue:** `packages/shared-config/index.ts` already imported workspace industry/template/tone types and constants that did not exist in `packages/shared-types/index.ts`.
- **Fix:** Added the missing workspace type/constant exports alongside the new Phase 3 opportunity contracts.
- **Files modified:** `packages/shared-types/index.ts`
- **Verification:** Python/grep checks passed and shared-config imports now resolve structurally.
- **Committed in:** not committed yet

**2. [Rule 3 - Blocking] Added API app bootstrap pathing for pytest fixtures**
- **Found during:** Task 2 (API/browser test foundation)
- **Issue:** Root-level pytest collection would not be able to import `app.main` from `apps/api` without explicit path setup.
- **Fix:** Inserted `apps/api` into `sys.path` in `tests/conftest.py` before importing `create_app`.
- **Files modified:** `tests/conftest.py`
- **Verification:** `python3 -m py_compile tests/conftest.py tests/api/test_dashboard_opportunities_api.py apps/api/app/main.py apps/api/app/product.py`
- **Committed in:** not committed yet

---

**Total deviations:** 2 auto-fixed (2 blocking)
**Impact on plan:** Both deviations were required to make the shared contracts and test scaffolding usable. No scope creep beyond enabling planned work.

## Issues Encountered

- `pnpm exec tsc --noEmit -p apps/web/tsconfig.json` could not run because the workspace currently has no `node_modules` or `tsc` binary installed. This does not block the plan's required verify commands, but it does block deeper TypeScript/browser verification until dependencies are installed.

## User Setup Required

None - no external service configuration required for this plan alone.

## Next Phase Readiness

- Wave 2 can now implement backend persistence and endpoints against frozen contracts and failing API tests.
- The repo still needs frontend dependencies installed before Playwright and Next-based verification can run in later waves.

---
*Phase: 03-dashboard-opportunities-list*
*Completed: 2026-04-09*
