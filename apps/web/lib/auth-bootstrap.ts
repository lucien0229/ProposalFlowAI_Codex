import {
  API_ROUTE_PATHS,
  AUTH_ROUTE_PATHS,
  BUSINESS_ROUTE_PATHS,
  RETURN_URL_QUERY_PARAM,
  SETUP_ROUTE_PATHS,
  GUARDED_BUSINESS_ROUTE_PREFIXES,
} from "@proposalflow/shared-config";

export type AuthBootstrapWorkspace = {
  id: string;
  name: string;
  industry_type: string;
  default_template_key: string;
  default_tone_preference: string;
  trial_status?: string;
  billing_status?: string;
  plan_type?: string;
};

export type AuthBootstrapUser = {
  id: string;
  email: string;
  full_name: string;
  primary_auth_provider: string;
  is_active: boolean;
};

export type AuthBootstrapState = {
  user: AuthBootstrapUser;
  workspace: AuthBootstrapWorkspace | null;
  workspace_setup_required: boolean;
  next_url?: string;
  session_type?: "web" | "admin";
};

const runtimeEnv = globalThis as typeof globalThis & {
  process?: {
    env?: Record<string, string | undefined>;
  };
};

const DEFAULT_API_BASE_URL =
  runtimeEnv.process?.env?.NEXT_PUBLIC_API_BASE_URL ??
  runtimeEnv.process?.env?.API_BASE_URL ??
  "http://127.0.0.1:8000";

export function getApiUrl(path: string, baseUrl: string = DEFAULT_API_BASE_URL): string {
  return new URL(path, baseUrl).toString();
}

export function isSafeReturnUrl(value: string | null | undefined): value is string {
  if (!value) {
    return false;
  }
  try {
    const parsed = new URL(value, "http://placeholder.local");
    if (parsed.origin !== "http://placeholder.local") {
      return false;
    }
    return parsed.pathname.startsWith("/") && !parsed.pathname.startsWith("//");
  } catch {
    return false;
  }
}

export function isBusinessReturnUrl(value: string | null | undefined): boolean {
  if (!isSafeReturnUrl(value)) {
    return false;
  }
  return GUARDED_BUSINESS_ROUTE_PREFIXES.some((prefix) => {
    return value === prefix || value.startsWith(`${prefix}/`);
  });
}

export function buildAuthUrl(path: string, returnUrl: string | null | undefined): string {
  const url = new URL(path, "http://placeholder.local");
  if (isSafeReturnUrl(returnUrl)) {
    url.searchParams.set(RETURN_URL_QUERY_PARAM, returnUrl);
  }
  return `${path}${url.search}`;
}

export function buildSignInUrl(returnUrl: string | null | undefined): string {
  return buildAuthUrl(AUTH_ROUTE_PATHS.signIn, returnUrl);
}

export function buildSignUpUrl(returnUrl: string | null | undefined): string {
  return buildAuthUrl(AUTH_ROUTE_PATHS.signUp, returnUrl);
}

export function buildForgotPasswordUrl(returnUrl: string | null | undefined): string {
  return buildAuthUrl(AUTH_ROUTE_PATHS.forgotPassword, returnUrl);
}

export function buildSetupWorkspaceUrl(returnUrl: string | null | undefined): string {
  return buildAuthUrl(SETUP_ROUTE_PATHS.workspace, returnUrl);
}

export function resolvePostAuthTarget(
  bootstrap: AuthBootstrapState | null,
  returnUrl: string | null | undefined,
): string {
  if (!bootstrap) {
    return buildSignInUrl(returnUrl);
  }
  if (bootstrap.workspace_setup_required) {
    return buildSetupWorkspaceUrl(returnUrl);
  }
  if (isBusinessReturnUrl(returnUrl)) {
    return returnUrl ?? BUSINESS_ROUTE_PATHS.dashboard;
  }
  return BUSINESS_ROUTE_PATHS.dashboard;
}

export async function fetchAuthBootstrap(cookieHeader?: string | null): Promise<AuthBootstrapState | null> {
  try {
    const init: RequestInit = {
      method: "GET",
      cache: "no-store",
    };
    if (cookieHeader) {
      init.headers = { cookie: cookieHeader };
    }
    const response = await fetch(getApiUrl(API_ROUTE_PATHS.authMe), init);
    if (response.status === 401) {
      return null;
    }
    if (!response.ok) {
      return null;
    }
    return (await response.json()) as AuthBootstrapState;
  } catch {
    return null;
  }
}

export function readReturnUrl(searchParams: URLSearchParams | Record<string, string | string[] | undefined>): string | null {
  const rawValue =
    searchParams instanceof URLSearchParams
      ? searchParams.get(RETURN_URL_QUERY_PARAM)
      : typeof searchParams[RETURN_URL_QUERY_PARAM] === "string"
        ? searchParams[RETURN_URL_QUERY_PARAM]
        : Array.isArray(searchParams[RETURN_URL_QUERY_PARAM])
          ? searchParams[RETURN_URL_QUERY_PARAM][0] ?? null
          : null;
  const value = rawValue ?? null;
  return isSafeReturnUrl(value) ? value : null;
}
