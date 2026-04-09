---
phase: 03-dashboard-opportunities-list
plan: 05
completed: 2026-04-09
---

# Phase 3 Plan 05 Summary

## Outcome

Wave 5 is complete. `/opportunities` now works as a real workflow queue with URL-backed search/filter/sort, archive and restore actions, filtered empty states, retry handling, and keyboard-friendly toolbar behavior.

## Implemented

- Added the real opportunities route and data bootstrap.
- Built the opportunities toolbar with `New opportunity`, `Search`, `Status`, `Archived`, and the frozen sort presets.
- Added scan-friendly opportunity rows with current step, state, owner, and updated timestamp metadata.
- Implemented archive/unarchive behavior with optimistic removal and refresh.
- Added filtered-empty and retry states that preserve toolbar orientation instead of collapsing the whole page.
- Added browser accessibility coverage for toolbar focus order and dialog semantics.

## Key Files

- `apps/web/app/opportunities/page.tsx`
- `apps/web/components/opportunities/opportunities-page.tsx`
- `apps/web/components/opportunities/opportunities-toolbar.tsx`
- `apps/web/components/opportunities/opportunity-row.tsx`
- `apps/web/components/opportunities/archive-toggle.tsx`
- `apps/web/lib/opportunities-api.ts`
- `tests/e2e/opportunities-list.spec.ts`
- `tests/e2e/opportunities-list-accessibility.spec.ts`

## Verification

- `PATH=/Users/wxm/.nvm/versions/node/v25.8.1/bin:$PATH COREPACK_HOME=/tmp/corepack corepack pnpm exec playwright test tests/e2e/opportunities-list.spec.ts`
- `PATH=/Users/wxm/.nvm/versions/node/v25.8.1/bin:$PATH COREPACK_HOME=/tmp/corepack corepack pnpm exec playwright test tests/e2e/opportunities-list-accessibility.spec.ts`

## Deviations

- Tightened Playwright helpers and assertions to target primary CTAs explicitly, avoiding strict-mode ambiguity between header, toolbar, and empty-state actions.

