# Phase 7: Proposal Draft + Templates & Rules - Context

**Gathered:** 2026-04-13
**Status:** Ready for planning

<domain>
## Phase Boundary

Ship the product's signature drafting surface: a rule-constrained, editable, versioned Proposal Draft workspace plus a separate Templates & Rules page for workspace-level defaults. This phase must turn structured upstream inputs into a proposal-ready draft users can actively work from, while keeping rule provenance, overwrite risk, confidence, and restrictions visible in-product.

This phase includes:
- the Proposal Draft route inside the opportunity workflow
- the Templates & Rules global route for workspace baseline rule editing
- effective rules visibility, opportunity-level override editing, and template selection
- proposal draft generate/read/update, chapter editing, chapter-level regenerate, save current, save-version, versions, restore, copy, and export
- low-confidence, missing-input, rules-conflict, and billing/restriction states

This phase does **not** include:
- e-sign, quoting, payment collection, or contract execution
- template marketplace patterns, recommendation engines, or admin-style control surfaces
- mobile/tablet product experience
- follow-up generation itself beyond keeping the handoff visible

</domain>

<decisions>
## Implementation Decisions

### Workspace continuity and product standard
- **D-01:** Proposal Draft remains an `opportunity` sub-workflow under the existing opportunity shell and stepper; it is not promoted into a separate top-level product area.
- **D-02:** Templates & Rules remains a global customer-shell page used only for workspace baseline rules; it must not absorb opportunity-local override editing.
- **D-03:** Carry forward the Phase 5 / Phase 6 product standard: current resource, immutable version history, explicit restore confirmation, no silent overwrite, workflow-first dark UI, and desktop/laptop-only quality.
- **D-04:** The page must feel like a shipping drafting workspace, not a black-box AI generator, report preview, landing page, or admin console.

### Rule layering and template semantics
- **D-05:** The effective rule stack is fixed as: template definition -> workspace rule set -> opportunity rule override -> current draft manual edits.
- **D-06:** Switching template from inside Proposal Draft creates or updates the current opportunity override only; it must not silently rewrite workspace baseline rules.
- **D-07:** Saving inside Templates & Rules updates the workspace baseline rule set only; it must not silently write back into the current opportunity override layer.
- **D-08:** Any change at either layer must immediately refresh the visible `effective rules` summary in Proposal Draft so users can see which rule source is active.
- **D-09:** Opportunity-local overrides must stay minimal and contextual; Proposal Draft should expose only the smallest override surface needed to correct the current opportunity.

### Proposal Draft information hierarchy
- **D-10:** Proposal Draft should not reuse the always-visible source-left / output-right split from Lead Brief and Discovery as its primary layout.
- **D-11:** The default desktop layout is: top `Rules Summary Bar`, central chapter-editing main stage, and a right-side on-demand context drawer for versions, override editing, and risk/confidence details.
- **D-12:** The central drafting surface must dominate the viewport because the primary task has shifted from reviewing source material to editing and refining proposal chapters.
- **D-13:** The top control area must keep `current template`, effective-rules summary, assumptions/exclusions preview, tone preview, terminology summary, and `override active` visibly connected to generation.
- **D-14:** The page should keep rules visible enough to prevent black-box generation, but must not collapse into a control-panel jungle.

### Draft structure and chapter editing
- **D-15:** The draft structure is fixed to the frozen MVP chapter set: `Executive Summary`, `Objectives`, `Recommended Approach`, `Deliverables`, `Timeline`, `Assumptions`, `Exclusions`, and `Next Steps / CTA`.
- **D-16:** `Assumptions` and `Exclusions` must remain first-class standalone chapters, not helper text or collapsed metadata.
- **D-17:** Users must be able to edit any chapter in place as part of the current working resource.
- **D-18:** Proposal Draft generation must be structured-first: Lead Brief + Discovery + Template + Effective Rules compose the draft; raw long-form input is never the direct drafting source.

### Regenerate, overwrite, and version semantics
- **D-19:** Chapter-level regenerate is the primary regenerate path in this phase; it replaces only the selected chapter and never silently mutates sibling chapters.
- **D-20:** If the targeted chapter has unsaved edits, chapter regenerate must require either `Save Current` first or an explicit overwrite confirmation before replacement.
- **D-21:** Whole-draft regenerate stays available, but as a secondary high-risk action with calmer, less prominent placement than chapter actions.
- **D-22:** Whole-draft regenerate must use stronger overwrite-risk language than chapter regenerate because its blast radius is larger.
- **D-23:** `Save Current`, `Save Version`, preview, restore, and optimistic concurrency behavior must follow the Phase 5 / Phase 6 model rather than inventing a new resource model here.
- **D-24:** If users want to preserve the pre-restore or pre-regenerate state, the product should direct them to save a version first; the system must not auto-preserve silently.

