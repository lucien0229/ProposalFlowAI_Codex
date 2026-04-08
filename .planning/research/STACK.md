# Technology Stack

**Project:** ProposalFlow AI Admin
**Researched:** 2026-04-08

## Recommended Stack

The docs do not prescribe a concrete framework or database stack. They do freeze the admin contract surface:

### Core Contract
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| `/admin` route/domain | N/A | Separate admin entry | Admin must stay isolated from customer-facing web. |
| `/api/v1/admin/*` | N/A | Admin API namespace | Keeps read queries and auth separate from customer APIs. |
| Internal auth guard | N/A | Access control | Required for every admin page and admin API. |
| Internal role guard | N/A | Role control | Only `internal_admin` and `internal_analyst` may access admin. |

### Query Contract
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Cursor pagination | N/A | List navigation | Stable for admin lists; preferred over ad hoc pagination. |
| `q`, status, date, sort filters | N/A | Query filtering | Shared contract across pages and APIs. |
| `from` / `to` windows | N/A | Metric and funnel ranges | Required for all trend and aggregation queries. |

### Data Sources
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| `users`, `workspaces`, `workspace_members` | N/A | Entity lookup | Core admin list/detail views. |
| `workspace_subscriptions` | N/A | Billing/trial state | Required for commercial judgment views. |
| `activity_logs` + core business entities | N/A | Funnel and usage aggregation | Docs require event and business-table joint calculation. |

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| API boundary | `/api/v1/admin/*` | Reusing customer APIs | Breaks separation and increases access risk. |
| Query style | Cursor-based lists | Fully ad hoc pagination | Docs prefer a stable list protocol. |
| Data model | Read aggregation over core tables | New BI warehouse first | Docs explicitly avoid turning admin into BI. |

## Installation

No implementation packages are specified by the docs.

## Sources

- Admin PRD
- Page requirements
- API requirements
- Information architecture
- Metrics and definitions
- Design brief

