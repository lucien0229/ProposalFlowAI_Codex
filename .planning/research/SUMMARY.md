# Research Summary: ProposalFlow AI Admin

**Domain:** Internal admin console for platform operations and commercial judgment
**Researched:** 2026-04-08
**Overall confidence:** HIGH

## Executive Summary

ProposalFlow AI Admin is an internal-only, read-first control surface for platform staff. It exists to answer platform-level questions about users, workspaces, trials, subscriptions, main-flow completion, and conversion signals. It is not a customer-facing product surface, and it is not a general operations, CRM, support, or BI system.

The docs consistently freeze admin as a separate entry point with separate auth, separate route namespace, separate API namespace, and separate internal roles. The first release is intentionally narrow: query, inspect, filter, sort, page, and drill into details. High-risk write actions are explicitly excluded.

The only scope that clearly belongs beyond first-release P0 is reservation work: User Detail, extra summary metrics, user-level funnel, funnel dimension switching, custom ranges, and funnel-to-list drill-down are all treated as P1 or later. These are placeholders for later boundary phases, not first-release commitments.

## Key Findings

**Stack:** Separate `/admin` surface, `/api/v1/admin/*` namespace, internal auth/role guards, cursor-based list queries, shared event/business-table aggregation.
**Architecture:** Admin web + admin API + shared data sources, with read-only query paths and no direct customer-workflow write path.
**Critical pitfall:** Do not let admin drift into a mutable backend, customer-facing web clone, or BI dashboard.

## Implications for Roadmap

Suggested phase structure:

1. **Admin shell and auth boundary** - establish the separate entry, route space, internal guards, and page chrome first.
   - Addresses: Admin Auth, global navigation, protected `/admin/*` routing
   - Avoids: customer-side login reuse, mixed auth, hidden admin entry points

2. **Core read views** - deliver the stable P0 read surfaces for overview, workspaces, users list, subscriptions, and workspace funnel.
   - Addresses: Overview, Workspaces List, Workspace Detail, Users List, Subscriptions / Trials, Funnel Analytics
   - Avoids: write actions, ops controls, complex BI, CRM-like workflow management

3. **Reserved expansion layer** - add only the explicitly reserved P1 surfaces and helper metrics.
   - Addresses: User Detail, summary strips, user funnel, conversion/usage/retention metrics, funnel custom range and dimension switch
   - Avoids: expanding into unbounded admin scope before the core read model is stable

**Phase ordering rationale:**
- Auth and route separation are prerequisites for every admin page.
- The read views depend on the same query protocol and shared entity model, so they should land together.
- P1 items are present in the docs as reserved capability, but they are not required to validate the core admin value.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Docs define namespaces, guards, and query patterns clearly. |
| Features | HIGH | P0 vs P1 boundaries are explicit across PRD, pages, API, and brief. |
| Architecture | HIGH | Separation, read-only behavior, and navigation layers are frozen. |
| Pitfalls | HIGH | Write paths, mixed scopes, and BI creep are repeatedly forbidden. |

## Gaps to Address

- No product stack implementation details are defined in the docs beyond contract boundaries.
- P1 admin expansions are reserved, but their implementation order is not yet fixed.

