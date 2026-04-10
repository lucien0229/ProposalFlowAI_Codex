---
phase: 04-opportunity-intake-file-processing
plan: 02
subsystem: testing
tags: [pytest, playwright, api, ui, opportunity-intake, red-state]
requires:
  - phase: 04-opportunity-intake-file-processing
    provides: "Wave 1 test harness fixtures, queue/object-store fakes, and shared route constants"
provides:
  - "Failing API specs for overview detail/update, D-30 inputs, file lifecycle, and lead-brief gate routes"
  - "Failing Playwright specs for overview shell continuity, shared route states, intake editing, retry, and lead-brief handoff"
  - "Verified RED evidence showing the current app still exposes Phase 3 placeholder behavior instead of Phase 4 intake workflow semantics"
affects: [04-03-PLAN, 04-04-PLAN, 04-05-PLAN, 04-06-PLAN, opportunity-overview, lead-brief]
tech-stack:
  added: []
  patterns:
    - "API RED tests seed opportunities directly in the sqlite test database before hitting Phase 4 routes"
    - "Playwright overview tests centralize selector seams and state-route expectations in a dedicated helper"
key-files:
  created:
    - tests/api/test_opportunity_intake_api.py
    - tests/api/test_opportunity_inputs_api.py
    - tests/api/test_opportunity_file_processing_api.py
    - tests/api/test_lead_brief_gate_api.py
    - tests/e2e/opportunity-overview-shell.spec.ts
    - tests/e2e/opportunity-intake.spec.ts
    - tests/e2e/helpers/opportunity-overview.ts
  modified: []
key-decisions:
  - "Seed opportunities directly inside the API RED tests so failures target missing Phase 4 routes and response shapes rather than unrelated create-opportunity gaps in the current worktree."
  - "Encode overview route-state expectations in Playwright through a dedicated helper and explicit selector seams before UI implementation starts."
patterns-established:
  - "RED API specs assert nested overview/intake payloads, D-30 route paths, and contract-specific error payloads."
  - "RED browser specs assert the locked copy and route-state labels from 04-UI-SPEC before any overview workspace implementation exists."
requirements-completed: [OPP-02, UI-02, INTAKE-01, INTAKE-02, INTAKE-03]
duration: 26min
completed: 2026-04-10
---

# Phase 4 Plan 2: RED Intake Contract Summary

**Fail-first Phase 4 API and Playwright specs for overview intake contract, file lifecycle, shared route states, and lead-brief handoff**

## Performance

- **Duration:** 26 min
- **Started:** 2026-04-10T01:57:30Z
- **Completed:** 2026-04-10T02:23:47Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments

- Added failing API contract coverage for overview detail/update, D-30 input CRUD-lite, file upload lifecycle, retry, and lead-brief gate behavior.
- Added failing Playwright coverage for the locked Phase 4 shell, `loading`/`empty`/`error`/`blocked`/`retry`/`success` route states, no-source handling, and not-found handling.
- Verified a real RED state: pytest fails on missing `/api/v1/opportunities/*` Phase 4 routes, and Playwright fails because the app still renders the Phase 3 placeholder overview (`Opportunity detail`) with no intake workspace or shared state surfaces.

## Task Commits

Each task was committed atomically:

1. **Task 1: Author failing API specs for overview, inputs CRUD-lite, files, and generate gate** - `d77d506` (test)
2. **Task 2: Author failing browser specs for shell continuity, editing, file states, and handoff** - `db1281c` (test)

## Files Created/Modified

- `tests/api/test_opportunity_intake_api.py` - RED coverage for nested overview payloads, patch semantics, and opportunity not-found contract.
- `tests/api/test_opportunity_inputs_api.py` - RED coverage for exact D-30 input list/create/update endpoints.
- `tests/api/test_opportunity_file_processing_api.py` - RED coverage for upload-url, complete, poll/detail, failure, and retry contracts.
- `tests/api/test_lead_brief_gate_api.py` - RED coverage for blocked gate reasons and successful lead-brief redirect/handoff.
- `tests/e2e/opportunity-overview-shell.spec.ts` - RED coverage for the shell eyebrow, stepper, route-state surfaces, no-source state, and not-found flow.
- `tests/e2e/opportunity-intake.spec.ts` - RED coverage for raw input editing, save trust, file states, retry extraction, blocked-to-ready flow, and lead-brief handoff.
- `tests/e2e/helpers/opportunity-overview.ts` - Shared selectors and route helpers for overview-shell and intake browser specs.

## Decisions Made

- Seeded opportunities directly inside API tests to keep failures focused on missing Phase 4 behavior instead of unrelated create-opportunity route gaps in the current router.
- Used a dedicated Playwright helper with explicit route-state expectations so later implementation waves can wire UI behavior to a stable spec surface.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Seeded API opportunities directly in the RED tests**
- **Found during:** Task 1 (Author failing API specs for overview, inputs CRUD-lite, files, and generate gate)
- **Issue:** The current worktree router does not expose the base create-opportunity product route, which would make the new specs fail before reaching the Phase 4 endpoints they are meant to describe.
- **Fix:** Inserted opportunity records directly through the sqlite-backed test database before exercising the overview, inputs, files, and lead-brief Phase 4 routes.
- **Files modified:** tests/api/test_opportunity_intake_api.py, tests/api/test_opportunity_inputs_api.py, tests/api/test_opportunity_file_processing_api.py, tests/api/test_lead_brief_gate_api.py
- **Verification:** `PYTHONPATH=apps/api pytest tests/api/test_opportunity_intake_api.py -q`, `PYTHONPATH=apps/api pytest tests/api/test_opportunity_inputs_api.py -q`, `PYTHONPATH=apps/api pytest tests/api/test_opportunity_file_processing_api.py -q`, and `PYTHONPATH=apps/api pytest tests/api/test_lead_brief_gate_api.py -q` all failed on Phase 4 route/contract expectations rather than on create-opportunity setup.
- **Committed in:** `d77d506`

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** The deviation narrowed the RED suite to the intended Phase 4 contract gaps without expanding scope or touching production code.

## Issues Encountered

- Sandboxed Playwright browser launch failed with a macOS Mach port permission error, so the browser RED verification had to be rerun unsandboxed.
- Playwright emitted secondary artifact-copy `ENOENT` noise after assertion failures, but the primary failing conditions were still the intended missing Phase 4 UI assertions.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Plan 04-03 can implement the overview detail/update and input contracts directly against the failing pytest suite.
- Plans 04-05 and 04-06 can wire the real overview workspace and lead-brief handoff into the failing Playwright helper/spec seams.
- The current app still exposes the old Phase 3 placeholder overview shell, so downstream implementation must replace that surface rather than trying to patch it incrementally.

## Self-Check

PASSED

- Found summary file: `.planning/phases/04-opportunity-intake-file-processing/04-02-SUMMARY.md`
- Found task commits: `d77d506`, `db1281c`
- Stub scan across created test files returned no matches for placeholder/TODO markers

---
*Phase: 04-opportunity-intake-file-processing*
*Completed: 2026-04-10*
