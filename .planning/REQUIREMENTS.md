# Requirements: ProposalFlow AI

**Defined:** 2026-04-08
**Core Value:** 把碎片化售前信息变成可以持续推进、可以回看版本、可以解释限制原因的 proposal-ready 工作流。

## v1 Requirements

### Platform & UI Baseline

- [ ] **PLAT-01**: The repository is a single monorepo with `apps/web`, `apps/admin`, `apps/api`, `apps/worker`, `packages/shared-types`, `packages/shared-schemas`, and `packages/shared-config`.
- [ ] **PLAT-02**: Customer web, admin, product API, admin API, and shared platform services are separated in code and route namespaces.
- [ ] **PLAT-03**: The project defines `local`, `staging`, and `production` environments with distinct deploy objects for `web`, `admin`, `api`, and `worker`.
- [ ] **UI-01**: Every customer-facing route renders task-oriented shipping UI rather than a specification page.
- [x] **UI-02**: Every customer-facing route supports the shared product states `loading`, `empty`, `error`, `blocked`, `retry`, and `success`.

### Identity & Workspace

- [ ] **AUTH-01**: A user can sign in, sign up, and reset password with email/password.
- [ ] **AUTH-02**: A user can sign in with Google OAuth.
- [ ] **AUTH-03**: A logged-in session persists across refresh and restores the intended destination.
- [ ] **WORK-01**: Workspace setup captures workspace name, industry type, default template, and default tone preference, then creates the active workspace context.
- [ ] **WORK-02**: The app blocks access to product pages when workspace setup is incomplete and routes the user back to setup.

### Command Center & Opportunity Intake

- [ ] **DASH-01**: The dashboard provides clear entry points to start a new opportunity and resume an unfinished one.
- [ ] **OPP-01**: The opportunities list supports search, filter, sort, archive, and opening an opportunity.
- [x] **OPP-02**: Each opportunity has a single container for intake and downstream work instead of separate disconnected pages.

### Intake & Files

- [x] **INTAKE-01**: Opportunity overview captures raw input and the minimum opportunity fields needed to start the workflow.
- [x] **INTAKE-02**: PDF upload processing exposes the states `uploaded`, `processing`, `ready`, and `failed`, and supports retry.
- [x] **INTAKE-03**: Lead Brief generation can only be triggered from a valid opportunity context with intake inputs present.

### Versioned Working Resources

- [ ] **STATE-01**: Lead Brief, Discovery, Proposal Draft, and Follow-up each support current resource, version history, and restore semantics.
- [ ] **BRIEF-01**: Lead Brief output exposes `Confirmed`, `Inferred`, `Missing`, and `Needs Review` field states and supports edit/confirm.
- [ ] **BRIEF-02**: Lead Brief regenerate is whole-resource in MVP and never silently overwrites user edits.
- [ ] **DISC-01**: Discovery output exposes goals, constraints, ambiguities, risk flags, and follow-up questions, and supports edit/confirm.
- [ ] **DISC-02**: Discovery regenerate is whole-resource in MVP and never silently overwrites user edits.

### Rules, Proposal Draft, and Follow-up

- [x] **RULE-01**: Workspace rules can be edited, and the effective rules are derived from template + workspace rules + opportunity overrides.
- [x] **PROP-01**: Proposal Draft generation requires an existing current Lead Brief and base Discovery data.
- [x] **PROP-02**: Proposal Draft supports chapter editing, chapter-level regenerate with explicit overwrite confirmation, copy, export, and rule/confidence notices.
- [ ] **FUP-01**: Follow-up generation requires an existing current Proposal Draft and returns subject, body, and CTA.
- [ ] **FUP-02**: Follow-up supports scenario selection, editing, version history, restore, and copy.

### Billing, Trial, and Restrictions

- [ ] **BILL-01**: Billing / Trial surfaces the current trial or paid state, current plan, and current period fields.
- [ ] **BILL-02**: Billing / Trial surfaces `is_generation_allowed`, `restriction_reason`, checkout, and portal actions.
- [ ] **BILL-03**: In `trial_expired`, `past_due`, `canceled`, or `inactive`, the app blocks `generate`, `regenerate`, `save current`, `save-version`, `restore`, and `export` while still allowing viewing and billing access.
- [ ] **BILL-04**: Stripe checkout, portal, and webhook events update the workspace billing snapshot consistently.

