---
phase: 4
slug: opportunity-intake-file-processing
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-04-09
---

# Phase 4 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | API/integration: `pytest 8.4.1`; browser/e2e: `@playwright/test 1.55.0` |
| **Config file** | [`playwright.config.ts`](../../../playwright.config.ts); the supported API test invocation is `PYTHONPATH=apps/api pytest ...` with shared fixtures from `tests/conftest.py` |
| **Quick run command** | `PYTHONPATH=apps/api pytest tests/api/test_opportunity_inputs_api.py -q -k list_inputs` |
| **Full suite command** | `PYTHONPATH=apps/api pytest tests/api -q && pnpm exec playwright test tests/e2e/opportunity-overview-shell.spec.ts tests/e2e/opportunity-intake.spec.ts` |
| **Estimated runtime** | smoke loops < 30s each; final sign-off ~240 seconds |

---

## Sampling Rate

- **After every task commit:** run the smallest targeted smoke command for that task; each smoke command must stay under 30 seconds.
- **After every plan wave:** run only that wave’s smoke commands first; keep the heavy regression suite for final sign-off.
- **Before `$gsd-verify-work`:** Full API suite plus Phase 4 browser workflow specs must be green.
- **Max smoke latency:** 30 seconds
- **Max final sign-off latency:** 240 seconds

---

## Wave Smoke Commands

