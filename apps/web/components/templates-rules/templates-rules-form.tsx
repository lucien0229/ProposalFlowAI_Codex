"use client";

import {
  PROPOSAL_DRAFT_SECTION_KEYS,
  WORKSPACE_TONE_PREFERENCES,
  type ProposalDraftSectionKey,
  type WorkspaceRuleSet,
} from "@proposalflow/shared-types";

import type { TemplateListItem } from "@/lib/templates-rules-api";

export type TemplatesRulesFieldKey =
  | "preferred_terminology"
  | "banned_terminology"
  | "required_sections"
  | "section_order"
  | "default_assumptions"
  | "default_exclusions"
  | "service_modules";

export type TemplatesRulesFieldErrors = Partial<
  Record<TemplatesRulesFieldKey, string>
>;

type TemplatesRulesFormProps = {
  ruleSet: WorkspaceRuleSet;
  templates: TemplateListItem[];
  fieldErrors: TemplatesRulesFieldErrors;
  isSaving: boolean;
  onFieldBlur: (field: TemplatesRulesFieldKey) => void;
  onTemplateChange: (value: WorkspaceRuleSet["template_key"]) => void;
  onToneChange: (value: WorkspaceRuleSet["tone_profile"]) => void;
  onListFieldChange: (
    field:
      | "default_assumptions"
      | "default_exclusions"
      | "preferred_terminology"
      | "banned_terminology"
      | "service_modules",
    value: string,
  ) => void;
  onToggleRequiredSection: (sectionKey: ProposalDraftSectionKey) => void;
  onMoveSection: (
    sectionKey: ProposalDraftSectionKey,
    direction: "up" | "down",
  ) => void;
};

const SECTION_LABELS: Record<ProposalDraftSectionKey, string> = {
  executive_summary: "Executive Summary",
  objectives: "Objectives",
  recommended_approach: "Recommended Approach",
  deliverables: "Deliverables",
  timeline: "Timeline",
  assumptions: "Assumptions",
  exclusions: "Exclusions",
  next_steps: "Next Steps / CTA",
};

function listToTextareaValue(values: string[]) {
  return values.join("\n");
}

function renderFieldError(message?: string) {
  return message ? <small className="field-error">{message}</small> : null;
}

