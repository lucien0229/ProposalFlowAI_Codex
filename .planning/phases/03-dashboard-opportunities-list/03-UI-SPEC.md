---
phase: 3
slug: dashboard-opportunities-list
status: approved
shadcn_initialized: false
preset: linear-console-dark
created: 2026-04-09
---

# Phase 3 — UI Design Contract

> Visual and interaction contract for the customer command center. This file locks the product-shell, dashboard, and opportunities-list design rules before implementation.

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
- **Visual thesis:** a dark, calm operations console for proposal work, with one indigo accent and almost no decorative chrome.
- **Content thesis:** the first screen should answer "what should I do next?" before it answers "what happened last week?"
- **Interaction thesis:** visible active navigation, crisp CTA feedback, and low-friction transitions that never shift layout.

---

## Spacing Scale

Declared values (multiples of 4 unless explicitly listed as an exception):

| Token | Value | Usage |
|-------|-------|-------|
| xs | 4px | Inline icon gaps, micro paddings |
| sm | 8px | Compact row internals, filter gaps |
| md | 16px | Default control spacing, section internals |
| lg | 24px | Card/panel padding, sub-section gaps |
| xl | 32px | Page section gaps, shell gutter rhythm |
| 2xl | 48px | Major block spacing |
| 3xl | 64px | Page-level breathing room |

Exceptions: `12px` is allowed inside dense list rows and compact toolbars where 16px feels too loose.

---

## Typography

| Role | Size | Weight | Line Height |
|------|------|--------|-------------|
| Body | 15px | 400 | 1.60 |
| Label | 13px | 510 | 1.40 |
| Heading | 24px | 510 | 1.20 |
| Display | 40px | 510 | 1.00 |

Additional rules:
- Page titles use tighter tracking and should stay within 2 lines on laptop widths.
- Status pills, nav labels, and metadata use label/caption scales rather than body copy.
- Avoid marketing copy styles, oversized hero language, or decorative mono usage in product surfaces.

---

## Color

| Role | Value | Usage |
|------|-------|-------|
| Dominant (60%) | `#08090a` | Page background, shell frame, deepest surfaces |
| Secondary (30%) | `#0f1011` / `#191a1b` | Nav rail, panels, list rows, toolbars |
| Accent (10%) | `#7170ff` | Active nav item, current-step marker, primary CTA, focused search/filter state |
| Destructive | `#ff8f8f` | Archive confirmation, destructive warnings, danger-adjacent actions |

Accent reserved for: `New Opportunity`, active global nav, active filter/sort control, current-step emphasis, retry CTA when the user can recover immediately.  
Do **not** use accent color for every clickable element.

Additional semantic colors:
- Success: `#10b981`
- Warning / needs review: `#ffd166`
- Attention / blocker: warm amber text with a stronger border, not full red unless destructive
- Muted text: `#8a8f98`
- Primary text: `#f7f8f8`

---

## Copywriting Contract

| Element | Copy |
|---------|------|
| Primary CTA | `New opportunity` |
| Empty state heading | `No opportunities yet.` |
| Empty state body | `Create the first opportunity to start intake and move toward a proposal-ready draft.` |
| Error state | `We couldn't load this workspace view. Retry now or return to the last working surface.` |
| Destructive confirmation | `Archive opportunity` — `This removes it from active views but keeps the record available in Archived.` |

Additional copy rules:
- Use utility copy, not homepage copy.
- Every blocker must explain cause + next step.
- `Needs attention` rows must say what is wrong in product language: missing intake input, file processing failed, billing restriction, or downstream generation failed.
- Avoid vague CTA verbs like `Continue` unless the destination is already obvious from nearby UI.

---

## Registry Safety

| Registry | Blocks Used | Safety Gate |
|----------|-------------|-------------|
| shadcn official | none | not required |
| third-party UI registry | none | not allowed in this phase |

Reasoning: Phase 3 should stay app-local and design-contract-driven; introducing registry drift here would add styling inconsistency faster than it adds value.

