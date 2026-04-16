# Phase 7: Proposal Draft + Templates & Rules - Research

**Gathered:** 2026-04-13
**Status:** Ready for planning

<summary>
Phase 7 is the first signature drafting surface in the product: a desktop/laptop-only Proposal Draft workspace plus a separate Templates & Rules page. It must combine structured upstream inputs, effective-rule visibility, chapter editing, chapter regenerate, version history, export, and restriction handling without collapsing into either a black-box generator or an admin control panel.
</summary>

<findings>
## Existing Codebase Findings

### Opportunity workflow seams already exist
- `apps/web/app/opportunities/[opportunityId]/[step]/page.tsx` already routes `lead-brief` and `discovery` into dedicated workspaces and already recognizes the `proposal_draft` step segment through shared config.
- `packages/shared-config/index.ts` already exposes the `proposal_draft` route segment and `templatesRules` navigation path, but it does not yet expose Phase 7 API builders.
- `apps/web/components/product-nav.tsx` already keeps `Templates & Rules` in the stable global customer shell, so the IA is reserved and should now be productized rather than redesigned.

### Versioned workspace patterns are already proven
- `apps/web/components/opportunities/lead-brief-workspace.tsx` and `apps/web/components/opportunities/discovery-workspace.tsx` already encode the product's `current resource + immutable versions + restore + conflict` interaction model.
- `apps/api/app/lead_brief_routes.py`, `apps/api/app/lead_brief_service.py`, `apps/api/app/discovery_routes.py`, and `apps/api/app/discovery_service.py` already demonstrate the browser-CSRF mutation pattern, optimistic concurrency, and conservative conflict responses Phase 7 should mirror.
- `packages/shared-types/index.ts` and `packages/shared-schemas/index.ts` already provide reusable naming and schema patterns for versioned, field-oriented resources.

### No Proposal Draft or Rules implementation exists yet
- There is no `proposal_draft` route branch, no proposal draft client API, no proposal draft backend route/service/repository module, and no templates/rules editing surface in the current repo.
- `apps/web/app/templates-rules/page.tsx` is still a placeholder page from Phase 3, which confirms route ownership but contributes no real functionality.
- The phase therefore needs a contract-first plan: tests, DTOs, routes, and persistence boundaries must be frozen before full UI implementation.

### Frozen docs define stricter semantics than the current codebase
- `docs/web/ProposalFlow AI｜API 设计 v1.0.md` fixes the public Proposal Draft and Templates & Rules endpoints, response fields, and gating expectations.
- `docs/share/ProposalFlow AI｜系统架构与技术方案 v1.0.md` fixes the structured-first generation chain and states that `workspace_rule_sets` and `opportunity_rule_overrides` are the only durable rule sources.
- `docs/share/ProposalFlow AI｜数据库设计 v1.0.md` fixes the persistence model: one current proposal draft per opportunity, immutable proposal-draft versions, template definitions, workspace baseline rules, and opportunity overrides.

</findings>

<ui_research>
## UI/UX Research Conclusions

### Dominant visual direction
- `docs/design/DESIGN.md` and the earlier workspace UI contracts remain the source of truth: deep-dark canvas, translucent panels, restrained accent use, Inter Variable, and dense-but-readable B2B product UI.
- The Proposal Draft surface should promote chapter editing to the dominant visual layer; this is the first page where users are actively shaping client-facing output, not just reviewing structured data.
- `Templates & Rules` should feel like a modular operational settings page tied tightly to the drafting outcome, not a template marketplace and not a flat admin form.

### What `ui-ux-pro-max` usefully reinforces
- Keep a stable type scale and accessible heading hierarchy.
- Use explicit labels for dense controls rather than placeholder-only inputs.
- Validate rule fields inline or on blur rather than only on submit.
- Prevent layout shift with stable skeleton geometry for async sections.

### What to reject from generic UI tooling
- `ui-ux-pro-max` design-system suggestions drifted toward storytelling, badge-heavy trust motifs, light backgrounds, and alternate typography. Those are not compatible with the frozen ProposalFlow product language.
- Next.js server-action recommendations from the generic stack guidance are not a reason to abandon the repo's existing API-route + client helper pattern midstream.

### Practical UI implications
- Proposal Draft should use a top rules summary bar, a dominant central chapter stage, and a right-side on-demand drawer for versions, override editing, and secondary risk detail.
- `low confidence`, `rules conflict`, `missing inputs`, and `billing restriction` need a two-layer expression model: page-level status band + local chapter/module markers.
- Templates & Rules should group configuration by mental model (`Template Basics`, `Assumptions & Exclusions`, `Tone & Terminology`, `Sections & Modules`) and keep the save/return-to-draft loop obvious.
- Route-level `loading.tsx` and `error.tsx` should exist so both pages remain credible product surfaces during failures.

</ui_research>

<implementation_implications>
## Implementation Implications