### State, conflict, and restriction visibility
- **D-25:** `low confidence`, `rules conflict`, `missing inputs`, and `billing restriction` must use a two-layer expression model.
- **D-26:** The first layer is a page-level status band that explains why generation, export, or progression is unsafe or blocked right now.
- **D-27:** The second layer is localized chapter or module markers that identify only the affected parts of the draft; do not turn the whole page into a wall of warnings.
- **D-28:** Status meaning must never depend on toast-only feedback; risk and restriction states must remain visible in the workspace itself.
- **D-29:** In billing-restricted states (`trial_expired`, `past_due`, `canceled`, `inactive`), the page remains viewable but must block `generate`, `regenerate`, `save current`, `save-version`, `restore`, and `export`, while clearly pointing to Billing actions.

### Templates & Rules page shape
- **D-30:** Templates & Rules is a modular configuration page, not a marketplace, not a library browser, and not a giant flat form.
- **D-31:** Its primary editing groups remain: `Template Basics`, `Assumptions & Exclusions`, `Tone & Terminology`, and `Sections & Modules`.
- **D-32:** The page must make the connection back to Proposal Draft obvious, especially which saved baseline rules will affect later generation.
- **D-33:** Returning from Templates & Rules to the current Proposal Draft must preserve current opportunity context and make the refreshed effective rules visible immediately.

### Product-quality constraints
- **D-34:** UI direction must continue `docs/design/DESIGN.md` and the prior workspace contracts: dark-mode-native, dense-but-readable, restrained accent use, keyboard-visible, and English-first B2B.
- **D-35:** `ui-ux-pro-max` output is useful only for hierarchy, accessibility, and dense-form discipline; do not adopt its landing-page patterns, light palette suggestions, or editorial serif direction for this phase.
- **D-36:** This phase is the highest-visibility customer surface so any spec-like copy, placeholder panels, or control-panel sprawl should be treated as product failures, not polish debt.

### the agent's Discretion
- Exact microcopy, iconography, spacing, and motion polish inside the locked workspace hierarchy.
- Whether the right-side context surface is one multi-mode drawer or a tightly related set of drawers, as long as versions, override editing, and risk context remain secondary to chapter editing.
- The precise visual treatment of chapter-local warnings and confidence markers, as long as they stay calmer than destructive alerts and remain readable in dense drafting flows.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Roadmap and project constraints
- `.planning/ROADMAP.md` — Phase 7 scope, outputs, acceptance, route contracts, and no-scope-creep boundary.
- `.planning/PROJECT.md` — Product positioning, customer-side MVP rules, shipping-UI requirement, and desktop/laptop-only constraint.
- `.planning/REQUIREMENTS.md` — `RULE-01`, `PROP-01`, `PROP-02`, and the shared restriction/state expectations.
- `.planning/phases/01-foundation-repo-infra-ui-baseline/01-CONTEXT.md` — Locked foundation decisions about shell language, route boundaries, shared contracts, and dark product UI.
- `.planning/phases/03-dashboard-opportunities-list/03-CONTEXT.md` — Global customer shell, action-first product language, and Templates & Rules as a stable primary-nav surface.
- `.planning/phases/05-lead-brief-workspace/05-CONTEXT.md` — Current-resource, version, restore, and overwrite-protection semantics Proposal Draft must continue.
- `.planning/phases/06-discovery-workspace/06-CONTEXT.md` — Source-to-judgment workspace patterns, dependency handoff rules, and version semantics Proposal Draft inherits.

### Product and UX docs
- `docs/web/ProposalFlow AI｜页面清单与页面级需求 v1.0.md` — W10 Proposal Draft and W12 Templates & Rules page blocks, actions, states, and acceptance.
- `docs/web/ProposalFlow AI｜页面流程与信息架构说明 v1.0.md` — Opportunity-centered routing, Templates & Rules return flow, override flow, and restriction behavior across workflow pages.
- `docs/web/ProposalFlow AI｜PRD v1.0（MVP）.md` — Core product promise, rule hierarchy, structured-first drafting model, and required chapter set.
- `docs/web/ProposalFlow_AI_客户侧_页面设计Brief_v1.2.md` — Frozen Proposal Draft / Templates & Rules interaction expectations, unified component list, exception states, and visibility rules.
- `docs/web/ProposalFlow AI｜API 设计 v1.0.md` — Proposal Draft export, rule override, effective-rules, templates, concurrency, and restriction endpoint expectations.
- `docs/web/ProposalFlow AI｜MVP 功能清单 v1.0.md` — P0/P1 split and first-release boundary for drafting/rules surfaces.

### Shared architecture and data rules
- `docs/share/ProposalFlow AI｜系统架构与技术方案 v1.0.md` — Structured-first drafting pipeline, rule interpretation in the backend application layer, sync-vs-async generation posture, and effective-rules semantics.
- `docs/share/ProposalFlow AI｜数据库设计 v1.0.md` — Current-resource, immutable version snapshots, and persistence expectations for proposal draft, rules, and overrides.
- `docs/share/ProposalFlow AI 开发骨架与目录结构设计说明 v1.0.md` — Module boundaries for `proposal_draft/` and `templates_rules/`, plus ownership of export and rule computation.

