import Link from "next/link";

import { BUSINESS_ROUTE_PATHS } from "@proposalflow/shared-config";
import type { DashboardSummary } from "@proposalflow/shared-types";

type BillingCardProps = {
  snapshot: DashboardSummary["billing_snapshot"];
};

function formatValue(value: string | null) {
  if (!value) {
    return "Not set";
  }
  return value.replaceAll("_", " ");
}

export function BillingCard({ snapshot }: BillingCardProps) {
  return (
    <section className="product-panel billing-card" aria-labelledby="billing-card-heading">
      <div className="dashboard-panel__header">
        <div>
          <span className="panel-kicker">Workspace health</span>
          <h2 id="billing-card-heading">Trial / Billing</h2>
        </div>
        <span className="product-chip" data-state={snapshot.is_restricted ? "blocked" : "active"}>
          {snapshot.is_restricted ? "Restricted" : "Active"}
        </span>
      </div>

      <dl className="billing-card__details">
        <div>
          <dt>Trial</dt>
          <dd>{formatValue(snapshot.trial_status)}</dd>
        </div>
        <div>
          <dt>Billing</dt>
          <dd>{formatValue(snapshot.billing_status)}</dd>
        </div>
        <div>
          <dt>Plan</dt>
          <dd>{formatValue(snapshot.plan_type)}</dd>
        </div>
      </dl>

      <p className="product-muted">
        {snapshot.is_restricted
          ? "Billing restrictions are active. Resume and create actions stay visible but explain why they are blocked."
          : "The workspace is clear to create and resume opportunities."}
      </p>

      <Link href={BUSINESS_ROUTE_PATHS.billing} className="product-button product-button--ghost">
        Open billing
      </Link>
    </section>
  );
}
