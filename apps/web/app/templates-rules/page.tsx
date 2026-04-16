import { ProductShell } from "@/components/product-shell";
import { TemplatesRulesPage } from "@/components/templates-rules/templates-rules-page";
import { requireBusinessContext } from "@/lib/server-business-context";

type TemplatesRulesRouteProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function readFirstSearchParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function TemplatesRulesRoute({
  searchParams,
}: TemplatesRulesRouteProps) {
  const { bootstrap } = await requireBusinessContext("/templates-rules");
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const returnTo = readFirstSearchParam(resolvedSearchParams?.returnTo) ?? null;

  return (
    <ProductShell
      workspaceName={bootstrap.workspace?.name ?? null}
      pageTitle="Templates & Rules"
      pageDescription="Adjust the workspace baseline that Proposal Draft uses before opportunity-level overrides take over."
      eyebrow="Workspace defaults"
    >
      <TemplatesRulesPage returnTo={returnTo} />
    </ProductShell>
  );
}
