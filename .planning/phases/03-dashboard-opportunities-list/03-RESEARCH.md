# Phase 3: Dashboard & Opportunities List - Research

**Researched:** 2026-04-09  
**Domain:** Shipping customer command center, opportunity list/query model, dashboard resume flows, UI/UX contract, API integration, and TDD-first verification  
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md and latest planning instruction)

### Locked Decisions
- D-01 to D-03: Phase 3 must introduce the real logged-in customer shell and keep the Linear-inspired dark product language from `docs/design/DESIGN.md`.
- D-04 to D-07: Dashboard is action-first, with `New Opportunity`, resume flow, `Needs Attention`, and compact summary/billing surfaces. It must not become a BI dashboard.
- D-08 to D-11: New opportunity creation must be explicit, lightweight, and redirect to Overview / Lead Intake; resume/open should deep-link to the current actionable step.
- D-12 to D-20: Opportunities view must behave like a compact workflow queue with row-card density, cursor pagination, URL-backed search/filter/minimal-sort state, and explicit archive/unarchive behavior.
- D-21 to D-27: Dashboard/list status UI must be backed by API-level `current_step`, `workflow summary`, readiness, and billing restriction semantics rather than frontend guesswork.
- D-28 to D-33: Shipping states, desktop/laptop browser usability, clear error/retry/blocked behavior, and workspace-wide visibility are mandatory.

### Additional Phase Planning Constraints
- UI/UX planning and execution must explicitly use skill guidance rather than ad hoc styling decisions.
- Implementation should follow a TDD model: failing test first, then minimal implementation, then refactor.
- Success means production-grade productization, not partial page delivery: UI, UX, backend/API integration, empty/loading/error/retry/blocked states, browser validation, and recovery flows all need explicit plan coverage.

### Deferred Ideas (OUT OF SCOPE)
- Admin-style analytics boards, CRM-like mega tables, kanban boards, and assignment-based personalized list defaults.
- Advanced saved filters, complex sort builders, and density upgrades better suited to later phases.

</user_constraints>

## Summary

Phase 3 is the point where ProposalFlow stops being a guarded onboarding demo and becomes a usable product workspace. The codebase already has a guarded `/dashboard` entry, auth bootstrap helpers, and a dark visual baseline, but it does **not** yet have a stable product shell, an opportunities route, a dashboard summary model, opportunity persistence, or list/archive APIs. Planning therefore has to cover the full vertical slice from shared contracts and persistence to browser-tested UI states.

The frozen docs consistently point to the same product shape:

- `Dashboard` is a workflow entry page, not a metrics board.
- `Opportunities` is a focused management queue, not a CRM spreadsheet.
- Opportunity progress and blockers must come from backend workflow semantics (`status`, `current_step`, readiness, restrictions), not from frontend-only heuristics.
- Workspace restrictions remain visible and actionable, but they must not overwhelm healthy workspaces.

**Primary recommendation:** build Phase 3 as six explicit layers: shared opportunity contracts and TDD scaffolding, DB-backed opportunity/dashboard APIs, a stable logged-in customer shell with reusable state patterns, a dashboard command center, an opportunities list surface, and a final browser-level integration hardening pass.

## Standard Stack

Versions below are grounded in the current repo plus the frozen architecture docs.

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js | 15.5.2 | Customer-facing routes and guarded product shell | Already in `apps/web`; App Router fits dashboard/list/server bootstrap well |
| React | 19.1.1 | UI runtime | Existing repo baseline |
| Tailwind CSS | 4.1.12 | Styling system | Already installed; fast path for design-token-driven product surfaces |
| FastAPI | `>=0.115.0` | Product API routes | Existing repo baseline in `apps/api` |
| SQLAlchemy | `>=2.0.0` | Opportunity persistence and list queries | Matches frozen DB strategy |
| Alembic | `>=1.13.0` | Migration for opportunity tables/indexes | Required by the docs' migrations-first rule |
| Playwright | 1.55.0 | Browser smoke/e2e/TDD for dashboard and list workflows | Already installed and used in repo |
| Pytest | 8.4.x | API test-first workflow | Already present in repo `tests/` |

