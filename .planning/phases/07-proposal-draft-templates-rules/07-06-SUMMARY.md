---
phase: 07-proposal-draft-templates-rules
plan: 06
subsystem: ui
tags: [react, nextjs, playwright, fastapi, proposal-draft, templates-rules]
requires:
  - phase: 07-02
    provides: templates and rules API contracts and workspace rule endpoints
  - phase: 07-04
    provides: product routes and state scaffolding for proposal draft and templates pages
  - phase: 07-05
    provides: proposal draft editing, override, restriction, and export flows
provides:
  - modular workspace-baseline Templates & Rules editing with inline validation and save-state recovery
  - proposal draft and templates round-trip coverage that preserves opportunity override boundaries
  - full Phase 7 verification green across API, contract, browser, and lint checks
affects: [phase-08-follow-up-workspace, billing-restrictions, proposal-draft]
tech-stack:
  added: []
  patterns:
    - client-side rule payload normalization before browser mutations
    - return-path-preserving cross-surface Playwright regression coverage
key-files:
  created:
    - apps/web/components/templates-rules/templates-rules-form.tsx
    - apps/web/components/templates-rules/rule-impact-note.tsx
  modified:
    - apps/web/components/templates-rules/templates-rules-page.tsx
    - apps/web/lib/templates-rules-api.ts
    - apps/web/next.config.mjs
    - apps/web/app/globals.css
    - tests/e2e/templates-rules.spec.ts
    - tests/e2e/proposal-draft-workspace.spec.ts
key-decisions:
  - "Templates & Rules validate/save requests omit workspace-owned fields so browser payloads match the FastAPI rule contract."
  - "Production API base URL enforcement stays strict for real build/start paths, while next lint falls back to localhost only for local verification."
  - "Proposal Draft round-trip coverage keeps workspace baseline refresh and opportunity override persistence visibly separate."
patterns-established:
  - "Baseline editor pattern: modular rule groups plus inline field errors and a save-time summary band."
  - "Cross-surface regression pattern: verify baseline refresh after return while override-active state remains visible until explicitly cleared."
requirements-completed: [RULE-01, PROP-01, PROP-02]
duration: 14 min
completed: 2026-04-13
---

# Phase 7 Plan 6: Proposal Draft + Templates & Rules Summary

**Modular Templates & Rules baseline editing with cross-surface effective-rule refresh and full Phase 7 regression proof**

## Performance

- **Duration:** 14 min
- **Started:** 2026-04-13T15:09:20Z
- **Completed:** 2026-04-13T15:23:47Z
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments

- Productized the Templates & Rules page into four locked editing modules with inline validation, save feedback, and a Proposal Draft impact note.
- Proved Proposal Draft and Templates & Rules stay synchronized without collapsing workspace baseline and opportunity override boundaries.
- Closed the final Phase 7 verification loop so the exact API + `tsc` + Playwright + lint contract is green.

## Task Commits

Each task was committed atomically:

1. **Task 1: Build the Templates & Rules baseline editor with inline validation and preserved return flow** - `24baaf8` (test), `7be5327` (feat)
2. **Task 2: Verify cross-surface rule refresh and run the full Phase 7 regression sweep** - `a41c0e2` (fix)

## Files Created/Modified

- `apps/web/components/templates-rules/templates-rules-page.tsx` - Reworked the Templates & Rules surface around modular editing, local/server validation, and explicit return impact.
- `apps/web/components/templates-rules/templates-rules-form.tsx` - Added the grouped baseline editor UI for template basics, assumptions/exclusions, terminology, and sections/modules.
- `apps/web/components/templates-rules/rule-impact-note.tsx` - Added the sidebar summary showing what the saved baseline will change in Proposal Draft.
- `apps/web/lib/templates-rules-api.ts` - Normalized workspace rule payloads so browser validate/save requests match the backend schema.
- `apps/web/next.config.mjs` - Allowed `next lint` to use a localhost fallback while preserving strict production API base enforcement.
- `apps/web/app/globals.css` - Styled the new modular editor, section-order controls, and impact note layout.
- `tests/e2e/templates-rules.spec.ts` - Expanded browser coverage for grouped modules, inline validation, save success/failure, and return-path continuity.
- `tests/e2e/proposal-draft-workspace.spec.ts` - Added cross-surface round-trip coverage and stronger billing-restricted blocked-action assertions.

## Decisions Made

- Kept workspace-baseline editing and opportunity-local overrides separate, and proved that boundary in browser tests instead of relying on implementation assumptions.
- Fixed the browser/backend contract at the client payload layer rather than loosening backend validation, because `workspace_id` is server-owned state.
- Treated the lint failure as a verification blocker and resolved it in config instead of altering the phase validation contract.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Removed `workspace_id` from browser rule mutation payloads**
- **Found during:** Task 2 (Verify cross-surface rule refresh and run the full Phase 7 regression sweep)
- **Issue:** The browser was posting `workspace_id` back into `/workspaces/current/rules/validate` and `/workspaces/current/rules`, but the FastAPI payload forbids that field, so the Templates & Rules save flow could fail before the real save request.
- **Fix:** Normalized workspace rule payload serialization in the web client so only backend-accepted fields are sent for validate/save calls.
- **Files modified:** `apps/web/lib/templates-rules-api.ts`
- **Verification:** The new Proposal Draft ↔ Templates & Rules round-trip Playwright test passed, and the final full-suite contract exited `0`.
- **Committed in:** `a41c0e2` (part of task commit)

**2. [Rule 3 - Blocking] Allowed `next lint` to load web config without production API env vars**
- **Found during:** Task 2 final verification
- **Issue:** `pnpm lint` failed because `apps/web/next.config.mjs` threw before lint could run when `API_BASE_URL` was not set.
- **Fix:** Added a lint-only localhost fallback while keeping strict API base URL enforcement for real production build/start behavior.
- **Files modified:** `apps/web/next.config.mjs`
- **Verification:** The exact full-suite command from `07-VALIDATION.md` exited `0`.
- **Committed in:** `a41c0e2` (part of task commit)

---

**Total deviations:** 2 auto-fixed (1 bug, 1 blocking)
**Impact on plan:** Both fixes were required to satisfy the frozen browser/API verification contract. No scope creep.

## Issues Encountered

- The phase verification contract depends on live local web and API services because the Playwright command does not boot them automatically. Verification succeeded once both services were already running.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Phase 7 is ready for downstream work with the final proposal drafting baseline/override semantics locked in browser and API coverage.
- Phase 8 can rely on the now-stable Proposal Draft outputs, version flows, and billing-restriction copy behavior.

---
*Phase: 07-proposal-draft-templates-rules*
*Completed: 2026-04-13*

## Self-Check: PASSED

- FOUND: `.planning/phases/07-proposal-draft-templates-rules/07-06-SUMMARY.md`
- FOUND: `24baaf8`
- FOUND: `7be5327`
- FOUND: `a41c0e2`
