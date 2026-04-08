# ROADMAP: ProposalFlow AI

## Roadmap Rules

- P0 = customer-side MVP first release scope.
- P1 reserve = boundary reservation or minimal placeholder, not the first release focus.
- Every customer-facing phase must deliver shipping UI, backend/API, required states, guards, restriction/dependency notices, and page-level verification.
- Route names, guards, endpoint mappings, acceptance notes, and other implementation-facing details may exist in planning docs, but they must not become the page body itself.

## Phase Overview

| Phase | Class | Outcome |
|------|-------|---------|
| Phase 1 | P0 | Monorepo, shared platform baseline, app shells, UI primitives, deploy skeleton |
| Phase 2 | P0 | Auth + workspace bootstrap so users can enter a live workspace |
| Phase 3 | P0 | Dashboard + opportunities list as the customer command center |
| Phase 4 | P0 | Opportunity intake, raw input, file processing, and lead-brief entry point |
| Phase 5 | P0 | Lead Brief workspace with current resource, version history, and restore |
| Phase 6 | P0 | Discovery workspace with evidence-aware structured intelligence |
| Phase 7 | P0 | Proposal Draft + Templates & Rules, the core drafting loop |
| Phase 8 | P0 | Follow-up workspace as the post-draft handoff step |
| Phase 9 | P0 | Billing / Trial / restriction matrix and read-only enforcement |
| Phase 10 | P0 | Minimal settings surface without becoming a second admin console |
| Phase 11 | P0 | Release readiness, staging parity, and launch verification |
| Phase 12 | P1 reserve | Admin boundary placeholder, kept separate from customer launch scope |

## Phase 1 — Foundation / Repo / Infra / UI Baseline

**Goal**

Establish the repo, application boundaries, shared packages, environment layers, and first-pass UI primitives so later phases can ship product UI instead of spec pages.

**In Scope**

- Create the monorepo skeleton and top-level workspace structure.
- Establish `apps/web`, `apps/admin`, `apps/api`, `apps/worker`.
- Establish `packages/shared-types`, `packages/shared-schemas`, `packages/shared-config`.
- Wire shared route namespaces for product API, admin API, and shared platform services.
- Build the customer app shell, admin placeholder shell scaffold, global navigation scaffold, shared layout primitives, and shared state primitives.
- Define local / staging / production environment shape.
- Set up the migration and worker skeletons, plus the basic integration surface for Auth, OpenAI, Stripe, and file processing.
- Apply the DESIGN.md visual baseline so the future product routes inherit the correct shipping UI language.

**Out of Scope**

- Real customer workflows.
- Real admin workflows.
- Polished page content beyond shell and state primitives.
- Production launch execution.

**Key Dependencies**

- Frozen docs under `/docs`.
- `DESIGN.md` as the only UI design system contract.
- Single PostgreSQL + shared platform architecture decisions.
- Docker / deployment baseline.

**Main Outputs**

- Frontend / UI: customer app shell, admin placeholder shell scaffold, navigation scaffold, shared layout primitives, shared state primitives.
- Backend / API: product API namespace, admin API namespace, shared service layer skeleton, auth/Stripe/OpenAI/file integration boundaries.
- Data / Worker / Infra: migration framework, worker bootstrapping, environment templates, deploy objects for `web / admin / api / worker`.
- Verification: local boot smoke, route shell smoke, and shared-state component smoke.

**Acceptance**

- All apps can boot in the repo and expose their intended entry points.
- `web` and `admin` are separated in code and route space.
- Customer-facing shells already look like product UI, not documentation pages.
- Shared primitives can be reused by later customer routes without reworking the baseline.
- Staging and production are already modeled as first-class environments, not an afterthought.

**Risks and Notes**

- Biggest risk is overbuilding shared abstractions too early.
- Admin must remain a placeholder scaffold at this stage, not a second product.
- Do not let shell work turn into page-content work.

## Phase 2 — Auth & Workspace Setup

**Goal**

Let a new user sign in, sign up, recover access, and create the active workspace context needed to enter the product.

**In Scope**

- Sign In, Sign Up, and Forgot Password customer routes.
- Email/password auth and Google OAuth.
- Session persistence and return-intent handling.
- Workspace Setup route and setup guard.
- Initial workspace creation with name, industry type, template, and tone preference.

**Out of Scope**

- Dashboard analytics.
- Opportunity workflows.
- Admin auth as a launch surface.

**Key Dependencies**

- Phase 1 auth/session scaffolding.
- User, session, workspace, and membership models.
- Customer route guards.

**Main Outputs**

- Frontend / UI: Sign In / Sign Up / Forgot Password shipping UI, Workspace Setup shipping UI, auth-related loading/error/retry states.
- Backend / API: web auth endpoints, session verification, workspace bootstrap endpoint, current workspace resolution.
- Data / Worker / Infra: user/session/workspace persistence and any auth-provider mapping needed for the login flow.
- Verification: sign-up to workspace setup to dashboard handoff smoke test.

