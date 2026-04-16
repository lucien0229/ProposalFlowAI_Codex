# Phase 7: Proposal Draft + Templates & Rules - Discussion Log

**Date:** 2026-04-13
**Phase:** 07
**Status:** Discussion completed

## Scope Anchor

Discussion stayed inside Phase 7 as defined in `.planning/ROADMAP.md`: ship Proposal Draft plus Templates & Rules as a real customer-facing drafting surface with rule visibility, versioning, chapter regenerate, export, and restriction handling.

## Prior Context Applied

Before discussion, the following decisions were carried forward and not reopened:
- Desktop/laptop web only; no mobile/tablet product scope.
- Opportunity workflow surfaces stay under the existing opportunity shell and stepper.
- Current resource + immutable versions + explicit restore confirmation + no silent overwrite.
- Shipping dark product UI from `docs/design/DESIGN.md`, not landing-page or admin-console composition.

## Gray Areas Presented

The following implementation gray areas were identified as the highest-impact decisions still worth locking:
1. Template switch semantics inside Proposal Draft vs workspace baseline rule editing.
2. Proposal Draft main-page layout and whether to keep the always-visible two-pane workspace shape.
3. Chapter-level regenerate overwrite semantics and whole-draft regenerate prominence.
4. Visibility model for low confidence, rules conflict, missing inputs, and billing restrictions.

## Q&A Record

### 1. Template / Rules Layering

**Recommendation presented**
- In Proposal Draft, switching template should create or update the current opportunity override only.
- In Templates & Rules, saving should update the workspace baseline only.
- Both actions should immediately refresh `effective rules`, but neither should silently write back into the other layer.

**User response**
- `同意`

**Locked outcome**
- Accepted as recommended.

### 2. Proposal Draft Main Layout

**Recommendation presented**
- Do not carry forward the Lead Brief / Discovery always-visible two-pane layout as the primary pattern.
- Use a top `Rules Summary Bar`, a central chapter-editing main stage, and a right-side on-demand context drawer for `Versions / Override / Risk & Confidence`.

**User response**
- `同意`

**Locked outcome**
- Accepted as recommended.

### 3. Regenerate Semantics

**Recommendation presented**
- `Regenerate section` should replace only the selected chapter.
- If that chapter has unsaved edits, require `Save Current` first or explicit overwrite confirmation.
- Whole-draft regenerate should remain available, but as a secondary higher-risk action.

**User response**
- `同意`

**Locked outcome**
- Accepted as recommended.

### 4. Warning / Restriction Visibility

**Recommendation presented**
- Use a two-layer model:
  - page-level status band for current unsafe/blocked state
  - local chapter/module markers for affected sections only
- Do not rely on toast-only feedback and do not turn the whole page into a warning wall.

**User response**
- `同意`

**Locked outcome**
- Accepted as recommended.

## Outcome Summary

The discussion locked the most consequential Phase 7 behavioral choices:
- rule/source-of-truth semantics are now explicit
- Proposal Draft layout is now editing-first rather than source-first
- chapter regenerate risk is now bounded and understandable
- confidence/conflict/restriction states now have a consistent visibility strategy

## Deferred / Out of Scope

No new capabilities were pulled into scope during discussion.

Still explicitly out of scope:
- template marketplace
- collaboration/comments
- diff-heavy compare tooling
- e-sign / quoting / payments
- mobile/tablet UX

---

*Discussion completed: 2026-04-13*
