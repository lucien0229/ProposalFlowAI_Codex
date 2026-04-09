import { notFound } from "next/navigation";

import { BUSINESS_ROUTE_PATHS } from "@proposalflow/shared-config";

import { ProductShell } from "@/components/product-shell";
import { ProductStateBlock } from "@/components/product-state-block";
import {
  formatOpportunityStatusLabel,
  formatOpportunityStepLabel,
} from "@/lib/opportunity-copy";
import { fetchOpportunityDetail } from "@/lib/opportunities-api";
import { requireBusinessContext } from "@/lib/server-business-context";

type OpportunityStepRouteProps = {
  params: Promise<{
    opportunityId: string;
    step: string;
  }>;
};

export default async function OpportunityStepRoute({ params }: OpportunityStepRouteProps) {
  const { bootstrap, cookieHeader } = await requireBusinessContext("/opportunities");
  const resolvedParams = await params;

  let opportunity = null;
  try {
    opportunity = await fetchOpportunityDetail(resolvedParams.opportunityId, {
      cookieHeader,
    });
  } catch {
    notFound();
  }

  if (!opportunity) {
    notFound();
  }

  const blocked = Boolean(opportunity.restriction_reason);

  return (
    <ProductShell
      workspaceName={bootstrap.workspace?.name ?? null}
      pageTitle={opportunity.title}
      pageDescription={`${opportunity.company_name} · ${formatOpportunityStepLabel(opportunity.current_step)}`}
      eyebrow="Opportunity detail"
      headerMeta={<span className="product-chip">{formatOpportunityStatusLabel(opportunity.status)}</span>}
    >
      <div className="detail-layout">
        <ProductStateBlock
          state={blocked ? "blocked" : "success"}
          title={
            blocked
              ? "This opportunity is visible but currently restricted."
              : "The current step is ready to continue."
          }
          body={
            blocked
              ? "The command center keeps the step visible so the team understands the blocker before moving to billing."
              : "Phase 3 lands you on a real workflow destination instead of a dead-end redirect."
          }
          detail={opportunity.restriction_reason?.replaceAll("_", " ") ?? undefined}
          primaryAction={{
            label: "Back to opportunities",
            href: BUSINESS_ROUTE_PATHS.opportunities,
          }}
          secondaryAction={{
            label: "Open dashboard",
            href: BUSINESS_ROUTE_PATHS.dashboard,
          }}
        />

        <section className="product-panel detail-panel" aria-labelledby="detail-panel-heading">
          <div className="dashboard-panel__header">
            <div>
              <span className="panel-kicker">Current record</span>
              <h2 id="detail-panel-heading">Opportunity overview</h2>
            </div>
          </div>

          <dl className="detail-panel__grid">
            <div>
              <dt>Company</dt>
              <dd>{opportunity.company_name}</dd>
            </div>
            <div>
              <dt>Current step</dt>
              <dd>{formatOpportunityStepLabel(opportunity.current_step)}</dd>
            </div>
            <div>
              <dt>Status</dt>
              <dd>{formatOpportunityStatusLabel(opportunity.status)}</dd>
            </div>
            <div>
              <dt>Requested service</dt>
              <dd>{opportunity.requested_service ?? "Not captured yet"}</dd>
            </div>
          </dl>
        </section>
      </div>
    </ProductShell>
  );
}
