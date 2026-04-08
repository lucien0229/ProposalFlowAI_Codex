# Phase 1: Foundation / Repo / Infra / UI Baseline - Context

**Gathered:** 2026-04-08
**Status:** Ready for planning

<domain>
## Phase Boundary

Establish the monorepo foundation, application boundaries, shared packages, environment layers, shared session and permission scaffolding, migration and worker baselines, and the initial shipping UI baseline so later phases can deliver product workflows instead of spec pages.

</domain>

<decisions>
## Implementation Decisions

### Repository and app shape
- **D-01:** Use a single monorepo as the permanent project shape.
- **D-02:** Keep `apps/web`, `apps/admin`, `apps/api`, and `apps/worker` as separate top-level apps from the start.
- **D-03:** Do not introduce `packages/ui` in P0; keep shared UI extraction for a later phase when reuse is stable.
- **D-04:** Prefer a lightweight workspace baseline centered on `pnpm` for the repo toolchain.

### Runtime and environment baseline
- **D-05:** Treat `local`, `staging`, and `production` as first-class, distinct environments from day one.
- **D-06:** Use containerized dependencies with app processes running locally during development.
- **D-07:** Keep staging and production as closely aligned as possible in image shape and deployment behavior.
- **D-08:** Model deployment around `web`, `admin`, `api`, and `worker`, not generic frontend/backend labels.

### UI baseline
- **D-09:** Apply the DESIGN.md baseline immediately so customer-facing shells already feel like shipping product UI.
- **D-10:** Use the Linear-inspired dark visual system as the default product surface language.
- **D-11:** Build product shells and shared states, not document-like pages or spec sheets.

### Session and permission boundaries
- **D-12:** Keep web and admin sessions separate even though they share the same `users` identity base.
- **D-13:** Persist `session_type = web | admin` explicitly and keep separate cookies for each surface.
- **D-14:** Keep customer workspace roles limited to `owner` and `member` for MVP.
- **D-15:** Keep internal admin roles separate via `internal_role_assignments` with `internal_admin` and `internal_analyst`.
- **D-16:** Require CSRF protection for browser write requests.

### Shared contracts and platform boundaries
- **D-17:** Keep customer API and admin API separated by namespace from the first phase.
- **D-18:** Treat `shared-types`, `shared-schemas`, and `shared-config` as the contract surface for cross-app constants, enums, route names, events, and filter keys.
- **D-19:** Use `activity_logs` as a shared platform primitive, not as a page-specific appendage.
- **D-20:** Keep shared contracts small and explicit rather than trying to create a universal abstraction layer.

### Database, migration, and worker baseline
- **D-21:** Use one PostgreSQL primary database only.
- **D-22:** All schema changes must flow through migrations; no hand-written SQL as the official baseline.
- **D-23:** Establish the migration framework early enough that later phases can add entity tables incrementally without rebuilding the foundation.
- **D-24:** Keep the worker as an internal async process for later file/AI/retry workloads; do not expose it publicly.

### Local development and integration surface
- **D-25:** Local development should support realistic auth/session, API, database, Redis, and object storage wiring so auth and workflow phases do not start on an artificial sandbox.
- **D-26:** Local smoke coverage should include app boot, shell routes, and shared state/guard behavior.

### Deferred scope
- **D-27:** Do not build real customer workflows in this phase.
- **D-28:** Do not build real admin workflows in this phase.
- **D-29:** Do not overbuild infrastructure automation, multi-service abstractions, or BI-style data layers in P0.

### the agent's Discretion
- Shell-level implementation details inside the phase 1 app scaffolds.
- Exact internal file organization inside each app, as long as the external boundary stays consistent.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Roadmap and product requirements
- `.planning/ROADMAP.md` — Phase 1 scope, outputs, acceptance, and non-goals.
- `.planning/REQUIREMENTS.md` — Platform/UI baseline, identity/workspace, and traceability requirements.
- `.planning/PROJECT.md` — Project-wide principles, constraints, and repo-shape decisions.

### Architecture and platform docs
- `docs/share/ProposalFlow AI｜开发骨架与目录结构设计说明 v1.0.md` — Monorepo layout, app boundaries, shared packages, and baseline module structure.
- `docs/share/ProposalFlow AI｜系统架构与技术方案 v1.0.md` — Runtime units, module boundaries, session/guard shape, worker role, and shared platform architecture.
- `docs/share/ProposalFlow AI｜数据库设计 v1.0.md` — Identity, workspace, session, activity log, and migration-oriented data model.
- `docs/share/ProposalFlow AI｜部署与环境搭建说明 v1.0.md` — Local/staging/production environment model, deployment objects, and cookie/domain separation.
- `docs/share/ProposalFlow AI｜共享平台边界说明 v1.0.md` — Customer/admin/shared platform separation, internal roles, and session boundary policy.

### UI baseline
- `docs/design/DESIGN.md` — The only customer-facing UI design contract and visual baseline.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- None yet. The repository currently contains planning and reference documents, but no app or package implementation to reuse.

### Established Patterns
- The docs establish a strict monorepo boundary, separate `web/admin/api/worker` runtime units, shared contract packages, and a dark Linear-inspired product UI baseline.
- Session and permission boundaries are intentionally split between customer workspace access and internal admin access.

### Integration Points
- `apps/web` and `apps/admin` should mount separate customer/admin shells and route namespaces.
- `apps/api` should own the authoritative HTTP contract, migrations, guards, and shared platform services.
- `apps/worker` should connect to API-owned persistence for async file and AI workloads.
- `packages/shared-types`, `packages/shared-schemas`, and `packages/shared-config` should expose the cross-app contract layer for enums, constants, filters, and events.

</code_context>

<specifics>
## Specific Ideas

- Use subdomain-style local simulation for `app`, `admin`, and `api` so cookie, CORS, CSRF, and OAuth behavior can be tested realistically.
- Keep the first product surfaces as shipping UI shells, not documentation-like or acceptance-text pages.
- Prefer a small number of explicit shared contracts over an abstract “platform” layer that tries to solve every future use case up front.

</specifics>

<deferred>
## Deferred Ideas

### Reviewed Todos (not folded)
None — no todo matches were surfaced during this discussion.

### Deferred ideas
- `packages/ui` can be introduced later once customer/admin component reuse stabilizes.
- More complex infra automation, multi-service abstractions, and BI-style data layers belong in later phases.
- Real customer workflows and real admin workflows are out of scope for phase 1.

</deferred>

---

*Phase: 01-Foundation / Repo / Infra / UI Baseline*
*Context gathered: 2026-04-08*
