import type { AppEnvironment, RouteNamespace } from "@proposalflow/shared-types";
import { APP_ENVIRONMENTS, ROUTE_NAMESPACES } from "@proposalflow/shared-types";

export const APP_ENVIRONMENT_LABELS: Record<AppEnvironment, string> = {
  local: "Local",
  staging: "Staging",
  production: "Production",
};

export const APP_ENVIRONMENT_VALUES = APP_ENVIRONMENTS;

export const WEB_ROUTE_PREFIX = "/";
export const ADMIN_ROUTE_PREFIX = "/admin";

export const ROUTE_PREFIXES: Record<RouteNamespace, string> = {
  product: WEB_ROUTE_PREFIX,
  admin: ADMIN_ROUTE_PREFIX,
  shared: "/shared",
};

export const SESSION_COOKIE = {
  web: "pf_web_session",
  admin: "pf_admin_session",
} as const;

export const SHARED_EVENT_NAMES = {
  SESSION_STATE_CHANGED: "session:state-changed",
  ACTIVITY_LOG_CREATED: "activity-log:created",
  CSRF_REQUIRED: "csrf:required",
} as const;

export const DEFAULT_PAGE_SIZE = 20;

export const ROUTE_NAMESPACE_VALUES = ROUTE_NAMESPACES;
