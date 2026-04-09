# Phase 3: Dashboard & Opportunities List - Context

**Gathered:** 2026-04-09
**Status:** Ready for planning

<domain>
## Phase Boundary

Deliver the first real customer command center after auth and workspace setup: a shipping `Dashboard` and `Opportunities` list that help users start new work, resume in-flight work, locate the right opportunity quickly, and understand what needs attention next.

This phase includes:
- the stable logged-in customer shell and primary navigation for global customer surfaces
- a dashboard that is action-first rather than analytics-first
- an opportunities list with search, filter, minimal sorting, archive/unarchive, and open behavior
- a new-opportunity entry point that hands users into the opportunity workflow
- backend/API support for dashboard summary, opportunity list/read models, archive mutations, and workflow summary metadata needed to resume the correct step

This phase does **not** include:
- intake editing depth beyond the entry handoff
- Lead Brief, Discovery, Proposal Draft, or Follow-up workspaces themselves
- admin analytics patterns, CRM-style heavy tables, or BI-dashboard scope creep

</domain>

<decisions>
## Implementation Decisions

### Product shell and navigation
- **D-01:** Phase 3 introduces the stable logged-in customer shell with primary navigation for `Dashboard`, `Opportunities`, `Templates & Rules`, `Billing`, and `Settings`.
- **D-02:** The customer shell must continue the Phase 1 Linear-inspired dark product language from `DESIGN.md`, but expressed as a workflow console rather than a landing-page or metrics-dashboard composition.
- **D-03:** Both dashboard and opportunities surfaces must feel like task-oriented product UI; they must remain credible if all route/API/spec notes are removed from the screen.

### Dashboard information hierarchy
- **D-04:** The dashboard first viewport prioritizes action and resumption: `New Opportunity` and `Continue Current Step` must be visible immediately without scrolling.
- **D-05:** Dashboard modules are fixed as: top action area, lightweight status overview, `Recent Opportunities`, `Needs Attention`, and a compact `Trial / Billing` card.
- **D-06:** `Needs Attention` carries more visual weight than summary numbers; the dashboard is a workflow entry page, not a BI board.
- **D-07:** The dashboard should surface only a small set of decision-support counts, not charts or dense analytics widgets.

### Opportunity creation and resume/open behavior
- **D-08:** `New Opportunity` should open a lightweight modal or drawer from Dashboard and Opportunities, capture only the minimum stable fields, create the record intentionally, and then redirect into `/opportunities/:opportunityId/overview`.
- **D-09:** The phase must avoid ghost opportunities created implicitly on page load or by accidental navigation; record creation should happen only after explicit confirmation.
- **D-10:** Resume behavior must deep-link to the opportunity's current actionable step, not always back to Overview.
- **D-11:** When an opportunity has no started downstream step yet, opening it should fall back to Overview / Lead Intake.

### Opportunities list model
- **D-12:** The opportunities list uses a compact workflow-list layout with row cards, not a CRM-grade spreadsheet and not a masonry/card gallery.
- **D-13:** On desktop, each row should show the smallest field set needed for judgment and reopening work: title, company, current step, status / attention indicator, updated time, and owner.
- **D-14:** On narrow widths, the same data collapses into stacked cards without losing search/filter/archive usability.
- **D-15:** Archive and unarchive remain explicit row-level actions and must update the current list view immediately.

### Search, filter, sort, and pagination
- **D-16:** Search in MVP remains narrow and fast: `title` and `company_name` only.
- **D-17:** Filtering is status-based plus an explicit archived toggle; do not introduce "assigned to me", complex owner filters, or CRM segmentation in Phase 3.
- **D-18:** Because the roadmap includes sort while the page/MVP docs demote it, Phase 3 ships a **minimal sort control** rather than a complex sort builder.
- **D-19:** Default ordering is `updated_at desc`, with at most 2-3 frozen sort presets exposed in the UI. Recommended presets: `Recently updated`, `Oldest updated`, `Recently created`.
- **D-20:** Opportunities list endpoints should use cursor-based pagination and explicit query params, and the frontend should preserve search/filter/sort state in the URL.

