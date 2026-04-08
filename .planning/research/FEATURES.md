# Feature Landscape

**Domain:** Internal admin console
**Researched:** 2026-04-08

## Table Stakes

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Separate admin auth entry | Admin must not share the customer entry path | Low | Required by docs. |
| Overview dashboard | Internal users need a quick platform-level readout | Low | Core P0. |
| Workspaces list and detail | Workspace is the main admin object | Med | Core P0. |
| Users list | Needed for platform-level lookup and tracing | Med | Core P0. |
| Subscriptions / Trials view | Needed for commercial status judgment | Med | Core P0. |
| Workspace funnel analytics | Needed to identify flow drop-off | Med | Core P0. |
| Search, filter, sort, paginate | Admin is query-first | Low | Mandatory across list views. |
| Read-only drill-down | Admin must support inspection without writes | Low | Mandatory. |
| Stable support states | Loading, empty, error, insufficient data, forbidden | Low | Mandatory for admin UX. |

## Differentiators

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Activation and workflow completion judgment | Helps internal teams judge product value and flow completion | Med | Explicitly defined in docs. |
| Restriction explanation fields | Turns billing/trial state into understandable admin output | Low | `is_generation_allowed`, `restriction_reason`. |
| Cross-page filter carryover | Makes drill-down and back navigation useful | Low | Part of route/query contract. |

## Anti-Features

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Customer-facing workflow pages | Admin is not part of the customer product | Keep admin isolated under separate route and auth. |
| CRM or support backend | Not part of the documented scope | Keep the product focused on platform judgment. |
| BI-style dashboard sprawl | The docs emphasize minimal, readable admin views | Use a compact overview plus lists. |
| High-risk write operations | Explicitly excluded from first release | Keep the surface read-only. |
| Impersonation | Explicitly excluded | Do not model it in P0. |
| Manual trial/billing mutation | Explicitly excluded | Leave state changes out of P0. |

## Feature Dependencies

Admin Auth -> all `/admin/*` pages
Overview -> list drill-down and commercial alerts
Workspaces List -> Workspace Detail
Subscriptions / Trials -> Workspace Detail
Funnel Analytics -> workspace funnel metrics and later reserved drill-down

## MVP Recommendation

Prioritize:
1. Admin Auth and protected admin shell
2. Overview, Workspaces, Users, Subscriptions / Trials, Funnel Analytics
3. Workspace Detail as the main drill-down surface

Defer:
- User Detail: reserved as P1, not a first-release dependency
- Funnel custom range and dimension switching: reserved as P1
- Funnel-to-list drill-down: enhancement only
- Summary strips and extra metrics: reserved, not P0

## Sources

- Admin PRD
- Page requirements
- API requirements
- Information architecture
- Metrics and definitions

