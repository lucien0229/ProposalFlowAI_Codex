---
phase: 07-proposal-draft-templates-rules
verified: 2026-04-14T04:44:42Z
status: passed
score: 7/7 must-haves verified
re_verification:
  previous_outcome: gaps_found
  previous_score: 4/7
  gaps_closed:
    - "Proposal Draft starts empty and generation stays blocked until current Lead Brief and Discovery exist."
    - "Proposal Draft content is rule-constrained by workspace baseline rules plus opportunity overrides."
    - "Confidence, missing-input, rules-conflict, and restriction notices are backed by real backend behavior."
  gaps_remaining: []
  regressions: []
---

# Phase 7: Proposal Draft + Templates & Rules Verification Report

**Phase Goal:** Ship the core value page: a rule-constrained, editable, versioned proposal draft that users can actually work from.
**Verified:** 2026-04-14T04:44:42Z
**Status:** passed
**Re-verification:** Yes — after gap closure

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
| --- | --- | --- | --- |
| 1 | Proposal Draft and Templates & Rules routes exist in the real app shells. | ✓ VERIFIED | `apps/api/app/product.py` mounts both routers; `apps/web/app/opportunities/[opportunityId]/[step]/page.tsx` renders `ProposalDraftWorkspace` on the `proposal_draft` branch; `apps/web/app/templates-rules/page.tsx` renders `TemplatesRulesPage`. |
| 2 | Workspace baseline rules can be edited on Templates & Rules and returned to Proposal Draft. | ✓ VERIFIED | `apps/web/components/templates-rules/templates-rules-page.tsx` keeps the return flow and save state; `templates-rules-form.tsx` preserves the four UI-spec groups; `tests/e2e/templates-rules.spec.ts` asserts `Save rules` and `Return to Proposal Draft`. |
| 3 | Proposal Draft shows a visible rules summary and an opportunity-local override panel. | ✓ VERIFIED | `apps/web/components/opportunities/proposal-draft-workspace.tsx` wires `ProposalDraftRulesBar`, `ProposalDraftOverrideDrawer`, `fetchOpportunityEffectiveRules`, `fetchOpportunityRuleOverride`, `saveOpportunityRuleOverride`, and `clearOpportunityRuleOverride`. |
| 4 | Proposal Draft starts empty and generation stays blocked until current Lead Brief and Discovery exist. | ✓ VERIFIED | `get_proposal_draft_workspace()` now returns `proposal_draft: null` when no current row exists; `generate_proposal_draft()` only creates the draft on successful generate; `tests/api/test_proposal_draft_api.py` covers repeated empty GETs plus post-GET `LEAD_BRIEF_REQUIRED` and `DISCOVERY_REQUIRED` gating. |
| 5 | Proposal Draft content is rule-constrained by workspace baseline rules plus opportunity overrides. | ✓ VERIFIED | `_live_effective_rule_summary()` delegates to `build_effective_rule_summary()` and is used by generate, save current, save version, restore, regenerate, and workspace serialization; API tests prove baseline edits and explicit overrides flow into assumptions, exclusions, template key, and exports. |
| 6 | Proposal Draft editing, save current, save version, version restore, section regenerate, copy, and export are implemented. | ✓ VERIFIED | `proposal_draft_routes.py` exposes all endpoints; `proposal-draft-workspace.tsx` wires all UI actions; API regressions passed `16` tests covering save/version/restore/regenerate/export and conflict handling. |
| 7 | Confidence, missing-input, rules-conflict, and restriction notices are delivered by real backend flows. | ✓ VERIFIED | `_build_payload_state()` emits `RULES_CONFLICT` warnings and per-section markers from live rule drift; dependency and restriction routes return real backend errors; the proposal-draft browser spec no longer contains fabricated `proposal_draft: null`, `LEAD_BRIEF_REQUIRED`, `DISCOVERY_REQUIRED`, or `RULES_CONFLICT` payloads. |

