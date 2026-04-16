---
phase: 07-proposal-draft-templates-rules
plan: 03
subsystem: api
tags: [fastapi, sqlalchemy, alembic, postgres, proposal-draft]
requires:
  - phase: 07-01
    provides: shared Proposal Draft route builders, schemas, and types
  - phase: 07-02
    provides: template, workspace rules, and effective-rule backend seams
provides:
  - Proposal Draft current-resource persistence and immutable version snapshots
  - Proposal Draft generate, update, save-version, restore, section regenerate, and export API routes
  - Restriction and overwrite metadata the web workspace can render directly
affects: [proposal-draft-workspace, follow-up, api, database]
tech-stack:
  added: []
  patterns:
    - current resource plus immutable version snapshots for proposal drafts
    - structured-first proposal generation from Lead Brief and Discovery fields
    - restriction responses that enumerate blocked draft actions for UI status bands
key-files:
  created:
    - apps/api/alembic/versions/0008_phase7_proposal_draft.py
    - apps/api/app/proposal_draft_models.py
    - apps/api/app/proposal_draft_repository.py
    - apps/api/app/proposal_draft_service.py
    - apps/api/app/proposal_draft_routes.py
  modified:
    - apps/api/app/__init__.py
    - apps/api/app/product.py
    - tests/api/test_proposal_draft_api.py
key-decisions:
  - "Proposal Draft routes are mounted through the real product router so create_app exposes the shipped /api/v1 surface."
  - "Successful proposal generation composes chapter content from current Lead Brief and Discovery fields instead of raw intake text."
  - "Restricted Proposal Draft actions return blocked_actions metadata so the browser can name the affected actions without heuristics."
patterns-established:
  - "Proposal Draft mirrors Lead Brief and Discovery with current working copy plus immutable version snapshots keyed by version_no."
  - "Section regenerate stays local to one chapter and requires explicit overwrite confirmation when the current section was user-edited."
requirements-completed: [PROP-01, PROP-02]
duration: 19min
completed: 2026-04-13
---

# Phase 07 Plan 03: Proposal Draft Backend Summary

**Proposal Draft backend with persistent current drafts, immutable versions, structured generation from Lead Brief and Discovery, local section regenerate, export, and restriction-aware error metadata**

## Performance

- **Duration:** 19 min
- **Started:** 2026-04-13T12:52:16Z
- **Completed:** 2026-04-13T13:11:41Z
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments

- Added Proposal Draft tables, repository helpers, service logic, and product-mounted routes for current draft reads, generation, updates, save-version, version detail, restore, section regenerate, and export.
- Implemented generate gating against current Lead Brief and Discovery, then added a structured-success path that derives chapter content from those upstream resources instead of canned raw-input text.
- Added restriction and overwrite metadata that the web workspace can map directly to page-level blocked-action bands and local section warnings.

## Task Commits

Each task was committed atomically:

1. **Task 1: Proposal Draft current-resource, generate, update, and version-history APIs**
   - `e781b01` (`test`) tighten the Proposal Draft API contract tests and add the initial red coverage
   - `7dee95d` (`feat`) add Proposal Draft persistence, routes, and current/version API behavior
   - `2044980` (`fix`) make successful generation compose draft sections from current Lead Brief and Discovery data
2. **Task 2: Section regenerate, export, and overwrite-aware conflict semantics**
   - `f098f08` (`fix`) add blocked-action metadata for restricted regenerate/export flows and cover the restriction path in API tests

## Files Created/Modified

- `apps/api/alembic/versions/0008_phase7_proposal_draft.py` - creates Proposal Draft current and version snapshot tables
- `apps/api/app/proposal_draft_models.py` - SQLAlchemy table definitions for Proposal Draft resources
- `apps/api/app/proposal_draft_repository.py` - CRUD helpers for current drafts and version snapshots
- `apps/api/app/proposal_draft_service.py` - generation, versioning, restore, regenerate, export, and gating logic
- `apps/api/app/proposal_draft_routes.py` - FastAPI route surface and error payload mapping
- `apps/api/app/product.py` - mounts Proposal Draft routes into the shipped product API
- `apps/api/app/__init__.py` - registers Proposal Draft metadata so test schema creation includes the new tables
- `tests/api/test_proposal_draft_api.py` - end-to-end API regression coverage for Proposal Draft flows

