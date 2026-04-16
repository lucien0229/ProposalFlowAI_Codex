---
phase: 07-proposal-draft-templates-rules
plan: 04
subsystem: ui
tags: [nextjs, react, playwright, proposal-draft, templates-rules, route-states]
requires:
  - phase: 07-01
    provides: Opportunity-shell workflow patterns and browser helpers for Phase 7 step routes
  - phase: 07-02
    provides: Lead Brief workspace patterns, copy, and action-state behavior
  - phase: 07-03
    provides: Discovery workspace patterns and gating behavior for proposal handoff
provides:
  - Real Proposal Draft route branch inside the opportunity shell
  - Real Templates & Rules page inside the customer shell with return-path handling
  - Client API helpers and centralized Proposal Draft copy/result-state helpers
  - Playwright coverage for empty, blocked, loading, billing-restricted, validation, and error route states
affects: [07-05, 07-06, phase-07-ui-polish, proposal-draft, templates-rules]
tech-stack:
  added: []
  patterns: [requestProductJson client helpers, state-first workspace shells, billing CTA mapping]
key-files:
  created:
    - apps/web/components/opportunities/proposal-draft-workspace.tsx
    - apps/web/components/templates-rules/templates-rules-page.tsx
    - apps/web/lib/proposal-draft-api.ts
    - apps/web/lib/proposal-draft-copy.ts
    - apps/web/lib/templates-rules-api.ts
    - tests/e2e/proposal-draft-workspace.spec.ts
    - tests/e2e/templates-rules.spec.ts
  modified:
    - apps/api/app/proposal_draft_service.py
    - apps/web/app/opportunities/[opportunityId]/[step]/page.tsx
    - apps/web/app/templates-rules/page.tsx
    - apps/web/app/globals.css
key-decisions:
  - "Proposal Draft and Templates & Rules use client-side workspace shells with the existing requestProductJson transport pattern instead of server-only placeholder routes."
  - "Error and blocked states keep a single visible status-band action so retry and billing CTAs stay unambiguous."
  - "Proposal Draft generation now requires ready Discovery field states, not just a placeholder Discovery record."
patterns-established:
  - "State-first workspace shells: header, summary/status band, and action surface render before deeper UI polish."
  - "Billing restrictions map to explicit navigation CTAs instead of disabled-only controls."
requirements-completed: [RULE-01, PROP-01, PROP-02]
duration: 28 min
completed: 2026-04-13
---

# Phase 07 Plan 04: Proposal Draft And Rules Route Scaffolding Summary

**Proposal Draft and Templates & Rules now ship as real shell-integrated routes with verified state surfaces, client API helpers, and billing-aware actions**

## Performance

- **Duration:** 28 min
- **Started:** 2026-04-13T21:36:28+08:00
- **Completed:** 2026-04-13T22:04:35+08:00
- **Tasks:** 2
- **Files modified:** 12

## Accomplishments

- Added failing Playwright coverage first for the Phase 7 route-state contract across Proposal Draft and Templates & Rules.
- Replaced placeholder web routes with real state-first workspace shells, client API helpers, and centralized copy/result-state helpers.
- Verified empty, blocked, loading, billing-restricted, validation, and error flows in-browser and aligned Proposal Draft backend gating with Discovery readiness.

## Task Commits

Each task was committed atomically:

1. **Task 1: Write failing browser specs for Phase 7 route states and shell hierarchy** - `1e33fd5` (test)
2. **Task 2: Implement route branches, client API helpers, and state-first workspace shells** - `0d7823c` (feat)

**Plan metadata:** docs closeout commit captures the summary plus planning-state updates for 07-04.

## Files Created/Modified

