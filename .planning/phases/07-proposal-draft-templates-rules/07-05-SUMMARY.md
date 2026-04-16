---
phase: 07-proposal-draft-templates-rules
plan: 05
subsystem: ui
tags: [nextjs, react, playwright, proposal-draft, workspace, warnings, export]
requires:
  - phase: 07-03
    provides: Proposal Draft route shell, current draft data flow, and billing restriction model
  - phase: 07-04
    provides: Opportunity-local template override APIs and version data for Proposal Draft
provides:
  - Editing-first Proposal Draft workspace with rules summary, chapter controls, and right-side drawers
  - Chapter-local regenerate protection, page-level warning bands, and per-action restriction messaging
  - Copy-all and export flows wired to live draft content with browser recovery guidance
affects: [07-06, proposal-draft-verification, desktop-ui]
tech-stack:
  added: []
  patterns:
    - Opportunity-local template overrides refreshed inside the draft workspace without leaving the route
    - Restriction metadata drives both page-level status bands and per-control disabled explanations
    - Proposal Draft interactions are hardened through TDD browser coverage before UI implementation
key-files:
  created:
    - apps/web/components/opportunities/proposal-draft-status-band.tsx
  modified:
    - apps/web/components/opportunities/proposal-draft-workspace.tsx
    - apps/web/components/opportunities/proposal-draft-rules-bar.tsx
    - apps/web/components/opportunities/proposal-draft-override-drawer.tsx
    - apps/web/components/opportunities/proposal-draft-chapter-block.tsx
    - apps/web/components/opportunities/proposal-draft-version-drawer.tsx
    - apps/web/lib/proposal-draft-copy.ts
    - apps/web/lib/proposal-draft-api.ts
    - apps/web/app/globals.css
    - tests/e2e/proposal-draft-workspace.spec.ts
key-decisions:
  - "Kept Regenerate all visible but secondary, while chapter regenerate carries the explicit overwrite protection flow."
  - "Used API restriction details to drive billing CTAs, page-level status bands, and action-specific blocked explanations while leaving Copy all available."
patterns-established:
  - "Proposal Draft right-side surfaces stay on-demand: preview and restore happen inside drawers, and restore is never triggered by selection alone."
  - "Warning semantics use a dual layer: a page-level status band for overall risk and inline chapter markers for affected sections."
requirements-completed: [PROP-01, PROP-02]
duration: 28 min
completed: 2026-04-13
---

# Phase 07 Plan 05: Proposal Draft Workspace Summary

**Proposal Draft editing workspace with opportunity-local rules overrides, guarded chapter regenerate, version restore drawer, and export/restriction warning flows**

## Performance

- **Duration:** 28 min
- **Started:** 2026-04-13T14:17:52Z
- **Completed:** 2026-04-13T14:45:32Z
- **Tasks:** 2
- **Files modified:** 10

## Accomplishments

- Built the editing-first Proposal Draft surface around a dominant chapter stage, on-demand right-side drawers, and an always-visible rules summary bar.
- Wired opportunity-local template switching and override editing into the live workspace so effective rules refresh immediately without leaving the draft route.
- Added guarded chapter regenerate, dual-layer warning and restriction states, copy/export flows, and billing recovery messaging with browser-verified behavior.

## Task Commits

Each task was committed atomically:

1. **Task 1: Build the editing-first Proposal Draft workspace with template/override flow, chapter actions, and version drawer** - `5594d09`, `fe503cc`
2. **Task 2: Finish chapter regenerate protection, export flows, and dual-layer warning/restriction states** - `3726184`, `5be3868`
3. **Plan metadata:** Pending final docs commit

_Note: Both tasks followed TDD flow with a failing browser-spec commit followed by the implementation commit._

## Files Created/Modified

- `apps/web/components/opportunities/proposal-draft-workspace.tsx` - Coordinates the rules bar, chapter stage, right-side drawers, action states, warning bands, copy, export, and regenerate flows.
- `apps/web/components/opportunities/proposal-draft-rules-bar.tsx` - Keeps effective rules, template context, and override controls visible at the top of the workspace.
- `apps/web/components/opportunities/proposal-draft-override-drawer.tsx` - Hosts opportunity-local template switching and override editing without leaving Proposal Draft.
- `apps/web/components/opportunities/proposal-draft-chapter-block.tsx` - Renders section editing, local warning markers, and guarded regenerate confirmation.
- `apps/web/components/opportunities/proposal-draft-version-drawer.tsx` - Handles version list, preview, restore confirmation, and blocked-restore messaging.
- `apps/web/components/opportunities/proposal-draft-status-band.tsx` - Centralized page-level status band for warning, retry, success, and blocked states.
- `apps/web/lib/proposal-draft-copy.ts` - Shapes chapter-ordered copy/export payloads and billing CTA labels.
- `apps/web/lib/proposal-draft-api.ts` - Normalizes export errors so UI restriction handling can use structured API details.
- `apps/web/app/globals.css` - Adds the flagship Proposal Draft layout, drawer, warning, and action-state styling.
- `tests/e2e/proposal-draft-workspace.spec.ts` - Covers rules summary, override/template flows, version preview/restore, regenerate protection, warning states, billing restrictions, copy, and export.

## Decisions Made

- Kept whole-draft regenerate visible but non-primary so the workspace still reflects the product contract while steering users toward section-scoped recovery.
- Drove billing CTA labels from restriction reasons (`Upgrade plan` for `trial_expired` and `inactive`, `Manage billing` for `past_due` and `canceled`) to keep recovery paths deterministic.
- Preserved copy availability whenever a current draft exists, even when generate/save/restore/export actions are restricted, because draft recovery still matters in locked billing states.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- The plan referenced `/Users/wxm/.codex/skills/frontend-skill/SKILL.md`, but that skill file was not present in this environment. Execution followed `docs/design/DESIGN.md`, `07-UI-SPEC.md`, and `ui-ux-pro-max` guidance instead.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Proposal Draft now has a credible editing, override, version, warning, and export surface ready for the remaining phase work.
- The browser and API verification paths for chapter regenerate, copy/export, and restriction states are in place for follow-on hardening.
- No blocking issues remain for plan `07-06`.

## Self-Check: PASSED
