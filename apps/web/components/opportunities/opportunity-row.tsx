import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import type { OpportunityListItem } from "@proposalflow/shared-types";

import {
  formatOpportunityQueueStatus,
  formatOpportunityStepLabel,
} from "@/lib/opportunity-copy";
import { formatOpportunityTimestamp } from "@/lib/opportunities-api";

import { ArchiveToggle } from "@/components/opportunities/archive-toggle";

type OpportunityRowProps = {
  item: OpportunityListItem;
  busy?: boolean;
  onArchiveToggle: (item: OpportunityListItem) => void;
};

export function OpportunityRow({
  item,
  busy = false,
  onArchiveToggle,
}: OpportunityRowProps) {
  return (
    <article className="opportunity-row">
      <Link href={item.current_step_url} className="opportunity-row__content">
        <div className="opportunity-row__title-group">
          <strong>{item.title}</strong>
          <span>{item.company_name}</span>
        </div>

        <div className="opportunity-row__meta">
          <span className="product-chip product-chip--step">{formatOpportunityStepLabel(item.current_step)}</span>
          <span>{formatOpportunityQueueStatus(item)}</span>
          <span>{item.owner_name ?? "Workspace owner"}</span>
          <span>{formatOpportunityTimestamp(item.updated_at)}</span>
        </div>

        <ArrowUpRight aria-hidden="true" size={16} />
      </Link>

      <ArchiveToggle archived={Boolean(item.archived_at)} busy={busy} onToggle={() => onArchiveToggle(item)} />
    </article>
  );
}
