---
phase: 7
slug: proposal-draft-templates-rules
status: pending
shadcn_initialized: false
preset: linear-console-dark
created: 2026-04-13
---

# Phase 7 — UI Design Contract

> Visual and interaction contract for the Proposal Draft workspace and the Templates & Rules page. This file locks the desktop/laptop shipping UI rules for rule-constrained drafting, chapter-level regenerate, version history, effective-rule visibility, and workspace baseline rule editing before implementation begins.

---

## Design System

| Property | Value |
|----------|-------|
| Tool | none |
| Preset | `linear-console-dark` |
| Component library | app-local primitives only |
| Icon library | `lucide-react` |
| Font | `Inter Variable` with `cv01` and `ss03`; `Berkeley Mono` for technical metadata only |

### Design Thesis
- **Visual thesis:** a dense drafting desk where chapter editing is the hero surface, rules stay legible as guardrails, and secondary context lives in drawers instead of crowding the workspace.
- **Content thesis:** Proposal Draft should read like structured, client-facing work in progress, not like raw AI output and not like a document preview.
- **Interaction thesis:** risky actions are explicit and local, state changes are visible in-place, and no rule-layer change or regenerate path silently rewrites user work.
- **Product thesis:** Proposal Draft is the product's flagship web-app workspace; Templates & Rules is the supporting baseline editor that sharpens output quality without becoming an admin console.

---

## Authoritative Baseline

- `docs/design/DESIGN.md` remains the visual source of truth.
- `07-CONTEXT.md` remains the source of truth for locked behavior decisions.
- `.planning/phases/05-lead-brief-workspace/05-UI-SPEC.md` and `.planning/phases/06-discovery-workspace/06-UI-SPEC.md` remain pattern references for drawers, state language, and dense workspace quality.
- `ui-ux-pro-max` is used only to reinforce accessible heading hierarchy, explicit field labels, inline validation, and stable async geometry. It does **not** override the core palette, typography, or layout language.

---

## Spacing Scale

Declared values (must be multiples of 4):

| Token | Value | Usage |
|-------|-------|-------|
| xs | 4px | Micro gaps, status-dot spacing, inline separators |
| sm | 8px | Chip internals, helper text separation, compact control clusters |
| md | 16px | Default row spacing, form control rhythm, chapter block internals |
| lg | 24px | Panel padding, toolbar gaps, section internals |
| xl | 32px | Main workspace gutters, page section spacing |
| 2xl | 48px | Major layout breaks and top-page separation |
| 3xl | 64px | Large page breathing room outside the main editing plane |

Exceptions:
- `12px` is allowed inside dense toolbars, rules chips, and validation rows where 16px would feel too loose.

Spacing rules:
- Proposal Draft must devote the most generous spacing to chapter content blocks, not to chrome.
- Rules Summary Bar and status bands stay compact and highly scannable.
- Templates & Rules should use modular section spacing instead of giant uninterrupted forms.
- Right-side drawers should feel compact but breathable; no cramped stacked mini-panels.

---

## Typography

| Role | Size | Weight | Line Height |
|------|------|--------|-------------|
| Body | 15px | 400 | 1.60 |
| Body Emphasis | 15px | 510 | 1.55 |
| Label | 13px | 510 | 1.40 |
| Chapter Heading | 18px | 510 | 1.30 |
| Page Heading | 28px | 510 | 1.10 |
| Display Accent | 32px | 510 | 1.05 |

Additional rules:
- Use only weights `400` and `510` on these pages.
- The page title should read like an active workspace title, not a marketing headline.
- Chapter headings should feel deliberate and editorially strong, but never oversized enough to overpower the workspace.
- Labels, chips, warnings, confidence notes, and rule summaries stay at label/caption scale.
- Long client-facing draft copy must remain easy to scan in editing mode and export-preview mode.
- Do not introduce serif typography or secondary brand fonts in this phase.

---

## Color