**Acceptance**

- A new user can create or access an account and land in a workspace.
- Missing workspace setup blocks access to the product and returns the user to setup.
- Session survives refresh.
- Auth pages surface clear failure states instead of silent failures.

**Risks and Notes**

- Web/admin session separation must stay strict from day one.
- Setup flow should be short and not become a product survey.

## Phase 3 — Dashboard & Opportunities List

**Goal**

Give the customer a command center for starting new work, resuming open work, and navigating opportunities.

**In Scope**

- Dashboard route.
- Opportunities List route.
- New opportunity entry point.
- Resume unfinished opportunity entry point.
- Search, filter, sort, archive, and open behaviors for opportunities.
- Global navigation links to the main customer surfaces.

**Out of Scope**

- Intake editing depth.
- Lead Brief, Discovery, or Proposal Draft generation.
- Admin analytics views.

**Key Dependencies**

- Auth and workspace setup.
- Opportunity list/read APIs.
- Summary metrics or counts needed by the dashboard.

**Main Outputs**

- Frontend / UI: Dashboard shipping UI, Opportunities List shipping UI, empty state, loading state, filtered state, blocked state, retry state.
- Backend / API: dashboard summary endpoints, opportunity list endpoints, archive/unarchive support.
- Data / Worker / Infra: opportunity list indexes and workspace-scoped query support.
- Verification: create/open/search/filter/archive smoke checks.

**Acceptance**

- The dashboard and list feel like a product command center, not a metrics dashboard dump.
- Users can reliably open the correct opportunity from list or dashboard.
- Guards and states are visible and task-oriented.

**Risks and Notes**

- Dashboard can easily become overstuffed; keep it action-first.
- List filters must not drift into admin-style analysis.

## Phase 4 — Opportunity Intake & File Processing

**Goal**

Turn raw lead information into a structured opportunity ready for Lead Brief generation.

**In Scope**

- Opportunity Overview / Lead Intake route.
- Raw input capture.
- Minimum opportunity field editing.
- PDF upload, processing, ready, failed, and retry states.
- File extraction and opportunity update behavior.
- Entry from intake into Lead Brief generation.

**Out of Scope**

- Structured brief content.
- Discovery intelligence.
- Proposal drafting.

**Key Dependencies**

- Opportunity entity and workspace scoping.
- File storage and worker processing.
- Opportunity detail/update APIs.

**Main Outputs**

- Frontend / UI: Opportunity Overview / Lead Intake shipping UI, file state components, long-text raw input area, primary CTA for Lead Brief generation.
- Backend / API: opportunity read/update/create endpoints, file upload-url/complete/retry endpoints, file status endpoints.
- Data / Worker / Infra: object storage, worker extraction jobs, file processing state records.
- Verification: uploaded → processing → ready / failed path, plus retry recovery.

**Acceptance**

- Intake route clearly feels like the top of an opportunity container.
- File states are visible in the page and not hidden behind a toast.
- Lead Brief generation is blocked until required intake inputs exist.

**Risks and Notes**

- Worker latency can make the page feel stalled if feedback is weak.
- Do not leak brief or discovery output onto the intake surface.

## Phase 5 — Lead Brief Workspace

**Goal**

Convert intake into a structured, editable, versioned Lead Brief.

**In Scope**

- Lead Brief route and stepper entry.
- Source/output split with structured fields.
- Confirmed / Inferred / Missing / Needs Review field states.
- Edit, confirm, regenerate, save current, save-version, list versions, preview, restore, and copy summary.
- Explicit restore confirmation and overwrite protection.

**Out of Scope**

- Discovery intelligence.
- Proposal Draft rules and sections.
- Finer-grained regenerate.

**Key Dependencies**

- Phase 4 intake and file output.
- Current resource + version history contracts.
- Concurrency handling for working copies.

**Main Outputs**

- Frontend / UI: Lead Brief shipping UI, source/output layout, version history drawer or modal, restore confirmation, blocked / needs-review notices.
- Backend / API: lead brief generate/read/update/save-version/versions/restore endpoints.
- Data / Worker / Infra: version snapshot persistence and optimistic concurrency fields.
- Verification: version list/preview/restore smoke tests and overwrite protection checks.

**Acceptance**

- Lead Brief can be generated, edited, versioned, previewed, and restored without silent data loss.
- The page is clearly a structured workspace, not a long-document viewer.
- Missing and review-needed states are visible in-product.

**Risks and Notes**

- The biggest failure mode is accidentally overwriting user edits.
- Restore must remain an explicit action with a clear confirmation step.

## Phase 6 — Discovery Workspace

**Goal**

