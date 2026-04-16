---
phase: 07-proposal-draft-templates-rules
plan: 08
subsystem: web
tags: [playwright, nextjs, proposal-draft, verification, gap-closure]
requires:
  - phase: 07-07
    provides: truthful proposal-draft gating, live effective rules, and backend conflict notices
  - phase: 07-05
    provides: proposal draft desktop workspace hierarchy and action surfaces
  - phase: 07-06
    provides: templates and rules refresh flow plus billing/action-state UX
provides:
  - real backend-backed empty proposal draft browser proof
  - real backend-backed lead-brief and discovery blocked states
  - real backend-backed rules-conflict status-band and chapter-marker proof
  - stable version/restore assertions aligned with live version numbering
affects: [proposal-draft-workspace, playwright-coverage, verifier-gap-closure]
tech-stack:
  added: []
  patterns:
    - real browser proof over request fabrication for proposal-draft gap states
    - status-band warning selection prefers rules conflict detail when multiple warnings coexist
    - version drawer assertions follow the persisted version numbering exposed by the backend
key-files:
  created:
    - .planning/phases/07-proposal-draft-templates-rules/07-08-SUMMARY.md
  modified:
    - tests/e2e/proposal-draft-workspace.spec.ts
    - apps/web/lib/proposal-draft-copy.ts
key-decisions:
  - "Proposal Draft empty, missing-input, and rules-conflict coverage now comes from real API state transitions instead of mocked proposal-draft payloads."
  - "The status band prefers the rules-conflict warning/detail pair so the page-level message stays specific when multiple warnings are present."
  - "Version drawer assertions align with the first persisted saved version instead of assuming a second seeded snapshot."
patterns-established:
  - "Pattern 1: Proposal Draft browser gap tests should create backend state through real workflow setup helpers before asserting UI."
  - "Pattern 2: Status-band copy selection should prioritize the most actionable warning when multiple warnings are returned."
requirements-completed: [RULE-01, PROP-01, PROP-02]
duration: 18min
completed: 2026-04-14
---

# Phase 07 Plan 08: Proposal Draft Browser Proof Gaps Summary

**Replaced the remaining mock-only Proposal Draft browser checks with real backend-backed Playwright proof**

## Performance

- **Duration:** 18 min
- **Started:** 2026-04-14T01:44:00Z
- **Completed:** 2026-04-14T02:02:00Z
- **Tasks:** 1
- **Files modified:** 2

## Accomplishments

- Converted the remaining Proposal Draft gap assertions to run against real backend state for empty, Lead Brief missing, Discovery missing, and rules-conflict flows.
- Corrected version drawer browser expectations so preview and restore assertions match the first persisted saved version instead of a previously assumed seeded version.
- Tightened status-band warning selection so rules-conflict copy stays specific when multiple warnings are present in the current draft payload.

## Task Commits

Each task was committed atomically:

1. **Task 1: Replace mocked Proposal Draft gap states with backend-backed Playwright coverage**
   - `59107cd` (`test`) red browser coverage for real Proposal Draft empty, blocked, and rules-conflict paths
   - `7068598` (`fix`) aligned browser expectations and status-band warning selection with the live backend contract

## Files Created/Modified

- `tests/e2e/proposal-draft-workspace.spec.ts` - replaced mock-only gap assertions with real workflow setup, corrected live version numbering expectations, and proved empty/blocked/conflict states against the backend
- `apps/web/lib/proposal-draft-copy.ts` - prioritized rules-conflict warnings and detail text for the page status band when the backend returns multiple warnings

## Decisions Made

- Real setup helpers remain the source of truth for Proposal Draft gap states; request mocking is retained only for non-gap cases like synthetic load and error transport coverage.
- The page-level status band should show the most actionable warning first, so rules-conflict detail wins over generic input copy when both exist.
- Saved version numbering follows persisted backend history, so browser assertions must target the actual saved snapshot rather than a speculative next number.

## Deviations from Plan

None - plan intent stayed intact while the final green pass only required two files.

## Issues Encountered

- The initial executor left a passing code path uncommitted after the red test commit, so I resumed locally, verified the full Wave 8 command fresh, and completed the green-side commit by hand.

## User Setup Required

None - the browser proof runs against the existing local app/test environment.

## Next Phase Readiness

- Phase 7 now has real browser evidence for the verifier gap that previously depended on mocked Proposal Draft payloads.
- The phase is ready for a fresh verifier pass to determine whether all Phase 7 gaps are fully closed.

## Self-Check: PASSED

- Verified `.planning/phases/07-proposal-draft-templates-rules/07-08-SUMMARY.md` exists on disk.
- Verified task commits `59107cd` and `7068598` exist in git history.

---
*Phase: 07-proposal-draft-templates-rules*
*Completed: 2026-04-14*
