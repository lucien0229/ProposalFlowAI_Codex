"use client";

import { useEffect } from "react";

import { ProductShell } from "@/components/product-shell";
import { ProductStateBlock } from "@/components/product-state-block";

type OpportunityStepErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function OpportunityStepError({ error, reset }: OpportunityStepErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <ProductShell
      workspaceName={null}
      pageTitle="Workspace unavailable"
      pageDescription="The requested opportunity step could not finish loading."
      eyebrow="Opportunity workspace"
    >
      <ProductStateBlock
        state="error"
        title="We couldn't load this workspace."
        body="Retry to restore the current opportunity context without losing your place."
        detail={error.message}
        primaryAction={{
          label: "Try again",
          onAction: reset,
        }}
        secondaryAction={{
          label: "Back to opportunities",
          href: "/opportunities",
        }}
      />
    </ProductShell>
  );
}
