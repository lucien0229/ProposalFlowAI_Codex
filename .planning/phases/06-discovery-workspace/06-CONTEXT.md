# Phase 6: Discovery Workspace - Context

**Gathered:** 2026-04-11
**Status:** Ready for planning

<domain>
## Phase Boundary

Turn the opportunity's notes, transcripts, and extracted intake material into proposal-ready discovery intelligence with visible ambiguity, risk, and evidence quality. This phase must feel like a real shipping workspace for user work, not a transcript viewer, chatbot, or document preview.

This phase includes:
- the Discovery route and stepper entry
- discovery input capture inside the opportunity context
- structured output for goals, constraints, ambiguities, risk flags, and follow-up questions
- generate, regenerate, save current, save-version, list versions, preview, and restore
- explicit weak-evidence feedback and overwrite protection

This phase does **not** include:
- Proposal Draft rules or chapter editing
- rules editing
- billing enforcement beyond shared notices
- admin-like analytics or collaboration surfaces

</domain>

<decisions>
## Implementation Decisions

### Workspace shape and page feel
- **D-01:** Discovery must be a structured evidence workspace, not a transcript dump and not a chat UI.
- **D-02:** Use the existing opportunity shell and stepper framing from earlier phases; Discovery stays a sub-workflow under the opportunity container.
- **D-03:** Keep the dark product language from `docs/design/DESIGN.md`, expressed as a dense editor/workbench rather than a marketing or dashboard composition.
- **D-04:** The desktop default layout should stay source-left / output-right so source material and synthesized judgment are visually separated.
- **D-05:** The source pane is read-first and provenance-preserving; the output pane is the active working surface.

### Discovery content model
- **D-06:** Discovery output must center on the frozen page-spec fields: goals, constraints, ambiguities, risk flags, and follow-up questions.
- **D-07:** Each output field should be clearly attributable to source evidence, inferred judgment, or a missing-evidence warning.
- **D-08:** Discovery should make it obvious when the model is summarizing, inferring, or flagging uncertainty.
- **D-09:** Evidence snippets and short rationale lines are required in the UI so users can audit why a field exists.
- **D-10:** The page must keep source context visible while the user edits or reviews the structured output.

### Input capture and source handling
- **D-11:** Discovery input capture should accept opportunity-context notes and transcript/excerpt material as working source, but it should stay lightweight and not become a separate research tool.
- **D-12:** Existing intake material, uploaded PDFs, and any extracted text remain part of the source context.
- **D-13:** Discovery input capture should support user-authored notes that feed the same opportunity context rather than fragmenting the workflow into separate documents.

### Current resource and version semantics
- **D-14:** Treat the current Discovery result as a mutable working copy with one authoritative current resource per opportunity.
- **D-15:** Persist version history as immutable full-resource snapshots, not diffs.
- **D-16:** `Save Current` updates the current working copy only; it does not create a new immutable history row.
- **D-17:** `Save Version` is the explicit "keep this state" action and creates a snapshot in version history.
- **D-18:** `Restore` replaces the current working copy with the selected version and must never auto-create a new history row.
- **D-19:** If the user wants to preserve the pre-restore state, they must save a version first; the UI must not preserve it silently.

### History, preview, and restore UX
- **D-20:** Version history should open in a right-side drawer on desktop so users can inspect versions without leaving the workspace.
- **D-21:** The history surface should support list -> preview -> restore inside the same drawer instead of sending users to another page.
- **D-22:** Restore must use an explicit confirmation step that clearly names overwrite risk before mutating the current working copy.
- **D-23:** Preview is read-only and should stay lightweight; no complex diff view in MVP.

### Regenerate and overwrite protection
- **D-24:** Regenerate stays whole-resource in MVP; no field-by-field or section-level regenerate in this phase.
- **D-25:** Regenerate must not silently overwrite user edits. If edits exist, the UI must explain the overwrite risk and require explicit confirmation.
- **D-26:** Save and regenerate flows should be guarded by optimistic concurrency so stale working copies do not overwrite newer server state without warning.
- **D-27:** On concurrency conflict, prefer a conservative failure state with refresh guidance over automatic merging or silent replacement.

### Evidence quality and weak-input behavior
- **D-28:** `Goals`, `Constraints`, `Ambiguities`, `Risk flags`, and `Follow-up questions` are all first-class output states, not optional annotations.
- **D-29:** `Needs more evidence` must be a visible product state when the source is too thin to support a reliable discovery output.
- **D-30:** Weak evidence should soft-block progress with clear guidance, not collapse the page into a dead-end error state.
- **D-31:** If no usable source exists at all, generation can be hard-blocked; otherwise the page should allow continued work while marking uncertainty explicitly.

### Dependency and handoff handling
- **D-32:** `Continue to Proposal Draft` should remain visible as the next-step handoff, but it should only be actionable when the Discovery current resource is usable.
- **D-33:** Dependency and restriction notices must explain the specific missing evidence or workspace restriction in product language.

### Product-quality constraints
- **D-34:** The page must feel production-ready for English-first B2B usage: clear labels, dense but readable spacing, strong keyboard accessibility, and no landing-page styling.
- **D-35:** Do not introduce mobile/tablet product-design scope in this phase; discovery should ship as desktop/laptop web quality only.
- **D-36:** Avoid admin-like analytical framing, charts, or collaboration features.

