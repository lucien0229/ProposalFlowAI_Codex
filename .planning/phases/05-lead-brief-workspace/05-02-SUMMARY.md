---
phase: 05-lead-brief-workspace
plan: 02
subsystem: api
tags:
  - lead-brief
  - fastapi
  - sqlalchemy
  - postgres
  - pytest
  - optimistic-concurrency
requires:
  - phase: 05-01
    provides: canonical lead brief route slug, shared contract surface, and route-seam normalization
provides:
  - dedicated `lead_briefs` current-resource table
  - immutable `lead_brief_versions` snapshot table
  - repository/service layer for current, save current, save version, version list/detail, and restore
  - canonical `/api/v1/opportunities/{opportunity_id}/lead-brief` route family
  - optimistic-concurrency conflict handling with `expected_revision_no`
affects:
  - 05-lead-brief-workspace
  - 06-discovery-workspace
tech-stack:
  added:
    - SQLAlchemy JSON-backed current/version tables
    - FastAPI route module for Lead Brief workspace operations
    - pytest-driven API regression coverage
  patterns:
    - dedicated current resource plus immutable full snapshots
    - conservative stale-write rejection on revision mismatch
    - shared route helper centralization for lead-brief paths
key-files:
  created:
    - apps/api/alembic/versions/0007_phase5_lead_brief_workspace.py
    - apps/api/app/lead_brief_models.py
    - apps/api/app/lead_brief_repository.py
    - apps/api/app/lead_brief_routes.py
    - apps/api/app/lead_brief_service.py
  modified:
    - apps/api/app/__init__.py
    - apps/api/app/main.py
    - apps/api/app/opportunity_service.py
    - packages/shared-config/index.ts
    - tests/api/test_lead_brief_api.py
key-decisions:
  - "The backend now owns a one-row-per-opportunity Lead Brief current record and an append-only version history."
  - "Save current mutates the working copy only; save version snapshots history without rewriting earlier versions."
  - "Restore copies a version back into current state without auto-creating a new history row."
  - "All mutating Lead Brief writes fail conservatively on stale `expected_revision_no` values."
patterns-established:
  - "Pattern 1: keep route strings centralized and expose both runtime builders and API route templates."
  - "Pattern 2: model Lead Brief responses as a current-resource payload plus separate version list/detail surfaces."
  - "Pattern 3: preserve current resource state on conflict instead of auto-merging or silently overwriting."
requirements-completed:
  - STATE-01
  - BRIEF-01
  - BRIEF-02
duration: 46min
completed: 2026-04-10T14:18:07Z
---

# Phase 05-02: Lead Brief Backend Persistence Summary

Lead Brief now has a real backend persistence layer: a dedicated current resource, immutable version snapshots, typed API routes, and conservative revision-based conflict handling.

## Performance

- **Duration:** 46 min
- **Started:** 2026-04-10T13:32:07Z
- **Completed:** 2026-04-10T14:18:07Z
- **Tasks:** 2
- **Files modified:** 11

## Accomplishments
- Added the `lead_briefs` and `lead_brief_versions` tables plus migration `0007_phase5_lead_brief_workspace.py`.
- Implemented repository and service logic for current read/update, save current, save version, version list/detail, and restore.
- Wired the Lead Brief route family into the API app and centralized the public `/lead-brief` route helpers.
- Extended the generate handoff so it seeds the current resource from intake source notes and returns current-resource metadata.
- Locked the behavior with backend tests covering current resource creation, snapshotting, restore, and stale revision rejection.

## Task Commits

1. **Task 1: Add the Lead Brief tables, repository, and service logic for current state plus version snapshots** - `e3205ff` (`feat`)
2. **Task 2: Wire the Lead Brief API routes, generate handoff, and shared contract responses** - `e3205ff` (`feat`)

## Files Created/Modified
- `apps/api/alembic/versions/0007_phase5_lead_brief_workspace.py` - migration for current and version tables
- `apps/api/app/lead_brief_models.py` - SQLAlchemy table definitions for current resource and snapshots
- `apps/api/app/lead_brief_repository.py` - persistence helpers for current row and version history
- `apps/api/app/lead_brief_service.py` - business rules for bootstrap, save, versioning, restore, and conflicts
- `apps/api/app/lead_brief_routes.py` - REST surface for current, save, versions, detail, and restore
- `apps/api/app/opportunity_service.py` - generate handoff now bootstraps current Lead Brief metadata
- `apps/api/app/main.py` - registers the new Lead Brief routes
- `packages/shared-config/index.ts` - centralized Lead Brief route builders and templates
- `tests/api/test_lead_brief_api.py` - TDD coverage for current, versioning, restore, and conflicts

## Decisions Made
- Keep Lead Brief as a dedicated current resource plus immutable snapshots rather than overloading opportunity status.
- Use a revision token (`expected_revision_no`) for all mutating writes that touch the Lead Brief state.
- Treat restore as a copy-back operation only; it must not auto-create a new version row.
- Keep route strings centralized so the web/API contract does not drift.

## Deviations from Plan

None - the wave followed the plan and the product constraints, including the source-note gate for generation.

## Issues Encountered
- The existing opportunity intake regression `tests/api/test_opportunity_intake_api.py::test_opportunity_detail_exposes_latest_uploaded_file_asset` still fails in this checkout because `tests/fixtures/north-star-intake.pdf` is missing. That failure is unrelated to the Lead Brief wave and was not modified.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Backend persistence and route wiring for Lead Brief are ready for the web workspace/UI wave.
- Browser work can now consume stable current-resource and version endpoints.

---
*Phase: 05-lead-brief-workspace*
*Completed: 2026-04-10*