- `tests/e2e/proposal-draft-workspace.spec.ts` - Freezes the Proposal Draft state contract for empty, blocked, loading, restricted, and error flows.
- `tests/e2e/templates-rules.spec.ts` - Freezes the Templates & Rules shell placement, validation, error, and return-path contract.
- `apps/web/components/opportunities/proposal-draft-workspace.tsx` - Implements the Proposal Draft client workspace, stepper context, rules summary, and state surfaces.
- `apps/web/components/templates-rules/templates-rules-page.tsx` - Implements the customer-shell Templates & Rules workspace with editable baseline fields and return navigation.
- `apps/web/lib/proposal-draft-api.ts` - Adds Proposal Draft client helpers for current draft, versions, regenerate, and export actions.
- `apps/web/lib/proposal-draft-copy.ts` - Centralizes Proposal Draft page copy, clipboard result states, rules summary rows, and billing CTA mapping.
- `apps/web/lib/templates-rules-api.ts` - Adds client helpers for templates, workspace rules, effective rules, and overrides.
- `apps/web/app/opportunities/[opportunityId]/[step]/page.tsx` - Routes the `proposal_draft` segment to the real workspace inside the opportunity shell.
- `apps/web/app/templates-rules/page.tsx` - Replaces the placeholder page with the real Templates & Rules product-shell route.
- `apps/web/app/globals.css` - Adds the layout and state styling for the new Phase 7 shells.
- `apps/api/app/proposal_draft_service.py` - Tightens the Proposal Draft dependency gate so placeholder Discovery rows do not unlock generation.

## Decisions Made

- Reused the existing `requestProductJson` and client-component workspace pattern so Proposal Draft and Templates & Rules match Lead Brief and Discovery instead of introducing a one-off transport layer.
- Kept retry and billing actions in the status bands to preserve a single, testable call-to-action per route state.
- Matched Proposal Draft's backend Discovery dependency check to the Discovery workspace handoff rule that requires all fields to be `confirmed` or `inferred`.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Blocked Proposal Draft generation when Discovery only had a placeholder current record**
- **Found during:** Task 2 (Implement route branches, client API helpers, and state-first workspace shells)
- **Issue:** Visiting the Discovery route created a placeholder current record, and Proposal Draft incorrectly treated that as completed Discovery, returning `202` instead of the required blocked `409`.
- **Fix:** Added a readiness check in `proposal_draft_service.py` so Proposal Draft generation requires Discovery fields to be in ready states before the route unlocks generation.
- **Files modified:** `apps/api/app/proposal_draft_service.py`
- **Verification:** `pnpm exec playwright test tests/e2e/proposal-draft-workspace.spec.ts tests/e2e/templates-rules.spec.ts -g 'empty|blocked|loading|billing|restricted|error|validation'`
- **Committed in:** `0d7823c` (part of Task 2 commit)

**2. [Rule 1 - Bug] Removed duplicate Retry CTAs from Phase 7 error shells**
- **Found during:** Task 2 (Implement route branches, client API helpers, and state-first workspace shells)
- **Issue:** Proposal Draft and Templates & Rules error states rendered duplicate visible `Retry` buttons, creating ambiguous UI and breaking strict Playwright role assertions.
- **Fix:** Kept the status-band retry action as the single visible CTA and removed duplicate fallback-block retry buttons.
- **Files modified:** `apps/web/components/opportunities/proposal-draft-workspace.tsx`, `apps/web/components/templates-rules/templates-rules-page.tsx`
- **Verification:** `pnpm exec playwright test tests/e2e/proposal-draft-workspace.spec.ts tests/e2e/templates-rules.spec.ts -g 'empty|blocked|loading|billing|restricted|error|validation'`
- **Committed in:** `0d7823c` (part of Task 2 commit)

---

**Total deviations:** 2 auto-fixed (2 bug)
**Impact on plan:** Both fixes were required to make the planned route-state contract correct and browser-verifiable. No scope creep.

## Issues Encountered

- The local shell defaulted to Node `18.9.0`, so verification commands were run with the repo's NVM Node `25.8.1` path to keep `pnpm`, TypeScript, and Playwright working consistently.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Proposal Draft and Templates & Rules route scaffolding is now real, verified, and ready for denser UI polish in later Phase 7 waves.
- Browser tests lock the required state hierarchy and CTA copy, reducing ambiguity for 07-05 and 07-06 refinement work.

---
*Phase: 07-proposal-draft-templates-rules*
*Completed: 2026-04-13*

## Self-Check: PASSED

- Found summary file: `.planning/phases/07-proposal-draft-templates-rules/07-04-SUMMARY.md`
- Found task commit: `1e33fd5`
- Found task commit: `0d7823c`