### Current code seams
- `packages/shared-config/index.ts` — Current route constants, opportunity step segments, and the absence of Phase 7 API helpers that must now be added explicitly.
- `packages/shared-types/index.ts` — Existing workflow step enums and opportunity status language that already reference `proposal_draft`.
- `apps/web/app/opportunities/[opportunityId]/[step]/page.tsx` — Current opportunity-step route seam where Proposal Draft must branch into a real workspace.
- `apps/web/app/templates-rules/page.tsx` — Existing placeholder route proving Templates & Rules already lives in the real product shell and now needs productized replacement.
- `apps/web/components/product-nav.tsx` — Stable global navigation that already exposes Templates & Rules as a primary customer surface.
- `apps/web/components/opportunities/lead-brief-workspace.tsx` — The nearest reusable pattern for current-resource editing, optimistic saves, and version-drawer behavior.
- `apps/web/components/opportunities/discovery-workspace.tsx` — The nearest reusable pattern for structured-output editing, generation gating, and next-step handoff logic.
- `apps/api/app/discovery_routes.py` — Current versioned workspace API shape, conflict responses, and browser-CSRF mutation pattern Phase 7 should mirror.
- `apps/api/app/opportunity_routes.py` — Existing lead-brief generation seam and opportunity-guard behavior around workflow transitions.
- `apps/api/app/opportunity_service.py` — Current opportunity-step readiness and status-to-step mapping that Proposal Draft must extend cleanly.
- `apps/web/lib/lead-brief-api.ts` — Existing client API pattern for current-resource workspaces.
- `apps/web/lib/discovery-api.ts` — Existing client API pattern for versioned generation, save, restore, and gate-aware workspace flows.

### Visual baseline
- `docs/design/DESIGN.md` — The only frozen customer-facing UI design contract and the authoritative dark product baseline.
- `.planning/phases/05-lead-brief-workspace/05-UI-SPEC.md` — The strongest existing visual/interaction reference for a dense, versioned workspace with explicit overwrite protection.
- `.planning/phases/06-discovery-workspace/06-UI-SPEC.md` — The strongest existing visual/interaction reference for evidence-aware structured output and visible state handling.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `ProductShell`, `product-nav`, and shared guarded-route bootstrap already exist and should continue to frame both Proposal Draft and Templates & Rules.
- Lead Brief and Discovery already implement the mutable current-resource + immutable version-list pattern, including optimistic concurrency and explicit restore confirmation.
- Shared opportunity-step routing already recognizes `proposal_draft`, so the web app has a natural insertion seam for a real Phase 7 workspace.
- The Templates & Rules route already exists as a placeholder inside the real shell, which reduces IA risk and keeps navigation stable.

### Established Patterns
- Customer workflow pages use server-side route bootstrap plus client-side rich workspace surfaces.
- Browser mutations use explicit CSRF-protected API calls and conservative conflict responses rather than silent merges.
- Shared state handling already expects `loading`, `empty`, `error`, `blocked`, `retry`, and `success` as real page states.
- Prior workspaces favor calm inline notices and drawer-based version inspection over full-page detours.

### Integration Points
- `apps/web/app/opportunities/[opportunityId]/[step]/page.tsx` needs a real Proposal Draft branch and its supporting client components.
- `apps/web/app/templates-rules/page.tsx` needs to be replaced with the workspace-baseline rule editor while preserving global-shell behavior.
- `packages/shared-config` and `packages/shared-schemas` need Phase 7 route helpers and request/response contracts for templates, effective rules, overrides, proposal draft resource operations, section regenerate, and export.
- `apps/api` needs new `proposal_draft` and `templates_rules` modules or equivalent route/service seams rather than burying rule logic in generic opportunity handlers.
- Billing restriction behavior from later phases is not implemented yet, but Phase 7 must already expose the UI and API seams needed to honor blocked actions consistently.

</code_context>

<specifics>
## Specific Ideas

- Proposal Draft should feel like the first page where users are truly shaping customer-facing output, so the editing stage must visually outrank provenance and control surfaces.
- Rules should stay visible as guardrails, not hidden in settings, but they should read as drafting context rather than admin configuration noise.
- Template switching inside Proposal Draft should feel like "adjusting this opportunity's drafting lens," not "reprogramming the whole workspace."
- The right-side context surface is the right place for versions, override editing, and secondary risk detail because these are essential but not the main act.
- `ui-ux-pro-max` guidance reinforced three useful principles only: keep a consistent type scale, label dense form controls explicitly, and preserve accessible heading/focus structure. Its suggested landing-page patterns, palette shifts, and editorial-font choices are explicitly rejected for this phase.

</specifics>

<deferred>
## Deferred Ideas

- Template marketplace, recommendation engines, or template browsing experiences beyond frozen defaults.
- Diff-heavy compare views between proposal versions or between regenerated chapters.
- Collaborative comments, approvals, or multi-user annotation inside the draft.
- E-sign, quoting, payment capture, or post-proposal commercial workflows.
- Mobile/tablet-specific drafting UX.

</deferred>

---

*Phase: 07-proposal-draft-templates-rules*
*Context gathered: 2026-04-13*