| Role | Value | Usage |
|------|-------|-------|
| Dominant (60%) | `#08090a` | Page background, shell frame, deep canvas |
| Secondary (30%) | `#0f1011` / `#191a1b` | Chapter blocks, bars, drawers, rules panels, forms |
| Accent (10%) | `#7170ff` | Focus state, current workflow step, primary action emphasis |
| Success | `#10b981` | Saved/snapshot complete, stable ready states |
| Warning | `#ffd166` | Needs review, low confidence, cautionary overwrite states |
| Destructive | `#ff8f8f` | Destructive confirmations only |
| Primary text | `#f7f8f8` | Main readable text |
| Muted text | `#8a8f98` | Helper copy, metadata, provenance lines |

Color rules:
- Accent color is for focus, current-step, and one dominant action only; do not let every button or chip compete for accent priority.
- `Low confidence`, `rules conflict`, and `missing inputs` must read as caution states, not destructive failures.
- `Override active` should read as active context, not as an error.
- Templates & Rules validation errors must remain clear without turning the entire page into a red form.
- Export format toggles, preview chips, and status bands should stay within the existing dark-product language, not introduce new palette families.

---

## Copywriting Contract

| Element | Copy |
|---------|------|
| Proposal Draft title | `Proposal Draft` |
| Proposal Draft subtitle | `Turn the current brief, discovery, and rules into a proposal-ready draft you can edit, version, and export.` |
| Empty state heading | `No current proposal draft.` |
| Empty state body | `Generate the first draft from the current Lead Brief, Discovery, template, and effective rules.` |
| First-time primary CTA | `Generate draft` |
| Existing-draft primary CTA | `Save current` |
| Snapshot CTA | `Save version` |
| Chapter regenerate CTA | `Regenerate section` |
| Whole-draft regenerate CTA | `Regenerate all` |
| History CTA | `Versions` |
| Export CTA | `Export` |
| Next-step CTA | `Go to Follow-up` |
| Templates & Rules title | `Templates & Rules` |
| Templates & Rules subtitle | `Set the workspace defaults that shape every proposal draft.` |
| Rules save CTA | `Save rules` |
| Rules validation conflict | `This ruleset has conflicts. Fix them before saving.` |
| Restore warning | `Restoring replaces the current working draft. Save a version first if you want to keep the current state.` |
| Chapter overwrite warning | `This section has unsaved edits. Save current first or confirm that you want to replace them.` |

Additional copy rules:
- Use working-surface language, not AI-showcase language.
- Avoid `document`, `report`, `generator`, `wizard`, or `template marketplace` framing as primary page identity.
- Each blocker must say what is missing, what is conflicting, or which actions are currently affected.
- Templates & Rules should explain impact in product language, not internal schema language.
- Export language should name the format (`Text`, `Markdown`) and avoid technical jargon beyond what the user needs.

---

## Proposal Draft Shell Contract

### Top-Level Hierarchy
1. Opportunity shell with global navigation
2. Opportunity header and current-step stepper
3. Proposal Draft workspace header with status and primary actions
4. Rules Summary Bar
5. Page-level status band when applicable
6. Central chapter-editing stage
7. Right-side context drawer(s) for versions, override editing, and secondary risk detail

### Shell Rules
- Preserve the existing opportunity shell from earlier phases.
- Proposal Draft is a sub-workflow under the opportunity container.
- The current step must remain visually obvious in the stepper.
- The central editing stage must visually outrank rule chrome, status chrome, and drawer chrome.
- No dashboard mosaics, report-preview chrome, or admin-console framing are allowed.

### Desktop / Laptop Layout
- Primary validation widths: `1024px`, `1280px`, `1440px`.
- This phase is desktop/laptop web only; no mobile/tablet product design work is defined here.
- Proposal Draft should not use an always-visible source-left / output-right split as its primary layout.
- Rules Summary Bar sits above the editing stage and spans the working area.
- The chapter stage occupies the main column.
- The right-side context surface is secondary and open on demand.
- No horizontal overflow is allowed at `1024px`.