1. Freeze Proposal Draft and Templates & Rules contracts first: types, schemas, route builders, API route tests, and browser surface expectations before building feature code.
2. Keep rules as backend business objects, not frontend-only knobs. The backend must own rule validation, effective-rule composition, conflict handling, and generation payload assembly.
3. Proposal Draft backend work should mirror Lead Brief and Discovery resource/version semantics, but extend them for chapter-level mutate/regenerate and export.
4. Proposal Draft UI work should be staged:
   - route and API clients
   - state scaffolding and gates
   - chapter workspace and version drawer
   - rule summary / override integration
   - full browser recovery and restriction sweep
5. Templates & Rules should remain workspace-baseline only. Opportunity-local override editing belongs inside Proposal Draft, not on the global rules page.
6. Billing is a later phase, but Phase 7 must still honor the blocked-action matrix in UI and API seams so the product does not need a redesign when billing enforcement arrives.

</implementation_implications>

<risks>
## Risks

- Proposal Draft can easily degenerate into a control-panel jungle if rules, warnings, versions, and editing all compete as primary surfaces.
- Chapter-level regenerate is the highest product-risk interaction because users expect local control but can still lose edits if overwrite semantics are weak.
- Export can look trivial in docs but creates contract and integration risk: format selection, restriction behavior, and preserving current-resource fidelity all need explicit test coverage.
- If Templates & Rules becomes a giant low-signal form, users will not understand which changes affect Proposal Draft generation or why.
- Over-relying on generic AI UI motifs would break the product language established in Phases 3, 5, and 6.

</risks>

<validation_architecture>
## Validation Architecture

### Core test stack
- API contract and business-rule verification should continue using `pytest` under `PYTHONPATH=apps/api`.
- Browser verification should continue using Playwright because this phase includes dense editing flows, drawers, explicit overwrite confirmation, and cross-page rule state refresh.
- `pnpm lint` remains part of the validation chain because Phase 7 adds large shared contract surfaces in TypeScript and substantial new web UI.

### Verification strategy by surface
- Shared contracts and API boundaries need explicit red-green coverage before implementation:
  - route helpers and DTO shapes
  - rules endpoints and conflict behavior
  - proposal draft generation gates
  - chapter regenerate overwrite semantics
  - export format behavior
- Browser verification must cover:
  - Proposal Draft empty/loading/error/blocked/retry/success states
  - Templates & Rules empty/loading/error/invalid/conflict/success states
  - chapter edit + save current + save version
  - chapter regenerate confirmation when unsaved edits exist
  - version list -> preview -> restore flow
  - rule baseline save -> return to Proposal Draft -> refreshed effective rules summary
  - override save/clear -> refreshed effective rules summary
  - restriction matrix behavior for blocked actions

### Recommended commands
- Quick API feedback:
  - `PYTHONPATH=apps/api pytest tests/api/test_templates_rules_api.py tests/api/test_proposal_draft_api.py -q`
- Quick browser feedback:
  - `pnpm exec playwright test tests/e2e/proposal-draft-workspace.spec.ts -g 'empty|blocked|regenerate|versions'`
- Full phase regression:
  - `PYTHONPATH=apps/api pytest tests/api/test_templates_rules_api.py tests/api/test_proposal_draft_api.py -q && pnpm exec playwright test tests/e2e/proposal-draft-workspace.spec.ts tests/e2e/templates-rules.spec.ts && pnpm lint`

</validation_architecture>

<references>
## References Consulted

- `.planning/PROJECT.md`
- `.planning/REQUIREMENTS.md`
- `.planning/ROADMAP.md`
- `.planning/phases/03-dashboard-opportunities-list/03-CONTEXT.md`
- `.planning/phases/05-lead-brief-workspace/05-CONTEXT.md`
- `.planning/phases/05-lead-brief-workspace/05-UI-SPEC.md`
- `.planning/phases/06-discovery-workspace/06-CONTEXT.md`
- `.planning/phases/06-discovery-workspace/06-UI-SPEC.md`
- `.planning/phases/07-proposal-draft-templates-rules/07-CONTEXT.md`
- `docs/design/DESIGN.md`
- `docs/web/ProposalFlow AI｜API 设计 v1.0.md`
- `docs/web/ProposalFlow AI｜页面清单与页面级需求 v1.0.md`
- `docs/web/ProposalFlow AI｜页面流程与信息架构说明 v1.0.md`
- `docs/web/ProposalFlow AI｜PRD v1.0（MVP）.md`
- `docs/web/ProposalFlow_AI_客户侧_页面设计Brief_v1.2.md`
- `docs/share/ProposalFlow AI｜系统架构与技术方案 v1.0.md`
- `docs/share/ProposalFlow AI｜数据库设计 v1.0.md`
- `docs/share/ProposalFlow AI 开发骨架与目录结构设计说明 v1.0.md`
- `apps/web/app/opportunities/[opportunityId]/[step]/page.tsx`
- `apps/web/app/templates-rules/page.tsx`
- `apps/web/components/product-nav.tsx`
- `apps/web/components/opportunities/lead-brief-workspace.tsx`
- `apps/web/components/opportunities/discovery-workspace.tsx`
- `apps/api/app/lead_brief_routes.py`
- `apps/api/app/discovery_routes.py`
- `apps/web/lib/lead-brief-api.ts`

</references>

---

*Phase: 07-proposal-draft-templates-rules*
*Research gathered: 2026-04-13*
