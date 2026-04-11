---
phase: 5
slug: lead-brief-workspace
status: pending
shadcn_initialized: false
preset: linear-console-dark
created: 2026-04-10
---

# Phase 5 — UI Design Contract

> Visual and interaction contract for the Lead Brief workspace. This file locks the desktop/laptop shipping UI rules for the current resource, immutable version history, and explicit restore flow before implementation begins.

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
- **Visual thesis:** a dense, dark operations desk where source material stays legible on the left and the active brief surface dominates on the right.
- **Content thesis:** trust comes from visible provenance, visible field state, and explicit overwrite risk, not from report-sheet polish.
- **Interaction thesis:** every high-risk action is deliberate, every async change is visible, and nothing silently overwrites user work.
- **Product thesis:** this is a working Lead Brief workspace, not a document preview, not a long-form editor, and not a dashboard card view.

---

## Spacing Scale

Declared values (must be multiples of 4):

| Token | Value | Usage |
|-------|-------|-------|
| xs | 4px | Inline icon gaps, micro paddings |
| sm | 8px | Compact row internals, provenance chips, dense helper text |
| md | 16px | Default control spacing, section internals |
| lg | 24px | Card/panel padding, sub-section gaps |
| xl | 32px | Page section gaps, shell gutter rhythm |
| 2xl | 48px | Major block spacing |
| 3xl | 64px | Page-level breathing room |

Exceptions: `12px` is allowed inside dense field rows, toolbars, and version list items where 16px would feel too loose.

Spacing rules:
- Keep the source pane visually calmer and slightly tighter than the output pane.
- Keep the output pane dense but never cramped; readability wins over information density.
- Maintain consistent vertical rhythm between field groups so the workspace feels editor-like, not form-builder-like.

---

## Typography

| Role | Size | Weight | Line Height |
|------|------|--------|-------------|
| Body | 15px | 400 | 1.60 |
| Label | 13px | 510 | 1.40 |
| Heading | 20px | 510 | 1.25 |
| Display | 32px | 510 | 1.05 |

Additional rules:
- Use only weights `400` and `510` on this page.
- The page title should read like a workspace title, not a marketing headline.
- Section labels, field labels, status chips, and provenance metadata should stay at label/caption scale.
- Raw source text, extracted snippets, and inline errors remain body-sized for scanning during long editing sessions.
- Avoid oversized display treatment anywhere in the workspace body.

---

## Color

| Role | Value | Usage |
|------|-------|-------|
| Dominant (60%) | `#08090a` | Page background, shell frame, deepest canvas areas |
| Secondary (30%) | `#0f1011` / `#191a1b` | Source pane, output pane, drawer, field containers, toolbars |
| Accent (10%) | `#7170ff` | Current step, focused actions, primary workspace emphasis, explicit next-step marker |
| Destructive | `#ff8f8f` | True destructive confirmations only |

Accent reserved for:
- the current Lead Brief step in the shell
- the primary active action when no brief exists
- keyboard focus treatment
- clear next-step emphasis

Do **not** use accent color for every interactive element.

Additional semantic colors:
- Success: `#10b981` for `Confirmed` state and successful save/restore feedback
- Warning: `#ffd166` for `Needs Review`, explicit overwrite risk, and cautious blocked states
- Muted text: `#8a8f98`
- Primary text: `#f7f8f8`
- Inferred content: muted accent tint only; it should read as derived, not as a primary action

Color rules:
- `Confirmed` should feel stable and final.
- `Inferred` should feel lightly emphasized but not authoritative.
- `Missing` should feel incomplete without becoming alarmist.
- `Needs Review` should feel attention-worthy and explicit, not destructive.

---

## Copywriting Contract

| Element | Copy |
|---------|------|
| Page title | `Lead Brief` |
| Page subtitle | `Shape the current opportunity into a brief you can trust, version, and hand off.` |
| Empty state heading | `No current lead brief.` |
| Empty state body | `Generate a structured brief from the intake source, then confirm each field before handing off to Discovery.` |
| First-time primary CTA | `Generate lead brief` |
| Existing-brief primary CTA | `Save current` |
| Snapshot CTA | `Save version` |
| Regenerate CTA | `Regenerate brief` |
| History CTA | `Versions` |
| Next-step CTA | `Continue to Discovery` |
| Load error | `We couldn't load this lead brief. Retry to restore the workspace without losing the opportunity context.` |
| Concurrency conflict | `This brief changed elsewhere. Reload the latest version before saving or regenerating.` |
| Restore warning | `Restoring replaces the current working brief. Save a version first if you want to keep the current state.` |

