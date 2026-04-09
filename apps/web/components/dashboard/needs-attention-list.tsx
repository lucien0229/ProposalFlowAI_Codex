import Link from "next/link";
import { ArrowUpRight, TriangleAlert } from "lucide-react";

import type { NeedsAttentionItem } from "@proposalflow/shared-types";

type NeedsAttentionListProps = {
  items: NeedsAttentionItem[];
};

export function NeedsAttentionList({ items }: NeedsAttentionListProps) {
  return (
    <section className="product-panel dashboard-panel dashboard-panel--attention" aria-labelledby="needs-attention-heading">
      <div className="dashboard-panel__header">
        <div>
          <span className="panel-kicker panel-kicker--warning">Triage first</span>
          <h2 id="needs-attention-heading">Needs attention</h2>
        </div>
        <span className="product-chip product-chip--warning">{items.length} open</span>
      </div>

      {items.length === 0 ? (
        <p className="product-muted">No blockers are holding the active queue right now.</p>
      ) : (
        <div className="attention-list">
          {items.map((item) => (
            <Link key={item.id} href={item.current_step_url} className="attention-list__item">
              <div className="attention-list__icon">
                <TriangleAlert aria-hidden="true" size={16} />
              </div>

              <div className="attention-list__copy">
                <strong>{item.title}</strong>
                <p>{item.attention_body}</p>
              </div>

              <ArrowUpRight aria-hidden="true" size={15} />
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
