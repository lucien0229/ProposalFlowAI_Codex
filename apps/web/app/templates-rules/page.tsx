import { BUSINESS_ROUTE_PATHS } from "@proposalflow/shared-config";

import { ProductPlaceholderPage } from "@/components/product-placeholder-page";
import { requireBusinessContext } from "@/lib/server-business-context";

export default async function TemplatesRulesRoute() {
  const { bootstrap } = await requireBusinessContext("/templates-rules");

  return (
    <ProductPlaceholderPage
      workspaceName={bootstrap.workspace?.name ?? null}
      title="Templates & Rules"
      description="Workspace defaults and template governance stay visible from the main shell even before deeper editing tools land."
      state="blocked"
      body="Template and rule editing is not part of Phase 3, but the route is reserved inside the real product shell so navigation stays stable."
      primaryAction={{ label: "Back to dashboard", href: BUSINESS_ROUTE_PATHS.dashboard }}
      secondaryAction={{ label: "Open opportunities", href: BUSINESS_ROUTE_PATHS.opportunities }}
    />
  );
}
