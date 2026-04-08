# Architecture Patterns

**Domain:** Internal admin console
**Researched:** 2026-04-08

## Recommended Architecture

Use a separated admin surface with three layers:

1. Admin web shell under `/admin`
2. Admin API under `/api/v1/admin/*`
3. Shared read models over platform entities and activity data

The docs strongly favor a read-first architecture. Admin pages should consume query endpoints for lists, summaries, details, and funnel metrics. Write paths, customer workflow mutations, and ops controls stay out of the first release.

### Component Boundaries

| Component | Responsibility | Communicates With |
|-----------|---------------|-------------------|
| Admin shell | Route, auth, navigation, support states | Admin auth endpoint, page views |
| Overview view | Platform-wide summary cards and alerts | Admin overview and metrics queries |
| Workspaces views | Searchable workspace list and detail | Workspace list/detail queries |
| Users views | User lookup and tracing | Users list query, future user detail |
| Subscriptions views | Trial and billing judgment | Subscriptions list and summary queries |
| Funnel view | Workspace funnel analysis | Funnel aggregate query |
| Shared query contract | Filters, sorting, pagination, time windows | All admin read endpoints |

### Data Flow

1. User enters `/admin`.
2. Admin auth guard calls `/api/v1/admin/auth/me`.
3. Route shell selects the requested admin page.
4. Page issues read-only admin query endpoints with shared filters and windows.
5. Results render as cards, tables, badges, timelines, and support states.
6. Drill-down returns to the originating list while preserving query params.

## Patterns to Follow

### Pattern 1: Read-only query surface
**What:** Admin pages only inspect and summarize state.
**When:** All first-release admin pages.
**Example:**
```typescript
// Fetch read data only; do not expose mutation actions in P0.
const data = await fetch("/api/v1/admin/workspaces?limit=20");
```

### Pattern 2: Shared filter contract
**What:** Reuse the same filter names across pages and APIs.
**When:** Lists, drill-downs, and metric queries.
**Example:**
```typescript
const params = new URLSearchParams({
  q,
  trial_status,
  billing_status,
  from,
  to,
});
```

### Pattern 3: Reserved placeholder routing
**What:** Keep route and API placeholders for documented P1 items without making them P0 commitments.
**When:** User Detail, extra summary metrics, user funnel, custom ranges.
**Example:**
```typescript
// Keep the route shape, but do not block first release on full feature work.
/admin/users/:userId
```

## Anti-Patterns to Avoid

### Anti-Pattern 1: Mixed customer/admin boundary
**What:** Reusing customer auth, routes, or APIs for admin.
**Why bad:** Breaks isolation and access control.
**Instead:** Keep separate admin entry, guards, and namespace.

### Anti-Pattern 2: Write-capable admin by default
**What:** Adding mutation or bulk-control actions early.
**Why bad:** Increases risk and scope.
**Instead:** Keep first release read-only.

### Anti-Pattern 3: BI dashboard sprawl
**What:** Turning admin into a broad analytics workspace.
**Why bad:** Conflicts with the docs' scan-first, judgment-first intent.
**Instead:** Favor compact cards, tables, and drill-down views.

## Scalability Considerations

| Concern | At 100 users | At 10K users | At 1M users |
|---------|--------------|--------------|-------------|
| Query cost | Direct reads are fine | Add caching or pre-aggregation | Pre-aggregate summary and funnel data |
| List navigation | Basic cursor pagination | Stable filters and sort | Strict query contracts and paging |
| Detail views | Simple joins | Summaries plus timelines | Split heavy detail data from core read path if needed |

## Sources

- Admin PRD
- Page requirements
- API requirements
- Information architecture
- Design brief

