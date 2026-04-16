"use client";

import type { WorkspaceRuleSet } from "@proposalflow/shared-types";

import type { TemplateListItem } from "@/lib/templates-rules-api";

type RuleImpactNoteProps = {
  ruleSet: WorkspaceRuleSet | null;
  templates: TemplateListItem[];
  isSaved: boolean;
  hasPendingChanges: boolean;
};

function formatReadableValue(value: string) {
  return value.replaceAll("_", " ");
}

function resolveTemplateLabel(
  templates: TemplateListItem[],
  templateKey: string,
) {
  return (
    templates.find((template) => template.key === templateKey)?.name ??
    formatReadableValue(templateKey)
  );
}

function summarizeList(values: string[], fallback: string) {
  return values.slice(0, 3).join(" · ") || fallback;
}

export function RuleImpactNote({
  ruleSet,
  templates,
  isSaved,
  hasPendingChanges,
}: RuleImpactNoteProps) {
  if (!ruleSet) {
    return null;
  }

  const templateLabel = resolveTemplateLabel(templates, ruleSet.template_key);
  const toneLabel = `${formatReadableValue(ruleSet.tone_profile)} tone`;
  const requiredSections = summarizeList(
    ruleSet.required_sections.map((sectionKey) =>
      formatReadableValue(sectionKey),
    ),
    "Assumptions and exclusions stay visible.",
  );
  const terminology = summarizeList(
    ruleSet.preferred_terminology,
    "No preferred terminology saved yet.",
  );
  const modules = summarizeList(
    ruleSet.service_modules,
    "No service modules saved yet.",
  );

  return (
    <section
      className="templates-rules-impact-note"
      data-testid="templates-rules-impact-note"
    >
      <div className="templates-rules-impact-note__summary">
        <p className="panel-kicker">Proposal Draft impact</p>
        <h3>{isSaved ? "Baseline refresh ready" : "What this baseline shapes"}</h3>
        <p>
          Proposal Draft will use the {templateLabel} baseline, {toneLabel},
          and the current section/module defaults the next time you return.
        </p>
        <div className="templates-rules-impact-note__chips">
          <span
            className={`product-chip${
              hasPendingChanges ? " product-chip--warning" : ""
            }`}
          >
            {hasPendingChanges ? "Unsaved changes in progress" : "Ready for return"}
          </span>
          <span className="product-chip">{templateLabel}</span>
          <span className="product-chip">{toneLabel}</span>
        </div>
      </div>

      <div className="templates-rules-impact-note__grid">
        <div className="templates-rules-impact-note__item">
          <span>Required sections</span>
          <p>{requiredSections}</p>
        </div>

        <div className="templates-rules-impact-note__item">
          <span>Terminology</span>
          <p>{terminology}</p>
        </div>

        <div className="templates-rules-impact-note__item">
          <span>Service modules</span>
          <p>{modules}</p>
        </div>
      </div>
    </section>
  );
}
