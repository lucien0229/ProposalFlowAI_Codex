# Phase 05: Lead Brief Workspace - Context

**Gathered:** 2026-04-10
**Status:** Ready for planning

<domain>
## Phase Boundary

Convert intake into a structured, editable, versioned Lead Brief that feels like a real shipping workspace, not a document preview or spec page.

This phase includes:
- the Lead Brief route and stepper entry
- a two-pane source/output workspace
- field-level states for `Confirmed`, `Inferred`, `Missing`, and `Needs Review`
- edit, confirm, regenerate, save current, save-version, list versions, preview, restore, and copy summary
- explicit overwrite protection, restore confirmation, and current-resource semantics

This phase does **not** include:
- Discovery intelligence
- Proposal Draft rules or sections
- finer-grained regenerate

</domain>

<decisions>
## Implementation Decisions

### Workspace shape and page feel
- **D-01:** The Lead Brief page must be a structured workflow workspace, not a long-form text editor and not a document preview page.
- **D-02:** Use the existing opportunity shell and stepper framing from earlier phases; Lead Brief is a sub-workflow under the opportunity container, not a new top-level surface.
- **D-03:** Keep the Phase 1 / Phase 3 dark product language from `docs/design/DESIGN.md`, but express it as a dense editorial workspace with strong source/output separation rather than a dashboard or marketing composition.
- **D-04:** The default layout should be a left source pane and right structured-output pane on desktop/laptop widths.
- **D-05:** The source pane is read-first and context-preserving; the output pane is the editable product surface.

### Lead Brief content model
- **D-06:** Lead Brief should expose a compact, judgment-oriented structure around the frozen page spec fields: client/company, contact, requested service, business context, urgency/timeline, budget signal, fit assessment, missing information, and recommended next step.
- **D-07:** Every field needs a visible status state from the locked set `Confirmed`, `Inferred`, `Missing`, and `Needs Review`.
- **D-08:** Field editing and field confirmation are both first-class interactions; confirmation is what turns raw or inferred content into user-approved brief content.
- **D-09:** Missing and needs-review states must remain visible in-product and must not be collapsed into generic warning text.
- **D-10:** The page should always make it obvious which parts came from source material and which parts are judgment or inference.

### Current resource and version semantics
- **D-11:** Treat the current Lead Brief as a mutable working copy with one authoritative current resource per opportunity.
- **D-12:** Persist version history as immutable full-resource snapshots, not diffs.
- **D-13:** `Save Current` updates the current working copy only; it does not create a new immutable history row.
- **D-14:** `Save Version` creates a deliberate snapshot in version history and is the user’s explicit “keep this state” action.
- **D-15:** `Restore` replaces the current working copy with the selected version and must never auto-create a new history row.
- **D-16:** If the user wants to preserve the pre-restore state, they must save a version first; do not auto-preserve silently.

### History, preview, and restore UX
- **D-17:** Version history should open in a right-side drawer on desktop so users can inspect versions without leaving the current workspace.
- **D-18:** The history surface should support list → preview → restore flow inside the same drawer rather than sending users to a separate page.
- **D-19:** Restore must use an explicit confirmation step that clearly names overwrite risk before mutating the current working copy.
- **D-20:** Preview is read-only and should make it easy to compare the selected version mentally against the current workspace without introducing a complex diff view in MVP.
- **D-21:** Copy summary should copy the current structured brief summary, not the raw source text.

### Regenerate and overwrite protection
- **D-22:** Regenerate stays whole-resource in MVP; no field-by-field or section-level regenerate in this phase.
- **D-23:** Regenerate must not silently overwrite user edits. If edits exist, the UI must explain the overwrite risk and ask for explicit confirmation.
- **D-24:** Save and regenerate flows should be guarded by optimistic concurrency so stale working copies do not overwrite newer server state without warning.
- **D-25:** On concurrency conflict, prefer a conservative failure state with refresh/reload guidance over automatic merging or silent replacement.

### Status and dependency handling
- **D-26:** The page must surface `loading`, `empty`, `error`, `blocked`, `retry`, `success`, and `Needs Review` states as real product states, not as generic placeholders.
- **D-27:** `Continue to Discovery` should remain visible as the next-step handoff, but it should only be actionable when the Lead Brief has a usable current resource.
- **D-28:** If the page is empty because no Lead Brief exists yet, the primary action should be `Generate Lead Brief`; the empty state should not feel like an error.
- **D-29:** Blocked states must explain the specific missing dependency or overwrite risk in product language.

### Product-quality constraints
- **D-30:** The page must feel production-ready for English-first B2B usage: clear labels, dense but readable spacing, strong keyboard accessibility, and no landing-page styling.
- **D-31:** Do not introduce mobile/tablet product-design scope in this phase; lock the implementation to desktop/laptop web quality.
- **D-32:** Avoid adding any admin-like analytical framing, charts, or speculative collaboration features.

