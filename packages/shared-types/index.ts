export type SessionType = "web" | "admin";
export type WorkspaceRole = "owner" | "member";
export type InternalRole = "internal_admin" | "internal_analyst";
export type AppEnvironment = "local" | "staging" | "production";
export type RouteNamespace = "product" | "admin" | "shared";
export type ProductState =
  | "loading"
  | "empty"
  | "error"
  | "blocked"
  | "retry"
  | "success";

export const SESSION_TYPES = ["web", "admin"] as const satisfies readonly SessionType[];
export const WORKSPACE_ROLES = ["owner", "member"] as const satisfies readonly WorkspaceRole[];
export const INTERNAL_ROLES = [
  "internal_admin",
  "internal_analyst",
] as const satisfies readonly InternalRole[];
export const APP_ENVIRONMENTS = [
  "local",
  "staging",
  "production",
] as const satisfies readonly AppEnvironment[];
export const ROUTE_NAMESPACES = [
  "product",
  "admin",
  "shared",
] as const satisfies readonly RouteNamespace[];
export const PRODUCT_STATES = [
  "loading",
  "empty",
  "error",
  "blocked",
  "retry",
  "success",
] as const satisfies readonly ProductState[];

export type ActivityLogMetadata = Record<string, string | number | boolean | null>;

export type ActivityLog = {
  workspace_id: string;
  user_id: string | null;
  opportunity_id: string | null;
  entity_type: string;
  entity_id: string;
  action_type: string;
  metadata: ActivityLogMetadata;
  created_at: string;
};
