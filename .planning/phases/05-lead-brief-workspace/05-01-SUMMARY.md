---
phase: 05-lead-brief-workspace
plan: 01
subsystem: api
tags: [fastapi, pytest, typescript, route-contract, shared-schemas]
requires:
  - phase: 04
    provides: intake shell, lead-brief handoff, and the existing opportunity serialization seam
provides:
  - canonical lead-brief route slug mapping across API and shared config
  - Lead Brief field/version DTOs and schemas for the shared contract layer
  - red-to-green pytest coverage for route drift and shared contract surface
affects: [05-02, 05-03, 05-04, phase-06]
tech-stack:
  added: []
  patterns: [centralized route-segment mapping, field-oriented Lead Brief DTOs, current resource plus immutable version snapshot contract, TDD-first API contract testing]
key-files:
  created:
    - tests/api/test_lead_brief_routing_api.py
    - tests/api/test_lead_brief_api.py
  modified:
    - packages/shared-config/index.ts
    - packages/shared-types/index.ts
    - packages/shared-schemas/index.ts
    - apps/api/app/opportunity_service.py
requirements-completed: [STATE-01, BRIEF-01, BRIEF-02, UI-01]
duration: 24min
completed: 2026-04-10
---

# Phase 05.01 Summary

**Lead Brief route canonicalization and shared versioned-resource contract locked down before backend persistence work**

## Performance

- **Duration:** 24 min
- **Started:** 2026-04-10T13:42:00Z
- **Completed:** 2026-04-10T14:06:56Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments

- Centralized public step-segment mapping so Lead Brief now serializes and redirects through `/opportunities/:id/lead-brief` instead of leaking snake_case into public URLs.
- Added field-oriented Lead Brief DTOs and JSON schemas for current resource, immutable version snapshots, save current, save version, restore, and conflict handling.
- Locked the wave with red-to-green pytest coverage for route drift and shared contract shape.

## Task Commits

Each task was committed atomically:

1. **Task 1: Normalize the public Lead Brief route contract and make route drift fail in tests** - `ef00d24` (`feat(05-01): canonicalize lead brief route slug`)
2. **Task 2: Write failing current-resource and version-history API contract tests** - `9a38ad1` (`feat(05-01): add lead brief shared contract surface`)

## Files Created/Modified

- `tests/api/test_lead_brief_routing_api.py` - route drift coverage for serialized Lead Brief URLs and generate redirect handoff
- `tests/api/test_lead_brief_api.py` - shared-contract assertions for the Lead Brief DTO/schemas surface
- `packages/shared-config/index.ts` - canonical step-segment mapping and shared route helper
- `packages/shared-types/index.ts` - Lead Brief field, resource, version, save, restore, and conflict types
- `packages/shared-schemas/index.ts` - matching Lead Brief JSON schemas for the shared contract layer
- `apps/api/app/opportunity_service.py` - public step URL normalization and canonical generate redirect
- `.planning/phases/05-lead-brief-workspace/05-01-SUMMARY.md` - wave summary and verification record

## Decisions Made

- Keep internal opportunity steps snake_case, but map public URL segments through one canonical helper so Lead Brief cannot drift back to `/lead_brief`.
- Model the Lead Brief contract as a field-oriented current resource plus immutable version snapshots, with `expected_revision_no` on writes and restore operations.
- Keep wave 1 focused on contract shape and route canonicalization; backend persistence and mutation implementation stay queued for the next wave.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- `pnpm exec tsc --noEmit -p apps/web/tsconfig.json` was not available in this checkout because the local TypeScript binary is not installed.
- An unrelated existing baseline check, `tests/api/test_phase4_wave0_baseline.py::test_phase4_wave0_dependency_baseline_declares_frontend_and_worker_stack`, raised a `KeyError` for `worker_project["project"]["dependencies"]` when run alongside this wave's tests. I did not change that file in this wave.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Route drift is locked, the shared Lead Brief contract surface is explicit, and wave 2 can implement backend persistence/mutations against these frozen shapes without reopening slug or DTO decisions.

---
*Phase: 05-Lead Brief Workspace*
*Completed: 2026-04-10*
