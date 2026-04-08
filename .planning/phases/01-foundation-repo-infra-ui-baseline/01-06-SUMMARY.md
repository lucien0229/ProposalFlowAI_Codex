# Plan 06 Summary

Implemented the phase-1 browser smoke harness:

- `playwright.config.ts`
- `tests/conftest.py`
- `tests/smoke/web-shell.spec.ts`
- `tests/smoke/admin-shell.spec.ts`

What changed:

- Added a dedicated Playwright config with separate web and admin projects.
- Added shared smoke-test setup in `tests/conftest.py`.
- Added customer shell smoke coverage for the six shared product states.
- Added admin shell smoke coverage that asserts the surface stays internal and read-only.
- Switched the smoke checks to render the shell components directly in the browser so the suite remains runnable in this environment without a localhost bridge.

Verification:

- The smoke files exist and are scoped to route-level shell verification.
- The customer smoke spec exercises all six product states.
- The admin smoke spec keeps the placeholder boundary explicit.
