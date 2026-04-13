# Phase 6: Discovery Workspace - UI-SPEC

**Gathered:** 2026-04-11
**Status:** Ready for planning

<goal>
Define the visual and interaction contract for the Discovery workspace so implementation stays aligned with the product UI standard and does not drift into a transcript viewer, chat assistant, or landing-page composition.
</goal>

<design_system>
## Design System

### Authoritative baseline
- `docs/design/DESIGN.md` is the source of truth.
- The UI must keep the Linear-inspired dark product language: near-black canvas, translucent panels, subtle borders, restrained accent usage, and precise typography.
- `ui-ux-pro-max` can inform loading/empty/error discipline, but not the page pattern, palette, or layout language.

### Typography
- Primary font: Inter Variable.
- Keep the Phase 1/3/5 typographic discipline: strong hierarchy, 510 as the signature emphasis weight, tight but readable spacing, and clear label/body separation.
- Avoid decorative or editorial serif pairings for the core UI.

### Color and surface treatment
- Background should remain in the deep-dark range used across the product.
- Surfaces should be translucent dark panels with subtle 1px borders.
- Use one restrained accent color for primary actions and active states.
- Status colors are for state meaning, not decoration.

</design_system>

<layout>
## Layout Contract

### Desktop workspace structure
- Top area: page title, brief explanation, workflow status, and primary actions.
- Main body: two-column workspace.
- Left column: source pane, read-first, includes intake notes, extracted text, transcript excerpts, and user-authored discovery notes.
- Right column: structured discovery output, editable fields, evidence chips, risk and ambiguity callouts, and next-step handoff.
- Version history: right-side drawer on desktop, not a separate page.

### Workspace hierarchy
- The source pane should stay visually quieter than the output pane.
- The output pane should be the dominant interaction surface.
- The version drawer should feel inspectable and cautious, not casual or decorative.

### Responsive behavior
- This phase is web app only and does not introduce mobile or tablet-specific layouts.
- The interface should remain credible at common desktop/laptop widths, including narrower laptop windows, by stacking secondary surfaces when needed.
- Do not design touch-first interactions or tablet-optimized gestures.

</layout>

<interaction_contract>
## Interaction Contract

### Primary actions
- Generate discovery.
- Save current.
- Save version.
- Regenerate.
- Open versions.
- Restore version.
- Copy summary or handoff text.

### Evidence handling
- Every output field needs visible source attribution or an explicit missing-evidence indicator.
- Show a short rationale line or source excerpt near the field that motivated it.
- If the evidence is thin, show a visible `Needs more evidence` state in the page, not just a passive banner.

### Error recovery and state handling
- Loading states must use skeletons or equivalent feedback.
- Empty states must include a clear primary action.
- Error states must be announced with accessible live-region semantics and should include a recovery path.
- Blocked states must explain the blocker and the unblocking action in product language.
- Retry states must be explicit, not just a repeated spinner.

### Destructive actions
- Regenerate and restore require explicit overwrite awareness.
- If user edits already exist, the UI must warn before replacing them.
- Stale-save conflicts must fail conservatively and point the user toward refresh or reload.

</interaction_contract>

<state_contract>
## State Contract

The UI must support these visible product states:
- `loading`
- `empty`
- `error`
- `blocked`
- `retry`
- `success`
- `Needs more evidence` as an inline domain-specific state

The UI must not hide any of these behind toasts only.

</state_contract>

<copy_tone>
## Copy Tone

- Clear, precise, and calm.
- Evidence-first, not conversational AI framing.
- No hype, no marketing language, no chat-bubble phrasing.
- Recovery copy should tell the user what happened and what to do next.

</copy_tone>

<accessibility>
## Accessibility Contract

- Errors should be announced with `role="alert"` or `aria-live`.
- Loading regions should expose busy semantics where appropriate.
- Keyboard focus must be visible on all interactive controls.
- Drawer open/close and restore confirmation must be reachable without a mouse.
- Use icons as supporting signals only; all state meaning must also be readable in text.

</accessibility>

<anti_patterns>
## Anti-Patterns

- Transcript dump layouts.
- Chat assistant bubbles or prompt-history framing.
- Landing-page hero compositions.
- Heavy analytics visuals, charts, or dashboard noise.
- Decorative motion that does not help the user understand state.
- Silent destructive actions or unannounced failures.

</anti_patterns>

<component_expectations>
## Component Expectations

- Reuse `ProductShell` and `ProductStateBlock`.
- Create Discovery-specific source, output, version drawer, and evidence field components as needed.
- Keep route-level `loading.tsx` and `error.tsx` in place.
- Keep stateful logic in the workspace layer and presentation logic in subcomponents.

</component_expectations>

---

*Phase: 06-Discovery Workspace*
*UI-SPEC gathered: 2026-04-11*
