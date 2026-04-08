# Domain Pitfalls

**Domain:** Internal admin console
**Researched:** 2026-04-08

## Critical Pitfalls

### Pitfall 1: Breaking the admin boundary
**What goes wrong:** Admin becomes reachable through customer routes, customer auth, or customer APIs.
**Why it happens:** Teams reuse existing web patterns instead of enforcing a separate admin contract.
**Consequences:** Access control confusion, accidental exposure, and roadmap drift.
**Prevention:** Keep `/admin` and `/api/v1/admin/*` separate with internal guards only.
**Detection:** Any reuse of customer auth, workspace guard, or product API for admin queries.

### Pitfall 2: Letting write actions creep into P0
**What goes wrong:** Manual state changes, impersonation, bulk edits, or workflow forcing are added too early.
**Why it happens:** Admin surfaces often attract operational shortcuts.
**Consequences:** Higher risk, harder testing, and scope explosion.
**Prevention:** Keep first release read-only and exclude high-risk actions.
**Detection:** Any button, endpoint, or modal that changes trial, billing, or workflow state.

### Pitfall 3: Mixing object scopes
**What goes wrong:** User-level and workspace-level metrics are mixed together.
**Why it happens:** Funnel and conversion analysis can drift across entity types.
**Consequences:** Bad numbers and misleading judgments.
**Prevention:** Keep workspace as the default object for core admin judgment.
**Detection:** Any metric definition that uses the wrong denominator or omits the object type.

## Moderate Pitfalls

### Pitfall 1: BI creep
**What goes wrong:** The admin surface turns into a full analytics warehouse UI.
**Prevention:** Keep cards, lists, and drill-downs lightweight.

### Pitfall 2: Too many future controls in the first screen
**What goes wrong:** P1 items are designed as if they are P0.
**Prevention:** Keep placeholder routes and controls visually reserved but non-blocking.

### Pitfall 3: Weak status explanation
**What goes wrong:** Internal statuses are shown without explanation.
**Prevention:** Always pair state with readable restriction text.

## Minor Pitfalls

### Pitfall 1: Losing query context on drill-down
**What goes wrong:** Users cannot return to the same filtered list.
**Prevention:** Preserve query params across navigation.

### Pitfall 2: Unsupported empty or error states
**What goes wrong:** Admin pages look broken when data is missing.
**Prevention:** Design loading, empty, error, insufficient data, and forbidden states explicitly.

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| Admin shell | Boundary bleed into customer web | Separate route, auth, and API namespace |
| Core P0 pages | Metric ambiguity | Freeze object type, denominator, and time window |
| Reserved P1 views | Scope creep | Keep placeholders only; do not promote to P0 |
| Funnel analytics | Object mixing | Default to workspace funnel; keep user funnel separate |
| Subscriptions / Trials | Raw status confusion | Surface `is_generation_allowed` and `restriction_reason` |

## Sources

- Admin PRD
- Page requirements
- API requirements
- Information architecture
- Metrics and definitions
- Design brief

