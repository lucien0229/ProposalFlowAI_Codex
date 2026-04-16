---
phase: 07-proposal-draft-templates-rules
plan: 02
subsystem: api
tags: [fastapi, sqlalchemy, postgres, pytest, optimistic-concurrency, rules-engine]
requires:
  - phase: 07-01
    provides: frozen Phase 7 API contracts for templates, workspace rules, effective rules, and opportunity overrides
provides:
  - persisted template definitions, workspace rule sets, and opportunity rule overrides
  - public `/api/v1/templates`, `/workspaces/current/rules`, `/rules/effective`, and `/rules/override` endpoints
  - backend-owned rule validation, effective-rule composition, and stale-write conflict payloads
affects: [07-03, proposal-draft-workspace, templates-rules-ui, rules-composition]
tech-stack:
  added: [FastAPI route module for templates/rules, SQLAlchemy JSON-backed rule tables, pytest regression coverage for validation and conflict recovery]
  patterns: [separate source-of-truth tables for template/baseline/override layers, service-layer effective rule composition, timestamp-based optimistic concurrency with reload hints]
key-files:
  created:
    - apps/api/alembic/versions/0007_phase7_templates_rules.py
    - apps/api/app/templates_rules_models.py
    - apps/api/app/templates_rules_repository.py
    - apps/api/app/templates_rules_service.py
    - apps/api/app/templates_rules_routes.py
  modified:
    - apps/api/app/__init__.py
    - apps/api/app/product.py
    - tests/api/test_templates_rules_api.py
key-decisions:
  - "Template definitions, workspace baselines, and opportunity overrides persist separately; effective rules are composed in the service layer instead of stored."
  - "Workspace and override writes use timestamp-based optimistic concurrency and always return reload guidance on conflict."
  - "Clearing an opportunity override deactivates the local layer without mutating the workspace baseline rows."
patterns-established:
  - "Pattern 1: Seed frozen docs-backed defaults lazily at the API layer so reset test databases still expose the product contract."
  - "Pattern 2: Validation failures return field-specific reason metadata plus UI-ready warning text."
  - "Pattern 3: Effective rule responses preserve source-of-truth provenance across template, workspace, and opportunity layers."
requirements-completed: [RULE-01]
duration: 40min
completed: 2026-04-13
---

# Phase 07 Plan 02: Proposal Draft Templates Rules Summary

**Templates & Rules backend persistence with server-side effective-rule composition, validation errors, and recoverable conflict semantics**

## Performance

- **Duration:** 40 min
- **Started:** 2026-04-13T11:59:21Z
- **Completed:** 2026-04-13T12:38:59Z
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments

- Added real persistence models and a migration for template definitions, workspace rule sets, and opportunity rule overrides.
- Exposed the product-facing Templates & Rules API surface under the existing `/api/v1` app, including templates, workspace baseline rules, effective rules, and override mutation flows.
- Implemented backend validation, effective-rule composition, and explicit stale-write conflict responses so the web workspace can recover without silent merges.

## Task Commits

Each task was committed atomically:

1. **Task 1: Implement template list and workspace baseline rules persistence with validation-first API behavior**
   - `e03a0f4` (`test`) red coverage for missing `section_order` and stale workspace writes
   - `f867e9c` (`feat`) template definitions, workspace rule persistence, validation, and read/effective endpoints
2. **Task 2: Implement effective rules and opportunity override APIs with explicit source-of-truth semantics**
   - `244ef51` (`test`) red coverage for stale override writes and baseline-protection assertions
   - `4d6eb05` (`feat`) override update/delete routes, effective-rule refresh, and recoverable conflict metadata

## Files Created/Modified

- `apps/api/alembic/versions/0007_phase7_templates_rules.py` - migration for the templates/rules tables
- `apps/api/app/templates_rules_models.py` - SQLAlchemy tables for template definitions, workspace rule sets, and opportunity overrides
- `apps/api/app/templates_rules_repository.py` - persistence helpers for templates, baselines, and overrides
- `apps/api/app/templates_rules_service.py` - validation, composition, seeding, and conflict-handling logic
- `apps/api/app/templates_rules_routes.py` - public FastAPI endpoints for templates, workspace rules, effective rules, and overrides
- `apps/api/app/product.py` - product router mounting for the new Templates & Rules API
- `apps/api/app/__init__.py` - metadata registration for the new tables
- `tests/api/test_templates_rules_api.py` - full regression coverage for baseline, validation, effective, override, and conflict behavior

## Decisions Made

- Persist `template_scope` on workspace rule sets for product alignment, but keep it out of current JSON responses so the existing frozen API contract remains unchanged.
- Keep the MVP rule layers explicit: workspace baseline rows are the only workspace source of truth, and opportunity overrides never back-write into those rows.
- Return deterministic, UI-ready validation/conflict payloads instead of generic `422`/`409` bodies so the web page can render inline guidance and reload prompts directly.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Added missing regression coverage for required stale-write and invalid-rule recovery paths**
- **Found during:** Task 1 and Task 2
- **Issue:** The inherited Phase 07-01 contract file covered the happy path but did not assert empty `section_order`, stale workspace writes, or stale override writes even though the plan required those failure modes.
- **Fix:** Extended `tests/api/test_templates_rules_api.py` and implemented the matching validation/conflict behavior in the templates/rules service and route layer.
- **Files modified:** `tests/api/test_templates_rules_api.py`, `apps/api/app/templates_rules_service.py`, `apps/api/app/templates_rules_routes.py`
- **Verification:** `PYTHONPATH=apps/api pytest tests/api/test_templates_rules_api.py -q`
- **Committed in:** `e03a0f4`, `f867e9c`, `244ef51`, `4d6eb05`

---

**Total deviations:** 1 auto-fixed (1 missing critical)
**Impact on plan:** Required to satisfy the frozen stale-write and invalid-rules acceptance criteria. No product scope expansion.

## Issues Encountered

- The Task 1 verify command in the plan used an invalid pytest `-k` expression. I used the closest equivalent explicit node selection for the Task 1 slice, then ran the full `tests/api/test_templates_rules_api.py` file as the final verification.
- FastAPI emitted existing `on_event` deprecation warnings during pytest runs. They did not affect this plan’s behavior and were left untouched.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- The Templates & Rules backend is ready for the web integration wave and for Proposal Draft to consume effective-rule summaries directly.
- Rule validation, baseline/override separation, and optimistic concurrency semantics are now stable and test-covered.
- Proposal Draft current-resource generation/version behavior remains separate work for the next wave.

## Self-Check: PASSED

- Verified `.planning/phases/07-proposal-draft-templates-rules/07-02-SUMMARY.md` exists on disk.
- Verified task commits `e03a0f4`, `f867e9c`, `244ef51`, and `4d6eb05` exist in git history.

---
*Phase: 07-proposal-draft-templates-rules*
*Completed: 2026-04-13*
