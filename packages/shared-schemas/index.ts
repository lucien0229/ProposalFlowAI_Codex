import type {
  ActivityLog,
  AppEnvironment,
  OpportunityCurrentStep,
  OpportunityFileProcessingJobStatus,
  OpportunityFileStatus,
  OpportunityGenerationGateReason,
  OpportunityInputType,
  OpportunitySortField,
  OpportunityStatus,
  OpportunityStepReadiness,
  OpportunityWorkflowState,
  ProductState,
  RouteNamespace,
  SessionType,
  SortDirection,
  WorkspaceIndustryType,
  WorkspaceRole,
  WorkspaceTemplateKey,
  WorkspaceTonePreference,
} from "@proposalflow/shared-types";
import {
  APP_ENVIRONMENTS,
  OPPORTUNITY_CURRENT_STEPS,
  OPPORTUNITY_FILE_PROCESSING_JOB_STATUSES,
  OPPORTUNITY_FILE_STATUSES,
  OPPORTUNITY_GENERATION_GATE_REASONS,
  OPPORTUNITY_INPUT_TYPES,
  OPPORTUNITY_SORT_FIELDS,
  OPPORTUNITY_STATUSES,
  OPPORTUNITY_STEP_READINESS_STATES,
  OPPORTUNITY_WORKFLOW_STATES,
  PRODUCT_STATES,
  ROUTE_NAMESPACES,
  SESSION_TYPES,
  SORT_DIRECTIONS,
  WORKSPACE_INDUSTRY_TYPES,
  WORKSPACE_ROLES,
  WORKSPACE_TEMPLATE_KEYS,
  WORKSPACE_TONE_PREFERENCES,
} from "@proposalflow/shared-types";

type EnumSchema<T extends string> = {
  readonly title: string;
  readonly type: "string";
  readonly enum: readonly T[];
};

const nullableStringSchema = { type: ["string", "null"] } as const;

const enumSchema = <T extends string>(
  title: string,
  values: readonly T[],
): EnumSchema<T> => ({
  title,
  type: "string",
  enum: values,
});

const strictObjectSchema = <
  TRequired extends readonly string[],
  TProperties extends Record<string, unknown>,
>(
  title: string,
  required: TRequired,
  properties: TProperties,
) => ({
  title,
  type: "object",
  additionalProperties: false,
  required,
  properties,
});

export const appEnvironmentSchema = enumSchema<AppEnvironment>("AppEnvironment", APP_ENVIRONMENTS);
export const sessionTypeSchema = enumSchema<SessionType>("SessionType", SESSION_TYPES);
export const workspaceRoleSchema = enumSchema<WorkspaceRole>("WorkspaceRole", WORKSPACE_ROLES);
export const workspaceIndustryTypeSchema = enumSchema<WorkspaceIndustryType>(
  "WorkspaceIndustryType",
  WORKSPACE_INDUSTRY_TYPES,
);
export const workspaceTemplateKeySchema = enumSchema<WorkspaceTemplateKey>(
  "WorkspaceTemplateKey",
  WORKSPACE_TEMPLATE_KEYS,
);
export const workspaceTonePreferenceSchema = enumSchema<WorkspaceTonePreference>(
  "WorkspaceTonePreference",
  WORKSPACE_TONE_PREFERENCES,
);
export const routeNamespaceSchema = enumSchema<RouteNamespace>(
  "RouteNamespace",
  ROUTE_NAMESPACES,
);
export const productStateSchema = enumSchema<ProductState>("ProductState", PRODUCT_STATES);
export const sortDirectionSchema = enumSchema<SortDirection>("SortDirection", SORT_DIRECTIONS);
export const opportunityStatusSchema = enumSchema<OpportunityStatus>(
  "OpportunityStatus",
  OPPORTUNITY_STATUSES,
);
export const opportunityCurrentStepSchema = enumSchema<OpportunityCurrentStep>(
  "OpportunityCurrentStep",
  OPPORTUNITY_CURRENT_STEPS,
);
export const opportunityWorkflowStateSchema = enumSchema<OpportunityWorkflowState>(
  "OpportunityWorkflowState",
  OPPORTUNITY_WORKFLOW_STATES,
);
export const opportunityStepReadinessSchema = enumSchema<OpportunityStepReadiness>(
  "OpportunityStepReadiness",
  OPPORTUNITY_STEP_READINESS_STATES,
);
export const opportunityInputTypeSchema = enumSchema<OpportunityInputType>(
  "OpportunityInputType",
  OPPORTUNITY_INPUT_TYPES,
);
export const opportunityFileStatusSchema = enumSchema<OpportunityFileStatus>(
  "OpportunityFileStatus",
  OPPORTUNITY_FILE_STATUSES,
);
export const opportunityFileProcessingJobStatusSchema =
  enumSchema<OpportunityFileProcessingJobStatus>(
    "OpportunityFileProcessingJobStatus",
    OPPORTUNITY_FILE_PROCESSING_JOB_STATUSES,
  );