### Status, workflow summary, and attention semantics
- **D-21:** Dashboard cards and list rows must surface `current_step`, `workflow summary`, and `step readiness` from the backend rather than inferring progress purely from frontend heuristics.
- **D-22:** `Needs Attention` is reserved for actionable blockers: missing required intake input, failed file processing, failed generation/retry state, or billing restrictions that block the next step.
- **D-23:** Attention and restriction UI must explain **why** the user is blocked and what action unblocks them; generic error copy is not acceptable.
- **D-24:** Status language across dashboard/list should stay limited and stable. Recommended workflow-facing vocabulary: `Not started`, `In progress`, `Completed`, `Needs attention`, and `Archived`.

### Billing visibility and restrictions
- **D-25:** A compact billing/trial card is always visible on the dashboard, but it becomes prominent only when the workspace is near trial end or currently restricted.
- **D-26:** Billing status must never overpower the main work queue on healthy workspaces, but restricted states must remain explicit and actionable.
- **D-27:** Restricted workspaces remain readable: users can still inspect existing opportunities and reach Billing/Upgrade, while blocked actions are clearly explained.

### Shared states and UX quality bar
- **D-28:** Dashboard and Opportunities must implement real shipping states for `loading`, `empty`, `error`, `blocked`, `retry`, and `success`; no generic placeholder panels or spec prose.
- **D-29:** Empty states must direct the user toward creating the first opportunity; filtered-empty states must preserve the current query/filter context and offer a reset path.
- **D-30:** The UI should stay professional, structured, and editor-like: no content feed styling, no community tropes, no chatbot framing, and no analytics-wall visual language.
- **D-31:** Phase 3 is desktop/laptop web only. Do not spend scope on mobile or tablet product layouts; keep browser behavior solid on standard desktop and laptop widths.

### Visibility and role assumptions
- **D-32:** Carry forward the MVP visibility rule that both `owner` and `member` can see all opportunities in the current workspace by default.
- **D-33:** Do not add participant-scoped default views, assignment-based landing states, or deeper permission branching in this phase.

### the agent's Discretion
- Exact microcopy, iconography, spacing scale, and motion polish inside the locked IA and behavior above.
- Whether the create-opportunity entry uses a centered modal or right-side drawer, as long as it stays lightweight and intentional.
- The exact visual treatment of compact status metrics, as long as they remain secondary to action and attention.

</decisions>

<specifics>
## Specific Ideas

- The product standard for this phase is **real launch-ready product UI**, not an upgraded placeholder or prototype shell.
- The dashboard should feel closer to a focused operations console than to a BI dashboard: think "start work / resume work / fix blockers" before "inspect metrics."
- The opportunities list should feel like a work queue with enough signal to make a decision quickly, not like a CRM admin grid.
- UI/UX direction should stay aligned with `docs/design/DESIGN.md`: dark-mode-native, restrained, professional, dense-but-readable, and credible for English-first B2B usage.
- `ui-ux-pro-max` search was directionally useful on the **dark technical/workflow console** styling, but its landing-page-oriented pattern suggestions are not adopted for Phase 3. This is an explicit inference from the tool output plus the frozen product docs.
- The new-opportunity entry point should optimize for fast commitment into the workflow, then immediately hand off to Overview / Lead Intake where deeper context editing belongs.

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Roadmap and project constraints
- `.planning/ROADMAP.md` — Phase 3 scope, outputs, acceptance, and no-scope-creep boundary.
- `.planning/PROJECT.md` — Product positioning, customer-side MVP rules, and "shipping UI, not spec page" constraint.
- `.planning/REQUIREMENTS.md` — `DASH-01`, `OPP-01`, shared state requirements, and v1 traceability.
- `.planning/phases/01-foundation-repo-infra-ui-baseline/01-CONTEXT.md` — Locked Phase 1 decisions that still constrain Phase 3, especially UI baseline, route boundaries, and shared package philosophy.