Additional copy rules:
- Use working-surface language, not report-sheet language.
- Avoid terms like `document`, `report`, `preview page`, or `summary sheet` as page framing.
- Every blocker must say what is missing, what is risky, or what the user should do next.
- `Generate lead brief` is only the empty-state or first-run action; once a current resource exists, the workspace should shift to `Save current` and `Regenerate brief`.
- `Continue to Discovery` must remain visible as the handoff, but it should never read as an unconditional CTA.

---

## Registry Safety

| Registry | Blocks Used | Safety Gate |
|----------|-------------|-------------|
| shadcn official | none | not required |
| third-party UI registry | none | not allowed in this phase |

Reasoning: Phase 5 must stay app-local and design-contract-driven. Introducing registry drift here would weaken the workspace consistency more than it would help delivery speed.

---

## Workspace Shell Contract

### Top-Level Hierarchy
1. Opportunity shell with global navigation
2. Opportunity header and current-step stepper
3. Lead Brief workspace header with resource status and primary actions
4. Two-pane working surface
5. Recovery and dependency notices

### Shell Rules
- Preserve the existing opportunity shell from prior phases.
- Lead Brief is a sub-workflow under the opportunity container, not a new top-level product surface.
- The current step must remain visually obvious in the stepper.
- The page must keep the action-first product language from the earlier phases, but shift the visual emphasis from list navigation to active editing.
- Do not add admin-style chrome, analytics framing, or marketing-style hero composition.

### Desktop / Laptop Layout
- Primary validation widths: `1024px`, `1280px`, `1440px`.
- This phase is desktop/laptop web only; do not design separate mobile or tablet layouts.
- The workspace should remain two-pane across the validated widths.
- The left source pane stays visible as the provenance anchor.
- The right structured-output pane is the primary working surface and should receive slightly more visual weight.
- Recommended split:
  - `1024px`: compressed two-pane layout with both panes visible and independently scrollable
  - `1280px`: comfortable asymmetric split with the output pane slightly wider
  - `1440px`: the output pane remains dominant while source provenance stays fully readable
- No horizontal overflow is allowed at `1024px`.

### Header Actions
- When no current brief exists, the primary action area should substitute `Generate lead brief` for `Save current`.
- Primary action area should surface:
  - `Save current`
  - `Save version`
  - `Regenerate brief`
  - `Versions`
  - `Copy summary`
  - `Continue to Discovery`
- Order matters:
  - `Save current` is the primary trust action once a brief exists.
  - `Save version` is the deliberate snapshot action.
  - `Regenerate brief` is a high-risk whole-resource action and must not look casual.
  - `Continue to Discovery` is a handoff, not the main editing action.

---

## Left Source Pane Contract

### Role
- Preserve trust and provenance.
- Keep original intake material visible while the user edits the brief.
- Make it obvious which source details informed the structured fields on the right.

### Required Content
- Source header with file / intake origin, current state, and freshness metadata.
- Read-only raw source notes or extracted text.
- Provenance chips such as page reference, message source, timestamp, or extraction note.
- Source snippets that can be mentally linked to the corresponding brief fields.

### Layout Rules
- The source pane is read-first and should feel calmer than the output pane.
- It should not become a second editor or a generic document preview.
- Use compact section headers and subtle dividers rather than heavy cards.
- Source material should be grouped so users can scan by origin, not by report chapter.
- If a field on the right is selected, the matching source snippet may be softly highlighted.

### What to Avoid
- No report-sheet styling.
- No generic PDF preview panel.
- No charts, KPI blocks, or CRM-style activity feeds.
- No editing controls that compete with the output pane.

### Provenance Rules
- Every derived field should have an obvious source trail if one exists.
- Provenance metadata belongs in muted text and small chips, not in loud callouts.
- Trust comes from readable origin labels and source fidelity, not from decorative framing.

---

## Right Structured-Output Pane Contract

### Role
- The right pane is the active product surface.
- It holds the editable Lead Brief and the field-state system.
- It should feel like a focused editor with business judgment, not a form wizard.

### Required Content Groups
- Core identity: client / company, contact
- Request summary: requested service, business context
- Decision context: urgency / timeline, budget signal
- Judgment area: fit assessment, missing information, recommended next step

