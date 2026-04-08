# Phase 1: Foundation / Repo / Infra / UI Baseline - Research

**Researched:** 2026-04-08  
**Domain:** Monorepo bootstrap, app/runtime boundaries, shared contracts, session/permission scaffolding, local/staging/production infra, shipping UI baseline  
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- D-01: Use a single monorepo as the permanent project shape.
- D-02: Keep `apps/web`, `apps/admin`, `apps/api`, and `apps/worker` as separate top-level apps from the start.
- D-03: Do not introduce `packages/ui` in P0; keep shared UI extraction for a later phase when reuse is stable.
- D-04: Prefer a lightweight workspace baseline centered on `pnpm` for the repo toolchain.
- D-05: Treat `local`, `staging`, and `production` as first-class, distinct environments from day one.
- D-06: Use containerized dependencies with app processes running locally during development.
- D-07: Keep staging and production as closely aligned as possible in image shape and deployment behavior.
- D-08: Model deployment around `web`, `admin`, `api`, and `worker`, not generic frontend/backend labels.
- D-09: Apply the DESIGN.md baseline immediately so customer-facing shells already feel like shipping product UI.
- D-10: Use the Linear-inspired dark visual system as the default product surface language.
- D-11: Build product shells and shared states, not document-like pages or spec sheets.
- D-12: Keep web and admin sessions separate even though they share the same `users` identity base.
- D-13: Persist `session_type = web | admin` explicitly and keep separate cookies for each surface.
- D-14: Keep customer workspace roles limited to `owner` and `member` for MVP.
- D-15: Keep internal admin roles separate via `internal_role_assignments` with `internal_admin` and `internal_analyst`.
- D-16: Require CSRF protection for browser write requests.
- D-17: Keep customer API and admin API separated by namespace from the first phase.
- D-18: Treat `shared-types`, `shared-schemas`, and `shared-config` as the contract surface for cross-app constants, enums, route names, events, and filter keys.
- D-19: Use `activity_logs` as a shared platform primitive, not as a page-specific appendage.
- D-20: Keep shared contracts small and explicit rather than trying to create a universal abstraction layer.
- D-21: Use one PostgreSQL primary database only.
- D-22: All schema changes must flow through migrations; no hand-written SQL as the official baseline.
- D-23: Establish the migration framework early enough that later phases can add entity tables incrementally without rebuilding the foundation.
- D-24: Keep the worker as an internal async process for later file/AI/retry workloads; do not expose it publicly.
- D-25: Local development should support realistic auth/session, API, database, Redis, and object storage wiring so auth and workflow phases do not start on an artificial sandbox.
- D-26: Local smoke coverage should include app boot, shell routes, and shared state/guard behavior.
- D-27: Do not build real customer workflows in this phase.
- D-28: Do not build real admin workflows in this phase.
- D-29: Do not overbuild infrastructure automation, multi-service abstractions, or BI-style data layers in P0.

### Claude's Discretion
- Shell-level implementation details inside the phase 1 app scaffolds.
- Exact internal file organization inside each app, as long as the external boundary stays consistent.

### Deferred Ideas (OUT OF SCOPE)
- `packages/ui` can be introduced later once customer/admin component reuse stabilizes.
- More complex infra automation, multi-service abstractions, and BI-style data layers belong in later phases.
- Real customer workflows and real admin workflows are out of scope for phase 1.
</user_constraints>

## Summary

Phase 1 is a greenfield bootstrap, not a refactor. The working tree currently has planning and reference documents only, so the plan should create the first real implementation scaffold instead of trying to reshape existing code. The frozen docs already define the irreversible boundaries: one monorepo, four runtime units, explicit customer/admin separation, a single PostgreSQL primary database, migrations-first persistence, and a dark shipping UI baseline.

The safest downstream plan is to close the Phase 1 requirements that are already traceable in `.planning/REQUIREMENTS.md` (`PLAT-01`, `PLAT-02`, `PLAT-03`, `UI-01`, `UI-02`) by building a narrow foundation: `apps/web`, `apps/admin`, `apps/api`, `apps/worker`, shared contract packages, explicit web/admin sessions and cookies, versioned migrations, and product shells with real states. Avoid broad abstractions now; every extra layer added in Phase 1 increases the odds of rework in later workflow phases.

**Primary recommendation:** bootstrap the repo with explicit `web/admin/api/worker` boundaries, shared contract packages, split sessions, and migrations-first persistence; do not add `packages/ui` or a broad platform abstraction layer in Phase 1.

