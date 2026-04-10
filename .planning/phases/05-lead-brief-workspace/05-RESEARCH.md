# Phase 05: Lead Brief Workspace - Research

## Summary Recommendation

Phase 5 should be implemented as a real versioned workspace, not as an extension of the intake page.

The safest production path is:

1. Keep the existing opportunity shell and stepper.
2. Split the `[step]` route into a small dispatcher that renders the Lead Brief workspace when the canonical step slug is requested.
3. Model Lead Brief as a dedicated current resource plus immutable version snapshots.
4. Use explicit `Save current`, `Save version`, `Restore`, and whole-resource `Regenerate` actions with optimistic concurrency.
5. Keep the UX desktop/laptop only, with a two-pane source/output layout and a right-side version drawer.

The frozen docs already define the product direction: dark, precise, workflow-first, source-aware, and explicitly anti-preview-page. Do not let generic design-system search results override that.

## Standard Stack

- Continue with the existing Next.js App Router + React stack in `apps/web`.
- Keep using the current product shell primitives: `ProductShell`, `ProductStateBlock`, the opportunity stepper, and the dark Linear-like product language from `docs/design/DESIGN.md`.
- Keep API calls in the existing REST/CSRF pattern via `requestProductJson`; do not switch this phase to Server Actions just because a generic UI search suggested them.
- Use app-local UI primitives only. Do not introduce a new component registry or a third-party design system.
- Keep the desktop/laptop validation target at `1024px`, `1280px`, and `1440px`.
- Use the existing `pytest` + `FastAPI TestClient` API tests and Playwright browser tests for TDD and verification.

Recommended implementation posture:

- `apps/api` owns the canonical Lead Brief data and mutation rules.
- `apps/web` owns the workspace composition, editing state, drawer UX, and recovery flows.
- `packages/shared-types` / `packages/shared-schemas` own the DTO contract, field-state unions, and response shapes.

## Architecture Patterns

### 1. Treat Lead Brief as a dedicated resource

Do not keep Lead Brief content inside `opportunities.status` or in the intake record. The opportunity status should remain a workflow marker; the Lead Brief itself needs its own current resource and version history.

Recommended resource split:

- `lead_briefs` current table: one row per opportunity.
- `lead_brief_versions` immutable snapshot table: append-only history.

### 2. Keep the public route slug canonical and hyphenated

There is already a route-seam mismatch in the current code:

- `generate_lead_brief()` redirects to `/opportunities/{id}/lead-brief`
- existing `current_step_url` helpers still build snake_case step URLs

Lock the canonical public URL as `lead-brief`, not `lead_brief`, and centralize the mapping so it is not duplicated across web, API, and tests.

Recommended approach:

- Use snake_case for internal enums like `OpportunityCurrentStep`.
- Use kebab-case for public URL segments.
- Add one shared mapping helper for enum -> route segment and route segment -> enum.

### 3. Keep the Lead Brief workspace two-pane and source-aware

The page should follow the frozen Lead Brief brief:

- Left pane: source material, provenance, raw input, extracted snippets.
- Right pane: editable structured brief with field state badges.
- Version history: right-side drawer on desktop.

Do not turn this into:

- a document preview page
- a long-form editor with hidden provenance
- a dashboard card layout
- a chat experience

The `Continue to Discovery` action should remain visible as the next-step handoff. Because Discovery is a later phase, this CTA should not become a new mini-surface in Phase 5; if the route target is not live yet, keep the action clearly labeled as a handoff rather than pretending the next workspace is already implemented.

### 4. Use explicit field-state transitions

The locked state vocabulary is:

- `Confirmed`
- `Inferred`
- `Missing`
- `Needs Review`

Recommended transition rules:

- `Confirmed` means the user has accepted the value.
- `Inferred` means the value came from source material or AI judgment and has not been explicitly confirmed.
- `Missing` means the field is still empty and must remain visible.
- `Needs Review` means the field exists but still needs user judgment before handoff.
- Editing a confirmed field should downgrade it to `Needs Review` until the user confirms it again.

### 5. Use manual save, not silent autosave

Phase 4 uses a debounced autosave pattern for intake. Do not copy that into Phase 5.

For Lead Brief, the safer contract is:

- local edits stay in component state until the user presses `Save current`
- `Save current` updates only the current working copy
- `Save version` creates an immutable snapshot
- `Regenerate` replaces the current working copy whole-resource, with overwrite confirmation if the user has unsaved edits

This makes concurrency visible and avoids hidden writes on a resource that now has restore semantics.

