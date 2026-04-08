---
phase: 1
slug: foundation-repo-infra-ui-baseline
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-08
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Backend: `pytest 8.4.1`; Frontend route smoke: Playwright |
| **Config file** | none yet - create during Wave 0 |
| **Quick run command** | `pytest -q` for backend/unit smoke once tests exist; `pnpm exec playwright test` once Playwright is added |
| **Full suite command** | `pytest -q && pnpm exec playwright test` |
| **Estimated runtime** | ~120 seconds |

---

## Sampling Rate

- **After every task commit:** Run `pytest -q` for backend-affecting tasks and `pnpm exec playwright test` for UI-shell tasks once the tooling exists
- **After every plan wave:** Run the full suite command
- **Before `$gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 120 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 01-01-01 | 01 | 1 | PLAT-01 | smoke | `test -f package.json && test -f pnpm-workspace.yaml && grep -q 'apps/\*' pnpm-workspace.yaml` | ❌ W0 | ⬜ pending |
| 01-01-02 | 01 | 1 | PLAT-01 | smoke | `test -f apps/web/package.json && test -f apps/admin/package.json` | ❌ W0 | ⬜ pending |
| 01-02-01 | 02 | 2 | PLAT-02 | unit | `test -f packages/shared-types/index.ts && grep -q 'SessionType' packages/shared-types/index.ts` | ❌ W0 | ⬜ pending |
| 01-02-02 | 02 | 2 | PLAT-02 | unit | `test -f packages/shared-schemas/index.ts && grep -q 'ProductState' packages/shared-schemas/index.ts` | ❌ W0 | ⬜ pending |
| 01-02-03 | 02 | 2 | PLAT-02 | unit | `test -f packages/shared-config/index.ts && grep -q 'WEB_ROUTE_PREFIX' packages/shared-config/index.ts` | ❌ W0 | ⬜ pending |
| 01-02-04 | 02 | 2 | PLAT-02 | unit | `test -f packages/shared-types/index.ts && grep -q 'ActivityLog' packages/shared-types/index.ts` | ❌ W0 | ⬜ pending |
| 01-03-01 | 03 | 2 | PLAT-03 | smoke | `test -f infra/compose/docker-compose.local.yml && grep -q 'postgres' infra/compose/docker-compose.local.yml` | ❌ W0 | ⬜ pending |
| 01-03-02 | 03 | 2 | PLAT-02 | unit | `python3 -m py_compile apps/api/app/main.py apps/api/app/product.py apps/api/app/admin.py` | ❌ W0 | ⬜ pending |
| 01-03-03 | 03 | 2 | PLAT-03 | unit | `python3 -m py_compile apps/api/alembic/env.py apps/api/alembic/versions/0001_initial.py apps/worker/main.py` | ❌ W0 | ⬜ pending |
| 01-04-01 | 04 | 3 | UI-01 | unit | `test -f apps/web/app/layout.tsx && test -f apps/web/components/status-panel.tsx` | ❌ W0 | ⬜ pending |
| 01-04-02 | 04 | 3 | UI-02 | unit | `test -f apps/admin/app/layout.tsx && test -f apps/admin/components/admin-shell.tsx` | ❌ W0 | ⬜ pending |
| 01-05-01 | 05 | 3 | PLAT-02 | unit | `test -f apps/api/app/security.py && grep -q 'require_web_session' apps/api/app/security.py` | ❌ W0 | ⬜ pending |
| 01-05-02 | 05 | 3 | PLAT-03 | unit | `test -f apps/api/alembic/versions/0002_activity_logs_security.py && grep -q 'activity_logs' apps/api/alembic/versions/0002_activity_logs_security.py` | ❌ W0 | ⬜ pending |
| 01-06-01 | 06 | 4 | UI-01 | e2e | `pnpm exec playwright test tests/smoke/web-shell.spec.ts` | ❌ W0 | ⬜ pending |
| 01-06-02 | 06 | 4 | UI-02 | e2e | `pnpm exec playwright test tests/smoke/admin-shell.spec.ts` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/conftest.py` — shared fixtures for browser smoke and backend smoke support

*If none: "Existing infrastructure covers all phase requirements."*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|---|---|---|---|
| Local Docker daemon parity | PLAT-03 | The local dependency model depends on a running daemon and cannot be validated by file checks alone | Start Docker Desktop or equivalent, then confirm `docker compose -f infra/compose/docker-compose.local.yml up` reaches healthy services |
| Design baseline fidelity | UI-01 | The visual baseline needs human review to ensure it is product-like rather than spec-like | Open the customer shell in a browser and confirm the dark shipping UI baseline matches `docs/design/DESIGN.md` |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 120s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