## Standard Stack

Versions below were verified from official package registries on 2026-04-08. The frozen architecture docs choose the shape; the registries confirm the current package baselines to plan against.

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js | 15.5.2 | Customer/admin frontend runtime and route shell | Strong fit for route-level product/admin separation and shipping UI shells |
| React | 19.1.1 | UI runtime | Current stable React baseline and ecosystem default |
| React DOM | 19.1.1 | Browser/server rendering runtime | Matches React 19 and keeps frontend tooling aligned |
| Tailwind CSS | 4.1.12 | Styling system | Fast to apply the dark product baseline and shell states consistently |
| FastAPI | 0.135.2 | Backend API runtime | Explicit routers and schema-first APIs fit the modular monolith design |
| Pydantic | 2.12.2 | Validation and schema modeling | Ideal for request/response validation and structured payloads |
| SQLAlchemy | 2.0.49 | ORM/query layer | Supports the repository/query split and explicit data modeling |
| Alembic | 1.18.4 | Database migrations | Matches the migrations-first baseline; no hand-written SQL as source of truth |
| psycopg | 3.3.3 | PostgreSQL driver | Modern PostgreSQL driver for the single primary database |
| redis | 7.3.0 | Redis client | Supports caching, queues, and coordination for local and worker flows |
| OpenAI SDK | 2.26.0 | AI integration | Official client for the Responses API and structured output workflows |
| Stripe SDK | 14.4.1 | Billing integration | Official checkout, portal, and webhook client for billing baseline |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| React Hook Form | 7.62.0 | Form handling | Auth, setup, and shell forms that need light validation and good UX |
| Zod | 4.1.5 | Schema validation | Shared validation for UI forms and contract-shape enforcement |
| TanStack Query | 5.87.1 | Server-state management | API-backed shell states, retries, and cache-aware loading/error handling |
| Uvicorn | 0.43.0 | ASGI server | Local and development runtime for the FastAPI app |
| Playwright | 1.55.0 | Route-shell smoke/e2e | Verifies product shells, route gating, and state rendering end to end |
| Pytest | 8.4.1 | Backend test runner | Current local test runner available on the machine |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Monorepo with explicit app and package boundaries | Multi-repo split | More version drift, more release coordination, and harder shared contracts |
| Shared contract packages only | Early `packages/ui` | Premature component coupling and UI abstraction creep |
| SQLAlchemy + Alembic | SQLModel | SQLModel is lighter, but SQLAlchemy fits the explicit repository/query/reporting split better |
| Next.js shipping shells | Plain React SPA | Less route-level boundary support and weaker product/admin segregation |
| FastAPI + Pydantic | Custom API layer | More hand-rolled validation and slower schema-first iteration |

**Installation:**
```bash
pnpm install
python3 -m pip install fastapi==0.135.2 pydantic==2.12.2 sqlalchemy==2.0.49 alembic==1.18.4 psycopg==3.3.3 redis==7.3.0 openai==2.26.0 stripe==14.4.1 uvicorn==0.43.0
```

## Architecture Patterns

### Recommended Project Structure
```text
proposalflow/
├── apps/
│   ├── web/
│   ├── admin/
│   ├── api/
│   │   ├── app/
│   │   │   ├── api/
│   │   │   │   ├── product/
│   │   │   │   └── admin/
│   │   │   ├── core/
│   │   │   ├── modules/
│   │   │   ├── db/
│   │   │   ├── schemas/
│   │   │   └── services/
│   │   └── alembic/
│   └── worker/
├── packages/
│   ├── shared-types/
│   ├── shared-schemas/
│   └── shared-config/
├── infra/
│   ├── docker/
│   ├── compose/
│   └── deploy/
├── scripts/
├── tests/
│   ├── integration/
│   ├── e2e/
│   └── fixtures/
└── docs/
```

### Pattern 1: Boundary-First App Split
**What:** keep `web`, `admin`, `api`, and `worker` as separate runtime units, with `product` and `admin` route namespaces split inside `apps/api`.  
**When to use:** always in Phase 1.  
**Example:**
```python
# Source: docs/share/ProposalFlow AI｜系统架构与技术方案 v1.0.md
# Inference from frozen docs: product and admin routers should not share the same namespace.
app.include_router(product_router, prefix="/api/v1")
app.include_router(admin_router, prefix="/api/v1/admin")
```

