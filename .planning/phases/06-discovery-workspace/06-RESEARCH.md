# Phase 6: Discovery Workspace - Research

**Gathered:** 2026-04-11
**Status:** Ready for planning

<summary>
Phase 6 is a desktop/laptop-only Discovery workspace that turns opportunity source material into proposal-ready intelligence with visible uncertainty, source attribution, version history, and explicit restore semantics.
</summary>

<findings>
## Existing Codebase Findings

### Route and shell seams already exist
- `apps/web/app/opportunities/[opportunityId]/[step]/page.tsx` already branches by workflow step and can be extended to route Discovery into a dedicated workspace component.
- `apps/web/components/product-shell.tsx` already provides the customer shell structure that Discovery should continue to use.
- `apps/web/components/product-state-block.tsx` already covers `loading`, `empty`, `error`, `blocked`, `retry`, and `success` states with accessible live-region semantics.

### Versioned workspace patterns already exist
- `apps/web/components/opportunities/lead-brief-workspace.tsx` already demonstrates the current-resource + version-history + restore pattern that Discovery should mirror.
- `apps/api/app/lead_brief_routes.py` and `apps/api/app/lead_brief_service.py` already encode optimistic concurrency, immutable version snapshots, and explicit restore confirmation behavior.
- `packages/shared-types/index.ts` already defines the field/value/version shape that Discovery can mirror without inventing a new interaction model.

### Shared route contracts are ready for discovery expansion
- `packages/shared-config/index.ts` already has the `discovery` step segment but no dedicated discovery API helpers yet.
- `packages/shared-types/index.ts` currently exposes workflow states, step readiness, and opportunity gating vocabulary, but no discovery-specific resource types.
- `packages/shared-schemas/index.ts` already carries structured schemas for Lead Brief and can be extended with a matching discovery contract.

### No discovery implementation exists yet
- There is no Discovery route component, no discovery API client, and no discovery backend route/service/repository layer in the repo yet.
- The phase therefore needs a contract-first plan that adds tests and DTOs before implementation work begins.

</findings>

<ui_research>
## UI/UX Research Conclusions

### What to keep
- `docs/design/DESIGN.md` is the dominant visual contract: dark-mode-native, subtle borders, restrained translucency, Inter Variable, and product UI that feels like a shipping application.
- `ProductStateBlock` already provides the right semantic backbone for loading, error, blocked, retry, and success states.
- The UI should continue the Phase 5 pattern of a source pane and a working pane rather than collapsing into a transcript or document viewer.

### What to reject from generic UI tooling
- The `ui-ux-pro-max` search results that leaned toward horizontal journeys, vibrant blocks, and landing-page motion are not suitable for this phase.
- The only useful guidance from that tooling is operational: show loading feedback, show helpful empty states, announce errors, place errors near the problem, and keep recovery paths obvious.

### Practical UI implications
- Discovery needs a split-pane evidence workspace with a read-first source pane and an active structured-output pane.
- Version history should be a right-side drawer on desktop, with list -> preview -> restore inside the drawer.
- Thin evidence should be an explicit visible state, not a silent failure or chat-like disclaimer.
- Route-level `loading.tsx` and `error.tsx` should exist for the Discovery route so the page still behaves like a product when data or network issues occur.

</ui_research>

<implementation_implications>
## Implementation Implications

1. Add discovery-specific DTOs, schemas, and route builders before touching implementation code.
2. Mirror the Lead Brief current-resource/version semantics so the user model stays consistent across workflow phases.
3. Keep the workspace evidence-first: source material stays visible while the structured output is edited.
4. Make weak evidence and concurrency conflicts explicit product states with recovery actions.
5. Treat browser verification as part of the phase definition, not as an optional polish step.

</implementation_implications>

<risks>
## Risks

- Discovery can easily collapse into a summary page if the source/output separation is weak.
- Restore and regenerate are the highest-risk destructive actions; both need explicit confirmations and conservative conflict handling.
- If route-level loading/error boundaries are omitted, the page will feel fragile even if the core workspace works.
- Over-adopting generic AI or landing-page UI motifs would break the product language established in earlier phases.

</risks>

<references>
## References Consulted

- `.planning/PROJECT.md`
- `.planning/REQUIREMENTS.md`
- `.planning/ROADMAP.md`
- `.planning/phases/01-foundation-repo-infra-ui-baseline/01-CONTEXT.md`
- `.planning/phases/03-dashboard-opportunities-list/03-CONTEXT.md`
- `.planning/phases/05-lead-brief-workspace/05-CONTEXT.md`
- `docs/design/DESIGN.md`
- `apps/web/app/opportunities/[opportunityId]/[step]/page.tsx`
- `apps/web/components/product-shell.tsx`
- `apps/web/components/product-state-block.tsx`
- `apps/web/components/opportunities/lead-brief-workspace.tsx`
- `apps/api/app/lead_brief_routes.py`
- `apps/api/app/lead_brief_service.py`
- `packages/shared-config/index.ts`
- `packages/shared-types/index.ts`
- `packages/shared-schemas/index.ts`

</references>

---

*Phase: 06-Discovery Workspace*
*Research gathered: 2026-04-11*