**Score:** 7/7 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
| --- | --- | --- | --- |
| `apps/api/app/proposal_draft_service.py` | Truthful proposal-draft workspace, generation, save/version, regenerate, export, and warning semantics | ✓ VERIFIED | Exists, is substantive, is mounted through routes, and now reads current rows without seeding on GET while composing live rules and conflict warnings. |
| `apps/api/app/templates_rules_service.py` | Opt-in opportunity override behavior and live effective-rule composition | ✓ VERIFIED | Exists, is substantive, and returns inactive override state until explicit save while composing workspace baseline plus active override. |
| `tests/api/test_proposal_draft_api.py` | Regression proof for empty current draft, dependency gating, live rule composition, and warning payloads | ✓ VERIFIED | Covers the exact previously failed backend behaviors and passed in this session. |
| `tests/api/test_templates_rules_api.py` | Regression proof that overrides are inactive until explicitly saved | ✓ VERIFIED | Covers baseline effective rules, inactive override default, explicit override save, delete idempotence, and stale-write handling. |
| `apps/web/components/opportunities/proposal-draft-workspace.tsx` | Workspace state mapping for backend-backed warning and empty-state responses | ✓ VERIFIED | Wires empty state, dependency-blocked state, real warning rendering, override drawer, version drawer, and action handlers. |
| `tests/e2e/proposal-draft-workspace.spec.ts` | Non-mocked browser proof for empty, missing-input, current-draft, and rules-conflict behavior | ✓ VERIFIED | Critical gap-state tests now use helper-created backend state and contain no fabricated proposal-draft payloads for the previously missing states. |

### Key Link Verification