export const opportunityGenerationGateReasonSchema =
  enumSchema<OpportunityGenerationGateReason>(
    "OpportunityGenerationGateReason",
    OPPORTUNITY_GENERATION_GATE_REASONS,
  );
export const opportunitySortFieldSchema = enumSchema<OpportunitySortField>(
  "OpportunitySortField",
  OPPORTUNITY_SORT_FIELDS,
);

export const activityLogSchema = strictObjectSchema(
  "ActivityLog",
  [
    "workspace_id",
    "user_id",
    "opportunity_id",
    "entity_type",
    "entity_id",
    "action_type",
    "metadata",
    "created_at",
  ] as const,
  {
    workspace_id: { type: "string" },
    user_id: nullableStringSchema,
    opportunity_id: nullableStringSchema,
    entity_type: { type: "string" },
    entity_id: { type: "string" },
    action_type: { type: "string" },
    metadata: { type: "object" },
    created_at: { type: "string" },
  },
) as const satisfies {
  readonly title: "ActivityLog";
  readonly type: "object";
  readonly additionalProperties: false;
  readonly required: readonly (keyof ActivityLog)[];
  readonly properties: Record<string, unknown>;
};

export const opportunityGenerationGateSchema = strictObjectSchema(
  "OpportunityGenerationGate",
  ["can_generate", "reasons", "primary_reason", "message", "source_ready"] as const,
  {
    can_generate: { type: "boolean" },
    reasons: {
      type: "array",
      items: opportunityGenerationGateReasonSchema,
    },
    primary_reason: {
      anyOf: [opportunityGenerationGateReasonSchema, { type: "null" }],
    },
    message: { type: "string" },
    source_ready: {
      type: "string",
      enum: ["manual", "file", "both", "none"] as const,
    },
  },
);

export const opportunityInputSchema = strictObjectSchema(
  "OpportunityInput",
  ["id", "opportunity_id", "input_type", "content", "source_label", "created_at", "updated_at"] as const,
  {
    id: { type: "string" },
    opportunity_id: { type: "string" },
    input_type: opportunityInputTypeSchema,
    content: { type: "string" },
    source_label: nullableStringSchema,
    created_at: { type: "string" },
    updated_at: { type: "string" },
  },
);

export const createOpportunityInputSchema = strictObjectSchema(
  "CreateOpportunityInputRequest",
  ["input_type", "content"] as const,
  {
    input_type: opportunityInputTypeSchema,
    content: { type: "string", minLength: 1 },
    source_label: nullableStringSchema,
  },
);

export const updateOpportunityInputSchema = strictObjectSchema(
  "UpdateOpportunityInputRequest",
  [] as const,
  {
    content: { type: "string", minLength: 1 },
    source_label: nullableStringSchema,
  },
);

export const opportunityFileProcessingJobSchema = strictObjectSchema(
  "OpportunityFileProcessingJob",
  [
    "id",
    "file_asset_id",
    "status",
    "attempt_number",
    "error_message",
    "queued_at",
    "started_at",
    "completed_at",
  ] as const,
  {
    id: { type: "string" },
    file_asset_id: { type: "string" },
    status: opportunityFileProcessingJobStatusSchema,
    attempt_number: { type: "integer", minimum: 1 },
    error_message: nullableStringSchema,
    queued_at: nullableStringSchema,
    started_at: nullableStringSchema,
    completed_at: nullableStringSchema,
  },
);

