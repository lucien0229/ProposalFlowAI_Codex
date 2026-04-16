---
phase: 07-proposal-draft-templates-rules
plan: 09
subsystem: testing
tags: [playwright, proposal-draft, synchronization, gap-closure, verification]
requires:
  - phase: 07-05
    provides: proposal draft desktop workspace actions and selectors
  - phase: 07-06
    provides: templates and rules return-path browser coverage
  - phase: 07-08
    provides: backend-backed proposal draft gap-state browser proof
provides:
  - deterministic proposal draft ready-state browser synchronization
  - green phase 7 validation command under default Playwright workers
  - resolved phase 7 UAT/debug artifacts for the parallel-worker race
affects: [proposal-draft-workspace, playwright-coverage, phase-07-verification]
tech-stack:
  added: []
  patterns:
    - ready-state barriers prefer ready-only selectors over shell visibility
    - proposal draft setup helpers return only after workspaceState ready
key-files:
  created:
    - .planning/phases/07-proposal-draft-templates-rules/07-09-SUMMARY.md
  modified:
    - tests/e2e/helpers/discovery.ts
    - tests/e2e/proposal-draft-workspace.spec.ts
    - .planning/phases/07-proposal-draft-templates-rules/07-UAT.md
    - .planning/debug/phase-07-uat-gap-parallel-pw.md
    - .planning/phases/07-proposal-draft-templates-rules/07-VERIFICATION.md
key-decisions:
  - "Proposal Draft E2E waits for loading-state disappearance plus ready-only controls instead of header-level shell chrome."
  - "The documented Phase 7 validation command remains unchanged; the fix had to close the race under default Playwright workers rather than serializing the suite."
  - "Phase 7 verify-work artifacts were resolved in place so future audits do not keep surfacing a closed race as active debt."
patterns-established:
  - "Pattern 1: If a workflow helper already lands on a ready page, tests should not re-navigate before interacting with ready-only controls."
  - "Pattern 2: Browser proofs for async workspaces should use a shared ready helper that asserts both loading exit and ready-only UI affordances."
requirements-completed: [RULE-01, PROP-01, PROP-02]
duration: 24min
completed: 2026-04-14
---

# Phase 07 Plan 09: Proposal Draft Validation Determinism Summary

**Closed the Phase 7 Playwright timing race by synchronizing Proposal Draft tests with the real ready workspace and restored the documented validation command to green**

## Performance

- **Duration:** 24 min
- **Started:** 2026-04-14T04:21:11Z
- **Completed:** 2026-04-14T04:44:42Z
- **Tasks:** 1
- **Files modified:** 6

## Accomplishments

- Replaced shell-level Proposal Draft browser waits with a ready-state barrier that only passes once the loading state is gone and ready-only controls are visible.
- Removed the redundant post-helper Proposal Draft reloads from the Phase 7 browser coverage so the override drawer flow no longer races the page state.
- Re-ran the exact `07-VALIDATION.md` command successfully under the default two-worker Playwright configuration and resolved the linked UAT/debug artifacts.

## Task Commits

Each task was committed atomically:

1. **Task 1: Remove the Proposal Draft ready-state race without lowering validation strictness**
   - `f620269` (`fix`) restored deterministic Proposal Draft browser synchronization and returned the full Phase 7 validation command to green

## Files Created/Modified

- `.planning/phases/07-proposal-draft-templates-rules/07-09-SUMMARY.md` - documents the gap closure, verification evidence, and follow-on readiness
- `tests/e2e/helpers/discovery.ts` - adds a shared Proposal Draft ready helper and makes the setup helper return only after the ready workspace renders
- `tests/e2e/proposal-draft-workspace.spec.ts` - removes redundant reloads and gates ready-only interactions behind the stronger ready helper
- `.planning/phases/07-proposal-draft-templates-rules/07-UAT.md` - records the formerly failing validation command as resolved
- `.planning/debug/phase-07-uat-gap-parallel-pw.md` - closes the diagnosis session with the implemented fix and fresh verification evidence
- `.planning/phases/07-proposal-draft-templates-rules/07-VERIFICATION.md` - updates Phase 7 verification evidence to include the restored default-worker full validation run

## Decisions Made

- Proposal Draft ready proof now depends on selectors that cannot exist during loading, so the browser suite distinguishes shell chrome from the ready workspace.
- The validation bar stayed fixed at the documented command; no `--workers=1`, serial mode, or Playwright config weakening was introduced.
- The verify-work artifacts were resolved as part of the same plan because the gap originated in Phase 7 validation rather than a future decimal polish phase.

## Deviations from Plan

None - the implementation matched the diagnosed fix path and verification target exactly.

## Issues Encountered

- The first executor stalled after leaving the correct code changes uncommitted in the shared worktree. I spot-checked the diff against the diagnosis, resumed execution manually, and verified the full command fresh before committing.

## User Setup Required

None - the repaired validation path runs against the existing local API/Web test environment.

## Next Phase Readiness

- Phase 7 no longer has an open validation race; the exact documented command is authoritative again.
- The phase is ready for final state/roadmap completion with no remaining gap plans.

## Self-Check: PASSED

- Verified `.planning/phases/07-proposal-draft-templates-rules/07-09-SUMMARY.md` exists on disk.
- Verified task commit `f620269` exists in git history.
- Verified `PYTHONPATH=apps/api pytest tests/api/test_templates_rules_api.py tests/api/test_proposal_draft_api.py -q && pnpm exec tsc --noEmit tests/shared/phase7-contracts.assert.ts && pnpm exec playwright test tests/e2e/proposal-draft-workspace.spec.ts tests/e2e/templates-rules.spec.ts && pnpm lint` exits `0`.

---
*Phase: 07-proposal-draft-templates-rules*
*Completed: 2026-04-14*
