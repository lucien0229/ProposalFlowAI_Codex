import { OpportunityIntakeSurface } from "@/components/opportunities/opportunity-intake-surface";
import { fetchOpportunityIntakeDetail } from "@/lib/opportunities-api";
import { ProductApiError } from "@/lib/product-api";
import { requireBusinessContext } from "@/lib/server-business-context";

type OpportunityStepRouteProps = {
  params: Promise<{
    opportunityId: string;
    step: string;
  }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function readFirstSearchParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function OpportunityStepRoute({
  params,
  searchParams,
}: OpportunityStepRouteProps) {
  const { bootstrap, cookieHeader } = await requireBusinessContext("/opportunities");
  const resolvedParams = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const routeState = readFirstSearchParam(resolvedSearchParams?.state);
  const view = readFirstSearchParam(resolvedSearchParams?.view);

  if (routeState === "loading" || routeState === "empty" || routeState === "error" || routeState === "blocked" || routeState === "retry" || routeState === "success" || view === "not-found") {
    return (
      <OpportunityIntakeSurface
        workspaceName={bootstrap.workspace?.name ?? null}
        initialDetail={null}
        initialError={null}
        routeState={view === "not-found" ? "not-found" : (routeState as "loading" | "empty" | "error" | "blocked" | "retry" | "success")}
      />
    );
  }

  let initialDetail = null;
  let initialError: string | null = null;

  try {
    initialDetail = await fetchOpportunityIntakeDetail(resolvedParams.opportunityId, {
      cookieHeader,
    });
  } catch (caughtError) {
    if (caughtError instanceof ProductApiError && caughtError.status === 404) {
      return (
        <OpportunityIntakeSurface
          workspaceName={bootstrap.workspace?.name ?? null}
          initialDetail={null}
          initialError={null}
          routeState="not-found"
        />
      );
    }
    initialError = caughtError instanceof Error ? caughtError.message : "We couldn't load this opportunity overview.";
  }

  return (
    <OpportunityIntakeSurface
      workspaceName={bootstrap.workspace?.name ?? null}
      initialDetail={initialDetail}
      initialError={initialError}
      routeState={null}
    />
  );
}
