---
phase: 03-dashboard-opportunities-list
plan: 04
completed: 2026-04-09
---

# Phase 3 Plan 04 Summary

## Outcome

Wave 4 is complete. `/dashboard` is now the real command center: users can start a new opportunity, resume work from recent items, see attention-first queue state, and understand billing restrictions without dropping into placeholder UI.

## Implemented

- Replaced the old dashboard handoff with a real server-bootstrapped dashboard route.
- Built the dashboard command center layout with `Needs attention`, compact summary counts, `Trial / Billing`, and `Recent opportunities`.
- Added the new-opportunity dialog with browser-side required-field validation and redirect-to-overview behavior.
- Added dashboard loading, empty, retry, and blocked states using the shared product-state primitive.
- Ensured dashboard create/resume flows use backend-authored `current_step_url` semantics.

## Key Files

- `apps/web/app/dashboard/page.tsx`
- `apps/web/components/dashboard/dashboard-page.tsx`
- `apps/web/components/dashboard/new-opportunity-dialog.tsx`
- `apps/web/components/dashboard/recent-opportunities.tsx`
- `apps/web/components/dashboard/needs-attention-list.tsx`
- `apps/web/components/dashboard/billing-card.tsx`
- `apps/web/lib/dashboard-api.ts`
- `tests/e2e/dashboard-command-center.spec.ts`
- `tests/e2e/dashboard-command-center-accessibility.spec.ts`

## Verification

- `PATH=/Users/wxm/.nvm/versions/node/v25.8.1/bin:$PATH COREPACK_HOME=/tmp/corepack corepack pnpm exec playwright test tests/e2e/dashboard-command-center.spec.ts`

## Deviations

- None.