export function TemplatesRulesForm({
  ruleSet,
  templates,
  fieldErrors,
  isSaving,
  onFieldBlur,
  onTemplateChange,
  onToneChange,
  onListFieldChange,
  onToggleRequiredSection,
  onMoveSection,
}: TemplatesRulesFormProps) {
  return (
    <div className="templates-rules-form">
      <section className="templates-rules-form__section">
        <div className="templates-rules-form__section-copy">
          <h3>Template Basics</h3>
          <p>
            Choose the baseline template and tone that Proposal Draft should
            use by default.
          </p>
        </div>

        <div className="templates-rules-form__grid">
          <label className="field">
            <span>Template</span>
            <select
              value={ruleSet.template_key}
              onChange={(event) =>
                onTemplateChange(
                  event.target.value as WorkspaceRuleSet["template_key"],
                )
              }
              disabled={isSaving}
            >
              {templates.map((template) => (
                <option key={template.key} value={template.key}>
                  {template.name}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Tone</span>
            <select
              value={ruleSet.tone_profile}
              onChange={(event) =>
                onToneChange(
                  event.target.value as WorkspaceRuleSet["tone_profile"],
                )
              }
              disabled={isSaving}
            >
              {WORKSPACE_TONE_PREFERENCES.map((tone) => (
                <option key={tone} value={tone}>
                  {tone}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <section className="templates-rules-form__section">
        <div className="templates-rules-form__section-copy">
          <h3>Assumptions &amp; Exclusions</h3>
          <p>
            Keep the baseline guardrails obvious before Proposal Draft generates
            the next version.
          </p>
        </div>

        <div className="templates-rules-form__grid">
          <label className="field">
            <span>Default assumptions</span>
            <textarea
              rows={5}
              value={listToTextareaValue(ruleSet.default_assumptions)}
              onChange={(event) =>
                onListFieldChange("default_assumptions", event.target.value)
              }
              onBlur={() => onFieldBlur("default_assumptions")}
              disabled={isSaving}
            />
            {renderFieldError(fieldErrors.default_assumptions)}
          </label>

          <label className="field">
            <span>Default exclusions</span>
            <textarea
              rows={5}
              value={listToTextareaValue(ruleSet.default_exclusions)}
              onChange={(event) =>
                onListFieldChange("default_exclusions", event.target.value)
              }
              onBlur={() => onFieldBlur("default_exclusions")}
              disabled={isSaving}
            />
            {renderFieldError(fieldErrors.default_exclusions)}
          </label>
        </div>
      </section>

      <section className="templates-rules-form__section">
        <div className="templates-rules-form__section-copy">
          <h3>Tone &amp; Terminology</h3>
          <p>
            Keep preferred and banned terminology distinct so the baseline
            guidance stays readable.
          </p>
        </div>

        <div className="templates-rules-form__grid">
          <label className="field">
            <span>Preferred terminology</span>
            <textarea
              rows={5}
              value={listToTextareaValue(ruleSet.preferred_terminology)}
              onChange={(event) =>
                onListFieldChange("preferred_terminology", event.target.value)
              }
              onBlur={() => onFieldBlur("preferred_terminology")}
              disabled={isSaving}
              data-invalid={fieldErrors.preferred_terminology ? "true" : undefined}
            />
            {renderFieldError(fieldErrors.preferred_terminology)}
          </label>

          <label className="field">
            <span>Banned terminology</span>
            <textarea
              rows={5}
              value={listToTextareaValue(ruleSet.banned_terminology)}
              onChange={(event) =>
                onListFieldChange("banned_terminology", event.target.value)
              }
              onBlur={() => onFieldBlur("banned_terminology")}
              disabled={isSaving}
              data-invalid={fieldErrors.banned_terminology ? "true" : undefined}
            />
            {renderFieldError(fieldErrors.banned_terminology)}
          </label>
        </div>
      </section>

      <section className="templates-rules-form__section">
        <div className="templates-rules-form__section-copy">
          <h3>Sections &amp; Modules</h3>
          <p>
            Lock the required chapters, keep the section order stable, and
            clarify which service modules should appear by default.
          </p>
        </div>

        <div className="templates-rules-form__grid">
          <label className="field">
            <span>Service modules</span>
            <textarea
              rows={5}
              value={listToTextareaValue(ruleSet.service_modules)}
              onChange={(event) =>
                onListFieldChange("service_modules", event.target.value)
              }
              onBlur={() => onFieldBlur("service_modules")}
              disabled={isSaving}
            />
            {renderFieldError(fieldErrors.service_modules)}
          </label>

          <div className="field">
            <span>Required sections</span>
            <div className="templates-rules-form__checkbox-grid">
              {PROPOSAL_DRAFT_SECTION_KEYS.map((sectionKey) => {
                const label = SECTION_LABELS[sectionKey];
                const isChecked = ruleSet.required_sections.includes(sectionKey);
                return (
                  <label
                    key={sectionKey}
                    className="toolbar-checkbox"
                    data-invalid={fieldErrors.required_sections ? "true" : undefined}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => onToggleRequiredSection(sectionKey)}
                      onBlur={() => onFieldBlur("required_sections")}
                      disabled={isSaving}
                    />
                    <span>{label}</span>
                  </label>
                );
              })}
            </div>
            {renderFieldError(fieldErrors.required_sections)}
          </div>
        </div>

        <div className="field templates-rules-form__section-order">
          <span>Section order</span>
          <div className="templates-rules-form__order-list">
            {ruleSet.section_order.map((sectionKey, index) => {
              const label = SECTION_LABELS[sectionKey];
              return (
                <div key={sectionKey} className="templates-rules-form__order-item">
                  <div className="templates-rules-form__order-copy">
                    <span className="product-chip">{index + 1}</span>
                    <strong>{label}</strong>
                  </div>

                  <div className="templates-rules-form__order-actions">
                    <button
                      type="button"
                      className="product-button product-button--ghost"
                      onClick={() => onMoveSection(sectionKey, "up")}
                      disabled={isSaving || index === 0}
                      aria-label={`Move ${label} up`}
                    >
                      Move up
                    </button>
                    <button
                      type="button"
                      className="product-button product-button--ghost"
                      onClick={() => onMoveSection(sectionKey, "down")}
                      disabled={
                        isSaving || index === ruleSet.section_order.length - 1
                      }
                      aria-label={`Move ${label} down`}
                    >
                      Move down
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          {renderFieldError(fieldErrors.section_order)}
        </div>
      </section>
    </div>
  );
}
