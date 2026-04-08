import type { ProductState } from "@proposalflow/shared-types";
import { PRODUCT_STATES } from "@proposalflow/shared-types";

import { AppShell } from "../components/app-shell";
import { StatusPanel } from "../components/status-panel";

type SearchParams = {
  state?: string | string[];
};

function resolveState(searchParams: SearchParams | undefined): ProductState {
  const value = searchParams?.state;
  const state = Array.isArray(value) ? value[0] : value;
  if (state && PRODUCT_STATES.includes(state as ProductState)) {
    return state as ProductState;
  }
  return "success";
}

export default function Page({
  searchParams,
}: {
  searchParams?: SearchParams;
}) {
  const state = resolveState(searchParams);

  return (
    <AppShell state={state}>
      <StatusPanel state={state} />
    </AppShell>
  );
}