## Decisions Made

- Mounted Proposal Draft under `product.py` so the real `create_app()` surface exposes `/api/v1/opportunities/{opportunity_id}/proposal-draft*` without relying on an isolated router import.
- Kept the seeded current-draft bootstrap for read/edit/export flows required by the existing contract tests, while making successful generate use actual Lead Brief and Discovery structured fields.
- Standardized restricted-action responses around `WORKSPACE_RESTRICTED` plus `blocked_actions` metadata so the browser can render blocked-action status bands deterministically.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Corrected stale Proposal Draft API expectations**
- **Found during:** Task 1
- **Issue:** The existing Proposal Draft API test expected stale payload fields (`summary` instead of `version_note`), the wrong `saved_by_name`, and a `DISCOVERY_REQUIRED` gate without creating a Lead Brief resource first.
- **Fix:** Updated the test contract to match the shared Phase 7 response shape, authenticated user semantics, and real prerequisite ordering.
- **Files modified:** `tests/api/test_proposal_draft_api.py`
- **Verification:** `PYTHONPATH=apps/api pytest tests/api/test_proposal_draft_api.py -q`
- **Committed in:** `e781b01`, `2044980`

**2. [Rule 2 - Missing Critical] Added blocked-action metadata for restricted Proposal Draft actions**
- **Found during:** Task 2
- **Issue:** Restricted regenerate/export responses only named the current action, which left the web workspace without a direct API field for the page-level “affected actions” band required by the UI contract.
- **Fix:** Added `blocked_actions` to the shared restriction payload and covered restricted regenerate/export behavior in API tests.
- **Files modified:** `apps/api/app/proposal_draft_routes.py`, `tests/api/test_proposal_draft_api.py`
- **Verification:** `PYTHONPATH=apps/api pytest tests/api/test_proposal_draft_api.py::test_proposal_draft_restricted_actions_return_blocked_action_metadata -q`
- **Committed in:** `f098f08`

**3. [Rule 2 - Missing Critical] Replaced canned successful generation with structured composition**
- **Found during:** Final verification against the plan objective
- **Issue:** The initial generate-success path still emitted canned chapter text, which did not satisfy the plan’s structured-first requirement to compose Proposal Draft sections from current Lead Brief and Discovery data.
- **Fix:** Added a successful-generate regression test and updated the service to derive executive summary, objectives, recommended approach, timeline, and next steps from current Lead Brief and Discovery fields.
- **Files modified:** `apps/api/app/proposal_draft_service.py`, `tests/api/test_proposal_draft_api.py`
- **Verification:** `PYTHONPATH=apps/api pytest tests/api/test_proposal_draft_api.py -q`
- **Committed in:** `2044980`

**4. [Rule 3 - Blocking] Worked around malformed pytest `-k` filters in the plan**
- **Found during:** Task 1 verification
- **Issue:** The plan’s literal `pytest -k 'generate or current resource or save version or restore'` and Task 2 equivalent are invalid pytest expressions because the space-separated fragments parse as syntax errors.
- **Fix:** Verified the same behavior with explicit nodeids and a final full-file run instead of the malformed `-k` filters.
- **Files modified:** None
- **Verification:** `PYTHONPATH=apps/api pytest tests/api/test_proposal_draft_api.py -q`
- **Committed in:** N/A

---

**Total deviations:** 4 auto-fixed (1 bug, 2 missing critical, 1 blocking)
**Impact on plan:** All deviations were required to make the Proposal Draft backend match the shared contract, expose UI-ready restriction metadata, and satisfy the structured-first generation requirement. No scope creep beyond the documented API/UI contract.

## Issues Encountered

- Running two pytest sessions in parallel against the shared PostgreSQL test database triggered a transient `drop_all/create_all` race. The authoritative verification for this plan was rerun sequentially and passed cleanly.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Proposal Draft backend routes are mounted, persisted, and verified on the real `create_app()` API surface.
- The web workspace can integrate against deterministic current/version APIs, structured generation, local section regenerate, export, and blocked-action metadata without inventing missing backend semantics.

## Self-Check: PASSED

- Summary file exists on disk.
- Proposal Draft migration and backend files referenced in the summary exist on disk.
- All recorded plan commit hashes are present in `git log --oneline --all`.

---
*Phase: 07-proposal-draft-templates-rules*
*Completed: 2026-04-13*
