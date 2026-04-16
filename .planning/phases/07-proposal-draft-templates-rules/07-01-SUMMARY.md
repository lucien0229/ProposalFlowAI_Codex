---
phase: 07-proposal-draft-templates-rules
plan: 01
subsystem: api
tags: [pytest, fastapi, typescript, json-schema, route-helpers, pnpm]

# Dependency graph
requires:
  - phase: 06-discovery-workspace
    provides: current-resource/version-history/restore semantics and shared contract patterns
provides:
  - Phase 7 API contract tests for templates/rules and proposal-draft endpoints
  - Shared Phase 7 DTOs, schemas, and canonical route builders for proposal-draft and rules flows
  - Typed route/path assertions that freeze proposal-draft and version_no vocabulary before backend work
affects: [07-proposal-draft-templates-rules wave 2, 07-proposal-draft-templates-rules wave 3, 07-proposal-draft-templates-rules wave 4]

# Tech tracking
tech-stack:
  added: []
  patterns: [red-first API contracts, proposal-draft version_no routes, shared-config path builders, strict JSON schema mirrors]

key-files:
  created: [tests/api/test_templates_rules_api.py, tests/api/test_proposal_draft_api.py, tests/shared/phase7-contracts.assert.ts, .planning/phases/07-proposal-draft-templates-rules/07-01-SUMMARY.md]
  modified: [packages/shared-types/index.ts, packages/shared-schemas/index.ts, packages/shared-config/index.ts, .planning/STATE.md, .planning/ROADMAP.md, .planning/REQUIREMENTS.md]

key-decisions:
  - "Phase 7 keeps the public route slug proposal-draft and reuses version_no-based detail/restore semantics from Lead Brief and Discovery."
  - "Templates, workspace rules, and opportunity overrides are frozen as distinct contract layers, with shared-config exporting the canonical API builders."

patterns-established:
  - "Pattern 1: Contract waves leave backend API tests red on missing routes while shared DTO/schema/config layers go green."
  - "Pattern 2: Shared-config exposes both concrete builders and literal route templates so drift is caught at compile time."
  - "Pattern 3: Proposal Draft restore and regenerate semantics keep explicit conflict and overwrite vocabulary in the shared contract."

requirements-completed: [RULE-01, PROP-01, PROP-02]

# Metrics
duration: 1h 25m
completed: 2026-04-13
---

# Phase 07 Plan 01: Proposal Draft Templates Rules Summary

**Phase 7 rules and proposal-draft contract freeze with failing API specs, shared DTO schemas, and canonical route builders**

## Performance

- **Duration:** 1h 25m
- **Started:** 2026-04-13T10:24:19Z
- **Completed:** 2026-04-13T11:49:23Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- Added failing API contract coverage for the Phase 7 templates/rules and proposal-draft endpoints, including generation gates, overwrite guidance, export formats, and effective rule semantics.
- Added a focused shared-contract assertion test that freezes the public `proposal-draft`, `rules`, and `version_no` vocabulary at compile time.
- Extended `shared-types`, `shared-schemas`, and `shared-config` with the missing Phase 7 DTOs, JSON schemas, route templates, and API builders required for later backend and web implementation.

## Task Commits

Each task was committed atomically:

1. **Task 1: Write failing API contract tests for Templates & Rules and Proposal Draft** - `7041fe8` (test)
2. **Task 2: Restore shared schema typing for contract builds** - `adc8341` (fix)
3. **Task 2: Add failing shared contract assertions** - `5edb5fa` (test)
4. **Task 2: Extend shared Phase 7 types, schemas, route helpers, and focused contract assertions** - `22919e1` (feat)

## Files Created/Modified
- `tests/api/test_templates_rules_api.py` - Freezes the rules/template API surface, validation errors, override behavior, and effective-rule semantics.
- `tests/api/test_proposal_draft_api.py` - Freezes proposal-draft current resource, generate gate, save-version, restore, regenerate, and export semantics.
- `tests/shared/phase7-contracts.assert.ts` - Compile-time guard for Phase 7 DTO exports and literal route/path segments.
- `packages/shared-types/index.ts` - Adds Phase 7 rules and proposal-draft DTOs plus canonical section/export/version vocabularies.
- `packages/shared-schemas/index.ts` - Mirrors the Phase 7 DTOs with strict JSON schemas for later backend/web consumption.
- `packages/shared-config/index.ts` - Exports canonical templates/rules/proposal-draft route builders, route templates, and API route definitions.

## Decisions Made
- Proposal Draft routes stay on the exact `proposal-draft` slug and use `versions/{version_no}` for detail and restore, matching the established Lead Brief and Discovery pattern.
- Shared contracts treat templates, workspace rules, and opportunity overrides as separate layers so later implementation can compute `effective_rule_summary` without inventing new path or DTO names.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Restored shared schema typing so the Phase 7 contract build could compile**
- **Found during:** Task 2 (Extend shared Phase 7 types, schemas, route helpers, and focused contract assertions)
- **Issue:** The shared schema file had type assertions that blocked the new contract assertion test from compiling cleanly.
- **Fix:** Adjusted `packages/shared-schemas/index.ts` typing so the shared contract build could proceed, then finished the missing Phase 7 schema/config exports.
- **Files modified:** `packages/shared-schemas/index.ts`
- **Verification:** `pnpm exec tsc --noEmit tests/shared/phase7-contracts.assert.ts`
- **Committed in:** `adc8341` (part of Task 2 work)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** The fix was required to complete the intended shared-contract layer; no scope expansion beyond the plan.

## Issues Encountered
- The Phase 7 API pytest suite remains red by design because the backend endpoints are still unimplemented; verification ended with 9 expected `404` failures across the new contract tests.
- `pnpm lint` requires `NEXT_PUBLIC_API_BASE_URL` and `API_BASE_URL` to be set because `apps/web/next.config.mjs` enforces them for production-mode config loading. Verification used `http://localhost:3001` for both.
- Next.js lint still emits a workspace-root warning because a parent `/Users/wxm/package-lock.json` exists outside this repo checkout; it did not block verification.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Wave 1 is complete: the red API contracts and green shared route/DTO/schema layer now freeze the public Phase 7 surface.
- Backend implementation can start against `tests/api/test_templates_rules_api.py` and `tests/api/test_proposal_draft_api.py` without reopening route naming or version semantics.
- The next executor should implement the actual API routes/services that currently return `404` for the nine Phase 7 contract tests.

## Self-Check: PASSED

---
*Phase: 07-proposal-draft-templates-rules*
*Completed: 2026-04-13*
