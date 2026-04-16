"use client";

import type { RefObject } from "react";

import type { TemplateListItem } from "@/lib/templates-rules-api";
import type { ProposalDraftOverrideFormState } from "@/lib/proposal-draft-copy";

import { PROPOSAL_DRAFT_PAGE_COPY } from "@/lib/proposal-draft-copy";

type ProposalDraftOverrideDrawerProps = {
  formState: ProposalDraftOverrideFormState | null;
  templates: TemplateListItem[];
  isWorking: boolean;
  templateFieldRef: RefObject<HTMLSelectElement | null>;
  onChange: (field: keyof ProposalDraftOverrideFormState, value: string) => void;
  onSave: () => void;
  onClear: () => void;
  onClose: () => void;
};

export function ProposalDraftOverrideDrawer({
  formState,
  templates,
  isWorking,
  templateFieldRef,
  onChange,
  onSave,
  onClear,
  onClose,
}: ProposalDraftOverrideDrawerProps) {
  return (
    <aside className="product-panel proposal-draft-drawer" data-testid="proposal-draft-override-drawer">
      <div className="proposal-draft-drawer__header">
        <div>
          <p className="panel-kicker">Opportunity-local rules</p>
          <h3>{PROPOSAL_DRAFT_PAGE_COPY.overrideDrawerTitle}</h3>
          <p>Adjust the current opportunity without rewriting the workspace baseline rules.</p>
        </div>
        <button type="button" className="product-button product-button--ghost" onClick={onClose} disabled={isWorking}>
          Close
        </button>
      </div>

      {formState ? (
        <div className="proposal-draft-drawer__body">
          <label className="field">
            <span>Template for this opportunity</span>
            <select
              ref={templateFieldRef}
              value={formState.templateKeyOverride ?? ""}
              onChange={(event) => onChange("templateKeyOverride", event.target.value)}
              disabled={isWorking}
            >
              {templates.map((template) => (
                <option key={template.key} value={template.key}>
                  {template.name}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Tone for this opportunity</span>
            <input
              type="text"
              value={formState.toneProfileOverride ?? ""}
              onChange={(event) => onChange("toneProfileOverride", event.target.value)}
              disabled={isWorking}
            />
          </label>

          <label className="field">
            <span>Assumptions for this opportunity</span>
            <textarea
              rows={4}
              value={formState.assumptionsOverride}
              onChange={(event) => onChange("assumptionsOverride", event.target.value)}
              disabled={isWorking}
            />
          </label>

          <label className="field">
            <span>Exclusions for this opportunity</span>
            <textarea
              rows={4}
              value={formState.exclusionsOverride}
              onChange={(event) => onChange("exclusionsOverride", event.target.value)}
              disabled={isWorking}
            />
          </label>

          <label className="field">
            <span>Preferred terminology additions</span>
            <textarea
              rows={3}
              value={formState.preferredTerminologyAdditions}
              onChange={(event) => onChange("preferredTerminologyAdditions", event.target.value)}
              disabled={isWorking}
            />
          </label>

          <label className="field">
            <span>Banned terminology additions</span>
            <textarea
              rows={3}
              value={formState.bannedTerminologyAdditions}
              onChange={(event) => onChange("bannedTerminologyAdditions", event.target.value)}
              disabled={isWorking}
            />
          </label>

          <div className="proposal-draft-drawer__footer">
            <button type="button" className="product-button product-button--primary" onClick={onSave} disabled={isWorking}>
              Save override
            </button>
            <button type="button" className="product-button product-button--ghost" onClick={onClear} disabled={isWorking}>
              Clear override
            </button>
          </div>
        </div>
      ) : (
        <p className="product-muted">Loading the current opportunity override…</p>
      )}
    </aside>
  );
}