Turn notes and transcripts into proposal-ready intelligence with visible ambiguity and risk handling.

**In Scope**

- Discovery route and stepper entry.
- Discovery input capture.
- Structured output for goals, constraints, ambiguities, risk flags, and follow-up questions.
- Generate, regenerate, save current, save-version, list versions, preview, restore.
- Clear not-enough-evidence feedback.

**Out of Scope**

- Proposal Draft generation logic.
- Rules editing.
- Billing and restriction state handling beyond shared notices.

**Key Dependencies**

- Phase 5 Lead Brief semantics.
- Discovery resource and versioning APIs.
- Shared output schema for evidence-aware intelligence.

**Main Outputs**

- Frontend / UI: Discovery shipping UI, source/output split, explicit risk and ambiguity states, restore workflow, and blocked-state notices.
- Backend / API: discovery generate/read/update/save-version/versions/restore endpoints and discovery records support.
- Data / Worker / Infra: version snapshot storage and any background support needed for structured extraction.
- Verification: evidence-thin and restore flows, plus no-silent-overwrite smoke tests.

**Acceptance**

- Discovery can be generated and edited without collapsing into a notes viewer.
- Risk flags and unanswered questions remain first-class content.
- Versioning semantics match Lead Brief.

**Risks and Notes**

- Discovery can be misread as a transcript dump if the output hierarchy is weak.
- Keep the page centered on judgment, not transcription.

## Phase 7 — Proposal Draft + Templates & Rules

**Goal**

Ship the core value page: a rule-constrained, editable, versioned proposal draft that users can actually work from.

**In Scope**

- Proposal Draft route.
- Templates & Rules route.
- Workspace baseline rules editing.
- Effective rules summary and opportunity override panel.
- Proposal Draft generation, chapter editing, chapter-level regenerate, save current, save-version, versions, restore, copy, and export.
- Confidence, missing-input, rules-conflict, and restriction notices.

**Out of Scope**

- E-sign.
- Quote engine.
- Payment collection.
- Complex rule marketplaces or automatic recommendation engines beyond the frozen defaults.

**Key Dependencies**

- Current Lead Brief and base Discovery.
- Template and rules APIs.
- Stripe / billing restriction enforcement in the product surface.

**Main Outputs**

- Frontend / UI: Proposal Draft shipping UI, Templates & Rules shipping UI, rule summary bar, override panel, draft sections, chapter regenerate controls, export and copy actions.
- Backend / API: templates, workspace rules, effective rules, opportunity override, proposal draft generate/read/update/sections/regenerate/save-version/versions/restore/export endpoints.
- Data / Worker / Infra: rules persistence, version snapshots, and any background work needed for generation or export.
- Verification: dependency gating, overwrite confirmation, and export smoke tests.

**Acceptance**

- Proposal Draft generation is blocked without current Lead Brief and base Discovery.
- Section regenerate requires explicit overwrite awareness.
- Rules summary and override state are visible in the page, not hidden in settings.
- The page feels like a shipping drafting workspace, not a black-box generator.

**Risks and Notes**

- This phase is the product’s signature surface, so any spec-like UI failure is highly visible.
- Keep rule presentation clear, but do not turn the page into a control panel jungle.

## Phase 8 — Follow-up Workspace

**Goal**

Turn the current proposal into concise, contextual follow-up copy.

**In Scope**

- Follow-up route.
- Scenario-based generation.
- Subject, body, and CTA output.
- Edit, save current, save-version, versions, restore, and copy email.
- Clear dependency notice when Proposal Draft context is missing.

**Out of Scope**

- Email sending automation.
- Marketing automation.
- Any extra sales outreach engine.

**Key Dependencies**

- Current Proposal Draft.
- Follow-up resource and versioning API.
- Restriction matrix enforcement.

**Main Outputs**

- Frontend / UI: Follow-up shipping UI, scenario selector, subject/body/CTA layout, blocked-state notices, copy action.
- Backend / API: follow-up generate/read/update/save-version/versions/restore endpoints.
- Data / Worker / Infra: version snapshots and any send/copy utilities.
- Verification: proposal-context dependency gating and copy smoke tests.

**Acceptance**

- Follow-up is available only as a contextual step after Proposal Draft.
- The result is lightweight and professional, not like a generic email client.
- Version and restore behavior matches the earlier versioned workspaces.

**Risks and Notes**

- Do not move tone switching or automation beyond what the frozen docs already support.
- Keep the page lighter than Proposal Draft, but still clearly part of the workflow.

## Phase 9 — Billing / Trial / Restriction Matrix

**Goal**

Make commercial state visible and enforce read-only behavior consistently across the customer app.

**In Scope**

- Billing / Trial route.
- Trial and paid state display.
- Checkout and customer portal entry points.
- `is_generation_allowed` and `restriction_reason` surfaces.
- Read-only enforcement for `trial_expired`, `past_due`, `canceled`, and `inactive`.
- Stripe webhook-driven workspace billing status updates.