### the agent's Discretion
- Exact microcopy, iconography, spacing, and motion polish inside the locked page structure.
- The final visual density of the source/output split and the version drawer, as long as the hierarchy remains clear and the workspace stays credible.
- The exact conflict-state wording for concurrency failures, as long as it remains conservative and explicit.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Roadmap and project constraints
- `.planning/ROADMAP.md` — Phase 5 scope, outputs, acceptance, and no-scope-creep boundary.
- `.planning/PROJECT.md` — Product positioning, customer-side MVP rules, and the shipping-UI requirement.
- `.planning/REQUIREMENTS.md` — `STATE-01`, `BRIEF-01`, `BRIEF-02`, and traceability constraints.
- `.planning/phases/01-foundation-repo-infra-ui-baseline/01-CONTEXT.md` — Locked foundation decisions about shell language, route boundaries, shared contracts, and dark product UI.
- `.planning/phases/03-dashboard-opportunities-list/03-CONTEXT.md` — Customer shell, stepper expectations, and the action-first product language that Lead Brief must continue.

### Product and UX docs
- `docs/web/ProposalFlow AI｜页面清单与页面级需求 v1.0.md` — Lead Brief page blocks, actions, and state expectations.
- `docs/web/ProposalFlow_AI_客户侧_页面设计Brief_v1.2.md` — Customer-side page brief for W08 / Lead Brief Workspace and the no-silent-overwrite rule.
- `docs/web/ProposalFlow AI｜页面流程与信息架构说明 v1.0.md` — Opportunity sub-workflow routing, dependency semantics, and version/restore flows.
- `docs/web/ProposalFlow AI｜PRD v1.0（MVP）.md` — Product promise and opportunity-centered workflow context.

### Shared architecture and implementation seams
- `docs/share/ProposalFlow AI｜系统架构与技术方案 v1.0.md` — Workspace resource model, version history semantics, and modular-monolith constraints.
- `docs/share/ProposalFlow AI｜数据库设计 v1.0.md` — Current-resource and version-snapshot persistence expectations.
- `packages/shared-config/index.ts` — Route and API contract constants already in use for opportunity workflow surfaces.
- `packages/shared-types/index.ts` — Shared state vocabulary and opportunity step/status enums.

### Current code seams
- `apps/web/components/opportunities/opportunity-intake-surface.tsx` — Phase 4 handoff surface that currently redirects into `/opportunities/:opportunityId/lead-brief`.
- `apps/web/app/opportunities/[opportunityId]/[step]/page.tsx` — The current step route seam that will need to branch into the real Lead Brief workspace.
- `apps/api/app/opportunity_routes.py` — Existing lead-brief generate endpoint and opportunity guard behavior.
- `apps/api/app/opportunity_service.py` — Existing lead-brief generation semantics and blocked/redirect behavior.
- `apps/web/components/product-shell.tsx` — The shell structure Lead Brief should continue using.

### Visual baseline
- `docs/design/DESIGN.md` — The only frozen customer-facing UI design contract and the dark product baseline.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- The opportunity shell, global nav, skip-link, and shared product-state block already exist in `apps/web`.
- Phase 4 already established the lead-brief route seam by redirecting successful generation into `/opportunities/:opportunityId/lead-brief`.
- Shared route and API constants already expose lead-brief generate path helpers.

### Established Patterns
- The product uses server-side bootstrap for guarded routes and client-side surfaces for rich editing.
- Shared state vocabularies already exist for loading, empty, blocked, retry, success, and error.
- The product language is already workflow-first, dark, and task-oriented rather than analytics-heavy.

### Integration Points
- `apps/web` will need a real Lead Brief workspace page and supporting client components.
- `apps/api` will need lead-brief read/update/save-version/versions/restore endpoints and optimistic concurrency behavior.
- `apps/api` and the persistence layer will need current-resource plus immutable version-snapshot records.
- `apps/web` should keep the stepper entry and route guard behavior consistent with earlier phases.

</code_context>

<specifics>
## Specific Ideas

- The left pane should preserve source context and trust, while the right pane should feel like the active product area users work in.
- Version history should be discoverable without leaving the workspace, but restoring should never feel casual.
- The product should make it easy to understand whether a field is factual, inferred, missing, or still needs review.
- `ui-ux-pro-max` search output was not adopted literally because it drifted toward landing-page patterns; the frozen product docs and `DESIGN.md` should dominate the final UI direction.

</specifics>

<deferred>
## Deferred Ideas

### Reviewed Todos (not folded)
None — no todo matches were surfaced during this discussion.

### Deferred ideas
- Field-level diff views between versions can be added later if users need more inspection depth.
- Finer-grained regenerate belongs to a later phase and should not be pulled into the Lead Brief MVP.
- Multi-party collaboration / comments / annotation features are not part of this phase.

</deferred>

---

*Phase: 05-Lead Brief Workspace*
*Context gathered: 2026-04-10*
