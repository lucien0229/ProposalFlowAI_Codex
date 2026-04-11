"use client";

import type { ChangeEvent } from "react";

import type { LeadBriefFieldKey, LeadBriefFieldState } from "@proposalflow/shared-types";

import { LEAD_BRIEF_FIELD_HELPER_TEXT, LEAD_BRIEF_FIELD_LABELS, formatLeadBriefFieldState } from "@/lib/lead-brief-copy";

type LeadBriefFieldCardProps = {
  fieldKey: LeadBriefFieldKey;
  state: LeadBriefFieldState;
  value: string | null;
  sourceExcerpt: string | null;
  disabled?: boolean;
  onChange: (nextValue: string) => void;
  onConfirm: () => void;
};

function isLongField(fieldKey: LeadBriefFieldKey) {
  return ["business_context", "fit_assessment", "missing_information", "recommended_next_step"].includes(fieldKey);
}

export function LeadBriefFieldCard({
  fieldKey,
  state,
  value,
  sourceExcerpt,
  disabled = false,
  onChange,
  onConfirm,
}: LeadBriefFieldCardProps) {
  const label = LEAD_BRIEF_FIELD_LABELS[fieldKey];
  const helperText = LEAD_BRIEF_FIELD_HELPER_TEXT[fieldKey];
  const multiline = isLongField(fieldKey);

  function handleChange(event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    onChange(event.target.value);
  }

  return (
    <article className="lead-brief-field-card" data-field-key={fieldKey} data-state={state}>
      <div className="lead-brief-field-card__header">
        <div className="lead-brief-field-card__heading">
          <span className="panel-kicker">{label}</span>
          <p>{helperText}</p>
        </div>
        <span className="product-chip lead-brief-field-card__state" data-testid="lead-brief-field-state" data-state={state}>
          {formatLeadBriefFieldState(state)}
        </span>
      </div>

      <label className="field lead-brief-field-card__editor">
        <span>{label}</span>
        {multiline ? (
          <textarea value={value ?? ""} onChange={handleChange} rows={3} disabled={disabled} />
        ) : (
          <input type="text" value={value ?? ""} onChange={handleChange} disabled={disabled} />
        )}
      </label>

      <div className="lead-brief-field-card__footer">
        <p className="lead-brief-field-card__source">
          {sourceExcerpt ? `From source: ${sourceExcerpt}` : "No source excerpt captured yet."}
        </p>
        <button type="button" className="product-button product-button--ghost" onClick={onConfirm} disabled={disabled}>
          Confirm
        </button>
      </div>
    </article>
  );
}
