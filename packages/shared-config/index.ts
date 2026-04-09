import type {
  AppEnvironment,
  RouteNamespace,
  WorkspaceIndustryType,
  WorkspaceTemplateKey,
  WorkspaceTonePreference,
} from "@proposalflow/shared-types";
import {
  APP_ENVIRONMENTS,
  ROUTE_NAMESPACES,
  WORKSPACE_INDUSTRY_TYPES,
  WORKSPACE_TEMPLATE_KEYS,
  WORKSPACE_TONE_PREFERENCES,
} from "@proposalflow/shared-types";

export const APP_ENVIRONMENT_LABELS: Record<AppEnvironment, string> = {
  local: "Local",
  staging: "Staging",
  production: "Production",
};

export const APP_ENVIRONMENT_VALUES = APP_ENVIRONMENTS;

export const WEB_ROUTE_PREFIX = "/";
export const ADMIN_ROUTE_PREFIX = "/admin";
export const API_V1_PREFIX = "/api/v1";

export const AUTH_ROUTE_PATHS = {
  signIn: "/auth/sign-in",
  signUp: "/auth/sign-up",
  forgotPassword: "/auth/forgot-password",
  resetPassword: "/auth/reset-password",
  googleStart: "/auth/google/start",
  googleCallback: "/auth/google-callback",
} as const;

export const SETUP_ROUTE_PATHS = {
  workspace: "/setup/workspace",
} as const;

export const BUSINESS_ROUTE_PATHS = {
  dashboard: "/dashboard",
  opportunities: "/opportunities",
} as const;

export const GUARDED_BUSINESS_ROUTE_PREFIXES = [
  BUSINESS_ROUTE_PATHS.dashboard,
  BUSINESS_ROUTE_PATHS.opportunities,
] as const;

export const RETURN_URL_QUERY_PARAM = "return_url";

export const API_ROUTE_PATHS = {
  auth: `${API_V1_PREFIX}/auth`,
  authMe: `${API_V1_PREFIX}/auth/me`,
  workspaces: `${API_V1_PREFIX}/workspaces`,
} as const;

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

export const WORKSPACE_SETUP_DEFAULTS_BY_INDUSTRY = {
  web_development_agency: {
    default_template_key: "development_agency",
    default_tone_preference: "direct",
  },
  product_ux_agency: {
    default_template_key: "product_ux_agency",
    default_tone_preference: "consultative",
  },
} as const satisfies Record<
  WorkspaceIndustryType,
  {
    default_template_key: WorkspaceTemplateKey;
    default_tone_preference: WorkspaceTonePreference;
  }
>;

export const WORKSPACE_SETUP_DEFAULT_TONE_PREFERENCE: WorkspaceTonePreference = "balanced";

export const WORKSPACE_INDUSTRY_VALUES = WORKSPACE_INDUSTRY_TYPES;
export const WORKSPACE_TEMPLATE_VALUES = WORKSPACE_TEMPLATE_KEYS;
export const WORKSPACE_TONE_PREFERENCE_VALUES = WORKSPACE_TONE_PREFERENCES;

export const DEFAULT_PAGE_SIZE = 20;

export const ROUTE_NAMESPACE_VALUES = ROUTE_NAMESPACES;