---

## Product Shell Contract

### Global Navigation
- Stable entries: `Dashboard`, `Opportunities`, `Templates & Rules`, `Billing`, `Settings`
- Active location must be visually obvious through accent color and shape or underline change
- Navigation must fit desktop and laptop browser widths without collapsing into a dense admin rail
- Do not design or validate separate mobile/tablet navigation behavior in this phase

### Chrome Hierarchy
- The product shell must feel lighter than the auth/setup pages and more operational than promotional
- Avoid full-page glassmorphism or large decorative gradients behind routine work surfaces
- Panels should use subtle borders and quiet elevation; do not wrap every region in heavyweight card chrome

---

## Dashboard Contract

### First Viewport Hierarchy
1. Page title and orientation copy
2. `New opportunity` CTA
3. Resume or `Continue current step` surface
4. `Needs Attention`
5. Compact status summary
6. Trial / Billing card

### Required Modules
- Top action area with `New opportunity`
- Compact summary counts
- `Recent opportunities`
- `Needs attention`
- `Trial / Billing`

### What to Avoid
- No charts
- No KPI wall that pushes action below the fold
- No marketing-style hero
- No template marketplace or community blocks

### State Rules
- Empty: CTA-first, not apologetic
- Error: explain load failure and give retry path
- Restricted: keep dashboard visible, but blocked actions must show why

---

## Opportunities List Contract

### Toolbar
- Controls: `New opportunity`, `Search`, `Status`, `Archived`, minimal `Sort`
- Search should target `title` and `company` only
- State changes must update the URL

### Row Layout
- Show: `title`, `company_name`, `current_step`, `status/attention`, `updated_at`, `owner`
- Row is the interaction, but row actions remain explicit and discoverable
- Archive must not be hidden behind deep menus only

### Density Rules
- Not a CRM spreadsheet
- Not a masonry card grid
- Not designed only for ultra-wide desktop
- On smaller widths, rows may stack, but each item must still be scannable in one glance

### Empty/Filtered States
- Empty: invite the first opportunity creation
- Filtered empty: preserve current query/filter context and offer reset
- Retry: keep query/filter controls visible so the page still feels oriented

---

## Shared State Contract

These states must exist visually and semantically on both dashboard and list:
- `loading`
- `empty`
- `error`
- `blocked`
- `retry`
- `success`

Rules:
- A disabled control without explanation is not a valid blocked state
- Error and restricted states must not share the same language
- Retry should feel actionable, not passive
- Empty states must always pair a message with a next action

---

## Interaction and Motion Contract

- Motion budget: `150ms–220ms`
- Hover may adjust color, border, or shadow only; no scale transforms that shift layout
- Focus states must be highly visible on keyboard navigation
- Archive/unarchive feedback must feel immediate
- Modal/drawer entry for `New opportunity` should be calm and fast, not theatrical

---

## Responsiveness and Accessibility Contract

- Primary design width: desktop / laptop browser
- Required checkpoints: `1024px`, `1280px`, `1440px`
- No horizontal overflow at `1024px`
- Keyboard order must support nav → toolbar → primary action → content list without traps
- Status pills, alert regions, and retry/block reasons must be announced via correct semantics
- Current page and current step must be visually and semantically exposed

---

## Execution Guidance

- Before any UI implementation task, use `frontend-skill` to preserve restraint and avoid dashboard-card sprawl.
- Before any behavior implementation task, follow `test-driven-development`: write a failing browser or API test first.
- `03-CONTEXT.md` locks information architecture and product behavior; this UI contract locks visual/interaction behavior.

---

## Checker Sign-Off

- [x] Dimension 1 Copywriting: PASS
- [x] Dimension 2 Visuals: PASS
- [x] Dimension 3 Color: PASS
- [x] Dimension 4 Typography: PASS
- [x] Dimension 5 Spacing: PASS
- [x] Dimension 6 Registry Safety: PASS

**Approval:** approved 2026-04-09