### Product, IA, and page behavior
- `docs/web/ProposalFlow AI｜PRD v1.0（MVP）.md` — Product promise, opportunity-centered workflow, roles, and draft-first rules.
- `docs/web/ProposalFlow AI｜MVP 功能清单 v1.0.md` — P0/P1 split for Dashboard, Opportunities, and adjacent workflow expectations.
- `docs/web/ProposalFlow AI｜页面清单与页面级需求 v1.0.md` — Page-level blocks, states, dependencies, and acceptance for Dashboard and Opportunities.
- `docs/web/ProposalFlow AI｜页面流程与信息架构说明 v1.0.md` — Navigation structure, guarded routes, opportunity-centered progression, and route semantics.
- `docs/web/ProposalFlow_AI_客户侧_页面设计Brief_v1.2.md` — Frozen customer-side visual/interaction brief, especially W05/W06 and the global/opportunity chrome rules.

### API and backend contract
- `docs/web/ProposalFlow AI｜API 设计 v1.0.md` — Opportunity-centered API rules, pagination/filter protocol, opportunity endpoints, archive/unarchive, and list/read contract.
- `docs/share/ProposalFlow AI｜系统架构与技术方案 v1.0.md` — Modular-monolith stack decisions, frontend/backend responsibilities, and dashboard/opportunity module boundaries.
- `docs/share/ProposalFlow AI｜数据库设计 v1.0.md` — Opportunity entity baseline, indexing/search strategy, and persistence rules for workflow summary support.
- `docs/share/ProposalFlow AI 开发骨架与目录结构设计说明 v1.0.md` — `apps/web`/`apps/api` module responsibilities and route/module ownership for dashboard and opportunities.

### Visual baseline
- `docs/design/DESIGN.md` — The only frozen UI design contract and Phase 3 visual baseline.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `apps/web/lib/auth-bootstrap.ts`: already resolves authenticated user, active workspace, and current billing/trial snapshot; useful for dashboard bootstrap and restriction messaging.
- `apps/web/middleware.ts`: already protects `/dashboard` and `/opportunities*` behind auth and workspace-setup checks.
- `packages/shared-config/index.ts`: already defines route constants for `/dashboard` and `/opportunities`, default page size, and shared protocol constants.
- `packages/shared-types/index.ts`: already defines the shared product-state vocabulary used by earlier phases.
- `apps/web/app/globals.css`: contains the current dark visual baseline and can seed the Phase 3 shell, though it will need refactoring away from phase-specific placeholder styling.

### Established Patterns
- The web app uses Next.js App Router with server-side auth bootstrap + redirect logic on guarded product pages.
- Shared product constants and route contracts live in `packages/shared-config` / `packages/shared-types`, not ad hoc inside the page modules.
- The existing customer surfaces already lean into a dark, polished, non-admin placeholder aesthetic, but there is no real logged-in product shell yet.

### Integration Points
- `apps/web/app/dashboard/page.tsx` is currently a Phase 2 handoff page and should be replaced by the real Phase 3 command center.
- `/opportunities` is already guard-aware in middleware but has no route implementation yet.
- `apps/api` needs summary/list/archive endpoints that return enough workflow metadata for resume behavior and needs-attention surfacing.
- The opportunity read model must expose `current_step`, readiness, and restriction context so dashboard/list do not become frontend guesswork.

</code_context>

<deferred>
## Deferred Ideas

- Complex multi-column CRM tables, kanban views, and admin-style analytics panels.
- Assignment-based default views such as "Mine", "Assigned to me", or participant-only visibility.
- Rich sort builders or advanced saved filters beyond the minimal Phase 3 sort/filter surface.
- Dashboard quick-action expansion beyond core create/resume/upgrade flows.
- Opportunity activity summaries and other density upgrades that the frozen docs position closer to later enhancement work.

</deferred>

---

*Phase: 03-dashboard-opportunities-list*
*Context gathered: 2026-04-09*
