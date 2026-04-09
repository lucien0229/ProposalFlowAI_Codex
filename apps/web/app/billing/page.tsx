import { BUSINESS_ROUTE_PATHS } from "@proposalflow/shared-config";

import { ProductPlaceholderPage } from "@/components/product-placeholder-page";
import { requireBusinessContext } from "@/lib/server-business-context";

export default async function BillingRoute() {
  const { bootstrap } = await requireBusinessContext("/billing");

  return (
    <ProductPlaceholderPage
      workspaceName={bootstrap.workspace?.name ?? null}
      title="Billing"
      description="Workspace billing status stays reachable from the same product shell as dashboard and opportunities."
      state="success"
      body="Billing detail screens are outside this phase, but the route exists so restriction messaging and navigation have a stable destination."
      primaryAction={{ label: "Back to dashboard", href: BUSINESS_ROUTE_PATHS.dashboard }}
      secondaryAction={{ label: "Open opportunities", href: BUSINESS_ROUTE_PATHS.opportunities }}
    />
  );
}
