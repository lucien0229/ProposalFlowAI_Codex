"use client";

import type { ProposalDraftSection, ProposalDraftSectionKey } from "@proposalflow/shared-types";

type ProposalDraftChapterBlockProps = {
  section: ProposalDraftSection;
  disabled: boolean;
  isRegenerateBlocked: boolean;
  blockedReason?: string | null;
  showRegeneratePrompt: boolean;
  onChange: (sectionKey: ProposalDraftSectionKey, value: string) => void;
  onRegenerate: (sectionKey: ProposalDraftSectionKey) => void;
  onConfirmRegenerate: (sectionKey: ProposalDraftSectionKey) => void;
  onRequestSaveCurrent: () => void;
  onCancelRegenerate: () => void;
};

export function ProposalDraftChapterBlock({
  section,
  disabled,
  isRegenerateBlocked,
  blockedReason,
  showRegeneratePrompt,
  onChange,
  onRegenerate,
  onConfirmRegenerate,
  onRequestSaveCurrent,
  onCancelRegenerate,
}: ProposalDraftChapterBlockProps) {
  const sectionHint = section.last_generated_at
    ? "Generated from the current brief, discovery, and rules."
    : "Waiting for the next drafting pass.";

  return (
    <article className="proposal-draft-chapter-block" data-state={section.confidence} data-section-key={section.key}>
      <div className="proposal-draft-chapter-block__header">
        <div className="proposal-draft-chapter-block__heading">
          <h3>{section.label}</h3>
          <p>{sectionHint}</p>
        </div>

        <div className="proposal-draft-chapter-block__badges">
          <span className="product-chip">{section.confidence} confidence</span>
          {section.is_user_edited ? <span className="product-chip">Edited</span> : null}
        </div>
      </div>

      {section.warning ? (
        <p className="proposal-draft-chapter-block__warning" role="status">
          {section.warning}
        </p>
      ) : null}

      {isRegenerateBlocked && blockedReason ? (
        <p className="proposal-draft-chapter-block__restriction" role="status">
          {blockedReason}
        </p>
      ) : null}

      <label className="field proposal-draft-chapter-block__editor">
        <span>{section.label}</span>
        <textarea
          rows={section.key === "executive_summary" ? 6 : 7}
          value={section.content}
          onChange={(event) => onChange(section.key, event.target.value)}
          disabled={disabled}
        />
      </label>

      <div className="proposal-draft-chapter-block__footer">
        <span>
          {section.is_user_edited
            ? "Current chapter includes unsaved manual edits."
            : "Current chapter still reflects the generated working copy."}
        </span>
        <button
          type="button"
          className="product-button product-button--ghost"
          onClick={() => onRegenerate(section.key)}
          disabled={disabled || isRegenerateBlocked}
        >
          Regenerate section
        </button>
      </div>

      {showRegeneratePrompt ? (
        <div className="proposal-draft-chapter-block__confirm">
          <p>This section has unsaved edits. Save current first or confirm that you want to replace them.</p>
          <div className="proposal-draft-chapter-block__confirm-actions">
            <button type="button" className="product-button product-button--ghost" onClick={onRequestSaveCurrent}>
              Save current
            </button>
            <button
              type="button"
              className="product-button product-button--primary"
              onClick={() => onConfirmRegenerate(section.key)}
              disabled={disabled || isRegenerateBlocked}
            >
              Replace section
            </button>
            <button type="button" className="product-button product-button--ghost" onClick={onCancelRegenerate}>
              Cancel
            </button>
          </div>
        </div>
      ) : null}
    </article>
  );
}
