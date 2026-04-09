---
phase: 03-dashboard-opportunities-list
plan: 02
completed: 2026-04-09
---

# Phase 3 Plan 02 Summary

## Outcome

Wave 2 is complete. Phase 3 now has a real backend: persisted opportunities, workspace-scoped list/detail/archive APIs, and an action-first dashboard summary endpoint that the web app can consume directly.

## Implemented

- Added durable opportunity persistence with model, repository, service, and migration coverage.
- Registered `GET/POST /api/v1/opportunities`, detail, archive, unarchive, and `GET /api/v1/dashboard/summary` in the product API router.
- Added dashboard summary composition so the backend authors `recent_opportunities`, `needs_attention`, `summary_counts`, `billing_snapshot`, and `current_step_url`.
- Hardened local and test DB bootstrapping so API tests and browser-driven local runs create schema before requests land.
- Fixed API test fixture seeding so real user, workspace, membership, and session rows exist before endpoint tests execute.

## Key Files

- `apps/api/app/db.py`
- `apps/api/app/opportunity_models.py`
- `apps/api/app/opportunity_repository.py`
- `apps/api/app/opportunity_service.py`
- `apps/api/app/dashboard_service.py`
- `apps/api/app/product.py`
- `apps/api/alembic/versions/0003_phase3_opportunities.py`
- `tests/api/test_dashboard_opportunities_api.py`
- `tests/conftest.py`

## Verification

- `pytest -q tests/api/test_dashboard_opportunities_api.py -k 'create or list or detail or archive or dashboard_summary or resume_target'`

## Deviations

- Added `ensure_database_schema()` in app startup to keep local browser-driven development usable against a fresh SQLite file.
- Renamed the product status route handler to avoid a FastAPI `status` symbol shadowing bug during app import.

