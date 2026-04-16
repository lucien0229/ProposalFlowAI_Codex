"use client";

import Link from "next/link";

type ProposalDraftStatusBandProps = {
  band: {
    state: "blocked" | "error" | "retry" | "success" | "warning";
    title: string;
    body: string;
    detail?: string | null;
    primaryAction?: {
      label: string;
      href?: string;
      onAction?: () => void;
    };
  };
};

export function ProposalDraftStatusBand({ band }: ProposalDraftStatusBandProps) {
  return (
    <section
      className="inline-alert proposal-draft-status-band"
      data-testid="proposal-draft-status-band"
      data-state={band.state}
      role={band.state === "error" || band.state === "blocked" ? "alert" : "status"}
    >
      <div className="proposal-draft-status-band__copy">
        <strong>{band.title}</strong>
        <p>{band.body}</p>
        {band.detail ? <span>{band.detail}</span> : null}
      </div>

      {band.primaryAction ? (
        band.primaryAction.href ? (
          <Link href={band.primaryAction.href} className="product-button product-button--ghost">
            {band.primaryAction.label}
          </Link>
        ) : (
          <button
            type="button"
            className="product-button product-button--ghost"
            onClick={band.primaryAction.onAction}
          >
            {band.primaryAction.label}
          </button>
        )
      ) : null}
    </section>
  );
}
