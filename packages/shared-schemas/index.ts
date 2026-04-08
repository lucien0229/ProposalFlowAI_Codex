import type {
  ActivityLog,
  AppEnvironment,
  ProductState,
  RouteNamespace,
  SessionType,
  WorkspaceRole,
} from "@proposalflow/shared-types";
import {
  APP_ENVIRONMENTS,
  PRODUCT_STATES,
  ROUTE_NAMESPACES,
  SESSION_TYPES,
  WORKSPACE_ROLES,
} from "@proposalflow/shared-types";

type EnumSchema<T extends string> = {
  readonly title: string;
  readonly type: "string";
  readonly enum: readonly T[];
};

const enumSchema = <T extends string>(
  title: string,
  values: readonly T[],
): EnumSchema<T> => ({
  title,
  type: "string",
  enum: values,
});

export const appEnvironmentSchema = enumSchema<AppEnvironment>("AppEnvironment", APP_ENVIRONMENTS);
export const sessionTypeSchema = enumSchema<SessionType>("SessionType", SESSION_TYPES);
export const workspaceRoleSchema = enumSchema<WorkspaceRole>("WorkspaceRole", WORKSPACE_ROLES);
export const routeNamespaceSchema = enumSchema<RouteNamespace>(
  "RouteNamespace",
  ROUTE_NAMESPACES,
);
export const productStateSchema = enumSchema<ProductState>("ProductState", PRODUCT_STATES);

export const activityLogSchema = {
  title: "ActivityLog",
  type: "object",
  additionalProperties: false,
  required: [
    "workspace_id",
    "user_id",
    "opportunity_id",
    "entity_type",
    "entity_id",
    "action_type",
    "metadata",
    "created_at",
  ],
  properties: {
    workspace_id: { type: "string" },
    user_id: { type: ["string", "null"] },
    opportunity_id: { type: ["string", "null"] },
    entity_type: { type: "string" },
    entity_id: { type: "string" },
    action_type: { type: "string" },
    metadata: { type: "object" },
    created_at: { type: "string" },
  },
} as const satisfies {
  readonly title: "ActivityLog";
  readonly type: "object";
  readonly additionalProperties: false;
  readonly required: readonly (keyof ActivityLog)[];
  readonly properties: Record<string, unknown>;
};
