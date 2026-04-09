import Link from "next/link";
import { Plus } from "lucide-react";

import { BUSINESS_ROUTE_PATHS } from "@proposalflow/shared-config";

import { getBlockedCreateActionCopy } from "@/lib/workspace-billing";

type NewOpportunityActionProps = {
  blockedReason?: string | null;
  noteId: string;
  onAction: () => void;
};

export function NewOpportunityAction({
  blockedReason = null,
  noteId,
  onAction,
}: NewOpportunityActionProps) {
  const blockedCopy = blockedReason ? getBlockedCreateActionCopy(blockedReason) : null;

  return (
    <div className="product-action-stack">
      <button
        type="button"
        className="product-button product-button--primary"
        onClick={onAction}
        disabled={Boolean(blockedReason)}
        aria-describedby={blockedCopy ? noteId : undefined}
      >
        <Plus aria-hidden="true" size={16} />
        <span>New opportunity</span>
      </button>

      {blockedCopy ? (
        <p id={noteId} className="product-action-stack__note">
          {blockedCopy} <Link href={BUSINESS_ROUTE_PATHS.billing}>Review billing</Link> to create new work.
        </p>
      ) : null}
    </div>
  );
}