### Layout Rules
- Field groups should be compact, sequential, and scannable.
- Each field row should show:
  - label
  - value or placeholder
  - status chip
  - provenance line or helper text
  - edit / confirm affordance
- Confirmed fields should collapse visually into a trusted, stable state.
- Inferred and Needs Review fields should remain visibly active until resolved.
- Missing fields should use explicit placeholder language and never disappear.

### Interaction Rules
- Inline editing must be available without leaving the workspace.
- Confirmation is a first-class action, not just a visual state.
- A field can be edited, then confirmed, without changing the page context.
- If a field is edited after confirmation, it should visually return to an unresolved state until re-confirmed.

### What to Avoid
- No long-form report paragraphs as the main experience.
- No document preview framing.
- No silent field normalization.
- No oversized card mosaics that hide the editing surface.

---

## Field State Contract

The field-state vocabulary is fixed to:
- `Confirmed`
- `Inferred`
- `Missing`
- `Needs Review`

### `Confirmed`
- Visual treatment: green status chip, stable row, minimal extra chrome.
- Meaning: the user has accepted the field as trustworthy and ready.
- Action emphasis: edit only if needed; no warning language.

### `Inferred`
- Visual treatment: muted accent tint, provenance line, slightly stronger outline than confirmed.
- Meaning: the value is derived from source material or judgment, not explicitly confirmed.
- Action emphasis: `Confirm` should be obvious and lightweight.

### `Missing`
- Visual treatment: muted placeholder text, quiet warning border, no false confidence.
- Meaning: the field has not been populated yet.
- Action emphasis: add information or leave explicit as missing.

### `Needs Review`
- Visual treatment: amber chip, stronger border, clear helper text, no destructive styling.
- Meaning: the field exists but requires user judgment before handoff.
- Action emphasis: review, edit, then confirm.

### Field UX Rules
- Field state must always be visible in the UI, not hidden in tooltips.
- Missing and Needs Review states must remain explicit and readable.
- Field labels should not change meaning based on state.
- Status chips are not decoration; they are part of the product logic.
- Users must always be able to tell whether the value is factual, inferred, missing, or undecided.

---

## Current Resource and Save Contract

### Current Resource Rules
- There is exactly one current Lead Brief per opportunity.
- The current Lead Brief is a mutable working copy.
- The version history is immutable and consists of full-resource snapshots.
- The current resource must be visibly distinguished from historical versions.

### Save Actions
- `Save current` updates the current working copy only.
- `Save current` does not create a new immutable version row.
- `Save version` creates a deliberate snapshot in version history.
- Save status must be visible inline near the actions area.
- `Copy summary` copies the current structured brief summary, not the raw source text or a version-history preview.

### Save Feedback
- Show `Saving…`, `Saved just now`, or `Save failed` inline.
- Toast-only feedback is not sufficient.
- If a save fails, keep the user’s draft visible and explain the next step.
- A failed save must not make the page feel lost or discarded.

---

## Regenerate and Concurrency Contract

### Regenerate Rules
- Regenerate is whole-resource only in this phase.
- Do not introduce field-level or section-level regenerate controls.
- Regenerate must be visually high-risk enough to discourage casual clicking.
- Regenerate must clearly warn that it can overwrite the current working copy.

### Guard Behavior
- If user edits exist, show explicit overwrite risk before proceeding.
- If the server state is stale, fail conservatively and ask the user to reload the latest version.
- Do not silently merge, diff, or auto-reconcile conflicts in the UI.
- Do not auto-preserve the pre-regenerate state unless the user explicitly saves a version first.

### Conflict Failure State
- Show a dedicated conservative failure banner or inline alert.
- The message should say the brief changed elsewhere and must be refreshed.
- Offer a clear `Reload latest` or equivalent recovery action.
- Keep the current draft visible until the user chooses the next step.

---

## Version Drawer Contract

### Drawer Role
- The version history lives in a right-side drawer on desktop.
- The drawer must let users inspect history without leaving the workspace.
- The drawer is a controlled review surface, not a casual side panel.

### Drawer Structure
- Header with `Versions` and current resource summary.
- Immutable history list sorted newest first.
- Preview area for the selected version.
- Explicit restore confirmation area.

### List Items
- Each version row should show:
  - snapshot label or timestamp
  - save time
  - optional note or save reason if present
  - `Current` marker only for the active working copy