### Recommended Additions for Phase 3
| Library | Purpose | Why Add |
|---------|---------|---------|
| `@tanstack/react-query` | Server-state fetching, retry, optimistic archive/unarchive, cache invalidation | Dashboard/list interactions need consistent loading/error/retry behavior |
| `zod` | Shared browser-side validation for create-opportunity form and query normalization | Keeps lightweight input validation explicit and consistent |
| `lucide-react` | Icon set for navigation, status, archive, and attention markers | Lightweight, professional, and consistent with the current product direction |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Cursor-based list queries | Offset pagination | Simpler initially, but weaker fit for growing opportunity queues and URL-shareable list state |
| Server-only fetch for every interaction | Full client-side state store | More brittle UX around archive/search/retry; unnecessary global state complexity |
| Dashboard card mosaic | Dense KPI wall | Conflicts with the product docs' "workflow entry" requirement |
| CRM table layout | Spreadsheet/grid-first list | Hurts scan speed on laptop widths and drifts toward admin UX |
| Frontend-only mock progress | Backend workflow summary read model | Mock-only progress would break resume routing, restrictions, and attention semantics |

## Architecture Patterns

### Pattern 1: Contract-First Opportunity Read Models
**What:** define shared opportunity primitives in `packages/shared-types`, `packages/shared-schemas`, and `packages/shared-config` before page work.  
**Why:** Dashboard/list UI, API responses, and filters must all use the same status, step, and sort vocabulary.  
**Use for:** `OpportunityStatus`, `OpportunityCurrentStep`, `NeedsAttentionReason`, `DashboardSummary`, `OpportunityListItem`, list query params, and sort presets.  
**Recommendation:** freeze the shared enums first so backend and frontend cannot drift during execution.

### Pattern 2: DB-Backed Opportunity Queue, Not Temporary In-Memory Data
**What:** add the opportunity table and indexes now, including `workspace_id`, `owner_user_id`, `title`, `company_name`, `requested_service`, `status`, `archived_at`, `created_at`, and `updated_at`.  
**Why:** Phase 3 is already customer-facing and must survive beyond demo state. Dashboard summary, archive/unarchive, and search/filter behavior depend on persistent records.  
**Recommendation:** add migration + repository/service + query helpers in the same plan wave so frontend work lands against durable contracts.

### Pattern 3: Action-First Dashboard Summary Endpoint
**What:** expose a dedicated dashboard summary read model rather than forcing the page to stitch everything together from raw list data.  
**Why:** Dashboard needs `recent opportunities`, `needs attention`, compact counts, and billing/trial snapshot in one predictable response.  
**Recommendation:** return:
- `summary_counts`
- `recent_opportunities`
- `needs_attention`
- `billing_snapshot`
- `resume_target` / `current_step_url` per opportunity where applicable

### Pattern 4: URL-Backed Opportunities List State
**What:** search/filter/minimal sort/archived toggle live in URL query params, with the API honoring the same protocol.  
**Why:** The docs explicitly prefer explicit query params, and `ui-ux-pro-max` guidance strongly reinforces deep-linking rather than hidden local-only state.  
**Recommendation:** support `q`, `status`, `archived`, `limit`, `cursor`, `order_by`, and `order_direction`, but keep UI controls intentionally minimal.

### Pattern 5: Stable Logged-In Product Shell Before Page Density
**What:** introduce a reusable customer shell with stable primary navigation, active-state highlighting, workspace context, and shared blocked/error/empty components before building dashboard/list specifics.  
**Why:** Right now `/dashboard` is a phase-2 handoff screen, not a real product frame. Without a shell plan, dashboard/list implementation will hard-code repeated chrome and state treatments.  
**Recommendation:** create shell primitives first, then plug dashboard/list surfaces into them.

### Pattern 6: TDD by Surface
**What:** use test-first per layer:
- backend API/domain: `pytest`
- browser interactions and state UX: Playwright
- shell/navigation smoke: Playwright smoke specs
**Why:** The user explicitly requested TDD and browser-side validation, and the repo already has both test runners available.  
**Recommendation:** every execution plan should start with a failing test or spec that names the target behavior in product terms before implementation.

## UI/UX Research Notes

### Direction That Fits the Frozen Docs
- `docs/design/DESIGN.md` and `frontend-skill` converge on the same app-standard: restrained, dark, high-clarity, low-noise product UI.
- `frontend-skill` is especially relevant on the "Apps" rules: calm hierarchy, few colors, minimal chrome, no dashboard-card mosaics, cards only when the card is the interaction.
- `ui-ux-pro-max` results were useful on:
  - empty states must contain guidance and a next action
  - active navigation state must be visually explicit
  - dynamic search/filter/sort state should be reflected in the URL
- `ui-ux-pro-max` landing-page-style design-system suggestions were **not** adopted, because the frozen product docs define an operational workspace, not a marketing composition.