### 6. Guard every mutating operation with optimistic concurrency

Use a dedicated revision token on the current Lead Brief row, not just `updated_at`.

Recommended contract:

- server returns `current_revision_no`
- client sends `expected_revision_no` on `PATCH`, `generate`, `save-version`, and `restore`
- stale writes return `409 Conflict`
- conflict responses should include the latest revision metadata and a clear reload/retry path

Do not silently merge or auto-reconcile stale working copies.

### 7. Keep history preview read-only and restore deliberate

The version drawer should follow list -> preview -> restore.

Recommended behavior:

- list items only select a version
- preview is read-only and uses the same field-group structure as the current workspace
- restore requires a separate confirmation step
- restore does not auto-create a new history row
- if the user wants to preserve the pre-restore state, they must save a version first

### 8. Keep whole-resource regenerate in MVP

Do not add section-level or field-level regenerate in Phase 5.

The whole-resource regenerate contract is simpler, easier to test, and consistent with the frozen docs. Fine-grained regenerate belongs to a later phase.

## Don't Hand-Roll

- Do not build a generic cross-resource versioning framework before Lead Brief exists in production.
- Do not build a diff engine for version preview in MVP.
- Do not add a generic "restore skeleton" abstraction across all future workflow surfaces.
- Do not keep route strings inline in multiple files.
- Do not convert the workspace into a landing-page or marketing composition.
- Do not rely on toast-only feedback for save, restore, or concurrency errors.
- Do not use 403 for business-rule blockers if the UI needs a product-specific explanation; reserve auth/status codes for true auth/session problems.
- Do not introduce mobile/tablet layouts or mobile-specific interaction patterns in this phase.

## Common Pitfalls

- Route slug drift between `lead_brief` and `lead-brief`.
- Using `opportunity.status` as the source of truth for brief content.
- Treating version history as a diff rather than as full snapshots.
- Letting `Regenerate` or `Restore` silently overwrite user edits.
- Hiding `Missing` or `Needs Review` behind generic warnings.
- Making the version drawer editable.
- Letting billing restriction errors collapse into generic session errors.
- Keeping the source pane visually noisy or turning it into a second editor.
- Copying the intake page's autosave behavior into a versioned workspace.
- Following the UI-UX tool's generic landing-page pattern instead of the frozen docs. For this phase, `docs/design/DESIGN.md` and `05-UI-SPEC.md` are the source of truth.

## File / Module Boundaries

### Web

- `apps/web/app/opportunities/[opportunityId]/[step]/page.tsx`
  - route dispatcher
  - normalize the canonical step slug
  - render intake vs Lead Brief workspace based on the requested step
- `apps/web/components/opportunities/lead-brief-workspace.tsx`
  - main Lead Brief client workspace
  - owns loading/empty/error/blocked/retry/success rendering
  - composes source pane, output pane, and action bar
- `apps/web/components/opportunities/lead-brief-source-pane.tsx`
  - read-only source/provenance panel
- `apps/web/components/opportunities/lead-brief-output-pane.tsx`
  - structured field editor and confirmation controls
- `apps/web/components/opportunities/lead-brief-version-drawer.tsx`
  - version list, preview, restore confirmation, drawer focus handling
- `apps/web/components/opportunities/lead-brief-field-card.tsx`
  - per-field label/value/status/provenance/edit/confirm row
- `apps/web/lib/lead-brief-api.ts`
  - Lead Brief fetch/mutation helpers and typed request wrappers
- `apps/web/lib/opportunity-route.ts` or a similar helper
  - canonical step slug mapping and URL builders
- `apps/web/lib/lead-brief-copy.ts`
  - page copy, field labels, status labels, blocked-state text

### API

- `apps/api/app/lead_brief_routes.py`
  - `GET`, `PATCH`, `generate`, `save-version`, `versions`, `version detail`, `restore`
- `apps/api/app/lead_brief_service.py`
  - business logic, field-state transitions, concurrency checks, restore rules
- `apps/api/app/lead_brief_repository.py`
  - current resource and version snapshot persistence
- `apps/api/app/lead_brief_models.py`
  - SQLAlchemy table definitions and indexes
- `apps/api/app/opportunity_routes.py`
  - should stop owning Lead Brief-specific behavior or delegate cleanly to the new module

### Shared

- `packages/shared-types/index.ts`
  - add Lead Brief resource types, field-state unions, version response types, and concurrency fields