### Pattern 2: Shared Contracts, Not Shared UI
**What:** put enums, route names, events, filters, and validation schemas in `shared-types`, `shared-schemas`, and `shared-config`; keep UI extraction out of P0.  
**When to use:** any cross-app constant or payload shape.  
**Example:**
```text
packages/shared-types/      # enums, role constants, response envelopes
packages/shared-schemas/    # activity event schema, filters, validation schema
packages/shared-config/     # env names, API prefixes, event names, pagination constants
```

### Pattern 3: Current Resource + Version History
**What:** store the current working state in one table and append immutable version rows in a companion version table.  
**When to use:** Lead Brief, Discovery Intelligence, Proposal Draft, and Follow-up.  
**Example:**
```python
# Source: docs/share/ProposalFlow AI｜数据库设计 v1.0.md
# Inference from frozen docs: save-version creates history; generate refreshes current state.
current_payload = {...}
version_row = {...}
```

### Pattern 4: Migrations-First Persistence
**What:** every schema change goes through Alembic migrations; never treat ad hoc SQL as the official baseline.  
**When to use:** any database change in Phase 1 or later.  
**Example:**
```text
apps/api/alembic/
apps/api/alembic/versions/
```

### Anti-Patterns to Avoid
- **One shared session for web and admin:** it collapses `session_type`, cookie boundaries, and guard behavior that the frozen docs explicitly split.
- **A broad `packages/platform` abstraction:** it hides the minimal explicit contracts that Phase 1 needs and creates a platform layer before the product surface exists.
- **Adding `packages/ui` in P0:** the phase context explicitly defers it until reuse stabilizes.
- **Spec-page shells:** if a route does not render real loading, empty, error, blocked, retry, and success states, it will need to be repainted later.
- **Direct SQL as a shortcut:** it bypasses the migration baseline and makes later phase rollout and rollback harder.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Sessions and cookie/CSRF behavior | Custom ad hoc session handling | `user_sessions`, split `session_type`, separate cookies, and CSRF guards | Browser auth rules are easy to get wrong and expensive to retrofit |
| Version history and restore semantics | Manual diff/patch logic | Current table + immutable version table | Snapshot history is simpler and safer for later restore flows |
| File processing state machine | One-off status fields or in-memory flags | `file_assets` + `file_processing_jobs` with explicit statuses | Worker retries and failure recovery need durable state |
| Event taxonomy | Magic strings scattered through the codebase | Shared event constants in `shared-config` / `shared-schemas` | Keeps product and admin analytics aligned |
| Permission model | Inferring admin rights from workspace membership | `workspace_members` plus `internal_role_assignments` | The frozen docs require separate customer and internal roles |
| Shared UI library in P0 | Early `packages/ui` extraction | Keep UI local to apps for now | UI reuse is not yet stable enough to justify the abstraction |

**Key insight:** Phase 1 is about establishing durable boundaries, not proving breadth. Every custom abstraction added now is likely to become the thing later phases need to unwind.

## Common Pitfalls

### Pitfall 1: Collapsing web and admin into one session model
**What goes wrong:** cookie names, guard logic, and write protection become ambiguous, and admin access ends up leaking through customer auth code.  
**Why it happens:** it is tempting to treat the two surfaces as "just another route group."  
**How to avoid:** keep `session_type = web | admin`, use separate cookies, and make guard helpers explicit.  
**Warning signs:** shared auth helpers, one cookie name for both surfaces, or admin routes reusing customer session middleware.

### Pitfall 2: Building a broad platform abstraction too early
**What goes wrong:** the repo gets a generic platform layer before product workflows exist, which makes every later feature harder to land.  
**Why it happens:** foundation work feels safer when it looks generalized.  
**How to avoid:** keep shared contracts small and explicit; only lift the pieces the docs already name.  
**Warning signs:** `platform`, `core-platform`, or `common` packages that start absorbing business rules.

### Pitfall 3: Shipping spec pages instead of product shells
**What goes wrong:** later workflow phases inherit layouts that do not already support task-driven states.  
**Why it happens:** the first pass is often treated as scaffolding rather than product UI.  
**How to avoid:** apply the DESIGN.md baseline immediately and render the six shared states from day one.  
**Warning signs:** routes that only show text, acceptance prose, or placeholder copy with no state model.