- The list item itself should not restore the version.
- Selecting a version should only open preview.

### Preview Rules
- Preview is read-only.
- Preview should reuse the brief’s field-group structure so the user can mentally compare it to the current working copy.
- No complex diff view in MVP.
- No inline editing inside the drawer preview.

### Restore Rules
- Restore must require an explicit confirmation step.
- The UI must say that restore will replace the current working copy.
- Restoring from the list alone is forbidden.
- If the current draft has unsaved edits, the warning must name that risk.
- The restore action should feel risky and deliberate, not convenient.

### Drawer States
- Loading: skeleton rows and preview placeholders.
- Error: failed history fetch with retry.
- Empty: no saved versions yet, but current resource may still exist.
- Retry: keep the drawer open and stateful.

---

## Shared State Contract

These states must exist visually and semantically on the page:
- `loading`
- `empty`
- `error`
- `blocked`
- `retry`
- `success`
- field-level `Needs Review`

Rules:
- Loading should render the final layout shell, not a blank screen.
- Empty should feel like the first legitimate state, not an apology.
- Error and blocked states must not use the same copy.
- Retry must feel actionable and local to the failing surface.
- Success should be visible inline after save, version snapshot, regenerate, or restore.
- Blocked states must explain the dependency or overwrite risk in product language.

State expectations:
- `loading`: header, panes, and drawer should appear as skeletons with stable geometry.
- `empty`: show the source pane plus a strong `Generate lead brief` action.
- `error`: explain the load failure and preserve navigation context.
- `blocked`: surface the missing dependency, stale state, or overwrite risk.
- `retry`: keep the current state visible and give a direct retry action.
- `success`: show a calm inline confirmation without forcing navigation.

---

## Interaction and Motion Contract

- Motion budget: `150ms–220ms`
- Hover may adjust color, border, or shadow only; no scale transforms that shift layout.
- Drawer open / close should feel fast and controlled.
- Save, restore, and regenerate feedback should be calm and operational, not flashy.
- Loading states may use skeletons or subtle spinners, but they must respect `prefers-reduced-motion`.
- Focus states must remain highly visible on every clickable or editable control.
- Keep the stepper, header actions, and save bar visually stable during async transitions.

Motion guidance:
- Use motion to clarify hierarchy and state change.
- Do not use celebratory animation for save or restore.
- Do not use decorative motion around source provenance.

---

## Responsiveness and Accessibility Contract

- Required browser checkpoints: `1024px`, `1280px`, `1440px`
- No mobile or tablet product-design contract is defined for this phase.
- The page must stay highly readable and keyboard accessible at desktop/laptop widths.
- Keyboard order must follow the visible workspace order:
  - global nav
  - stepper
  - workspace actions
  - source pane
  - output pane
  - drawer trigger
  - drawer list
  - drawer preview
  - restore confirmation
- The version drawer must trap focus while open and close cleanly with keyboard escape.
- Focus rings must be obvious on field rows, chips, buttons, and drawer controls.
- Inline error states must use announced semantics such as `role="alert"`.
- Async status such as saving, loading, and restoring should use polite live regions.
- Source and output panes should remain scannable without zooming or horizontal scrolling at the validated widths.
- No responsive behavior should collapse this into a mobile-first stack.

Browser verification must cover:
- initial empty state
- populated current resource state
- field editing and confirmation
- `Save current`
- `Save version`
- version list → preview → restore confirmation
- regenerate overwrite warning
- optimistic concurrency failure
- loading / error / blocked / retry states

---

## Execution Guidance

- Keep the implementation split into isolated page, pane, drawer, and state components so downstream tasks can be tested independently.
- Continue the app-local primitive strategy from earlier phases.
- Use `frontend-skill` for any implementation work so the workspace preserves restraint, hierarchy, and the dark product language.
- Use TDD for behavior: save, restore, regenerate, and conflict handling should be proven with failing tests before code is written.
- Do not expand scope into Discovery, Proposal Draft, or multi-party collaboration here.
- Do not introduce mobile/tablet-specific layout work in this phase.

---

## Checker Sign-Off

- [ ] Dimension 1 Copywriting: PASS
- [ ] Dimension 2 Visuals: PASS
- [ ] Dimension 3 Color: PASS
- [ ] Dimension 4 Typography: PASS
- [ ] Dimension 5 Spacing: PASS
- [ ] Dimension 6 Registry Safety: PASS

**Approval:** pending