**Out of Scope**

- Multi-plan pricing walls.
- Billing admin tools.
- Non-Stripe payment rails.

**Key Dependencies**

- Stripe Checkout, Billing, Portal, and webhooks.
- Workspace billing snapshot fields.
- Shared restriction notice component used across customer pages.

**Main Outputs**

- Frontend / UI: Billing / Trial shipping UI, billing status card, restriction notice, upgrade/portal actions.
- Backend / API: billing status, checkout-session, portal-session, and webhook endpoints.
- Data / Worker / Infra: workspace billing snapshot updates and webhook idempotency handling.
- Verification: trial/paid/expired/past-due/canceled/inactive matrix tests.

**Acceptance**

- The UI explains what is blocked and why, instead of showing a generic error.
- Viewing history remains possible even when generation is blocked.
- All blocked actions are consistently blocked across the product surface.

**Risks and Notes**

- This is a cross-cutting enforcement phase; inconsistent checks between page and API are a major risk.
- `restriction_reason` must stay visible and readable.

## Phase 10 — Settings & Account Surface

**Goal**

Provide a minimal configuration surface without turning it into a second admin console.

**In Scope**

- Settings route.
- Workspace info.
- User account.
- Minimal members view.
- Basic save changes and permission feedback.

**Out of Scope**

- Advanced permissions.
- Billing configuration beyond the Billing / Trial surface.
- Admin reporting or operations tooling.

**Key Dependencies**

- Workspace, user, and membership data.
- Auth/session context.

**Main Outputs**

- Frontend / UI: Settings shipping UI with lightweight forms and clear save state.
- Backend / API: minimal settings read/update support.
- Data / Worker / Infra: workspace and member persistence already established in earlier phases.
- Verification: settings save and permission checks smoke tests.

**Acceptance**

- Settings is visibly lighter than the workflow pages.
- It does not absorb billing or admin complexity.
- It remains aligned with the main product language and dark UI system.

**Risks and Notes**

- Settings can easily become a catch-all; keep it intentionally small.

## Phase 11 — Release Readiness / Launch

**Goal**

Turn the built product into something that is actually shippable in staging and production.

**In Scope**

- Staging parity checks.
- Production deploy objects for `web`, `admin`, `api`, and `worker`.
- Smoke tests, migration runbooks, backup and rollback readiness.
- Monitoring for API, worker, database, Stripe, OpenAI, and object storage.
- End-to-end launch verification on the customer main chain.

**Out of Scope**

- New feature expansion.
- New analytics surfaces.
- Admin productization beyond the boundary placeholder.

**Key Dependencies**

- All P0 customer flows.
- Deployment docs and environment contracts.
- CI/CD and observability wiring.

**Main Outputs**

- Frontend / UI: release-ready customer pages with validated states and guards.
- Backend / API: hardened endpoints with verified contracts and deployment configuration.
- Data / Worker / Infra: migration, backup, rollback, and monitoring readiness.
- Verification: launch checklist, staging smoke tests, and production-like rollback rehearsal.

**Acceptance**

- The full customer chain can be exercised in staging with production-like behavior.
- Deploys are repeatable and reversible.
- Billing, file processing, and AI calls are explicitly included in post-deploy verification.

**Risks and Notes**

- Launch risk is highest where integrations intersect.
- Do not treat deployment as a footnote; it is its own phase.

## Phase 12 — Admin Boundary Placeholder

**Goal**

Reserve the internal control surface without making it the launch focus.

**In Scope**

- Separate admin route and API namespace.
- Minimal internal auth entry and internal role guard.
- Read-only placeholder shells for Overview, Workspaces, Users, Subscriptions / Trials, and Funnel Analytics if needed.
- Query contract reservation for admin filters and metrics.

**Out of Scope**

- Deep admin drill-downs.
- User Detail as a first-release dependency.
- Manual workflow edits, bulk writes, impersonation, or billing mutations.

**Key Dependencies**

- Customer launch stability.
- Internal auth / role model.
- Shared reporting queries from the platform base.

**Main Outputs**

- Frontend / UI: minimal admin placeholder shell and read-only surface, not a customer-facing workflow view.
- Backend / API: `/api/v1/admin/auth/me` and read-only admin query namespace reservations.
- Data / Worker / Infra: shared reporting data access and guard wiring.
- Verification: internal access / forbidden / object-not-found / insufficient-data smoke checks.

**Acceptance**

- Admin remains separately addressable in code, routes, guards, and API space.
- It can be postponed without blocking customer-side launch.
- It does not leak into customer navigation or customer product pages.

**Risks and Notes**

- The main risk is admin scope creep.
- Keep this phase strictly boundary-oriented until the customer MVP is shipped.

