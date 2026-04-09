import { OpportunitiesPage } from "@/components/opportunities/opportunities-page";
import {
  fetchOpportunities,
  parseOpportunityListQuery,
} from "@/lib/opportunities-api";
import { requireBusinessContext } from "@/lib/server-business-context";

type SearchParams = Record<string, string | string[] | undefined>;

export default async function OpportunitiesRoute({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const { bootstrap, cookieHeader } = await requireBusinessContext("/opportunities");
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const initialQuery = parseOpportunityListQuery(resolvedSearchParams);

  let initialData = null;
  let initialError: string | null = null;

  try {
    initialData = await fetchOpportunities(initialQuery, { cookieHeader });
  } catch (caughtError) {
    initialError =
      caughtError instanceof Error
        ? caughtError.message
        : "We couldn't load this opportunity view.";
  }

  return (
    <OpportunitiesPage
      workspaceName={bootstrap.workspace?.name ?? null}
      workspace={bootstrap.workspace}
      initialData={initialData}
      initialError={initialError}
      initialQuery={initialQuery}
    />
  );
}