| Wave | Goal | Smoke Commands (<30s each) |
|------|------|----------------------------|
| 1 | contracts + harness | `pnpm exec playwright test --list`; `PYTHONPATH=apps/api pytest --collect-only -q tests/api/test_dashboard_opportunities_api.py`; `python3 -c "from tests.support.file_processing_fakes import InlineQueue, InMemoryObjectStore"` |
| 2 | RED-state capture | `! PYTHONPATH=apps/api pytest tests/api/test_opportunity_inputs_api.py -q -k list_inputs`; `! PYTHONPATH=apps/api pytest tests/api/test_opportunity_file_processing_api.py -q -k upload_url`; `! pnpm exec playwright test tests/e2e/opportunity-overview-shell.spec.ts -g 'loading|empty|error|blocked|retry|success|not found'` |
| 3 | overview + inputs + gate backend | `PYTHONPATH=apps/api pytest tests/api/test_opportunity_intake_api.py -q -k detail`; `PYTHONPATH=apps/api pytest tests/api/test_opportunity_inputs_api.py -q -k 'list_inputs or create_input or update_input'`; `PYTHONPATH=apps/api pytest tests/api/test_lead_brief_gate_api.py -q -k success_redirect` |
| 4 | file backend or overview UI | `PYTHONPATH=apps/api pytest tests/api/test_opportunity_file_processing_api.py -q -k 'upload_url or complete or retry'`; `pnpm exec playwright test tests/e2e/opportunity-overview-shell.spec.ts -g 'Opportunity intake|loading|empty|error|blocked|retry|success|not found'`; `pnpm exec playwright test tests/e2e/opportunity-intake.spec.ts -g 'edit|autosave|save failed|no source'` |
| 5 | file UI + handoff | `pnpm exec playwright test tests/e2e/opportunity-intake.spec.ts -g 'file states|retry'`; `pnpm exec playwright test tests/e2e/opportunity-intake.spec.ts -g 'blocked to ready|lead brief|retry|success|not found'` |

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 04-01-01 | 01 | 1 | OPP-02 / INTAKE-01 / INTAKE-02 / INTAKE-03 | infra | `pnpm exec playwright test --list` | ✅ yes | ⬜ pending |
| 04-01-02 | 01 | 1 | INTAKE-02 | infra | `PYTHONPATH=apps/api pytest --collect-only -q tests/api/test_dashboard_opportunities_api.py && python3 -c "from tests.support.file_processing_fakes import InlineQueue, InMemoryObjectStore"` | ✅ yes | ⬜ pending |
| 04-02-01 | 02 | 2 | UI-02 / INTAKE-01 / INTAKE-03 | RED api | `! PYTHONPATH=apps/api pytest tests/api/test_opportunity_intake_api.py -q && ! PYTHONPATH=apps/api pytest tests/api/test_opportunity_inputs_api.py -q` | ❌ W1 | ⬜ pending |
| 04-02-02 | 02 | 2 | INTAKE-02 | RED api | `! PYTHONPATH=apps/api pytest tests/api/test_opportunity_file_processing_api.py -q && ! PYTHONPATH=apps/api pytest tests/api/test_lead_brief_gate_api.py -q` | ❌ W1 | ⬜ pending |
| 04-02-03 | 02 | 2 | OPP-02 / UI-02 / INTAKE-01 / INTAKE-02 / INTAKE-03 | RED browser | `! pnpm exec playwright test tests/e2e/opportunity-overview-shell.spec.ts && ! pnpm exec playwright test tests/e2e/opportunity-intake.spec.ts` | ❌ W1 | ⬜ pending |
| 04-03-01 | 03 | 3 | OPP-02 / INTAKE-01 | API integration | `PYTHONPATH=apps/api pytest tests/api/test_opportunity_intake_api.py -q && PYTHONPATH=apps/api pytest tests/api/test_opportunity_inputs_api.py -q` | ❌ W2 | ⬜ pending |
| 04-03-02 | 03 | 3 | INTAKE-03 | API integration | `PYTHONPATH=apps/api pytest tests/api/test_lead_brief_gate_api.py -q` | ❌ W2 | ⬜ pending |
| 04-04-01 | 04 | 4 | INTAKE-02 | API + worker integration | `PYTHONPATH=apps/api pytest tests/api/test_opportunity_file_processing_api.py -q` | ❌ W2 | ⬜ pending |
| 04-05-01 | 05 | 4 | OPP-02 / UI-02 / INTAKE-01 | browser e2e | `pnpm exec playwright test tests/e2e/opportunity-overview-shell.spec.ts -g 'Opportunity intake|loading|empty|error|blocked|retry|success|not found' && pnpm exec playwright test tests/e2e/opportunity-intake.spec.ts -g 'edit|autosave|save failed|no source'` | ❌ W2 | ⬜ pending |
| 04-06-01 | 06 | 5 | UI-02 / INTAKE-02 / INTAKE-03 | browser + API | `PYTHONPATH=apps/api pytest tests/api/test_lead_brief_gate_api.py -q && pnpm exec playwright test tests/e2e/opportunity-intake.spec.ts -g 'file states|retry|blocked to ready|lead brief|success|not found'` | ❌ W4 | ⬜ pending |
| 04-06-02 | 06 | 5 | OPP-02 / UI-02 / INTAKE-01 / INTAKE-02 / INTAKE-03 | final sign-off | `PYTHONPATH=apps/api pytest tests/api -q && pnpm exec playwright test tests/e2e/opportunity-overview-shell.spec.ts tests/e2e/opportunity-intake.spec.ts` | ❌ W4 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/conftest.py` — add `api_client`, authenticated web-session fixtures, and reusable payload builders for opportunity/intake/file tests
- [ ] `tests/api/test_opportunity_inputs_api.py` — failing API contract tests for explicit D-30 input CRUD-lite routes
- [ ] `tests/api/test_opportunity_intake_api.py` — failing API contract tests for overview detail/update, raw input persistence, and save error handling
- [ ] `tests/api/test_opportunity_file_processing_api.py` — failing API contract tests for upload URL, complete, polling, ready/failed, and retry
- [ ] `tests/api/test_lead_brief_gate_api.py` — failing API contract tests for generation gate logic and successful redirect/handoff semantics
- [ ] `tests/e2e/opportunity-overview-shell.spec.ts` — failing browser spec for header, stepper, shell continuity, and opportunity-container framing
- [ ] `tests/e2e/opportunity-intake.spec.ts` — failing browser workflow spec for edit/autosave, file states, recovery, and Lead Brief entry
- [ ] Playwright CLI install / workspace wiring — `pnpm exec playwright test --list` must succeed before browser TDD can start
- [ ] Queue test harness — provide synchronous/fake queue execution for RQ-backed file-processing tests
- [ ] Local Redis + S3-compatible storage path for test/dev parity, or equivalent deterministic test doubles where full services are unavailable

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Opportunity Overview visual fidelity against `04-UI-SPEC.md` and `docs/design/DESIGN.md` | OPP-02 / UI quality bar | Automated tests can verify structure and states, but not whether the page still feels like a restrained intake desk instead of a generic form builder | Open `/opportunities/:id/overview` at roughly `1280x800` and `1440x900`; confirm header, stepper, asymmetric desk layout, source/context separation, and dominant primary CTA match the UI contract |
| File-state clarity and recovery trust | INTAKE-02 | Human review is needed to judge whether `processing`, `ready`, `failed`, and `retry` read as operational and understandable rather than technical noise | Walk through uploaded → processing → failed → retry → ready in a browser; confirm states are visible in-page, explain next steps, and never collapse into toast-only feedback |
| Blocked-to-ready generation comprehension | INTAKE-03 | The presence of copy can be automated, but whether users can understand exactly why generation is blocked is a product-clarity check | Trigger each blocked reason and confirm the page names the missing condition in product language; then satisfy the gate and verify the page cleanly hands off into Lead Brief |

---

## Validation Sign-Off

- [ ] All tasks have automated verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all missing verification references
- [ ] No watch-mode flags
- [ ] Every wave has at least one sub-30s smoke command
- [ ] Heavy regressions are reserved for final sign-off
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
