---
phase: 05-lead-brief-workspace
plan: 00
type: plan
status: complete
depends_on:
  - "04"
requirements:
  - STATE-01
  - BRIEF-01
  - BRIEF-02
  - UI-01
  - UI-02
files_modified:
  - .planning/phases/05-lead-brief-workspace/05-01-PLAN.md
  - .planning/phases/05-lead-brief-workspace/05-02-PLAN.md
  - .planning/phases/05-lead-brief-workspace/05-03-PLAN.md
  - .planning/phases/05-lead-brief-workspace/05-04-PLAN.md
---

<objective>
Phase 05 converts opportunity intake into a production-grade Lead Brief workspace with a current resource, immutable version history, explicit restore flow, and desktop/laptop-only shipping UI.

The implementation must be test-first, web-app only, and productized end to end:
- shared contract and route normalization first
- backend current-resource + version-snapshot behavior second
- browser-verified workspace UI third
- restore, conflict recovery, and full regression last

The Lead Brief surface must follow the frozen context, research, and UI contract:
- two-pane source/output workspace
- `Confirmed` / `Inferred` / `Missing` / `Needs Review`
- manual `Save current` and deliberate `Save version`
- list → preview → confirm restore
- whole-resource regenerate only
- conservative optimistic concurrency failures
- no mobile/tablet scope
</objective>

<execution_context>
@/Users/wxm/.codex/get-shit-done/workflows/execute-plan.md
@/Users/wxm/.codex/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/STATE.md
@.planning/ROADMAP.md
@.planning/REQUIREMENTS.md
@.planning/phases/05-lead-brief-workspace/05-CONTEXT.md
@.planning/phases/05-lead-brief-workspace/05-RESEARCH.md
@.planning/phases/05-lead-brief-workspace/05-UI-SPEC.md
@docs/design/DESIGN.md
@/Users/wxm/.codex/skills/frontend-skill/SKILL.md
@/Users/wxm/.codex/skills/ui-ux-pro-max/SKILL.md
@/Users/wxm/.codex/superpowers/skills/test-driven-development/SKILL.md
</context>

<must_haves>
  <truths>
    - "Phase 05 is a shipping workspace, not a preview page or a report sheet."
    - "Lead Brief uses a dedicated current resource plus immutable full-snapshot version history."
    - "The public route slug is canonicalized to `lead-brief` and shared across web, API, and tests."
    - "Every mutating Lead Brief operation is guarded by `expected_revision_no` and fails conservatively on conflict."
    - "UI work must explicitly follow `05-UI-SPEC.md`, `docs/design/DESIGN.md`, and the `frontend-skill` workflow."
    - "UI work must also run the `ui-ux-pro-max` design-system search workflow before any browser-facing implementation."
    - "All browser coverage is desktop/laptop only at 1024px, 1280px, and 1440px."
  </truths>
  <artifacts>
    - path: ".planning/phases/05-lead-brief-workspace/05-01-PLAN.md"
      provides: "RED contract and route-normalization wave"
    - path: ".planning/phases/05-lead-brief-workspace/05-02-PLAN.md"
      provides: "Backend current-resource and version-snapshot implementation wave"
    - path: ".planning/phases/05-lead-brief-workspace/05-03-PLAN.md"
      provides: "RED browser spec and initial workspace UI wave"
    - path: ".planning/phases/05-lead-brief-workspace/05-04-PLAN.md"
      provides: "Version drawer, restore/conflict recovery, and final regression wave"
  </artifacts>
</must_haves>

<wave_breakdown>
1. `05-01-PLAN.md` freezes the shared contract, normalizes route slugs, and writes failing API tests.
2. `05-02-PLAN.md` implements the backend resource model, versioning, restore semantics, and API routes.
3. `05-03-PLAN.md` writes failing Playwright coverage and builds the browser workspace shell using the frozen UI contract.
4. `05-04-PLAN.md` finishes the version drawer, overwrite/conflict recovery, and final browser/API regression.
</wave_breakdown>

<verification_strategy>
- Each wave starts with a failing API or browser test before implementation work begins.
- API work is verified with `PYTHONPATH=apps/api pytest ...`.
- UI work is verified with Playwright at `1024px`, `1280px`, and `1440px`.
- Final sign-off requires current-resource reads, save current, save version, preview, restore confirmation, overwrite protection, reload/retry conflict handling, and loading/empty/error/blocked/retry/success coverage to all be green.
</verification_strategy>

<output>
After the wave files are written, return a concise summary of the wave breakdown and verification strategy.
</output>