export const opportunityFileAssetSchema = strictObjectSchema(
  "OpportunityFileAsset",
  [
    "id",
    "opportunity_id",
    "file_name",
    "mime_type",
    "storage_key",
    "file_status",
    "latest_job_status",
    "uploaded_at",
    "extracted_text",
    "latest_job",
    "created_at",
    "updated_at",
  ] as const,
  {
    id: { type: "string" },
    opportunity_id: { type: "string" },
    file_name: { type: "string" },
    mime_type: { type: "string" },
    storage_key: { type: "string" },
    file_status: opportunityFileStatusSchema,
    latest_job_status: {
      anyOf: [opportunityFileProcessingJobStatusSchema, { type: "null" }],
    },
    uploaded_at: nullableStringSchema,
    extracted_text: nullableStringSchema,
    latest_job: {
      anyOf: [opportunityFileProcessingJobSchema, { type: "null" }],
    },
    created_at: { type: "string" },
    updated_at: { type: "string" },
  },
);

export const opportunitySummarySchema = strictObjectSchema(
  "OpportunitySummary",
  [
    "id",
    "workspace_id",
    "owner_user_id",
    "owner_name",
    "title",
    "company_name",
    "contact_name",
    "contact_email",
    "requested_service",
    "source_type",
    "status",
    "current_step",
    "current_step_url",
    "workflow_state",
    "needs_attention_reason",
    "restriction_reason",
    "archived_at",
    "created_at",
    "updated_at",
    "step_readiness",
  ] as const,
  {
    id: { type: "string" },
    workspace_id: { type: "string" },
    owner_user_id: nullableStringSchema,
    owner_name: nullableStringSchema,
    title: { type: "string" },
    company_name: { type: "string" },
    contact_name: nullableStringSchema,
    contact_email: nullableStringSchema,
    requested_service: nullableStringSchema,
    source_type: nullableStringSchema,
    status: opportunityStatusSchema,
    current_step: opportunityCurrentStepSchema,
    current_step_url: { type: "string" },
    workflow_state: opportunityWorkflowStateSchema,
    needs_attention_reason: {
      anyOf: [
        {
          type: "string",
          enum: [
            "missing_input",
            "file_failed",
            "generation_failed",
            "billing_restricted",
            "review_required",
          ] as const,
        },
        { type: "null" },
      ],
    },
    restriction_reason: nullableStringSchema,
    archived_at: nullableStringSchema,
    created_at: { type: "string" },
    updated_at: { type: "string" },
    step_readiness: opportunityStepReadinessSchema,
  },
);

export const updateOpportunityOverviewSchema = strictObjectSchema(
  "UpdateOpportunityOverviewRequest",
  [] as const,
  {
    title: { type: "string", minLength: 1 },
    company_name: { type: "string", minLength: 1 },
    contact_name: nullableStringSchema,
    contact_email: nullableStringSchema,
    requested_service: nullableStringSchema,
    source_type: {
      type: "string",
      enum: ["manual", "email_thread", "pdf_upload"] as const,
    },
  },
);

export const opportunityOverviewResponseSchema = strictObjectSchema(
  "OpportunityOverviewResponse",
  ["opportunity", "inputs", "latest_file"] as const,
  {
    opportunity: {
      allOf: [
        opportunitySummarySchema,
        strictObjectSchema(
          "OpportunityOverviewSupplement",
          ["generation_gate"] as const,
          {
            generation_gate: opportunityGenerationGateSchema,
          },
        ),
      ],
    },
    inputs: {
      type: "array",
      items: opportunityInputSchema,
    },
    latest_file: {
      anyOf: [opportunityFileAssetSchema, { type: "null" }],
    },
  },
);

export const opportunityInputsListResponseSchema = strictObjectSchema(
  "OpportunityInputsListResponse",
  ["items"] as const,
  {
    items: {
      type: "array",
      items: opportunityInputSchema,
    },
  },
);

export const opportunityFileDetailSchema = strictObjectSchema(
  "OpportunityFileDetailResponse",
  ["file"] as const,
  {
    file: opportunityFileAssetSchema,
  },
);

export const leadBriefGenerateResponseSchema = strictObjectSchema(
  "LeadBriefGenerateResponse",
  ["opportunity_id", "redirect_to", "generation_started_at", "gate"] as const,
  {
    opportunity_id: { type: "string" },
    redirect_to: { type: "string" },
    generation_started_at: { type: "string" },
    gate: opportunityGenerationGateSchema,
  },
);