### Settings, Release, and Admin Boundary

- [ ] **SET-01**: Settings supports workspace info, user account, and a minimal members view without becoming a second admin console.
- [ ] **REL-01**: Staging and production verification covers the customer main chain, file processing, and billing integrations before launch.
- [ ] **REL-02**: Monitoring, rollback, backup, and migration runbooks exist for `web`, `admin`, `api`, and `worker`.
- [ ] **ADMIN-01**: Admin has a separate route/API namespace and a read-only boundary placeholder, but it does not become a launch-focus product surface.

## v2 Requirements

### Admin Enhancements

- **ADMIN-02**: User Detail page and deeper admin drill-downs.
- **ADMIN-03**: Admin analytics enhancements such as custom range, dimension switching, and funnel-to-list drill-down.

### Workflow Enhancements

- **WF-01**: Finer-grained regenerate for Lead Brief and Discovery.

### Billing / Export Enhancements

- **BILL-05**: Improved billing error recovery and export formatting.

### Settings Enhancements

- **SET-02**: More advanced settings and permission management.

## Out of Scope

| Feature | Reason |
|---------|--------|
| E-sign and formal signature flow | The frozen docs explicitly say Proposal Draft is not a formal signing surface. |
| Automatic quote engine or payment collection | The product is a pre-proposal copilot, not a post-sale commerce system. |
| CRM or customer-support backend | Customer-side scope is workflow-first, not CRM-first. |
| Separate analytics warehouse or BI platform | The docs prefer `activity_logs + core tables` for the first release. |
| Microservices or a complex event bus | The architecture docs explicitly prefer a modular monolith for MVP. |
| Bulk risky admin writes, impersonation, or forced state edits | Admin is read-first and boundary-only in the first release. |
| Mobile app | The product is web-first for MVP. |
| Template marketplace or multilingual system | Not frozen for the first release and would expand scope materially. |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| PLAT-01 | Phase 1 | Pending |
| PLAT-02 | Phase 1 | Pending |
| PLAT-03 | Phase 1 | Pending |
| UI-01 | Phase 1 | Pending |
| UI-02 | Phase 1 | Complete |
| AUTH-01 | Phase 2 | Pending |
| AUTH-02 | Phase 2 | Pending |
| AUTH-03 | Phase 2 | Pending |
| WORK-01 | Phase 2 | Pending |
| WORK-02 | Phase 2 | Pending |
| DASH-01 | Phase 3 | Pending |
| OPP-01 | Phase 3 | Pending |
| OPP-02 | Phase 4 | Complete |
| INTAKE-01 | Phase 4 | Complete |
| INTAKE-02 | Phase 4 | Complete |
| INTAKE-03 | Phase 4 | Complete |
| STATE-01 | Phase 5 | Pending |
| BRIEF-01 | Phase 5 | Pending |
| BRIEF-02 | Phase 5 | Pending |
| DISC-01 | Phase 6 | Pending |
| DISC-02 | Phase 6 | Pending |
| RULE-01 | Phase 7 | Complete |
| PROP-01 | Phase 7 | Complete |
| PROP-02 | Phase 7 | Complete |
| FUP-01 | Phase 8 | Pending |
| FUP-02 | Phase 8 | Pending |
| BILL-01 | Phase 9 | Pending |
| BILL-02 | Phase 9 | Pending |
| BILL-03 | Phase 9 | Pending |
| BILL-04 | Phase 9 | Pending |
| SET-01 | Phase 10 | Pending |
| REL-01 | Phase 11 | Pending |
| REL-02 | Phase 11 | Pending |
| ADMIN-01 | Phase 12 | Pending |

**Coverage:**
- v1 requirements: 34 total
- Mapped to phases: 34
- Unmapped: 0 ✓

---
*Requirements defined: 2026-04-08*
*Last updated: 2026-04-08 after new-project initialization*