| From | To | Via | Status | Details |
| --- | --- | --- | --- | --- |
| `apps/api/app/product.py` | `templates_rules_routes.py` | `router.include_router(templates_rules_router)` | ✓ WIRED | Templates & Rules endpoints remain mounted under the real `/api/v1` product app. |
| `apps/api/app/product.py` | `proposal_draft_routes.py` | `router.include_router(proposal_draft_router)` | ✓ WIRED | Proposal Draft endpoints remain mounted under the real `/api/v1` product app. |
| `apps/web/app/opportunities/[opportunityId]/[step]/page.tsx` | `ProposalDraftWorkspace` | `proposal_draft` route branch | ✓ WIRED | The real opportunity route still renders the workspace component. |
| `apps/api/app/proposal_draft_service.py` | `apps/api/app/templates_rules_service.py` | `_live_effective_rule_summary()` → `build_effective_rule_summary()` | ✓ WIRED | Live effective rules now drive workspace serialization, generate, save, version, restore, regenerate, and export-adjacent payloads. |
| `apps/web/components/opportunities/proposal-draft-workspace.tsx` | backend warning payloads | `fetchProposalDraftWorkspace()` + `deriveProposalDraftStatusBand()` | ✓ WIRED | Backend warnings and confidence notes flow directly into the status band and chapter markers. |
| `tests/e2e/proposal-draft-workspace.spec.ts` | real backend setup helpers | `openProposalDraftWorkspaceWithoutCurrentDraft()` / `openDiscoveryWorkspaceWithLeadBrief()` | ✓ WIRED | Empty, missing-input, and rules-conflict scenarios are created from real state transitions instead of request-payload fabrication. |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
| --- | --- | --- | --- | --- |
| `apps/api/app/proposal_draft_service.py` | `current` | `get_proposal_draft_current()` | Yes; returns persisted row or `None`, with no create-on-read fallback | ✓ FLOWING |
| `apps/api/app/proposal_draft_service.py` | `effective_rule_summary` | `_live_effective_rule_summary()` → `templates_rules_service.build_effective_rule_summary()` | Yes; composed from template definitions, workspace rules, and opt-in active overrides | ✓ FLOWING |
| `apps/web/components/opportunities/proposal-draft-workspace.tsx` | `currentDraft` | `fetchProposalDraftWorkspace()` → `get_proposal_draft_workspace()` | Yes; empty workspace stays `null` until generate succeeds | ✓ FLOWING |
| `apps/web/components/opportunities/proposal-draft-workspace.tsx` | `statusBand` / chapter warnings | backend `warnings` + `confidence_notes` → `deriveProposalDraftStatusBand()` | Yes; rules-conflict, dependency, and restriction signals render from backend payloads | ✓ FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
| --- | --- | --- | --- |
| Phase 7 API regressions | `PYTHONPATH=apps/api pytest tests/api/test_templates_rules_api.py tests/api/test_proposal_draft_api.py -q` | `16 passed, 34 warnings in 3.20s` | ✓ PASS |
| Shared Phase 7 route/type contract | `pnpm exec tsc --noEmit tests/shared/phase7-contracts.assert.ts` | `EXIT_CODE:0` | ✓ PASS |
| Critical proposal-draft gap-state spec contains no fabricated payload tokens | Node scan of `tests/e2e/proposal-draft-workspace.spec.ts` for `proposal_draft: null`, `LEAD_BRIEF_REQUIRED`, `DISCOVERY_REQUIRED`, `RULES_CONFLICT` | All four returned `NOT_FOUND` | ✓ PASS |
| Exact documented full Phase 7 validation command | `PYTHONPATH=apps/api pytest tests/api/test_templates_rules_api.py tests/api/test_proposal_draft_api.py -q && pnpm exec tsc --noEmit tests/shared/phase7-contracts.assert.ts && pnpm exec playwright test tests/e2e/proposal-draft-workspace.spec.ts tests/e2e/templates-rules.spec.ts && pnpm lint` | `16 passed, 34 warnings in 3.20s`; `20 passed (2.2m)` under the default 2-worker Playwright run; lint exited `0` | ✓ PASS |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
| --- | --- | --- | --- | --- |
| `RULE-01` | `07-01`, `07-02`, `07-04`, `07-06`, `07-07`, `07-08` | Workspace rules can be edited, and the effective rules are derived from template + workspace rules + opportunity overrides. | ✓ SATISFIED | `templates_rules_service.py` composes the effective rule stack, override state is opt-in, API regressions passed, and Templates & Rules keeps the saved-baseline return flow. |
| `PROP-01` | `07-01`, `07-03`, `07-04`, `07-05`, `07-06`, `07-07`, `07-08` | Proposal Draft generation requires an existing current Lead Brief and base Discovery data. | ✓ SATISFIED | Empty GET no longer seeds a draft, generate-after-GET remains blocked by real dependency errors, and the browser spec encodes those blocked flows without fabricated proposal-draft payloads. |
| `PROP-02` | `07-01`, `07-03`, `07-04`, `07-05`, `07-06`, `07-07`, `07-08` | Proposal Draft supports chapter editing, chapter-level regenerate with explicit overwrite confirmation, copy, export, and rule/confidence notices. | ✓ SATISFIED | Routes and UI handlers exist for edit/version/restore/regenerate/copy/export, API regressions pass, and real backend warnings now drive rules-conflict and confidence notice rendering. |

All requirement IDs declared in Phase 7 plan frontmatter are present in `.planning/REQUIREMENTS.md`, and `.planning/REQUIREMENTS.md` does not assign any additional orphaned Phase 7 IDs beyond `RULE-01`, `PROP-01`, and `PROP-02`.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
| --- | --- | --- | --- | --- |
| — | — | No Phase 7 blocker anti-patterns found in the verified gap-closure files | — | No TODO/placeholder/mock-only implementation remained for the previously failing proposal-draft gap states. |

### Gaps Summary

All three previously reported blockers remain closed in the current codebase, and the additional verify-work race has now been resolved. Proposal Draft no longer seeds itself on read, dependency gating remains truthful after route visits, live effective rules drive proposal-draft payloads, browser proof relies on helper-created backend state instead of fabricated responses, and the exact documented validation command is green again under the default Playwright worker configuration.

---

_Verified: 2026-04-14T04:44:42Z_
_Verifier: Claude (gsd-verifier)_
