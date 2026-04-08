# Phase 1: Foundation / Repo / Infra / UI Baseline - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-08
**Phase:** 1-Foundation / Repo / Infra / UI Baseline
**Areas discussed:** repository shape, runtime and environment baseline, UI baseline, session and permission boundaries, shared contracts, migration and worker baseline, local development and integration surface

---

## Repository Shape

| Option | Description | Selected |
|--------|-------------|----------|
| Single monorepo | Keep one repo with separate apps and shared packages | ✓ |
| Multi-repo split | Separate repos for web/admin/api/worker | |
| Monorepo plus broad platform abstraction | Add a heavy shared platform layer early | |

**User's choice:** Single monorepo with separate `web/admin/api/worker` apps and shared contract packages.
**Notes:** Rejected over-abstracting the platform in P0; keep the foundation small and explicit.

## Runtime and Environment Baseline

| Option | Description | Selected |
|--------|-------------|----------|
| Local + staging + production | Three first-class environments with similar runtime shape | ✓ |
| Local only | Skip staging until later | |
| Production-first | Optimize deployment before local/staging parity | |

**User's choice:** Three-tier environment baseline with local/staging/production treated as first-class.
**Notes:** Local should simulate session/cookie boundaries realistically so auth and guards do not need rework later.

## UI Baseline

| Option | Description | Selected |
|--------|-------------|----------|
| Shipping UI shells | Apply DESIGN.md baseline immediately to product shells | ✓ |
| Spec pages | Build documentation-like pages first | |
| Minimal text-only placeholder | Defer UI baseline until later phases | |

**User's choice:** Apply the Linear-inspired shipping UI baseline from the start.
**Notes:** The phase 1 shell must already feel like a product, not a spec sheet.

## Session and Permission Boundaries

| Option | Description | Selected |
|--------|-------------|----------|
| Split web/admin sessions | Separate `session_type` and cookies by surface | ✓ |
| Shared session | Reuse one browser session for both surfaces | |
| Workspace-only roles | Infer admin access from workspace membership | |

**User's choice:** Split web/admin sessions and keep admin roles separate from workspace roles.
**Notes:** Browser write actions must include CSRF protection.

## Shared Contracts

| Option | Description | Selected |
|--------|-------------|----------|
| Small explicit contracts | Use shared types/schemas/config for enums, events, and filters | ✓ |
| Broad platform library | Centralize many future abstractions immediately | |
| Ad hoc duplication | Let each app define its own constants and shapes | |

**User's choice:** Small explicit shared contracts with clear boundaries.
**Notes:** Keep `activity_logs` and cross-app enums/constants in the shared contract layer.

## Migration and Worker Baseline

| Option | Description | Selected |
|--------|-------------|----------|
| Migrations-first | All schema changes go through versioned migrations | ✓ |
| Hand SQL | Allow direct SQL as the primary baseline | |
| Deferred worker | Add worker later, after business flows exist | |

**User's choice:** Migrations-first with an early worker skeleton.
**Notes:** Worker remains internal and is not exposed as a public service.

## Local Development and Integration Surface

| Option | Description | Selected |
|--------|-------------|----------|
| Realistic local stack | Dockerized dependencies, app shell boot, and smoke coverage | ✓ |
| Simplified local mock stack | Minimize dependencies, defer realism | |
| Cloud-only testing | Skip local integration fidelity | |

**User's choice:** Realistic local stack with auth/session, database, Redis, and object storage wiring.
**Notes:** Smoke coverage should include boot, shell routes, and shared state/guard behavior.

## the agent's Discretion

- Exact internal file organization inside each app, as long as the external boundary stays consistent.
- Shell-level implementation details within the phase 1 scaffolds.

## Deferred Ideas

- `packages/ui` later, once reuse stabilizes.
- Real customer workflows.
- Real admin workflows.
- More complex infra automation and BI-style data layers.

