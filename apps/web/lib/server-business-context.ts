import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { BUSINESS_ROUTE_PATHS } from "@proposalflow/shared-config";
import { fetchAuthBootstrap, resolvePostAuthTarget } from "@/lib/auth-bootstrap";

export async function getServerCookieHeader() {
  const cookieStore = await cookies();
  return cookieStore
    .getAll()
    .map((cookie) => `${cookie.name}=${cookie.value}`)
    .join("; ");
}

export async function requireBusinessContext(returnUrl?: string | null) {
  const cookieHeader = await getServerCookieHeader();
  const bootstrap = await fetchAuthBootstrap(cookieHeader);

  if (!bootstrap) {
    redirect(resolvePostAuthTarget(null, returnUrl ?? BUSINESS_ROUTE_PATHS.dashboard));
  }

  if (bootstrap.workspace_setup_required) {
    redirect(resolvePostAuthTarget(bootstrap, returnUrl));
  }

  return {
    bootstrap,
    cookieHeader,
  };
}
