---
phase: 7
slug: proposal-draft-templates-rules
status: draft
nyquist_compliant: true
wave_0_complete: true
created: 2026-04-13
---

# Phase 7 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | `pytest` + Playwright + repo linting |
| **Config file** | `pytest.ini` (implicit via repo setup), `playwright.config.*` if present, workspace lint config already established |
| **Quick run command** | `PYTHONPATH=apps/api pytest tests/api/test_templates_rules_api.py tests/api/test_proposal_draft_api.py -q` |
| **Full suite command** | `PYTHONPATH=apps/api pytest tests/api/test_templates_rules_api.py tests/api/test_proposal_draft_api.py -q && pnpm exec tsc --noEmit tests/shared/phase7-contracts.assert.ts && pnpm exec playwright test tests/e2e/proposal-draft-workspace.spec.ts tests/e2e/templates-rules.spec.ts && pnpm lint` |
| **Estimated runtime** | ~100 seconds |

---

## Sampling Rate

- **After every task commit:** Run the task's targeted verify command plus the quick API smoke if backend contracts changed.
- **After every plan wave:** Run that wave's full verify command.
- **Before `$gsd-verify-work`:** The full suite command for this phase must be green.
- **Max feedback latency:** 120 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 07-01-01 | 01 | 1 | RULE-01 / PROP-01 / PROP-02 | unit | `PYTHONPATH=apps/api pytest tests/api/test_templates_rules_api.py tests/api/test_proposal_draft_api.py -q` | ❌ W1 | ⬜ pending |
| 07-01-02 | 01 | 1 | RULE-01 / PROP-01 / PROP-02 | unit | `pnpm exec tsc --noEmit tests/shared/phase7-contracts.assert.ts && pnpm lint` | ❌ W1 | ⬜ pending |
| 07-02-01 | 02 | 2 | RULE-01 | integration | `PYTHONPATH=apps/api pytest tests/api/test_templates_rules_api.py -q` | ❌ W2 | ⬜ pending |
| 07-02-02 | 02 | 2 | RULE-01 | integration | `PYTHONPATH=apps/api pytest tests/api/test_templates_rules_api.py -q` | ❌ W2 | ⬜ pending |
| 07-03-01 | 03 | 3 | PROP-01 | integration | `PYTHONPATH=apps/api pytest tests/api/test_proposal_draft_api.py -q -k 'gate or current resource or generate'` | ❌ W3 | ⬜ pending |
| 07-03-02 | 03 | 3 | PROP-02 | integration | `PYTHONPATH=apps/api pytest tests/api/test_proposal_draft_api.py -q -k 'section regenerate or restore or export'` | ❌ W3 | ⬜ pending |
| 07-04-01 | 04 | 4 | PROP-01 / PROP-02 | e2e | `pnpm exec playwright test tests/e2e/proposal-draft-workspace.spec.ts -g 'empty|blocked|loading|billing|restricted|error'` | ❌ W4 | ⬜ pending |
| 07-04-02 | 04 | 4 | RULE-01 | e2e | `pnpm exec playwright test tests/e2e/templates-rules.spec.ts -g 'empty|validation|return path'` | ❌ W4 | ⬜ pending |
| 07-05-01 | 05 | 5 | PROP-02 | e2e | `pnpm exec playwright test tests/e2e/proposal-draft-workspace.spec.ts -g 'rules summary|template|override|chapter|save current|save version|versions|restore'` | ❌ W5 | ⬜ pending |
| 07-05-02 | 05 | 5 | PROP-02 | e2e | `pnpm exec playwright test tests/e2e/proposal-draft-workspace.spec.ts -g 'regenerate|low confidence|rules conflict|restriction|billing|copy|export'` | ❌ W5 | ⬜ pending |
| 07-06-01 | 06 | 6 | RULE-01 | e2e | `pnpm exec playwright test tests/e2e/templates-rules.spec.ts -g 'save rules|return to draft|baseline refresh|override'` | ❌ W6 | ⬜ pending |
| 07-06-02 | 06 | 6 | RULE-01 / PROP-01 / PROP-02 | integration + e2e | `PYTHONPATH=apps/api pytest tests/api/test_templates_rules_api.py tests/api/test_proposal_draft_api.py -q && pnpm exec tsc --noEmit tests/shared/phase7-contracts.assert.ts && pnpm exec playwright test tests/e2e/proposal-draft-workspace.spec.ts tests/e2e/templates-rules.spec.ts && pnpm lint` | ❌ W6 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] Existing infrastructure covers all phase requirements.
- [ ] New test files will be added in Wave 1: `tests/api/test_templates_rules_api.py`, `tests/api/test_proposal_draft_api.py`
- [ ] New shared contract assertion file will be added in Wave 1: `tests/shared/phase7-contracts.assert.ts`
- [ ] New Playwright specs will be added by Wave 4: `tests/e2e/proposal-draft-workspace.spec.ts`, `tests/e2e/templates-rules.spec.ts`

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Exported proposal copy quality stays client-readable after markdown/text export | PROP-02 | Automated tests can prove format and non-empty content, but not nuanced readability of real exported narrative | Use a seeded opportunity, generate/export both formats, inspect chapter order and the preserved `Assumptions` / `Exclusions` sections visually before release sign-off |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or planned Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all missing references
- [x] No watch-mode flags
- [x] Feedback latency < 120s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
