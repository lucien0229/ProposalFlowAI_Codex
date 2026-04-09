---
phase: 03-dashboard-opportunities-list
plan: 06
completed: 2026-04-09
---

# Phase 3 Plan 06 Summary

## Outcome

Wave 6 is complete. Dashboard and opportunities now behave as one launch-ready web product surface, with cross-route integration, explicit error recovery coverage, stable onboarding-to-dashboard handoff, and final browser/API/typecheck verification.

## Implemented

- Added cross-route integration coverage for create, archive, restore, and dashboard/list parity.
- Added recovery coverage for dashboard create failures and opportunities archive failures without introducing test-only production code.
- Fixed CSRF handling for browser write requests that use `POST` without a request body, which unblocked archive/unarchive.
- Normalized 5xx product fetch messaging so server failures surface a user-safe message instead of raw backend detail.
- Hardened the onboarding helper to generate collision-safe emails under parallel Playwright execution.
- Updated legacy onboarding smoke/E2E assertions to match the real Phase 3 dashboard surface instead of Phase 2 handoff copy.

## Key Files

- `apps/web/lib/product-api.ts`
- `tests/e2e/helpers/onboarding.ts`
- `tests/e2e/helpers/opportunities.ts`
- `tests/e2e/dashboard-opportunities-integration.spec.ts`
- `tests/e2e/dashboard-opportunities-error-recovery.spec.ts`
- `tests/e2e/auth-setup.spec.ts`
- `tests/smoke/auth-workspace.spec.ts`

## Verification

- `pytest -q tests/api/test_dashboard_opportunities_api.py -k 'create or list or detail or archive or dashboard_summary or resume_target'`
- `PATH=/Users/wxm/.nvm/versions/node/v25.8.1/bin:$PATH COREPACK_HOME=/tmp/corepack corepack pnpm --dir apps/web exec tsc -p tsconfig.json --noEmit`
- `PATH=/Users/wxm/.nvm/versions/node/v25.8.1/bin:$PATH COREPACK_HOME=/tmp/corepack corepack pnpm exec playwright test tests/smoke/product-shell-phase3.spec.ts tests/e2e/dashboard-command-center-accessibility.spec.ts tests/e2e/dashboard-command-center.spec.ts tests/e2e/opportunities-list.spec.ts tests/e2e/opportunities-list-accessibility.spec.ts tests/e2e/dashboard-opportunities-integration.spec.ts tests/e2e/dashboard-opportunities-error-recovery.spec.ts tests/e2e/auth-setup.spec.ts tests/smoke/auth-workspace.spec.ts --reporter=line`

## Deviations

- Used Playwright route interception for failure-path verification so recovery UX could be tested against realistic 5xx responses without adding production-only debug hooks.

