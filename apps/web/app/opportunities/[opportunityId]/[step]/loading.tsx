import { ProductShell } from "@/components/product-shell";
import { ProductStateBlock } from "@/components/product-state-block";

export default function OpportunityStepLoading() {
  return (
    <ProductShell
      workspaceName={null}
      pageTitle="Loading workspace"
      pageDescription="Restoring the selected opportunity step."
      eyebrow="Opportunity workspace"
    >
      <ProductStateBlock
        state="loading"
        title="Loading workspace"
        body="Fetching the opportunity context and current workspace state."
      />
    </ProductShell>
  );
}
