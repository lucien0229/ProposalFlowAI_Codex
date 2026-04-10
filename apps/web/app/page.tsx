import { redirect } from "next/navigation";

import { BUSINESS_ROUTE_PATHS } from "@proposalflow/shared-config";

export default function Page() {
  redirect(BUSINESS_ROUTE_PATHS.dashboard);
}