---

## Rules Summary Bar Contract

### Role
- Keep the current drafting constraints visible without forcing users into the global rules page.
- Explain what is shaping this draft right now.
- Expose whether the current opportunity has local overrides active.

### Required Content
- current template
- current effective rules summary
- assumptions preview
- exclusions preview
- tone preview
- terminology summary
- `override active` state
- entry point for opportunity override editing
- entry point to the workspace-level Templates & Rules page

### Interaction Rules
- Switching template here affects the current opportunity override layer only.
- Opening the workspace baseline editor must navigate to Templates & Rules while preserving a return path to the current opportunity.
- Saving or clearing overrides must refresh the visible effective-rules summary immediately.
- The bar should never read like a technical debug panel.

### What to Avoid
- No giant tag clouds.
- No schema tables.
- No collapses that hide all rule context by default.
- No mixed baseline/override editing in one undifferentiated surface.

---

## Proposal Draft Chapter Contract

### Role
- The chapter stage is the main act of the page.
- Each chapter is an editable, version-aware work block tied to the current working draft.
- Chapters should feel like purposeful drafting surfaces, not accordion cards and not rich-text blobs.

### Required Chapter Set
- Executive Summary
- Objectives
- Recommended Approach
- Deliverables
- Timeline
- Assumptions
- Exclusions
- Next Steps / CTA

### Chapter Block Rules
- Each chapter block should show:
  - chapter title
  - current value
  - local status or warning markers when relevant
  - edit affordance
  - save context via the global working-copy model
  - chapter-level regenerate affordance
- `Assumptions` and `Exclusions` must never be hidden as helper notes or merged into other chapters.
- Long content should remain readable while editing without turning into a generic document editor.
- Confidence or warning markers should stay subordinate to the content itself.

### Regenerate Rules
- `Regenerate section` replaces only the selected chapter.
- If that chapter has unsaved edits, the user must `Save current` first or explicitly confirm overwrite.
- `Regenerate all` is secondary and visually lower priority than chapter actions.
- Whole-draft regenerate must use stronger risk language than chapter regenerate.

### What to Avoid
- No floating card mosaic of chapters.
- No uncontrolled multi-column text layout.
- No hidden assumptions/exclusions.
- No silent content replacement on regenerate.

---

## Status Band and Local Warning Contract

### Two-Layer Expression Model
1. **Page-level status band**
   - explains current unsafe/blocked state
   - names affected actions (`generate`, `regenerate`, `save current`, `save-version`, `restore`, `export`)
   - remains visible until dismissed by state change
2. **Local chapter/module markers**
   - identify only the affected chapter or rule module
   - stay embedded near the problem area
   - do not replicate the full page-level message

### Required Page-Level States
- loading
- empty
- error
- blocked
- retry
- success
- low confidence
- rules conflict
- missing inputs
- billing restriction

### State Rules
- These states must not live in toast-only feedback.
- `Low confidence` should feel cautionary and explain which chapter or condition is uncertain.
- `Rules conflict` should explain whether the problem is in baseline rules, overrides, or effective-rule composition.
- `Missing inputs` must explicitly name missing Lead Brief or Discovery prerequisites when generation is blocked.
- Billing restriction must explain why actions are blocked and keep Billing actions visible.

---

## Version Drawer Contract

### Role
- Version history lives in a right-side drawer on desktop.
- Users should be able to inspect versions without leaving the drafting surface.
- Restoring should feel deliberate and risk-aware.

### Drawer Structure
- header with `Versions`
- current resource summary
- immutable version list sorted newest first
- read-only preview for selected version
- explicit restore confirmation area

### Rules
- Selecting a version opens preview only; it must not restore automatically.
- Preview stays read-only and should reuse the chapter structure enough for mental comparison.
- No diff-heavy compare view in MVP.
- Restore must always state overwrite risk clearly.
- If unsaved edits exist, the warning must explicitly name that risk.

