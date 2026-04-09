import { BUSINESS_ROUTE_PATHS } from "@proposalflow/shared-config";

import { ProductPlaceholderPage } from "@/components/product-placeholder-page";
import { requireBusinessContext } from "@/lib/server-business-context";

export default async function SettingsRoute() {
  const { bootstrap } = await requireBusinessContext("/settings");

  return (
    <ProductPlaceholderPage
      workspaceName={bootstrap.workspace?.name ?? null}
      title="Settings"
      description="The product shell keeps workspace settings on the same left-rail navigation model as the main operating surfaces."
      state="blocked"
      body="Settings detail is intentionally deferred, but the route is live so the shell remains product-grade instead of linking to dead ends."
      primaryAction={{ label: "Back to dashboard", href: BUSINESS_ROUTE_PATHS.dashboard }}
      secondaryAction={{ label: "Open opportunities", href: BUSINESS_ROUTE_PATHS.opportunities }}
    />
  );
}
