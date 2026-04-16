"use client";

import Link from "next/link";

import { BUSINESS_ROUTE_PATHS } from "@proposalflow/shared-config";
import type { EffectiveRuleSummary } from "@proposalflow/shared-types";

import { PROPOSAL_DRAFT_PAGE_COPY, buildRulesSummaryRows } from "@/lib/proposal-draft-copy";

type ProposalDraftRulesBarProps = {
  opportunityId: string;
  summary: EffectiveRuleSummary | null;
  isWorking: boolean;
  onOpenOverride: () => void;
  onClearOverride: () => void;
};

export function ProposalDraftRulesBar({
  opportunityId,
  summary,
  isWorking,
  onOpenOverride,
  onClearOverride,
}: ProposalDraftRulesBarProps) {
  const templatesHref = `${BUSINESS_ROUTE_PATHS.templatesRules}?returnTo=${encodeURIComponent(
    BUSINESS_ROUTE_PATHS.opportunityStep(opportunityId, "proposal_draft"),
  )}`;

  return (
    <section
      className="product-panel proposal-draft-rules-summary"
      data-testid="proposal-draft-rules-summary"
      aria-labelledby="proposal-draft-rules-summary-heading"
    >
      <div className="proposal-draft-rules-summary__header">
        <div>
          <p className="panel-kicker">Drafting guardrails</p>
          <h3 id="proposal-draft-rules-summary-heading">{PROPOSAL_DRAFT_PAGE_COPY.rulesSummaryTitle}</h3>
          <p>
            Keep the active template, rule stack, assumptions, exclusions, tone, and terminology visible
            while the proposal changes.
          </p>
        </div>

        <div className="proposal-draft-rules-summary__actions">
          {summary?.has_override ? <span className="product-chip">Override active</span> : null}
          <button
            type="button"
            className="product-button product-button--ghost"
            onClick={onOpenOverride}
            disabled={isWorking}
          >
            {PROPOSAL_DRAFT_PAGE_COPY.overrideAction}
          </button>
          {summary?.has_override ? (
            <button
              type="button"
              className="product-button product-button--ghost"
              onClick={onClearOverride}
              disabled={isWorking}
            >
              {PROPOSAL_DRAFT_PAGE_COPY.clearOverride}
            </button>
          ) : null}
          <Link href={templatesHref} className="product-button product-button--ghost">
            Open Templates &amp; Rules
          </Link>
        </div>
      </div>

      <div className="proposal-draft-rules-summary__grid">
        {buildRulesSummaryRows(summary).map((row) => (
          <div key={row.label} className="proposal-draft-rules-summary__item">
            <span>{row.label}</span>
            <p>{row.value}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
