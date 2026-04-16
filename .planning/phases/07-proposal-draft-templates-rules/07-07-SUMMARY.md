---
phase: 07-proposal-draft-templates-rules
plan: 07
subsystem: api
tags: [fastapi, sqlalchemy, pytest, proposal-draft, rules-engine, gap-closure]
requires:
  - phase: 07-02
    provides: effective-rules composition and opportunity override persistence seams
  - phase: 07-03
    provides: proposal draft current-resource, version, regenerate, and export APIs
  - phase: 07-06
    provides: browser-facing rules refresh and override UX expectations
provides:
  - truthful empty proposal-draft reads until generation succeeds
  - opt-in opportunity overrides that stay inactive until explicit save
  - live rule composition across proposal draft generate/save/version/regenerate flows
  - backend-backed rules conflict notices for current draft workspace payloads
affects: [proposal-draft-workspace, templates-rules-ui, verifier-gap-closure, api]
tech-stack:
  added: []
  patterns:
    - no read-path seeding for proposal draft current resources
    - opt-in opportunity override activation on explicit PUT only
    - live effective-rule summaries persisted and surfaced across draft mutations
    - backend-owned rules conflict notices derived from current draft vs live rules
key-files:
  created:
    - .planning/phases/07-proposal-draft-templates-rules/07-07-SUMMARY.md
  modified:
    - apps/api/app/proposal_draft_service.py
    - apps/api/app/proposal_draft_routes.py
    - apps/api/app/templates_rules_service.py
    - tests/api/test_proposal_draft_api.py
    - tests/api/test_templates_rules_api.py
key-decisions:
  - "Proposal Draft GET now returns a true empty workspace and never creates current/version rows on read."
  - "Opportunity overrides remain absent until explicit user save, while delete stays idempotent and baseline-restoring."
  - "Rules conflict warnings are computed by comparing live effective assumptions/exclusions against the current draft instead of browser mocks."
patterns-established:
  - "Pattern 1: Read-only API paths must not seed mutable workflow resources."
  - "Pattern 2: Proposal Draft mutations persist live effective-rule summaries alongside current/version payloads."
  - "Pattern 3: Workspace GET recomputes rule conflict notices from backend state so the UI renders real warning bands."
requirements-completed: [RULE-01, PROP-01, PROP-02]
duration: 24min
completed: 2026-04-14
---

# Phase 07 Plan 07: Proposal Draft Backend Truth Gaps Summary

**Empty proposal-draft reads, opt-in overrides, live rule-driven draft payloads, and backend rules-conflict notices across the real API**

## Performance

- **Duration:** 24 min
- **Started:** 2026-04-14T01:13:00Z
- **Completed:** 2026-04-14T01:37:27Z
- **Tasks:** 1
- **Files modified:** 5

## Accomplishments

- Stopped Proposal Draft and opportunity override rows from being created on read-only API paths, restoring the real empty and prerequisite-gated backend states.
- Wired Proposal Draft generation, save current, save version, restore, regenerate, and workspace reads to live effective-rule composition instead of seeded defaults.
- Added backend-owned `RULES_CONFLICT` and chapter-level assumptions/exclusions notices so the browser no longer has to invent those states.

## Task Commits

Each task was committed atomically:

1. **Task 1: Make Proposal Draft backend truthfully gated, live-rule-driven, and warning-capable**
   - `92b4806` (`test`) red API coverage for empty reads, opt-in overrides, live rules, and conflict notices
   - `dbe2a1a` (`fix`) backend changes for no read-path seeding, opt-in overrides, live rule composition, and real warning payloads

_Note: This plan resumed after a stream disconnect with uncommitted red-side tests already in progress; those tests were preserved and committed first._

## Files Created/Modified

- `apps/api/app/proposal_draft_service.py` - removed read-path seeding, composed live rules into draft flows, and derived rules-conflict notices from backend state
- `apps/api/app/proposal_draft_routes.py` - passed override intent through generate and returned `PROPOSAL_DRAFT_NOT_FOUND` for mutation/export paths without a current draft
- `apps/api/app/templates_rules_service.py` - stopped auto-activating overrides on read, created overrides only on explicit save, and kept delete baseline-restoring/idempotent
- `tests/api/test_proposal_draft_api.py` - locked the gap-closure contract for empty reads, prerequisite gating after page visit, live rules, explicit overrides, and conflict warnings
- `tests/api/test_templates_rules_api.py` - locked inactive-by-default override semantics and explicit activation/conflict behavior

## Decisions Made

- Live effective-rule summaries remain the source for assumptions/exclusions previews, while current draft sections are preserved and only annotated when they drift.
- Workspace reads recompute conflict warnings from current backend state instead of mutating draft content on GET.
- Version snapshots keep the live rule summary captured at save time, while current workspace reads always reflect the latest effective-rule state.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- The previous executor stream disconnected after writing the red-side API tests. I resumed from those uncommitted edits, verified they failed, and continued without discarding them.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- The backend now exposes truthful empty/gated Proposal Draft states and real rules-conflict warnings for the browser to consume without mocks.
- Phase `07-08` can focus on the remaining verification/browser gap closure against a backend that matches the roadmap semantics.

## Self-Check: PASSED

- Verified `.planning/phases/07-proposal-draft-templates-rules/07-07-SUMMARY.md` exists on disk.
- Verified task commits `92b4806` and `dbe2a1a` exist in git history.

---
*Phase: 07-proposal-draft-templates-rules*
*Completed: 2026-04-14*
