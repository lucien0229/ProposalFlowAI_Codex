import type { ProductState } from "@proposalflow/shared-types";
import { PRODUCT_STATES } from "@proposalflow/shared-types";

import { AppShell } from "../components/app-shell";
import { StatusPanel } from "../components/status-panel";

export default function Page() {
  const state: ProductState = PRODUCT_STATES.includes("success") ? "success" : PRODUCT_STATES[0];

  return (
    <AppShell state={state}>
      <StatusPanel state={state} />
    </AppShell>
  );
}
