---
status: resolved
trigger: "Diagnose this Phase 07 UAT gap. Find root cause only, do not implement fixes."
created: 2026-04-14T03:04:15Z
updated: 2026-04-14T04:44:42Z
---

## Current Focus

hypothesis: Confirmed root cause is a test synchronization bug: the failing test reloads Proposal Draft after the helper already returned a ready page, then `expectProposalDraftShell()` passes against the loading shell and the test clicks `Edit override` before the page is actually ready.
test: Root cause confirmed from trace snapshots plus serial/parallel control runs; no further testing required for diagnosis-only mode.
expecting: n/a
next_action: Closed by 07-09 gap execution; keep as resolved evidence for future audits.

## Symptoms

expected: The documented full Phase 7 validation command should complete green from a fresh local environment.
actual: Fresh boot succeeded and API tests passed, but the documented validation command failed when running the Proposal Draft and Templates & Rules Playwright specs together. The failing assertion waited for `proposal-draft-override-drawer`. The same test passes alone with `--workers=1`, and both spec files pass together with `--workers=1` (20/20 green).
errors: "template and override drawer updates the rules summary without leaving proposal draft" timed out waiting for `proposal-draft-override-drawer`
reproduction: Run `PYTHONPATH=apps/api pytest tests/api/test_templates_rules_api.py tests/api/test_proposal_draft_api.py -q && pnpm exec tsc --noEmit tests/shared/phase7-contracts.assert.ts && pnpm exec playwright test tests/e2e/proposal-draft-workspace.spec.ts tests/e2e/templates-rules.spec.ts && pnpm lint` from a fresh local environment. Compare with `pnpm exec playwright test tests/e2e/proposal-draft-workspace.spec.ts tests/e2e/templates-rules.spec.ts --workers=1`.
started: Observed in Phase 07 UAT validation; fresh boot succeeds but the documented full validation command is not green under the default parallel Playwright worker configuration.

## Eliminated

## Evidence

- timestamp: 2026-04-14T03:12:43Z
  checked: tests/e2e/helpers/discovery.ts and tests/e2e/proposal-draft-workspace.spec.ts
  found: `openProposalDraftWorkspaceWithDiscoveryReady()` already leaves the browser on Proposal Draft and waits for `Save current` before returning, but the failing test immediately does a second `page.goto(.../proposal-draft)` and then only calls `expectProposalDraftShell()`.
  implication: The test reintroduces an unnecessary page load after the helper has already established a ready proposal-draft state.

- timestamp: 2026-04-14T03:12:43Z
  checked: reproduced failure trace (`test-results/e2e-proposal-draft-workspa-d2099-hout-leaving-proposal-draft/trace.zip`)
  found: Right before the click and visibility assertion, the captured DOM still shows Proposal Draft in loading state: chips read `Loading workspace`, rules summary rows show `Loading current rule stack`, and `data-drawer-open="false"`; `Edit override` is present even though the ready chapter workspace has not finished loading.
  implication: `expectProposalDraftShell()` is not a readiness barrier for this test. Under slower parallel execution, the click lands while the page is still loading, so the test races the client-side state needed to open the drawer.

- timestamp: 2026-04-14T03:12:43Z
  checked: control runs
  found: The same test passes alone with `--workers=1`, and the same two spec files pass together with `--workers=1`; the default two-worker run fails reproducibly on the first proposal-draft interaction after the redundant reload.
  implication: Parallel workers are exposing a timing hole in the test, not a broken proposal-draft override feature or backend data collision.

- timestamp: 2026-04-14T03:07:12Z
  checked: `pnpm exec playwright test tests/e2e/proposal-draft-workspace.spec.ts tests/e2e/templates-rules.spec.ts`
  found: The default Playwright run reproduced the exact issue: 20 tests started with 2 workers, the proposal-draft test at line 86 failed waiting for `proposal-draft-override-drawer`, and the remaining proposal-draft tests in that file were skipped while 6 tests had already passed.
  implication: The UAT gap is real and reproducible under the documented command's default worker configuration; diagnosis can now focus on why the proposal-draft page differs under concurrent file execution.

- timestamp: 2026-04-14T03:05:35Z
  checked: .planning/phases/07-proposal-draft-templates-rules/07-UAT.md and 07-VALIDATION.md
  found: The documented full Phase 7 command runs the two Playwright spec files together with default worker settings; the UAT gap already records that the command is only stable with `--workers=1`.
  implication: The failure scope is the default Playwright multi-worker execution of these two files, not the API, contract, or lint stages.

- timestamp: 2026-04-14T03:05:35Z
  checked: tests/e2e/proposal-draft-workspace.spec.ts
  found: The failing test waits for `proposal-draft-override-drawer` immediately after clicking `Edit override`; the failure occurs before the override save/delete requests and before any Templates & Rules navigation.
  implication: Root cause is in opening the drawer or reaching the ready proposal-draft state, not in later override persistence logic.

- timestamp: 2026-04-14T03:05:35Z
  checked: apps/web/components/opportunities/proposal-draft-workspace.tsx and proposal-draft-override-drawer.tsx
  found: The drawer only renders when `drawerMode === "override"`, and `openOverrideDrawer()` sets that state immediately before asynchronously loading templates, override data, and rules summary.
  implication: If the drawer never appears, either the click is not hitting a usable Proposal Draft UI state or page/app state is being disrupted before/while that local state transition occurs.
## Resolution

root_cause: The failing Phase 7 UAT command is blocked by a Playwright test race in `tests/e2e/proposal-draft-workspace.spec.ts`, not by the Proposal Draft feature itself. The helper `openProposalDraftWorkspaceWithDiscoveryReady()` already returns on a ready Proposal Draft page, but the test performs a second `page.goto()` to the same route. After that reload, `expectProposalDraftShell()` only verifies shell-level elements that also exist during loading. In the default two-worker run, concurrent spec execution slows the route enough that the test clicks `Edit override` while Proposal Draft is still in its loading shell, so the override drawer is never observed and the assertion times out.
fix: `tests/e2e/helpers/discovery.ts` now exports `expectProposalDraftReady()` and `openProposalDraftWorkspaceWithDiscoveryReady()` waits for the real ready workspace; `tests/e2e/proposal-draft-workspace.spec.ts` removed redundant helper-then-reload flows and waits for the shared ready barrier before interacting with ready-only controls.
verification: The exact documented Phase 7 validation command passed after the repair: `PYTHONPATH=apps/api pytest tests/api/test_templates_rules_api.py tests/api/test_proposal_draft_api.py -q && pnpm exec tsc --noEmit tests/shared/phase7-contracts.assert.ts && pnpm exec playwright test tests/e2e/proposal-draft-workspace.spec.ts tests/e2e/templates-rules.spec.ts && pnpm lint`.
files_changed:
  - tests/e2e/helpers/discovery.ts
  - tests/e2e/proposal-draft-workspace.spec.ts