### the agent's Discretion
- Exact microcopy, iconography, spacing, and motion polish inside the locked page structure.
- The precise visual density of the source/output split and version drawer, as long as the hierarchy stays obvious.
- The exact wording for thin-evidence states, as long as it stays explicit and action-oriented.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Roadmap and project constraints
- `.planning/ROADMAP.md` — Phase 6 scope, outputs, acceptance, and no-scope-creep boundary.
- `.planning/PROJECT.md` — Product positioning, customer-side MVP rules, and the shipping-UI requirement.
- `.planning/REQUIREMENTS.md` — `DISC-01`, `DISC-02`, and traceability constraints.
- `.planning/phases/01-foundation-repo-infra-ui-baseline/01-CONTEXT.md` — Locked foundation decisions about shells, route boundaries, shared contracts, and dark product UI.
- `.planning/phases/03-dashboard-opportunities-list/03-CONTEXT.md` — Customer shell, workflow-console language, and task-oriented product expectations.
- `.planning/phases/05-lead-brief-workspace/05-CONTEXT.md` — Versioning, restore, overwrite-protection, and structured workspace patterns that Discovery must continue.

### Product and UX docs
- `docs/web/ProposalFlow AI｜页面清单与页面级需求 v1.0.md` — Discovery page blocks, actions, and state expectations.
- `docs/web/ProposalFlow_AI_客户侧_页面设计Brief_v1.2.md` — Frozen customer-side visual/interaction brief, especially the workflow workspace rules.
- `docs/web/ProposalFlow AI｜页面流程与信息架构说明 v1.0.md` — Opportunity sub-workflow routing, dependency semantics, and version/restore flows.
- `docs/web/ProposalFlow AI｜PRD v1.0（MVP）.md` — Product promise and opportunity-centered workflow context.

### Shared architecture and implementation seams
- `docs/share/ProposalFlow AI｜系统架构与技术方案 v1.0.md` — Workspace resource model, version history semantics, and modular-monolith constraints.
- `docs/share/ProposalFlow AI｜数据库设计 v1.0.md` — Current-resource and version-snapshot persistence expectations.
- `packages/shared-config/index.ts` — Route and API contract constants already in use for opportunity workflow surfaces.
- `packages/shared-types/index.ts` — Shared state vocabulary and opportunity step/status enums.

### Current code seams
- `apps/web/app/opportunities/[opportunityId]/[step]/page.tsx` — The current step route seam that will need to branch into the real Discovery workspace.
- `apps/web/components/product-shell.tsx` — The shell structure Discovery should continue using.
- `apps/web/components/opportunities/lead-brief-workspace.tsx` — The nearest reusable pattern for current-resource, drawer, and version semantics.
- `apps/api/app/opportunity_service.py` — Opportunity step/readiness and restriction context that Discovery should continue to surface.

### Visual baseline
- `docs/design/DESIGN.md` — The only frozen customer-facing UI design contract and the dark product baseline.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- The opportunity shell, global nav, skip-link, and shared product-state block already exist in `apps/web`.
- Phase 5 already established the current-resource and version-history interaction model through the Lead Brief workspace.
- Shared route and API constants already expose the discovery route segment and the surrounding opportunity workflow paths.

### Established Patterns
- The product uses server-side bootstrap for guarded routes and client-side surfaces for rich editing.
- Shared state vocabularies already exist for loading, empty, blocked, retry, success, and error.
- The product language is already workflow-first, dark, and task-oriented rather than analytics-heavy.

### Integration Points
- `apps/web` will need a real Discovery workspace page and supporting client components.
- `apps/api` will need discovery read/update/save-version/versions/restore endpoints and optimistic concurrency behavior.
- `apps/api` and the persistence layer will need current-resource plus immutable version-snapshot records.
- `apps/web` should keep the stepper entry and route guard behavior consistent with earlier phases.

</code_context>

<specifics>
## Specific Ideas

- Discovery should read like judgment built from evidence, not like a model-generated summary dump.
- Source text, excerpts, and notes should stay visible while the user reviews the structured output.
- Version history should be discoverable without leaving the workspace, but restoring should never feel casual.
- Thin evidence should be an explicit state with guidance, not a silent failure or ambiguous AI answer.
- `ui-ux-pro-max` results were useful only insofar as they reinforced loading/empty/error discipline; the final visual direction should still be dominated by `docs/design/DESIGN.md` and the frozen product docs.

</specifics>

<deferred>
## Deferred Ideas

### Reviewed Todos (not folded)
None — no todo matches were surfaced during this discussion.

### Deferred ideas
- Field-level diff views between versions can be added later if users need deeper inspection.
- Finer-grained regenerate belongs to a later phase and should not be pulled into the Discovery MVP.
- Multi-party collaboration, comments, or annotation features are not part of this phase.
- Analytics-style visualizations are explicitly out of scope for this workspace.

</deferred>

---

*Phase: 06-Discovery Workspace*
*Context gathered: 2026-04-11*