### Pitfall 4: Ignoring staging parity until late
**What goes wrong:** auth, cookie, CORS, CSRF, and deployment behavior differ across environments and need rework under deadline.  
**Why it happens:** local-only setups feel faster in the short term.  
**How to avoid:** treat local, staging, and production as first-class and keep image shape close across all three.  
**Warning signs:** "we will fix deploy later," environment-specific hacks, or separate local-only auth paths.

## Code Examples

Verified patterns from frozen docs. Where the docs imply behavior rather than provide literal code, the snippet is labeled as an inference.

### Route Namespace Split
```text
# Source: docs/share/ProposalFlow AI｜开发骨架与目录结构设计说明 v1.0.md
apps/api/app/api/product/
apps/api/app/api/admin/
```

### Session Boundary Split
```text
# Source: docs/share/ProposalFlow AI｜数据库设计 v1.0.md
user_sessions.session_type = web | admin
pf_web_session
pf_admin_session
```

### Current-State + Version-State Model
```python
# Source: docs/share/ProposalFlow AI｜数据库设计 v1.0.md
# Inference from frozen docs: generate updates current state; save-version appends history.
lead_brief.current_payload = {...}
lead_brief_versions.insert({...})
```

### Shared Contract Surface
```text
# Source: docs/share/ProposalFlow AI｜开发骨架与目录结构设计说明 v1.0.md
packages/shared-types/
packages/shared-schemas/
packages/shared-config/
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| One frontend with mixed customer/admin concerns | Separate `apps/web` and `apps/admin` surfaces | Frozen in phase context on 2026-04-08 | Keeps route, session, and navigation boundaries clear from the start |
| Hand-written schema changes | Versioned Alembic migrations | Frozen in architecture and database docs on 2026-04-08 | Makes rollback and incremental rollout practical |
| Shared browser session for both surfaces | Explicit `session_type = web | admin` with separate cookies | Frozen in context and database docs on 2026-04-08 | Prevents permission leakage and CSRF confusion |
| Raw text as the only AI output | Structured payload + UI-renderable content | Frozen in system architecture doc on 2026-04-08 | Keeps later workflow phases editable and reviewable |

**Deprecated/outdated:**
- `frontend/backend` deployment naming: the deployment doc explicitly standardizes on `web/admin/api/worker`.
- `packages/ui` in P0: the phase context explicitly defers shared UI extraction.
- Spec-sheet customer pages: the UI baseline requires product shells with real states.
- Unbounded platform abstraction: the frozen docs prefer small explicit shared contracts.

## Open Questions

1. **How minimal should the `apps/admin` first-pass shell be?**
   - What we know: it must exist as a separate app and remain a boundary reserve, not a launch-focus product surface.
   - What is still unclear: whether Phase 1 should ship only a read-only landing shell or a slightly richer internal scaffold.
   - Recommendation: keep it minimal and runnable, with just enough chrome to prove route and session separation.

2. **What exact Node baseline should Phase 1 pin?**
   - What we know: the local machine currently has Node `v25.8.1`, but the repository has no pinned runtime yet.
   - What is still unclear: the project-wide major/minor pin the team wants for reproducible frontend builds.
   - Recommendation: pin an LTS major in the bootstrap commit rather than letting the current workstation version become the de facto baseline.

3. **How should the Python environment be pinned for the API/worker split?**
   - What we know: Python `3.13.5` is available locally and the current package stack supports it.
   - What is still unclear: whether the repo should standardize on `python3`, `uv`, Poetry, or another lockfile workflow for Phase 1 bootstrap.
   - Recommendation: decide this in the foundation phase, then keep API and worker aligned on the same interpreter and lockfile story.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|-------------|-----------|---------|----------|
| Node.js | Frontend runtime and build tooling | ✓ | 25.8.1 | Pin an LTS major before scaffold finalization |
| pnpm | Monorepo package manager | ✓* | Binary present; Corepack version resolution failed in this shell | Fix Corepack cache permissions or install/pin pnpm before implementation |
| Python 3 | API and worker runtime | ✓ | 3.13.5 | Pin the interpreter version in the phase 1 bootstrap |
| pytest | Backend test runner | ✓ | 8.4.1 | None needed for backend test bootstrap |
| Docker runtime | Local dependency containers, image builds, staging/prod parity | ✗ / partial | CLI 29.3.1; Compose 5.1.1; daemon/server not reachable | Start Docker Desktop or an equivalent daemon before container-based local work |
| PostgreSQL client | DB verification and local admin work | ✓ | 18.3 | Use the containerized DB once the Docker runtime is available |
| redis-cli | Redis verification | ✓ | 7.0.0 | Use the containerized Redis once the Docker runtime is available |
| Playwright | Frontend route-shell smoke | ✗ | — | Add it as a dev dependency when UI smoke work begins |
| Stripe CLI | Local webhook testing | ✗ | — | Use dashboard/webhook forwarding or install the CLI later |

**Missing dependencies with no fallback:**
- Docker daemon/server access is required for the documented local containerized-dependency model. Without it, local Postgres/Redis/object-storage parity cannot be exercised as planned.

**Missing dependencies with fallback:**
- Playwright can be added when the first route-smoke tests are introduced.
- Stripe CLI can be deferred until webhook verification work starts.
- pnpm can be stabilized by fixing Corepack or pinning a direct install.

## Validation Architecture

The repo currently has no app/test scaffold, so validation for Phase 1 should be built in Wave 0 rather than assumed to exist. The frozen docs require app boot checks, shell-route smoke, and shared-state/guard smoke; that maps best to `pytest` for backend behavior and Playwright for route-level UI checks once the frontend scaffold exists.

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Backend: `pytest 8.4.1`; Frontend route smoke: Playwright (not yet installed in the repo) |
| Config file | none yet - create during Wave 0 |
| Quick run command | `pytest -q` for backend/unit smoke once tests exist; `pnpm exec playwright test` once Playwright is added |
| Full suite command | `pytest -q && pnpm exec playwright test` |

### Phase Outputs -> Test Map
| Behavior | Test Type | Automated Command | File Exists? |
|----------|-----------|-------------------|-------------|
| Monorepo boots with four runtime units | smoke | `pnpm dev` (to be defined in Wave 0 bootstrap) | ❌ Wave 0 |
| Web/admin route boundaries stay separate | e2e | Playwright route smoke | ❌ Wave 0 |
| Session type and cookies stay split | integration | `pytest` backend auth/guard tests | ❌ Wave 0 |
| Shared product states render in shells | e2e/UI smoke | Playwright shell-state checks | ❌ Wave 0 |
| Migration baseline runs cleanly | integration | `alembic upgrade head && pytest -q` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** backend `pytest` smoke once the scaffold exists
- **Per wave merge:** Playwright shell-route smoke plus backend integration checks
- **Phase gate:** the full suite should be green before `/gsd:verify-work`

### Wave 0 Gaps
- `apps/api` test configuration does not exist yet.
- `tests/conftest.py` does not exist yet.
- `tests/integration/` does not exist yet.
- `tests/e2e/` does not exist yet.
- `playwright.config.ts` does not exist yet.
- Frontend route-shell smoke fixtures do not exist yet.
- A repo-level test command has not been defined yet.

## Sources

### Primary (HIGH confidence)
- `.planning/phases/01-foundation-repo-infra-ui-baseline/01-CONTEXT.md`
- `.planning/REQUIREMENTS.md`
- `.planning/ROADMAP.md`
- `.planning/PROJECT.md`
- `.planning/STATE.md`
- `docs/design/DESIGN.md`
- `docs/share/ProposalFlow AI 开发骨架与目录结构设计说明 v1.0.md`
- `docs/share/ProposalFlow AI｜系统架构与技术方案 v1.0.md`
- `docs/share/ProposalFlow AI｜数据库设计 v1.0.md`
- `docs/share/ProposalFlow AI｜部署与环境搭建说明 v1.0.md`
- `docs/share/ProposalFlow AI｜共享平台边界说明 v1.0.md`
- Official package registry pages for `next`, `react`, `react-dom`, `tailwindcss`, `react-hook-form`, `zod`, `@tanstack/react-query`, `playwright`, `fastapi`, `pydantic`, `sqlalchemy`, `alembic`, `psycopg`, `redis`, `openai`, `stripe`, and `uvicorn`

### Secondary (MEDIUM confidence)
- Local environment checks for `node`, `pnpm`, `python3`, `docker`, `pytest`, `psql`, and `redis-cli`

### Tertiary (LOW confidence)
- None - no unverified web search claims were needed beyond official docs and registries.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - frozen architecture plus official package registries were used to pin the recommended baseline.
- Architecture: HIGH - the phase context and frozen docs lock the repo shape, runtime boundaries, and shared-contract boundaries.
- Pitfalls: HIGH - the risks are directly implied by the frozen docs and by the local environment audit.

**Research date:** 2026-04-08  
**Valid until:** 2026-04-15
