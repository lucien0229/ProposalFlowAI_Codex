---
phase: 3
slug: dashboard-opportunities-list
status: approved
nyquist_compliant: true
wave_0_complete: true
created: 2026-04-09
---

# Phase 3 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Backend: `pytest`; Browser/product UX: Playwright |
| **Config file** | Existing repo defaults plus `tests/conftest.py`; add phase-3-specific API/browser fixtures during Plan `03-01` |
| **Quick run command** | `pytest -q tests/api/test_dashboard_opportunities_api.py` or `pnpm exec playwright test tests/e2e/dashboard-command-center.spec.ts` |
| **Full suite command** | `pytest -q && pnpm exec playwright test` |
| **Estimated runtime** | ~180 seconds |

---

## Sampling Rate

- **After every task commit:** Run the narrowest affected command first (`pytest` for API/domain tasks, targeted Playwright spec for UI tasks)
- **After every plan wave:** Run the relevant full affected runner plus `pnpm exec playwright test` once the UI surface is involved
- **Before `$gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 180 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 03-01-01 | 01 | 1 | OPP-01 | unit | `grep -q 'export type OpportunityStatus' packages/shared-types/index.ts && grep -q 'opportunityListQuerySchema' packages/shared-schemas/index.ts` | ✅ yes | ✅ green |
| 03-01-02 | 01 | 1 | DASH-01 | unit | `test -f tests/api/test_dashboard_opportunities_api.py && test -f tests/e2e/dashboard-command-center.spec.ts` | ✅ yes | ✅ green |
| 03-02-01 | 02 | 2 | OPP-01 | unit | `pytest -q tests/api/test_dashboard_opportunities_api.py -k 'list or create or archive'` | ✅ yes | ✅ green |
| 03-02-02 | 02 | 2 | DASH-01 | unit | `pytest -q tests/api/test_dashboard_opportunities_api.py -k 'dashboard_summary or resume_target'` | ✅ yes | ✅ green |
| 03-03-01 | 03 | 3 | UI-01 | e2e | `pnpm exec playwright test tests/smoke/product-shell-phase3.spec.ts` | ✅ yes | ✅ green |
| 03-03-02 | 03 | 3 | UI-02 | e2e | `pnpm exec playwright test tests/e2e/dashboard-command-center-accessibility.spec.ts -g 'navigation'` | ✅ yes | ✅ green |
| 03-04-01 | 04 | 4 | DASH-01 | e2e | `pnpm exec playwright test tests/e2e/dashboard-command-center.spec.ts` | ✅ yes | ✅ green |
| 03-04-02 | 04 | 4 | UI-02 | e2e | `pnpm exec playwright test tests/e2e/dashboard-command-center-accessibility.spec.ts -g 'dashboard'` | ✅ yes | ✅ green |
| 03-05-01 | 05 | 5 | OPP-01 | e2e | `pnpm exec playwright test tests/e2e/opportunities-list.spec.ts` | ✅ yes | ✅ green |
| 03-05-02 | 05 | 5 | UI-02 | e2e | `pnpm exec playwright test tests/e2e/opportunities-list-accessibility.spec.ts` | ✅ yes | ✅ green |
| 03-06-01 | 06 | 6 | DASH-01 | e2e | `pnpm exec playwright test tests/e2e/dashboard-opportunities-integration.spec.ts` | ✅ yes | ✅ green |
| 03-06-02 | 06 | 6 | OPP-01 | e2e | `pytest -q tests/api/test_dashboard_opportunities_api.py && pnpm exec playwright test tests/e2e/dashboard-opportunities-integration.spec.ts` | ✅ yes | ✅ green |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [x] `tests/conftest.py` — extend with API app/client fixtures and reusable phase-3 data builders
- [x] `tests/api/test_dashboard_opportunities_api.py` — failing API contract tests before backend implementation
- [x] `tests/e2e/dashboard-command-center.spec.ts` — failing browser spec before dashboard UI implementation
- [x] `tests/e2e/opportunities-list.spec.ts` — failing browser spec before list UI implementation

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Visual fidelity against the design contract | UI-01 | Automated tests can verify structure and states, but not whether the composition still feels like a restrained workflow console | Open `/dashboard` and `/opportunities`, compare against `03-UI-SPEC.md` and `docs/design/DESIGN.md`, and confirm there is no dashboard-card mosaic or BI-board drift |
| Scan quality on desktop/laptop widths | DASH-01 / OPP-01 | Human review is still needed to judge whether `Needs Attention` and row-card density support fast decisions | Review at roughly `1280x800` and `1440x900`, then confirm CTA visibility, row scan speed, and archive visibility |
| Restricted-state explanation clarity | UI-02 | Copy can be technically present but still unclear to real users | Trigger a blocked/restricted fixture and confirm the page explains current state, affected actions, and next step without generic "try again later" wording |

---

Manual-only checks were completed in `03-HUMAN-UAT.md` with 3/3 passes.

## Execution Results

- `pytest -q tests/api/test_dashboard_opportunities_api.py -k 'create or list or detail or archive or dashboard_summary or resume_target'` → 6 passed
- `pnpm --dir apps/web exec tsc -p tsconfig.json --noEmit` → passed
- `pnpm exec playwright test tests/smoke/product-shell-phase3.spec.ts tests/e2e/dashboard-command-center-accessibility.spec.ts tests/e2e/dashboard-command-center.spec.ts tests/e2e/opportunities-list.spec.ts tests/e2e/opportunities-list-accessibility.spec.ts tests/e2e/dashboard-opportunities-integration.spec.ts tests/e2e/dashboard-opportunities-error-recovery.spec.ts tests/e2e/auth-setup.spec.ts tests/smoke/auth-workspace.spec.ts --reporter=line` → 12 passed
- `03-HUMAN-UAT.md` → 3 manual verification checks passed via real browser walkthrough and screenshot review

---

## Validation Sign-Off

- [x] All tasks have automated verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all missing phase-3 verification references
- [x] No watch-mode flags
- [x] Feedback latency < 180s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-04-09 with automated validation green and `03-HUMAN-UAT.md` complete