### Practical UI Conclusions
- Use a left navigation + top content header or compact top nav + page header, but keep the first viewport dominated by actionable work, not promotional copy.
- `Needs Attention` should use clearer contrast and more urgent affordance than summary counts.
- The opportunities list should be optimized for desktop and laptop browser widths only; no mobile/tablet fallback layout is required in this phase.
- Hover should sharpen affordance, not cause scale-shift or decorative motion.
- Empty states, retry states, and restricted states must preserve orientation: what happened, why, what the user can do next.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Progress inference | Frontend-only "guess current step" logic | API read model returning `current_step`, readiness, and blocker reasons | Resume routing and attention semantics stay authoritative |
| Search/filter protocol | Free-form ad hoc query strings | Frozen query names from API docs and shared config constants | Prevents client/server drift |
| UI chrome | Page-specific nav clones | One reusable customer shell + shared state blocks | Keeps dashboard and list visually consistent |
| Archive behavior | Hidden menu-only archive without feedback | Explicit row action with immediate list refresh + archived toggle | Archive is core Phase 3 behavior, not a hidden power feature |
| TDD compliance | "Implement first, add smoke later" | Failing pytest/Playwright spec before each execution slice | User explicitly requested TDD and real browser validation |

## Common Pitfalls

### Pitfall 1: Treating Dashboard as a KPI board
**What goes wrong:** the page fills with stats while create/resume flows fall below the fold.  
**Avoid by:** anchoring the viewport around `New Opportunity`, `Continue Current Step`, `Needs Attention`, and only then compact counts.

### Pitfall 2: Creating opportunities too eagerly
**What goes wrong:** clicking around or opening a form creates empty junk records.  
**Avoid by:** modal/drawer confirmation with a minimum stable payload and post-create redirect to Overview.

### Pitfall 3: Letting list UX drift into CRM/admin patterns
**What goes wrong:** a wide spreadsheet punishes laptop users and makes archive/open actions harder to scan.  
**Avoid by:** row-card density, a small field set, and search/filter/minimal-sort only.

### Pitfall 4: Shipping frontend states without backend semantics
**What goes wrong:** "Needs attention" becomes subjective, resume links break, and restrictions feel random.  
**Avoid by:** backend summary/read models that explicitly compute step readiness and blocker reasons.

### Pitfall 5: Verifying only happy-path rendering
**What goes wrong:** empty/loading/error/retry/blocked states regress or become generic placeholders.  
**Avoid by:** explicit Playwright coverage for each state and route-level accessibility checks in desktop/laptop browser viewports.

## Validation Architecture

Phase 3 should use a two-runner validation strategy:

### Backend/API
- **Runner:** `pytest`
- **Scope:** dashboard summary endpoint, opportunity create/list/detail/archive/unarchive behavior, filter/query parsing, resume-target semantics, restriction serialization
- **Fast loop:** targeted API file(s) only
- **Why:** fastest way to enforce TDD and contract correctness without booting the full browser flow

### Browser/Product UX
- **Runner:** Playwright
- **Scope:** guarded shell, active navigation, dashboard empty/normal/restricted states, new-opportunity create flow, list search/filter/minimal sort/archive/open, retry/error copy, keyboard focus, and desktop/laptop overflow safety
- **Fast loop:** targeted phase-3 specs
- **Why:** the user explicitly requires browser-side validation and complete UI/UX behavior

### Required Manual Review
- Visual fidelity against `03-UI-SPEC.md` and `docs/design/DESIGN.md`
- Scan quality of dashboard/list at laptop width
- Restricted-state explanation quality and CTA clarity

## Code Examples

### Shared Route Contract Already Exists
```ts
// Source: packages/shared-config/index.ts
export const BUSINESS_ROUTE_PATHS = {
  dashboard: "/dashboard",
  opportunities: "/opportunities",
} as const;
```

### Existing Guard Boundary Already Covers Product Surfaces
```ts
// Source: apps/web/middleware.ts
if (pathname === BUSINESS_ROUTE_PATHS.dashboard || pathname.startsWith("/opportunities")) {
  if (bootstrap.workspace_setup_required) {
    // redirect to /setup/workspace
  }
}
```

### Opportunity Persistence Shape Is Frozen in Docs
```text
// Source: docs/share/ProposalFlow AI｜数据库设计 v1.0.md
workspace_id
owner_user_id
title
company_name
requested_service
status
archived_at
```

### List Search Strategy Is Already Frozen
```text
// Source: docs/share/ProposalFlow AI｜数据库设计 v1.0.md
title ILIKE
company_name ILIKE
```

## Planning Implications

The plans should explicitly sequence work as:
1. Shared opportunity contracts and TDD scaffolding
2. DB-backed opportunity/dashboard APIs
3. Stable product shell and shared route-state primitives
4. Dashboard command center implementation
5. Opportunities list implementation
6. Integration hardening, browser validation, and recovery-state completion

Anything less risks producing a visually improved placeholder rather than a true customer command center.
