# Plan 04 Summary

Implemented the phase-1 customer and admin shells:

- `apps/web/app/layout.tsx`
- `apps/web/app/page.tsx`
- `apps/web/app/globals.css`
- `apps/web/components/app-shell.tsx`
- `apps/web/components/status-panel.tsx`
- `apps/admin/app/layout.tsx`
- `apps/admin/app/page.tsx`
- `apps/admin/app/globals.css`
- `apps/admin/components/admin-shell.tsx`

What changed:

- Added a dark, shipping-style customer shell with a query-driven product-state panel.
- Rendered all six shared product states from the customer shell.
- Added a clearly separate internal admin placeholder shell with read-only boundary copy.

Verification:

- The shell files exist and follow the frozen visual baseline.
- The customer page includes all six product states.
- The admin page remains minimal and explicitly internal.