- `packages/shared-schemas/index.ts`
  - add the matching JSON schemas used by tests and contract validation
- `packages/shared-config/index.ts`
  - centralize route slug mapping and canonical step URL helpers

### Tests

- `tests/api/test_lead_brief_api.py`
  - current resource read/update/save-version/version list/detail/restore
- `tests/api/test_lead_brief_gate_api.py`
  - generate and dependency gating coverage
- `tests/e2e/lead-brief-workspace.spec.ts`
  - browser verification for empty/populated/recovery/history/restore flows
- `tests/e2e/helpers/lead-brief.ts`
  - route setup, version drawer helpers, width setup, and common assertions

## Data Model Decisions to Lock

### 1. Canonical route slug

Lock the public Lead Brief URL segment as `lead-brief`.

Reason:

- the current generator already redirects there
- the frozen UI brief uses that shape
- it keeps the URL readable and consistent with the other workflow pages

### 2. Current resource schema

Recommended `lead_briefs` row shape:

- `id`
- `workspace_id`
- `opportunity_id` unique
- `current_payload` JSONB
- `current_revision_no` integer
- `latest_version_no` integer
- `last_ai_call_id` nullable
- `updated_by_user_id` nullable
- `created_at`
- `updated_at`

The current payload should contain the structured brief fields and their field-state metadata.

### 3. Version snapshot schema

Recommended `lead_brief_versions` row shape:

- `id`
- `lead_brief_id`
- `workspace_id`
- `opportunity_id`
- `version_no`
- `payload` JSONB
- `version_origin` (`generate`, `save_current`, `save_version`, `restore`)
- `saved_by_user_id`
- `ai_call_id` nullable
- `created_at`

History must be immutable and full-resource, not diff-based.

### 4. Concurrency token

Use a dedicated integer revision token, not `updated_at`, for optimistic concurrency.

Recommended request pattern:

- `expected_revision_no` is required for every mutating request
- the server rejects mismatches with `409 Conflict`
- the UI shows a conservative reload/retry message and keeps the visible draft intact

### 5. Payload shape

Keep the payload structured and field-oriented. A stable map of field keys is easier to render and validate than free-form prose.

Recommended field groups:

- client/company
- contact
- requested service
- business context
- urgency/timeline
- budget signal
- fit assessment
- missing information
- recommended next step

Each field should carry:

- `value`
- `status`
- provenance or helper text when available

### 6. Restriction and blocked-action semantics

The restricted billing states must block the write actions without blocking view-only access.

Recommended behavior:

- allow read-only viewing of the current resource and versions
- block `generate`, `regenerate`, `save current`, `save-version`, `restore`, and `export`
- surface `restriction_reason` in the page copy and not just in the API payload

## Verification Strategy

Use TDD in this order:

1. Write failing API contract tests for current resource, save current, save version, version list/detail, restore, and conflict handling.
2. Write failing browser tests for the desktop workspace, version drawer, overwrite confirmation, and concurrency recovery.
3. Implement the API first, then the workspace UI, then the browser verification.

Minimum API test coverage:

- Lead Brief empty vs populated current resource
- `Save current` updates current resource only
- `Save version` appends an immutable snapshot
- restore replaces the current working copy
- stale `expected_revision_no` returns `409`
- billing restrictions block write actions but preserve viewing

Minimum browser coverage:

- empty Lead Brief state
- populated current resource state
- field editing and confirmation
- `Save current`
- `Save version`
- version list -> preview -> restore confirmation
- regenerate overwrite warning
- loading / error / blocked / retry / success states
- desktop widths at `1024px`, `1280px`, and `1440px`

## Code Examples

### Canonical route mapping

```ts
const LEAD_BRIEF_ROUTE_SEGMENT = "lead-brief";

function buildLeadBriefUrl(opportunityId: string) {
  return `/opportunities/${opportunityId}/${LEAD_BRIEF_ROUTE_SEGMENT}`;
}
```

### Optimistic concurrency request shape

```ts
type LeadBriefUpdateRequest = {
  expected_revision_no: number;
  payload: LeadBriefPayload;
};
```

### Version preview rule

```ts
// Selecting a version only opens preview.
// Restore is a separate confirmed action.
```

## Bottom Line

Phase 5 is ready to plan when the team agrees on:

- canonical `lead-brief` route slug
- explicit revision token for concurrency
- current resource + immutable snapshot tables
- manual `Save current` instead of silent autosave
- desktop-only two-pane workspace with a right-side version drawer
- TDD-first implementation with API tests before UI polish
