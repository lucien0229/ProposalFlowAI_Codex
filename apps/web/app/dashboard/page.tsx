import { DashboardPage } from "@/components/dashboard/dashboard-page";
import { fetchDashboardSummary } from "@/lib/dashboard-api";
import { requireBusinessContext } from "@/lib/server-business-context";

export default async function DashboardRoute() {
  const { bootstrap, cookieHeader } = await requireBusinessContext("/dashboard");

  let initialSummary = null;
  let initialError: string | null = null;

  try {
    initialSummary = await fetchDashboardSummary({ cookieHeader });
  } catch (caughtError) {
    initialError =
      caughtError instanceof Error
        ? caughtError.message
        : "We couldn't load this workspace view. Retry now or return to the last working surface.";
  }

  return (
    <DashboardPage
      workspaceName={bootstrap.workspace?.name ?? null}
      initialSummary={initialSummary}
      initialError={initialError}
    />
  );
}
