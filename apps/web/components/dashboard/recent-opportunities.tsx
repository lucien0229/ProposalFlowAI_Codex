import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import type { OpportunityListItem } from "@proposalflow/shared-types";
import {
  formatOpportunityStepLabel,
  formatOpportunityStatusLabel,
} from "@/lib/opportunity-copy";
import { formatOpportunityTimestamp } from "@/lib/opportunities-api";

type RecentOpportunitiesProps = {
  items: OpportunityListItem[];
};

function formatLabel(value: string | null) {
  if (!value) {
    return "No owner";
  }
  return value;
}

export function RecentOpportunities({ items }: RecentOpportunitiesProps) {
  return (
    <section className="product-panel dashboard-panel" aria-labelledby="recent-opportunities-heading">
      <div className="dashboard-panel__header">
        <div>
          <span className="panel-kicker">Resume queue</span>
          <h2 id="recent-opportunities-heading">Recent opportunities</h2>
        </div>
        <span className="product-chip">{items.length} items</span>
      </div>

      {items.length === 0 ? (
        <p className="product-muted">Recent work appears here once the first opportunity has been created.</p>
      ) : (
        <div className="dashboard-list">
          {items.map((item) => (
            <Link key={item.id} href={item.current_step_url} className="dashboard-list__item">
              <div className="dashboard-list__title-group">
                <strong>{item.title}</strong>
                <span>{item.company_name}</span>
              </div>

              <div className="dashboard-list__meta">
                <span className="product-chip product-chip--step">
                  {formatOpportunityStepLabel(item.current_step)}
                </span>
                <span>{formatOpportunityStatusLabel(item.status)}</span>
                <span>{formatLabel(item.owner_name)}</span>
                <span>{formatOpportunityTimestamp(item.updated_at)}</span>
                <ArrowUpRight aria-hidden="true" size={15} />
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
