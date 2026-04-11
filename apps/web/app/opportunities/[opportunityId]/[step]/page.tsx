import { ProductShell } from "@/components/product-shell";
import { OpportunityIntakeSurface } from "@/components/opportunities/opportunity-intake-surface";
import { LeadBriefWorkspace } from "@/components/opportunities/lead-brief-workspace";
import { fetchOpportunityIntakeDetail } from "@/lib/opportunities-api";
import { ProductApiError } from "@/lib/product-api";
import { requireBusinessContext } from "@/lib/server-business-context";
import { OPPORTUNITY_STEP_ROUTE_SEGMENTS } from "@proposalflow/shared-config";
import { ProductStateBlock } from "@/components/product-state-block";

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

  if (resolvedParams.step === OPPORTUNITY_STEP_ROUTE_SEGMENTS.lead_brief) {
    try {
      const detail = await fetchOpportunityIntakeDetail(resolvedParams.opportunityId, {
        cookieHeader,
      });

      return (
        <ProductShell
          workspaceName={bootstrap.workspace?.name ?? null}
          pageTitle="Lead Brief"
          pageDescription="Shape the current opportunity into a brief you can trust, version, and hand off."
          eyebrow="Lead Brief workspace"
        >
          <LeadBriefWorkspace opportunityId={resolvedParams.opportunityId} opportunityDetail={detail} />
        </ProductShell>
      );
    } catch (caughtError) {
      if (caughtError instanceof ProductApiError && caughtError.status === 404) {
        return (
          <ProductShell
            workspaceName={bootstrap.workspace?.name ?? null}
            pageTitle="Lead Brief"
            pageDescription="Shape the current opportunity into a brief you can trust, version, and hand off."
            eyebrow="Lead Brief workspace"
          >
            <ProductStateBlock
              state="error"
              title="Opportunity not found."
              body="Return to Opportunities and reopen the record."
              detail="The requested opportunity record is missing or unavailable."
              primaryAction={{
                label: "Back to opportunities",
                href: "/opportunities",
              }}
            />
          </ProductShell>
        );
      }

      throw caughtError;
    }
  }

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
