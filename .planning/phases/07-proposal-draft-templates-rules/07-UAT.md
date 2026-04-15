---
status: complete
phase: 07-proposal-draft-templates-rules
source: [07-05-SUMMARY.md, 07-06-SUMMARY.md, 07-07-SUMMARY.md, 07-08-SUMMARY.md, 07-09-SUMMARY.md]
started: 2026-04-14T03:00:54Z
updated: 2026-04-15T00:03:15Z
---

## Current Test

[testing complete]

## Tests

### 1. Cold Start Smoke Test
expected: |
  Stop the existing app processes, boot API and Web fresh, and confirm the product comes back cleanly. The API health endpoint should return `ok`, the web auth entry should respond, and the Phase 7 browser flows should run against this fresh boot rather than a warm leftover state.
result: pass

### 2. Proposal Draft Desktop Workspace Shell
expected: |
  Opening Proposal Draft from a ready opportunity should show the shipping desktop workspace: rules summary bar, chapter editing stage, primary save/version/regenerate actions, secondary versions/copy/export actions, and no horizontal overflow across the supported desktop widths.
result: pass

### 3. Opportunity Override Drawer and Local Rule Changes
expected: |
  Clicking `Edit override` from Proposal Draft should open the opportunity-local override drawer in place, allow template and terminology changes, and refresh the visible rules summary without leaving the draft route.
result: pass

### 4. Templates & Rules Baseline Editor and Return Path
expected: |
  The global Templates & Rules page should expose the grouped baseline editor, validation/success/error states, and preserve the explicit return path back into Proposal Draft without collapsing workspace baseline and opportunity override boundaries.
result: pass

### 5. Version Preview, Restore, and Regenerate Protection
expected: |
  Proposal Draft should support save current, save version, previewing a saved version before restore, explicit restore confirmation, and section regenerate that warns before replacing unsaved chapter edits.
result: pass

### 6. Empty and Dependency-Blocked Proposal Draft States
expected: |
  A ready opportunity with no current draft should show the empty Proposal Draft state and `Generate draft` CTA, while missing Lead Brief or missing Discovery should show backend-backed blocked guidance with the correct recovery navigation.
result: pass

### 7. Warning and Restriction States
expected: |
  Proposal Draft should show low-confidence, rules-conflict, billing-restricted, loading, and error/retry states through the page status band and local chapter markers without breaking the desktop workspace hierarchy.
result: pass

### 8. Copy and Export User Flows
expected: |
  `Copy all` should preserve chapter order and show recovery guidance when clipboard access is blocked. Export should produce both text and markdown downloads from the current draft flow.
result: pass

### 9. Documented Full Phase 7 Validation Command
expected: |
  The documented full validation command from `07-VALIDATION.md` should run green from a fresh local environment: API regressions, Phase 7 contract check, Playwright Proposal Draft + Templates & Rules browser specs, and lint should all pass in one command.
result: pass

## Summary

total: 9
passed: 9
issues: 0
pending: 0
skipped: 0
blocked: 0

## Gaps

- truth: "The documented full Phase 7 validation command should complete green from a fresh local environment."
  status: resolved
  reason: "Proposal Draft browser coverage now waits for the real ready workspace, and the exact full Phase 7 validation command passed under the default two-worker Playwright run."
  severity: major
  test: 9
  root_cause: "The failing Proposal Draft test re-navigates to the same route after the ready-state helper has already finished, then uses a shell-level readiness check that passes while the page is still loading. Under the default two-worker browser run, that timing hole lets the test click `Edit override` before Proposal Draft reaches `workspaceState = ready`, so the drawer assertion times out even though the feature itself still works."
  artifacts:
    - path: "tests/e2e/proposal-draft-workspace.spec.ts"
      issue: "The override-drawer test reloads Proposal Draft unnecessarily and only waits for shell visibility before interacting."
    - path: "tests/e2e/helpers/discovery.ts"
      issue: "The helper already returns on a ready Proposal Draft page, making the second navigation redundant."
    - path: "apps/web/components/opportunities/proposal-draft-workspace.tsx"
      issue: "The rules bar is visible during loading, so button visibility is weaker than actual workspace readiness."
    - path: "playwright.config.ts"
      issue: "Default file-level parallel execution exposes the test timing hole."
  missing:
    - "None."
  debug_session: ".planning/debug/phase-07-uat-gap-parallel-pw.md"

- truth: "The documented full Phase 7 validation command should complete green from a fresh local environment."
  status: resolved
  reason: "Workspace rules validation now seeds template definitions before checking template keys, so the fresh-database API regression suite no longer fails with a false invalid-template error."
  severity: major
  test: 9
  root_cause: "validate_workspace_rule_set_payload() required an existing template definition before the validation path had seeded the frozen template set, so a clean database rejected the valid `development_agency` template key during `/workspaces/current/rules/validate`."
  artifacts:
    - path: "apps/api/app/templates_rules_service.py"
      issue: "The workspace rules validation flow read template definitions before calling ensure_template_definitions on a fresh database."
    - path: "tests/api/test_templates_rules_api.py"
      issue: "The validation regression expected required-sections guidance but hit invalid_template_key first on a clean database."
  missing:
    - "Seed template definitions before validating workspace rule template keys."
  debug_session: ""
