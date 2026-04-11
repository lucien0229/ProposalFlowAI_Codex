import type { OpportunityIntakeOverviewResponse } from "@/lib/opportunities-api";
import type { LeadBriefCurrentResource } from "@proposalflow/shared-types";

import { formatOpportunityTimestamp } from "@/lib/opportunities-api";

type LeadBriefSourcePaneProps = {
  opportunityDetail: OpportunityIntakeOverviewResponse;
  currentResource: LeadBriefCurrentResource | null;
  workspaceState: "loading" | "empty" | "error" | "ready";
};

function buildSourcePreview(detail: OpportunityIntakeOverviewResponse) {
  return (
    detail.intake.primary_input?.content ??
    detail.intake.latest_file?.extracted_text ??
    "No source material has been captured yet."
  );
}

export function LeadBriefSourcePane({
  opportunityDetail,
  currentResource,
  workspaceState,
}: LeadBriefSourcePaneProps) {
  const sourcePreview = buildSourcePreview(opportunityDetail);
  const latestSourceUpdatedAt =
    opportunityDetail.intake.latest_file?.updated_at ??
    opportunityDetail.intake.primary_input?.updated_at ??
    opportunityDetail.opportunity.updated_at;

  return (
    <section className="product-panel lead-brief-source-pane" data-testid="lead-brief-source-pane" aria-labelledby="lead-brief-source-heading">
      <div className="dashboard-panel__header">
        <div>
          <span className="panel-kicker">Source material</span>
          <h2 id="lead-brief-source-heading">Source material</h2>
        </div>
        <span className="product-chip" data-state={currentResource ? "active" : "empty"}>
          {workspaceState === "loading"
            ? "Loading current brief"
            : currentResource
              ? `Current revision ${currentResource.current_revision_no}`
              : "No current brief"}
        </span>
      </div>

      <div className="lead-brief-source-pane__summary">
        <div>
          <span className="panel-kicker">Opportunity</span>
          <p>{opportunityDetail.opportunity.title}</p>
        </div>
        <div>
          <span className="panel-kicker">Company</span>
          <p>{opportunityDetail.opportunity.company_name}</p>
        </div>
        <div>
          <span className="panel-kicker">Source type</span>
          <p>{opportunityDetail.minimum_context.fields.source_type ?? "manual"}</p>
        </div>
      </div>

      <div className="lead-brief-source-pane__provenance">
        <span className="product-chip product-chip--step">Opportunity intake</span>
        {opportunityDetail.intake.primary_input ? (
          <span className="product-chip">Manual notes</span>
        ) : null}
        {opportunityDetail.intake.latest_file ? (
          <span className="product-chip">Latest file</span>
        ) : null}
        <span className="product-chip">Updated {formatOpportunityTimestamp(latestSourceUpdatedAt)}</span>
      </div>

      <div className="lead-brief-source-pane__excerpt">
        <span className="panel-kicker">Source excerpt</span>
        <p>{sourcePreview}</p>
      </div>

      <p className="product-muted">
        The source pane stays read-first so the active brief always has a provenance anchor.
      </p>
    </section>
  );
}
