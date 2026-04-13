"use client";

import type { ChangeEvent } from "react";

import type { DiscoveryFieldKey, DiscoveryFieldState } from "@proposalflow/shared-types";

import {
  DISCOVERY_FIELD_HELPER_TEXT,
  DISCOVERY_FIELD_LABELS,
  formatDiscoveryFieldState,
} from "@/lib/discovery-copy";

type DiscoveryFieldCardProps = {
  fieldKey: DiscoveryFieldKey;
  state: DiscoveryFieldState;
  value: string | null;
  sourceExcerpt: string | null;
  disabled?: boolean;
  onChange: (nextValue: string) => void;
  onConfirm: () => void;
};

function isLongField(fieldKey: DiscoveryFieldKey) {
  return true;
}

export function DiscoveryFieldCard({
  fieldKey,
  state,
  value,
  sourceExcerpt,
  disabled = false,
  onChange,
  onConfirm,
}: DiscoveryFieldCardProps) {
  const label = DISCOVERY_FIELD_LABELS[fieldKey];
  const helperText = DISCOVERY_FIELD_HELPER_TEXT[fieldKey];
  const multiline = isLongField(fieldKey);

  function handleChange(event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    onChange(event.target.value);
  }

  return (
    <article className="discovery-field-card" data-field-key={fieldKey} data-state={state}>
      <div className="discovery-field-card__header">
        <div className="discovery-field-card__heading">
          <span className="panel-kicker">{label}</span>
          <p>{helperText}</p>
        </div>
        <span
          className="product-chip discovery-field-card__state"
          data-testid="discovery-field-state"
          data-state={state}
        >
          {formatDiscoveryFieldState(state)}
        </span>
      </div>

      <label className="field discovery-field-card__editor">
        <span>{label}</span>
        {multiline ? (
          <textarea value={value ?? ""} onChange={handleChange} rows={4} disabled={disabled} />
        ) : (
          <input type="text" value={value ?? ""} onChange={handleChange} disabled={disabled} />
        )}
      </label>

      <div className="discovery-field-card__footer">
        <p className="discovery-field-card__source">
          {sourceExcerpt ? `Evidence: ${sourceExcerpt}` : "No source excerpt captured yet."}
        </p>
        <button type="button" className="product-button product-button--ghost" onClick={onConfirm} disabled={disabled}>
          Mark reviewed
        </button>
      </div>
    </article>
  );
}
