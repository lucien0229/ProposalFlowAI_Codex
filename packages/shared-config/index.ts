import type {
  AppEnvironment,
  OpportunityCurrentStep,
  OpportunitySortField,
  RouteNamespace,
  SortDirection,
  WorkspaceIndustryType,
  WorkspaceTemplateKey,
  WorkspaceTonePreference,
} from "@proposalflow/shared-types";
import {
  APP_ENVIRONMENTS,
  OPPORTUNITY_CURRENT_STEPS,
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
  templatesRules: "/templates-rules",
  billing: "/billing",
  settings: "/settings",
  opportunityStep: (opportunityId: string, step: OpportunityCurrentStep) =>
    `/opportunities/${opportunityId}/${step}`,
} as const;

export const GUARDED_BUSINESS_ROUTE_PREFIXES = [
  BUSINESS_ROUTE_PATHS.dashboard,
  BUSINESS_ROUTE_PATHS.opportunities,
  BUSINESS_ROUTE_PATHS.templatesRules,
  BUSINESS_ROUTE_PATHS.billing,
  BUSINESS_ROUTE_PATHS.settings,
] as const;

export const RETURN_URL_QUERY_PARAM = "return_url";

export const buildOpportunityDetailApiPath = (opportunityId: string) =>
  `${API_V1_PREFIX}/opportunities/${opportunityId}`;
export const buildOpportunityInputsApiPath = (opportunityId: string) =>
  `${buildOpportunityDetailApiPath(opportunityId)}/inputs`;
export const buildOpportunityInputDetailApiPath = (opportunityId: string, inputId: string) =>
  `${buildOpportunityInputsApiPath(opportunityId)}/${inputId}`;
export const buildOpportunityFileUploadUrlApiPath = (opportunityId: string) =>
  `${buildOpportunityDetailApiPath(opportunityId)}/files/upload-url`;
export const buildOpportunityFileCompleteApiPath = (opportunityId: string, fileAssetId: string) =>
  `${buildOpportunityDetailApiPath(opportunityId)}/files/${fileAssetId}/complete`;
export const buildOpportunityFileDetailApiPath = (opportunityId: string, fileAssetId: string) =>
  `${buildOpportunityDetailApiPath(opportunityId)}/files/${fileAssetId}`;
export const buildOpportunityFileRetryApiPath = (opportunityId: string, fileAssetId: string) =>
  `${buildOpportunityFileDetailApiPath(opportunityId, fileAssetId)}/retry`;
export const buildLeadBriefGenerateApiPath = (opportunityId: string) =>
  `${buildOpportunityDetailApiPath(opportunityId)}/lead-brief/generate`;

export const OPPORTUNITY_API_ROUTE_TEMPLATES = {
  inputs: "/opportunities/${opportunityId}/inputs",
  fileUploadUrl: "/opportunities/${opportunityId}/files/upload-url",
  fileComplete: "/opportunities/${opportunityId}/files/${fileAssetId}/complete",
  fileDetail: "/opportunities/${opportunityId}/files/${fileAssetId}",
  fileRetry: "/opportunities/${opportunityId}/files/${fileAssetId}/retry",
  leadBriefGenerate: "/opportunities/${opportunityId}/lead-brief/generate",
} as const;

export const API_ROUTE_PATHS = {
  auth: `${API_V1_PREFIX}/auth`,
  authMe: `${API_V1_PREFIX}/auth/me`,
  workspaces: `${API_V1_PREFIX}/workspaces`,
  dashboardSummary: `${API_V1_PREFIX}/dashboard/summary`,
  opportunities: `${API_V1_PREFIX}/opportunities`,
  opportunityDetail: buildOpportunityDetailApiPath,
  opportunityInputs: buildOpportunityInputsApiPath,
  opportunityInputDetail: buildOpportunityInputDetailApiPath,
  opportunityFileUploadUrl: buildOpportunityFileUploadUrlApiPath,
  opportunityFileComplete: buildOpportunityFileCompleteApiPath,
  opportunityFileDetail: buildOpportunityFileDetailApiPath,
  opportunityFileRetry: buildOpportunityFileRetryApiPath,
  leadBriefGenerate: buildLeadBriefGenerateApiPath,
} as const;

export const OPPORTUNITY_API_ROUTE_DEFINITIONS = {
  detail: {
    method: "GET",
    path: "GET /api/v1/opportunities/{opportunity_id}",
  },
  update: {
    method: "PATCH",
    path: "PATCH /api/v1/opportunities/{opportunity_id}",
  },
  listInputs: {
    method: "GET",
    path: "GET /api/v1/opportunities/{opportunity_id}/inputs",
  },
  createInput: {
    method: "POST",
    path: "POST /api/v1/opportunities/{opportunity_id}/inputs",
  },
  updateInput: {
    method: "PATCH",
    path: "PATCH /api/v1/opportunities/{opportunity_id}/inputs/{input_id}",
  },
  uploadUrl: {
    method: "POST",
    path: "POST /api/v1/opportunities/{opportunity_id}/files/upload-url",
  },
  completeUpload: {
    method: "POST",
    path: "POST /api/v1/opportunities/{opportunity_id}/files/{file_asset_id}/complete",
  },
  fileDetail: {
    method: "GET",
    path: "GET /api/v1/opportunities/{opportunity_id}/files/{file_asset_id}",
  },
  retryFile: {
    method: "POST",
    path: "POST /api/v1/opportunities/{opportunity_id}/files/{file_asset_id}/retry",
  },
  generateLeadBrief: {
    method: "POST",
    path: "POST /api/v1/opportunities/{opportunity_id}/lead-brief/generate",
  },
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
export const OPPORTUNITY_LIST_DEFAULT_LIMIT = 20;
export const OPPORTUNITY_FILE_POLL_INTERVAL_MS = 2000;

export const OPPORTUNITY_LIST_QUERY_PARAM_NAMES = {
  q: "q",
  status: "status",
  archived: "archived",
  limit: "limit",
  cursor: "cursor",
  orderBy: "order_by",
  orderDirection: "order_direction",
} as const;

export const OPPORTUNITY_SORT_PRESETS = [
  {
    key: "updated_desc",
    label: "Recently updated",
    order_by: "updated_at",
    order_direction: "desc",
  },
  {
    key: "created_desc",
    label: "Newest first",
    order_by: "created_at",
    order_direction: "desc",
  },
  {
    key: "created_asc",
    label: "Oldest first",
    order_by: "created_at",
    order_direction: "asc",
  },
] as const satisfies ReadonlyArray<{
  key: string;
  label: string;
  order_by: OpportunitySortField;
  order_direction: SortDirection;
}>;

export const OPPORTUNITY_STEP_SEQUENCE = OPPORTUNITY_CURRENT_STEPS;
export const ROUTE_NAMESPACE_VALUES = ROUTE_NAMESPACES;