---

## Templates & Rules Page Contract

### Role
- Edit workspace baseline rules that influence future Proposal Draft generation.
- Keep baseline editing separate from opportunity-local override editing.

### Primary Sections
- Template Basics
  - `default_template`
  - `template_scope`
- Assumptions & Exclusions
  - `default_assumptions`
  - `default_exclusions`
- Tone & Terminology
  - `tone_profile`
  - `preferred_terminology`
  - `banned_terminology`
- Sections & Modules
  - `section_order`
  - `required_sections`
  - `service_modules`
  - `default_cta_style`

### Page Rules
- Use modular stacked sections, not a single uninterrupted long form.
- Validation should happen inline or on blur where sensible, with a save-time summary for remaining conflicts.
- The page must clearly explain that saved baseline rules affect Proposal Draft output.
- Returning to Proposal Draft should preserve the user's current opportunity context.
- Do not let this page become a template catalog or marketplace surface.

### Conflict Rules
- `required_sections` must always preserve `assumptions` and `exclusions`.
- `preferred_terminology` and `banned_terminology` collisions must be visible before save succeeds.
- Save failures should state whether the current effective baseline remains unchanged.

---

## Shared State Contract

These states must exist visually and semantically across Phase 7 pages:
- `loading`
- `empty`
- `error`
- `blocked`
- `retry`
- `success`
- domain-specific warning states (`low confidence`, `rules conflict`, `missing inputs`)

Rules:
- Loading should preserve final page geometry with skeletons or equivalent reserved space.
- Empty states should feel legitimate, not apologetic.
- Error and blocked states must use different copy and different recovery paths.
- Retry must remain local to the failed surface when possible.
- Success should be visible inline after save, version snapshot, regenerate, restore, or rules save.
- Browser states must remain credible at `1024px`, `1280px`, and `1440px`.

---

## Interaction and Motion Contract

- Motion budget: `150ms–220ms`
- Hover may change color, opacity, border, or shadow only; no scale transforms that shift layout.
- Chapter edit transitions should feel immediate and calm.
- Drawer open/close should feel controlled and fast.
- Async status feedback should be operational, not celebratory.
- Loading skeletons and region updates must respect `prefers-reduced-motion`.
- Do not use horizontal swipe, carousel, or other gesture-first patterns in the main workspace.

---

## Accessibility Contract

- Keep sequential heading hierarchy across both pages.
- All dense controls need explicit labels; placeholders are not labels.
- Errors requiring user attention should use announced semantics such as `role="alert"`.
- Saving/loading notices should use polite live regions where appropriate.
- Keyboard order must follow visible hierarchy and allow full operation without a mouse.
- Drawer focus must trap correctly and release cleanly on close.
- Focus states must remain obvious on chapter actions, rules controls, export controls, and drawer controls.
- Avoid layout shifts while async data or rule validation messages appear.

---

## Execution Guidance

- Use `frontend-skill` for app-level hierarchy, restraint, and non-generic composition.
- Use `ui-ux-pro-max` during implementation to validate dense-form labeling, validation cadence, and async geometry decisions, but do not let it override the frozen ProposalFlow design language.
- Use TDD for all behavior changes: route contracts, rules validation, generation gates, chapter regenerate, save-version, restore, export, and browser flows should all start from failing tests.
- Use verification-before-completion discipline before claiming any wave or phase work is done.
- Do not expand into mobile/tablet UX, template marketplace behavior, or collaboration features.

---

## Checker Sign-Off

- [ ] Dimension 1 Copywriting: PASS
- [ ] Dimension 2 Visuals: PASS
- [ ] Dimension 3 Color: PASS
- [ ] Dimension 4 Typography: PASS
- [ ] Dimension 5 Spacing: PASS
- [ ] Dimension 6 Registry Safety: PASS

**Approval:** pending
