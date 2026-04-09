import { redirect } from "next/navigation";
import { cookies } from "next/headers";

import { BUSINESS_ROUTE_PATHS } from "@proposalflow/shared-config";
import { fetchAuthBootstrap, resolvePostAuthTarget } from "@/lib/auth-bootstrap";

type SearchParams = {
  return_url?: string | string[];
};

export default async function DashboardPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.getAll().map((cookie) => `${cookie.name}=${cookie.value}`).join("; ");
  const bootstrap = await fetchAuthBootstrap(cookieHeader);
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const returnUrl = Array.isArray(resolvedSearchParams?.return_url)
    ? resolvedSearchParams?.return_url[0] ?? null
    : resolvedSearchParams?.return_url ?? null;

  if (!bootstrap) {
    redirect(resolvePostAuthTarget(null, returnUrl ?? BUSINESS_ROUTE_PATHS.dashboard));
  }
  if (bootstrap.workspace_setup_required) {
    redirect(resolvePostAuthTarget(bootstrap, returnUrl));
  }

  const workspace = bootstrap.workspace;

  return (
    <main className="dashboard-shell">
      <section className="dashboard-shell__hero">
        <div className="dashboard-shell__intro">
          <span className="dashboard-shell__kicker">Workspace home</span>
          <h1 className="dashboard-shell__title">
            {workspace ? `${workspace.name} is ready.` : "Your workspace is ready."}
          </h1>
          <p className="dashboard-shell__description">
            Authentication, setup, and return intent are complete. This landing surface confirms
            the handoff before phase 3 replaces it with the real opportunity workspace.
          </p>
          <div className="dashboard-shell__chips" aria-label="Workspace status chips">
            <span>Authenticated</span>
            <span>Workspace saved</span>
            <span>Setup finished</span>
          </div>
        </div>

        <div className="dashboard-shell__status">
          <div>
            <strong>Workspace</strong>
            <p>{workspace?.name ?? "Active"}</p>
          </div>
          <div>
            <strong>Industry</strong>
            <p>{workspace?.industry_type?.replaceAll("_", " ") ?? "Ready"}</p>
          </div>
          <div>
            <strong>Template</strong>
            <p>{workspace?.default_template_key?.replaceAll("_", " ") ?? "Ready"}</p>
          </div>
          <div>
            <strong>Tone</strong>
            <p>{workspace?.default_tone_preference ?? "balanced"}</p>
          </div>
        </div>
      </section>

      <section className="dashboard-shell__grid">
        <div className="dashboard-shell__panel">
          <h2>Next action</h2>
          <p>
            Start an opportunity, continue a draft, or move to templates and rules once those
            surfaces ship.
          </p>
          <div className="dashboard-shell__actions">
            <span className="dashboard-shell__primary dashboard-shell__primary--disabled" aria-disabled="true">
              Start opportunity
            </span>
            <span className="dashboard-shell__secondary dashboard-shell__secondary--disabled" aria-disabled="true">
              Review templates
            </span>
          </div>
        </div>

        <div className="dashboard-shell__panel">
          <h2>What this proves</h2>
          <p>
            The current page is intentionally light. Its job is to show that the auth handoff,
            workspace persistence, and guarded routing all work together.
          </p>
          <div className="dashboard-shell__footnote">
            The next phase can replace this shell with live work queues, templates, and rules.
          </div>
        </div>
      </section>
    </main>
  );
}
