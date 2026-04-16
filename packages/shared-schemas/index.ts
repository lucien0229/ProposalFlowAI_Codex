import type {
  ActivityLog,
  AppEnvironment,
  DiscoveryConflictResponse,
  DiscoveryCurrentResource,
  DiscoveryCurrentResourceResponse,
  DiscoveryFieldKey,
  DiscoveryFieldState,
  DiscoveryFieldValue,
  DiscoveryFields,
  DiscoveryGenerateResponse,
  DiscoveryRestoreRequest,
  DiscoverySaveCurrentRequest,
  DiscoverySaveVersionRequest,
  DiscoverySourceNote,
  DiscoverySourceNotesRequest,
  DiscoveryVersion,
  DiscoveryVersionDetailResponse,
  DiscoveryVersionListResponse,
  EffectiveRuleSummary,
  LeadBriefFieldKey,
  LeadBriefFieldState,
  LeadBriefFields,
  LeadBriefConflictResponse,
  LeadBriefCurrentResource,
  LeadBriefCurrentResourceResponse,
  LeadBriefFieldValue,
  LeadBriefRestoreRequest,
  LeadBriefSaveCurrentRequest,
  LeadBriefSaveVersionRequest,
  LeadBriefVersion,
  LeadBriefVersionDetailResponse,
  LeadBriefVersionListResponse,
  OpportunityCurrentStep,
  OpportunityFileProcessingJobStatus,
  OpportunityFileStatus,
  OpportunityGenerationGateReason,
  OpportunityInputType,
  OpportunityRuleOverride,
  OpportunityRuleOverrideResponse,
  OpportunitySortField,
  OpportunityStatus,
  OpportunityStepReadiness,
  OpportunityWorkflowState,
  ProposalDraftConflictResponse,
  ProposalDraftCurrentResource,
  ProposalDraftCurrentResourceResponse,
  ProposalDraftExportFormat,
  ProposalDraftGenerateRequest,
  ProposalDraftGenerateResponse,
  ProposalDraftSaveCurrentRequest,
  ProposalDraftSaveVersionRequest,
  ProposalDraftSection,
  ProposalDraftSectionConfidence,
  ProposalDraftSectionKey,
  ProposalDraftSectionRegenerateRequest,
  ProposalDraftSections,
  ProposalDraftVersion,
  ProposalDraftVersionDetail,
  ProposalDraftVersionDetailResponse,
  ProposalDraftVersionListResponse,
  ProposalDraftVersionOrigin,
  ProposalDraftWarning,
  ProductState,
  RouteNamespace,
  SessionType,
  SortDirection,
  TemplateDefinition,
  WorkspaceIndustryType,
  WorkspaceRole,
  WorkspaceRuleSet,
  WorkspaceRuleSetResponse,
  WorkspaceRuleSetUpdateRequest,
  WorkspaceRuleValidationIssue,
  WorkspaceRuleValidationResponse,
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
  PROPOSAL_DRAFT_EXPORT_FORMATS,
  PROPOSAL_DRAFT_SECTION_CONFIDENCE_LEVELS,
  PROPOSAL_DRAFT_SECTION_KEYS,
  PROPOSAL_DRAFT_VERSION_ORIGINS,
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
  const TTitle extends string,
  TRequired extends readonly string[],
  TProperties extends Record<string, unknown>,
>(
  title: TTitle,
  required: TRequired,
  properties: TProperties,
): {
  readonly title: TTitle;
  readonly type: "object";
  readonly additionalProperties: false;
  readonly required: TRequired;
  readonly properties: TProperties;
} => ({
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
) satisfies {
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

export const leadBriefFieldStateSchema = enumSchema<LeadBriefFieldState>("LeadBriefFieldState", [
  "confirmed",
  "inferred",
  "missing",
  "needs_review",
]);

export const leadBriefFieldKeySchema = enumSchema<LeadBriefFieldKey>("LeadBriefFieldKey", [
  "client_company",
  "contact",
  "requested_service",
  "business_context",
  "urgency_timeline",
  "budget_signal",
  "fit_assessment",
  "missing_information",
  "recommended_next_step",
]);

export const leadBriefFieldValueSchema = strictObjectSchema(
  "LeadBriefFieldValue",
  ["value", "state", "source_excerpt"] as const,
  {
    value: nullableStringSchema,
    state: leadBriefFieldStateSchema,
    source_excerpt: nullableStringSchema,
  },
) satisfies {
  readonly title: "LeadBriefFieldValue";
  readonly type: "object";
  readonly additionalProperties: false;
  readonly required: readonly (keyof LeadBriefFieldValue)[];
  readonly properties: Record<string, unknown>;
};

export const leadBriefFieldsSchema = strictObjectSchema(
  "LeadBriefFields",
  [
    "client_company",
    "contact",
    "requested_service",
    "business_context",
    "urgency_timeline",
    "budget_signal",
    "fit_assessment",
    "missing_information",
    "recommended_next_step",
  ] as const,
  {
    client_company: leadBriefFieldValueSchema,
    contact: leadBriefFieldValueSchema,
    requested_service: leadBriefFieldValueSchema,
    business_context: leadBriefFieldValueSchema,
    urgency_timeline: leadBriefFieldValueSchema,
    budget_signal: leadBriefFieldValueSchema,
    fit_assessment: leadBriefFieldValueSchema,
    missing_information: leadBriefFieldValueSchema,
    recommended_next_step: leadBriefFieldValueSchema,
  },
) satisfies {
  readonly title: "LeadBriefFields";
  readonly type: "object";
  readonly additionalProperties: false;
  readonly required: readonly (keyof LeadBriefFields)[];
  readonly properties: Record<string, unknown>;
};

export const leadBriefCurrentResourceSchema = strictObjectSchema(
  "LeadBriefCurrentResource",
  ["id", "opportunity_id", "workspace_id", "current_revision_no", "fields", "created_at", "updated_at"] as const,
  {
    id: { type: "string" },
    opportunity_id: { type: "string" },
    workspace_id: { type: "string" },
    current_revision_no: { type: "integer", minimum: 0 },
    fields: leadBriefFieldsSchema,
    created_at: { type: "string" },
    updated_at: { type: "string" },
  },
) satisfies {
  readonly title: "LeadBriefCurrentResource";
  readonly type: "object";
  readonly additionalProperties: false;
  readonly required: readonly (keyof LeadBriefCurrentResource)[];
  readonly properties: Record<string, unknown>;
};

export const leadBriefVersionSchema = strictObjectSchema(
  "LeadBriefVersion",
  [
    "id",
    "opportunity_id",
    "workspace_id",
    "current_revision_no",
    "fields",
    "created_at",
    "updated_at",
    "version_no",
    "saved_at",
    "saved_by_user_id",
    "saved_by_name",
  ] as const,
  {
    id: { type: "string" },
    opportunity_id: { type: "string" },
    workspace_id: { type: "string" },
    current_revision_no: { type: "integer", minimum: 0 },
    fields: leadBriefFieldsSchema,
    created_at: { type: "string" },
    updated_at: { type: "string" },
    version_no: { type: "integer", minimum: 1 },
    saved_at: { type: "string" },
    saved_by_user_id: nullableStringSchema,
    saved_by_name: nullableStringSchema,
  },
) satisfies {
  readonly title: "LeadBriefVersion";
  readonly type: "object";
  readonly additionalProperties: false;
  readonly required: readonly (keyof LeadBriefVersion)[];
  readonly properties: Record<string, unknown>;
};

export const leadBriefCurrentResourceResponseSchema = strictObjectSchema(
  "LeadBriefCurrentResourceResponse",
  ["lead_brief", "versions"] as const,
  {
    lead_brief: {
      anyOf: [leadBriefCurrentResourceSchema, { type: "null" }],
    },
    versions: {
      type: "array",
      items: leadBriefVersionSchema,
    },
  },
) satisfies {
  readonly title: "LeadBriefCurrentResourceResponse";
  readonly type: "object";
  readonly additionalProperties: false;
  readonly required: readonly (keyof LeadBriefCurrentResourceResponse)[];
  readonly properties: Record<string, unknown>;
};

export const leadBriefVersionListResponseSchema = strictObjectSchema(
  "LeadBriefVersionListResponse",
  ["items"] as const,
  {
    items: {
      type: "array",
      items: leadBriefVersionSchema,
    },
  },
) satisfies {
  readonly title: "LeadBriefVersionListResponse";
  readonly type: "object";
  readonly additionalProperties: false;
  readonly required: readonly (keyof LeadBriefVersionListResponse)[];
  readonly properties: Record<string, unknown>;
};

export const leadBriefVersionDetailResponseSchema = strictObjectSchema(
  "LeadBriefVersionDetailResponse",
  ["version"] as const,
  {
    version: leadBriefVersionSchema,
  },
) satisfies {
  readonly title: "LeadBriefVersionDetailResponse";
  readonly type: "object";
  readonly additionalProperties: false;
  readonly required: readonly (keyof LeadBriefVersionDetailResponse)[];
  readonly properties: Record<string, unknown>;
};

export const leadBriefSaveCurrentRequestSchema = strictObjectSchema(
  "LeadBriefSaveCurrentRequest",
  ["expected_revision_no", "fields"] as const,
  {
    expected_revision_no: { type: "integer", minimum: 0 },
    fields: leadBriefFieldsSchema,
  },
) satisfies {
  readonly title: "LeadBriefSaveCurrentRequest";
  readonly type: "object";
  readonly additionalProperties: false;
  readonly required: readonly (keyof LeadBriefSaveCurrentRequest)[];
  readonly properties: Record<string, unknown>;
};

export const leadBriefSaveVersionRequestSchema = strictObjectSchema(
  "LeadBriefSaveVersionRequest",
  ["expected_revision_no", "fields"] as const,
  {
    expected_revision_no: { type: "integer", minimum: 0 },
    fields: leadBriefFieldsSchema,
  },
) satisfies {
  readonly title: "LeadBriefSaveVersionRequest";
  readonly type: "object";
  readonly additionalProperties: false;
  readonly required: readonly (keyof LeadBriefSaveVersionRequest)[];
  readonly properties: Record<string, unknown>;
};

export const leadBriefRestoreRequestSchema = strictObjectSchema(
  "LeadBriefRestoreRequest",
  ["expected_revision_no", "version_no"] as const,
  {
    expected_revision_no: { type: "integer", minimum: 0 },
    version_no: { type: "integer", minimum: 1 },
  },
) satisfies {
  readonly title: "LeadBriefRestoreRequest";
  readonly type: "object";
  readonly additionalProperties: false;
  readonly required: readonly (keyof LeadBriefRestoreRequest)[];
  readonly properties: Record<string, unknown>;
};

export const leadBriefConflictResponseSchema = strictObjectSchema(
  "LeadBriefConflictResponse",
  ["current_revision_no", "expected_revision_no", "latest_version_no", "message", "reload_hint"] as const,
  {
    current_revision_no: { type: "integer", minimum: 0 },
    expected_revision_no: { type: "integer", minimum: 0 },
    latest_version_no: {
      anyOf: [{ type: "integer", minimum: 1 }, { type: "null" }],
    },
    message: { type: "string" },
    reload_hint: { type: "string" },
  },
) satisfies {
  readonly title: "LeadBriefConflictResponse";
  readonly type: "object";
  readonly additionalProperties: false;
  readonly required: readonly (keyof LeadBriefConflictResponse)[];
  readonly properties: Record<string, unknown>;
};

export const discoverySourceNoteSchema = strictObjectSchema(
  "DiscoverySourceNote",
  ["content", "source_label"] as const,
  {
    content: { type: "string" },
    source_label: nullableStringSchema,
  },
) satisfies {
  readonly title: "DiscoverySourceNote";
  readonly type: "object";
  readonly additionalProperties: false;
  readonly required: readonly (keyof DiscoverySourceNote)[];
  readonly properties: Record<string, unknown>;
};

export const discoverySourceNotesSchema = {
  title: "DiscoverySourceNotes",
  type: "array",
  items: discoverySourceNoteSchema,
} as const;

export const discoveryFieldStateSchema = enumSchema<DiscoveryFieldState>("DiscoveryFieldState", [
  "confirmed",
  "inferred",
  "missing",
  "needs_review",
]);

export const discoveryFieldKeySchema = enumSchema<DiscoveryFieldKey>("DiscoveryFieldKey", [
  "goals",
  "constraints",
  "ambiguities",
  "risk_flags",
  "follow_up_questions",
]);

export const discoveryFieldValueSchema = strictObjectSchema(
  "DiscoveryFieldValue",
  ["value", "state", "source_excerpt"] as const,
  {
    value: nullableStringSchema,
    state: discoveryFieldStateSchema,
    source_excerpt: nullableStringSchema,
  },
) satisfies {
  readonly title: "DiscoveryFieldValue";
  readonly type: "object";
  readonly additionalProperties: false;
  readonly required: readonly (keyof DiscoveryFieldValue)[];
  readonly properties: Record<string, unknown>;
};

export const discoveryFieldsSchema = strictObjectSchema(
  "DiscoveryFields",
  ["goals", "constraints", "ambiguities", "risk_flags", "follow_up_questions"] as const,
  {
    goals: discoveryFieldValueSchema,
    constraints: discoveryFieldValueSchema,
    ambiguities: discoveryFieldValueSchema,
    risk_flags: discoveryFieldValueSchema,
    follow_up_questions: discoveryFieldValueSchema,
  },
) satisfies {
  readonly title: "DiscoveryFields";
  readonly type: "object";
  readonly additionalProperties: false;
  readonly required: readonly (keyof DiscoveryFields)[];
  readonly properties: Record<string, unknown>;
};

export const discoveryCurrentResourceSchema = strictObjectSchema(
  "DiscoveryCurrentResource",
  [
    "id",
    "opportunity_id",
    "workspace_id",
    "current_revision_no",
    "fields",
    "source_notes",
    "created_at",
    "updated_at",
  ] as const,
  {
    id: { type: "string" },
    opportunity_id: { type: "string" },
    workspace_id: { type: "string" },
    current_revision_no: { type: "integer", minimum: 0 },
    fields: discoveryFieldsSchema,
    source_notes: discoverySourceNotesSchema,
    created_at: { type: "string" },
    updated_at: { type: "string" },
  },
) satisfies {
  readonly title: "DiscoveryCurrentResource";
  readonly type: "object";
  readonly additionalProperties: false;
  readonly required: readonly (keyof DiscoveryCurrentResource)[];
  readonly properties: Record<string, unknown>;
};

export const discoveryVersionSchema = strictObjectSchema(
  "DiscoveryVersion",
  [
    "id",
    "opportunity_id",
    "workspace_id",
    "current_revision_no",
    "fields",
    "source_notes",
    "created_at",
    "updated_at",
    "version_no",
    "saved_at",
    "saved_by_user_id",
    "saved_by_name",
  ] as const,
  {
    id: { type: "string" },
    opportunity_id: { type: "string" },
    workspace_id: { type: "string" },
    current_revision_no: { type: "integer", minimum: 0 },
    fields: discoveryFieldsSchema,
    source_notes: discoverySourceNotesSchema,
    created_at: { type: "string" },
    updated_at: { type: "string" },
    version_no: { type: "integer", minimum: 1 },
    saved_at: { type: "string" },
    saved_by_user_id: nullableStringSchema,
    saved_by_name: nullableStringSchema,
  },
) satisfies {
  readonly title: "DiscoveryVersion";
  readonly type: "object";
  readonly additionalProperties: false;
  readonly required: readonly (keyof DiscoveryVersion)[];
  readonly properties: Record<string, unknown>;
};

export const discoveryCurrentResourceResponseSchema = strictObjectSchema(
  "DiscoveryCurrentResourceResponse",
  ["discovery", "versions"] as const,
  {
    discovery: {
      anyOf: [discoveryCurrentResourceSchema, { type: "null" }],
    },
    versions: {
      type: "array",
      items: discoveryVersionSchema,
    },
  },
) satisfies {
  readonly title: "DiscoveryCurrentResourceResponse";
  readonly type: "object";
  readonly additionalProperties: false;
  readonly required: readonly (keyof DiscoveryCurrentResourceResponse)[];
  readonly properties: Record<string, unknown>;
};

export const discoveryVersionListResponseSchema = strictObjectSchema(
  "DiscoveryVersionListResponse",
  ["items"] as const,
  {
    items: {
      type: "array",
      items: discoveryVersionSchema,
    },
  },
) satisfies {
  readonly title: "DiscoveryVersionListResponse";
  readonly type: "object";
  readonly additionalProperties: false;
  readonly required: readonly (keyof DiscoveryVersionListResponse)[];
  readonly properties: Record<string, unknown>;
};

export const discoveryVersionDetailResponseSchema = strictObjectSchema(
  "DiscoveryVersionDetailResponse",
  ["version"] as const,
  {
    version: discoveryVersionSchema,
  },
) satisfies {
  readonly title: "DiscoveryVersionDetailResponse";
  readonly type: "object";
  readonly additionalProperties: false;
  readonly required: readonly (keyof DiscoveryVersionDetailResponse)[];
  readonly properties: Record<string, unknown>;
};

export const discoverySaveCurrentRequestSchema = strictObjectSchema(
  "DiscoverySaveCurrentRequest",
  ["expected_revision_no", "fields", "source_notes"] as const,
  {
    expected_revision_no: { type: "integer", minimum: 0 },
    fields: discoveryFieldsSchema,
    source_notes: discoverySourceNotesSchema,
  },
) satisfies {
  readonly title: "DiscoverySaveCurrentRequest";
  readonly type: "object";
  readonly additionalProperties: false;
  readonly required: readonly (keyof DiscoverySaveCurrentRequest)[];
  readonly properties: Record<string, unknown>;
};

export const discoverySaveVersionRequestSchema = strictObjectSchema(
  "DiscoverySaveVersionRequest",
  ["expected_revision_no", "fields", "source_notes"] as const,
  {
    expected_revision_no: { type: "integer", minimum: 0 },
    fields: discoveryFieldsSchema,
    source_notes: discoverySourceNotesSchema,
  },
) satisfies {
  readonly title: "DiscoverySaveVersionRequest";
  readonly type: "object";
  readonly additionalProperties: false;
  readonly required: readonly (keyof DiscoverySaveVersionRequest)[];
  readonly properties: Record<string, unknown>;
};

export const discoveryRestoreRequestSchema = strictObjectSchema(
  "DiscoveryRestoreRequest",
  ["expected_revision_no", "version_no"] as const,
  {
    expected_revision_no: { type: "integer", minimum: 0 },
    version_no: { type: "integer", minimum: 1 },
  },
) satisfies {
  readonly title: "DiscoveryRestoreRequest";
  readonly type: "object";
  readonly additionalProperties: false;
  readonly required: readonly (keyof DiscoveryRestoreRequest)[];
  readonly properties: Record<string, unknown>;
};

export const discoveryConflictResponseSchema = strictObjectSchema(
  "DiscoveryConflictResponse",
  ["current_revision_no", "expected_revision_no", "latest_version_no", "message", "reload_hint"] as const,
  {
    current_revision_no: { type: "integer", minimum: 0 },
    expected_revision_no: { type: "integer", minimum: 0 },
    latest_version_no: {
      anyOf: [{ type: "integer", minimum: 1 }, { type: "null" }],
    },
    message: { type: "string" },
    reload_hint: { type: "string" },
  },
) satisfies {
  readonly title: "DiscoveryConflictResponse";
  readonly type: "object";
  readonly additionalProperties: false;
  readonly required: readonly (keyof DiscoveryConflictResponse)[];
  readonly properties: Record<string, unknown>;
};

export const discoveryGenerateResponseSchema = strictObjectSchema(
  "DiscoveryGenerateResponse",
  ["opportunity_id", "redirect_to", "generation_started_at", "gate"] as const,
  {
    opportunity_id: { type: "string" },
    redirect_to: { type: "string" },
    generation_started_at: { type: "string" },
    gate: opportunityGenerationGateSchema,
  },
) satisfies {
  readonly title: "DiscoveryGenerateResponse";
  readonly type: "object";
  readonly additionalProperties: false;
  readonly required: readonly (keyof DiscoveryGenerateResponse)[];
  readonly properties: Record<string, unknown>;
};

export const discoverySourceNotesRequestSchema = strictObjectSchema(
  "DiscoverySourceNotesRequest",
  ["source_notes"] as const,
  {
    source_notes: discoverySourceNotesSchema,
  },
) satisfies {
  readonly title: "DiscoverySourceNotesRequest";
  readonly type: "object";
  readonly additionalProperties: false;
  readonly required: readonly (keyof DiscoverySourceNotesRequest)[];
  readonly properties: Record<string, unknown>;
};

export const templateDefinitionSchema = strictObjectSchema(
  "TemplateDefinition",
  [
    "key",
    "name",
    "industry_scope",
    "section_order",
    "required_sections",
    "default_service_modules",
    "is_active",
  ] as const,
  {
    key: workspaceTemplateKeySchema,
    name: { type: "string" },
    industry_scope: workspaceIndustryTypeSchema,
    section_order: {
      type: "array",
      items: { title: "ProposalDraftSectionKey", type: "string", enum: PROPOSAL_DRAFT_SECTION_KEYS },
    },
    required_sections: {
      type: "array",
      items: { title: "ProposalDraftSectionKey", type: "string", enum: PROPOSAL_DRAFT_SECTION_KEYS },
    },
    default_service_modules: {
      type: "array",
      items: { type: "string" },
    },
    is_active: { type: "boolean" },
  },
) satisfies {
  readonly title: "TemplateDefinition";
  readonly type: "object";
  readonly additionalProperties: false;
  readonly required: readonly (keyof TemplateDefinition)[];
  readonly properties: Record<string, unknown>;
};

export const workspaceRuleSetSchema = strictObjectSchema(
  "WorkspaceRuleSet",
  [
    "workspace_id",
    "template_key",
    "tone_profile",
    "preferred_terminology",
    "banned_terminology",
    "default_assumptions",
    "default_exclusions",
    "service_modules",
    "section_order",
    "required_sections",
    "default_cta_style",
    "updated_at",
  ] as const,
  {
    workspace_id: { type: "string" },
    template_key: workspaceTemplateKeySchema,
    tone_profile: workspaceTonePreferenceSchema,
    preferred_terminology: {
      type: "array",
      items: { type: "string" },
    },
    banned_terminology: {
      type: "array",
      items: { type: "string" },
    },
    default_assumptions: {
      type: "array",
      items: { type: "string" },
    },
    default_exclusions: {
      type: "array",
      items: { type: "string" },
    },
    service_modules: {
      type: "array",
      items: { type: "string" },
    },
    section_order: {
      type: "array",
      items: { title: "ProposalDraftSectionKey", type: "string", enum: PROPOSAL_DRAFT_SECTION_KEYS },
    },
    required_sections: {
      type: "array",
      items: { title: "ProposalDraftSectionKey", type: "string", enum: PROPOSAL_DRAFT_SECTION_KEYS },
    },
    default_cta_style: { type: "string" },
    updated_at: { type: "string" },
  },
) satisfies {
  readonly title: "WorkspaceRuleSet";
  readonly type: "object";
  readonly additionalProperties: false;
  readonly required: readonly (keyof WorkspaceRuleSet)[];
  readonly properties: Record<string, unknown>;
};

export const workspaceRuleSetResponseSchema = strictObjectSchema(
  "WorkspaceRuleSetResponse",
  ["workspace_rule_set", "meta"] as const,
  {
    workspace_rule_set: workspaceRuleSetSchema,
    meta: strictObjectSchema("WorkspaceRuleSetResponseMeta", ["source_of_truth"] as const, {
      source_of_truth: {
        type: "string",
        enum: ["workspace_rule_sets"] as const,
      },
    }),
  },
) satisfies {
  readonly title: "WorkspaceRuleSetResponse";
  readonly type: "object";
  readonly additionalProperties: false;
  readonly required: readonly (keyof WorkspaceRuleSetResponse)[];
  readonly properties: Record<string, unknown>;
};

export const workspaceRuleSetUpdateRequestSchema = strictObjectSchema(
  "WorkspaceRuleSetUpdateRequest",
  ["expected_updated_at", "rule_set"] as const,
  {
    expected_updated_at: { type: "string" },
    rule_set: workspaceRuleSetSchema,
  },
) satisfies {
  readonly title: "WorkspaceRuleSetUpdateRequest";
  readonly type: "object";
  readonly additionalProperties: false;
  readonly required: readonly (keyof WorkspaceRuleSetUpdateRequest)[];
  readonly properties: Record<string, unknown>;
};

export const workspaceRuleValidationIssueSchema = strictObjectSchema(
  "WorkspaceRuleValidationIssue",
  ["code", "field", "message"] as const,
  {
    code: { type: "string" },
    field: nullableStringSchema,
    message: { type: "string" },
  },
) satisfies {
  readonly title: "WorkspaceRuleValidationIssue";
  readonly type: "object";
  readonly additionalProperties: false;
  readonly required: readonly (keyof WorkspaceRuleValidationIssue)[];
  readonly properties: Record<string, unknown>;
};

export const workspaceRuleValidationResponseSchema = strictObjectSchema(
  "WorkspaceRuleValidationResponse",
  ["valid", "summary"] as const,
  {
    valid: { type: "boolean" },
    summary: strictObjectSchema("WorkspaceRuleValidationSummary", ["field_errors", "save_blockers"] as const, {
      field_errors: {
        type: "array",
        items: { type: "string" },
      },
      save_blockers: {
        type: "array",
        items: { type: "string" },
      },
    }),
  },
) satisfies {
  readonly title: "WorkspaceRuleValidationResponse";
  readonly type: "object";
  readonly additionalProperties: false;
  readonly required: readonly (keyof WorkspaceRuleValidationResponse)[];
  readonly properties: Record<string, unknown>;
};

export const opportunityRuleOverrideSchema = strictObjectSchema(
  "OpportunityRuleOverride",
  [
    "opportunity_id",
    "template_key_override",
    "tone_profile_override",
    "assumptions_override",
    "exclusions_override",
    "service_modules_override",
    "preferred_terminology_additions",
    "banned_terminology_additions",
    "default_cta_style_override",
    "updated_at",
  ] as const,
  {
    opportunity_id: { type: "string" },
    template_key_override: {
      anyOf: [workspaceTemplateKeySchema, { type: "null" }],
    },
    tone_profile_override: {
      anyOf: [workspaceTonePreferenceSchema, { type: "null" }],
    },
    assumptions_override: {
      type: "array",
      items: { type: "string" },
    },
    exclusions_override: {
      type: "array",
      items: { type: "string" },
    },
    service_modules_override: {
      type: "array",
      items: { type: "string" },
    },
    preferred_terminology_additions: {
      type: "array",
      items: { type: "string" },
    },
    banned_terminology_additions: {
      type: "array",
      items: { type: "string" },
    },
    default_cta_style_override: nullableStringSchema,
    updated_at: { type: "string" },
  },
) satisfies {
  readonly title: "OpportunityRuleOverride";
  readonly type: "object";
  readonly additionalProperties: false;
  readonly required: readonly (keyof OpportunityRuleOverride)[];
  readonly properties: Record<string, unknown>;
};

const effectiveRuleSummarySourcesSchema = strictObjectSchema(
  "EffectiveRuleSummarySources",
  ["template_definition", "workspace_rule_set", "opportunity_override"] as const,
  {
    template_definition: { type: "string" },
    workspace_rule_set: { type: "string" },
    opportunity_override: nullableStringSchema,
  },
);

export const effectiveRuleSummarySchema = strictObjectSchema(
  "EffectiveRuleSummary",
  [
    "template_key",
    "tone_profile",
    "section_order",
    "required_sections",
    "assumptions_preview",
    "exclusions_preview",
  ] as const,
  {
    template_key: workspaceTemplateKeySchema,
    tone_profile: workspaceTonePreferenceSchema,
    section_order: {
      type: "array",
      items: { title: "ProposalDraftSectionKey", type: "string", enum: PROPOSAL_DRAFT_SECTION_KEYS },
    },
    required_sections: {
      type: "array",
      items: { title: "ProposalDraftSectionKey", type: "string", enum: PROPOSAL_DRAFT_SECTION_KEYS },
    },
    assumptions_preview: {
      type: "array",
      items: { type: "string" },
    },
    exclusions_preview: {
      type: "array",
      items: { type: "string" },
    },
    template_label: { type: "string" },
    preferred_terminology: {
      type: "array",
      items: { type: "string" },
    },
    banned_terminology: {
      type: "array",
      items: { type: "string" },
    },
    service_modules: {
      type: "array",
      items: { type: "string" },
    },
    rule_sources: effectiveRuleSummarySourcesSchema,
    has_override: { type: "boolean" },
  },
) satisfies {
  readonly title: "EffectiveRuleSummary";
  readonly type: "object";
  readonly additionalProperties: false;
  readonly required: readonly (keyof EffectiveRuleSummary)[];
  readonly properties: Record<string, unknown>;
};

const opportunityRuleOverrideWarningSchema = strictObjectSchema(
  "OpportunityRuleOverrideWarning",
  ["title", "message"] as const,
  {
    title: { type: "string" },
    message: { type: "string" },
  },
);

export const opportunityRuleOverrideResponseSchema = strictObjectSchema(
  "OpportunityRuleOverrideResponse",
  [] as const,
  {
    override: {
      anyOf: [opportunityRuleOverrideSchema, { type: "null" }],
    },
    effective_rule_summary: effectiveRuleSummarySchema,
    warning: {
      anyOf: [opportunityRuleOverrideWarningSchema, { type: "null" }],
    },
    cleared: { type: "boolean" },
    meta: strictObjectSchema("OpportunityRuleOverrideResponseMeta", ["source_of_truth"] as const, {
      source_of_truth: {
        type: "string",
        enum: ["opportunity_rule_overrides"] as const,
      },
    }),
  },
) satisfies {
  readonly title: "OpportunityRuleOverrideResponse";
  readonly type: "object";
  readonly additionalProperties: false;
  readonly required: readonly (keyof OpportunityRuleOverrideResponse)[];
  readonly properties: Record<string, unknown>;
};

export const proposalDraftSectionKeySchema = enumSchema<ProposalDraftSectionKey>(
  "ProposalDraftSectionKey",
  PROPOSAL_DRAFT_SECTION_KEYS,
);
export const proposalDraftSectionConfidenceSchema = enumSchema<ProposalDraftSectionConfidence>(
  "ProposalDraftSectionConfidence",
  PROPOSAL_DRAFT_SECTION_CONFIDENCE_LEVELS,
);
export const proposalDraftVersionOriginSchema = enumSchema<ProposalDraftVersionOrigin>(
  "ProposalDraftVersionOrigin",
  PROPOSAL_DRAFT_VERSION_ORIGINS,
);
export const proposalDraftExportFormatSchema = enumSchema<ProposalDraftExportFormat>(
  "ProposalDraftExportFormat",
  PROPOSAL_DRAFT_EXPORT_FORMATS,
);

const proposalDraftWarningSchema = strictObjectSchema(
  "ProposalDraftWarning",
  ["code", "message"] as const,
  {
    code: { type: "string" },
    message: { type: "string" },
  },
) satisfies {
  readonly title: "ProposalDraftWarning";
  readonly type: "object";
  readonly additionalProperties: false;
  readonly required: readonly (keyof ProposalDraftWarning)[];
  readonly properties: Record<string, unknown>;
};

export const proposalDraftSectionSchema = strictObjectSchema(
  "ProposalDraftSection",
  [
    "key",
    "label",
    "content",
    "last_edited_at",
    "last_generated_at",
    "is_user_edited",
    "confidence",
    "warning",
  ] as const,
  {
    key: proposalDraftSectionKeySchema,
    label: { type: "string" },
    content: { type: "string" },
    last_edited_at: nullableStringSchema,
    last_generated_at: nullableStringSchema,
    is_user_edited: { type: "boolean" },
    confidence: proposalDraftSectionConfidenceSchema,
    warning: nullableStringSchema,
  },
) satisfies {
  readonly title: "ProposalDraftSection";
  readonly type: "object";
  readonly additionalProperties: false;
  readonly required: readonly (keyof ProposalDraftSection)[];
  readonly properties: Record<string, unknown>;
};

export const proposalDraftSectionsSchema = strictObjectSchema(
  "ProposalDraftSections",
  PROPOSAL_DRAFT_SECTION_KEYS,
  {
    executive_summary: proposalDraftSectionSchema,
    objectives: proposalDraftSectionSchema,
    recommended_approach: proposalDraftSectionSchema,
    deliverables: proposalDraftSectionSchema,
    timeline: proposalDraftSectionSchema,
    assumptions: proposalDraftSectionSchema,
    exclusions: proposalDraftSectionSchema,
    next_steps: proposalDraftSectionSchema,
  },
) satisfies {
  readonly title: "ProposalDraftSections";
  readonly type: "object";
  readonly additionalProperties: false;
  readonly required: readonly (keyof ProposalDraftSections)[];
  readonly properties: Record<string, unknown>;
};

export const proposalDraftCurrentResourceSchema = strictObjectSchema(
  "ProposalDraftCurrentResource",
  [
    "id",
    "opportunity_id",
    "workspace_id",
    "template_key",
    "current_revision_no",
    "latest_version_no",
    "sections",
    "confidence_notes",
    "warnings",
    "effective_rule_summary",
    "has_override",
    "created_at",
    "updated_at",
  ] as const,
  {
    id: { type: "string" },
    opportunity_id: { type: "string" },
    workspace_id: { type: "string" },
    template_key: workspaceTemplateKeySchema,
    current_revision_no: { type: "integer", minimum: 0 },
    latest_version_no: { type: "integer", minimum: 0 },
    sections: proposalDraftSectionsSchema,
    confidence_notes: {
      type: "array",
      items: { type: "string" },
    },
    warnings: {
      type: "array",
      items: proposalDraftWarningSchema,
    },
    effective_rule_summary: effectiveRuleSummarySchema,
    has_override: { type: "boolean" },
    created_at: { type: "string" },
    updated_at: { type: "string" },
  },
) satisfies {
  readonly title: "ProposalDraftCurrentResource";
  readonly type: "object";
  readonly additionalProperties: false;
  readonly required: readonly (keyof ProposalDraftCurrentResource)[];
  readonly properties: Record<string, unknown>;
};

export const proposalDraftVersionSchema = strictObjectSchema(
  "ProposalDraftVersion",
  [
    "template_key",
    "sections",
    "version_no",
    "version_origin",
    "version_note",
    "saved_at",
    "saved_by_user_id",
    "saved_by_name",
  ] as const,
  {
    template_key: workspaceTemplateKeySchema,
    sections: proposalDraftSectionsSchema,
    version_no: { type: "integer", minimum: 1 },
    version_origin: proposalDraftVersionOriginSchema,
    version_note: nullableStringSchema,
    saved_at: { type: "string" },
    saved_by_user_id: nullableStringSchema,
    saved_by_name: nullableStringSchema,
  },
) satisfies {
  readonly title: "ProposalDraftVersion";
  readonly type: "object";
  readonly additionalProperties: false;
  readonly required: readonly (keyof ProposalDraftVersion)[];
  readonly properties: Record<string, unknown>;
};

export const proposalDraftVersionDetailSchema = strictObjectSchema(
  "ProposalDraftVersionDetail",
  [
    "id",
    "opportunity_id",
    "workspace_id",
    "template_key",
    "current_revision_no",
    "latest_version_no",
    "sections",
    "confidence_notes",
    "warnings",
    "effective_rule_summary",
    "has_override",
    "created_at",
    "updated_at",
    "version_no",
    "version_origin",
    "version_note",
    "saved_at",
    "saved_by_user_id",
    "saved_by_name",
  ] as const,
  {
    id: { type: "string" },
    opportunity_id: { type: "string" },
    workspace_id: { type: "string" },
    template_key: workspaceTemplateKeySchema,
    current_revision_no: { type: "integer", minimum: 0 },
    latest_version_no: { type: "integer", minimum: 0 },
    sections: proposalDraftSectionsSchema,
    confidence_notes: {
      type: "array",
      items: { type: "string" },
    },
    warnings: {
      type: "array",
      items: proposalDraftWarningSchema,
    },
    effective_rule_summary: effectiveRuleSummarySchema,
    has_override: { type: "boolean" },
    created_at: { type: "string" },
    updated_at: { type: "string" },
    version_no: { type: "integer", minimum: 1 },
    version_origin: proposalDraftVersionOriginSchema,
    version_note: nullableStringSchema,
    saved_at: { type: "string" },
    saved_by_user_id: nullableStringSchema,
    saved_by_name: nullableStringSchema,
  },
) satisfies {
  readonly title: "ProposalDraftVersionDetail";
  readonly type: "object";
  readonly additionalProperties: false;
  readonly required: readonly (keyof ProposalDraftVersionDetail)[];
  readonly properties: Record<string, unknown>;
};

export const proposalDraftCurrentResourceResponseSchema = strictObjectSchema(
  "ProposalDraftCurrentResourceResponse",
  ["proposal_draft", "versions"] as const,
  {
    proposal_draft: {
      anyOf: [proposalDraftCurrentResourceSchema, { type: "null" }],
    },
    versions: {
      type: "array",
      items: proposalDraftVersionSchema,
    },
  },
) satisfies {
  readonly title: "ProposalDraftCurrentResourceResponse";
  readonly type: "object";
  readonly additionalProperties: false;
  readonly required: readonly (keyof ProposalDraftCurrentResourceResponse)[];
  readonly properties: Record<string, unknown>;
};

export const proposalDraftVersionListResponseSchema = strictObjectSchema(
  "ProposalDraftVersionListResponse",
  ["items"] as const,
  {
    items: {
      type: "array",
      items: proposalDraftVersionSchema,
    },
  },
) satisfies {
  readonly title: "ProposalDraftVersionListResponse";
  readonly type: "object";
  readonly additionalProperties: false;
  readonly required: readonly (keyof ProposalDraftVersionListResponse)[];
  readonly properties: Record<string, unknown>;
};

export const proposalDraftVersionDetailResponseSchema = strictObjectSchema(
  "ProposalDraftVersionDetailResponse",
  ["version"] as const,
  {
    version: proposalDraftVersionDetailSchema,
  },
) satisfies {
  readonly title: "ProposalDraftVersionDetailResponse";
  readonly type: "object";
  readonly additionalProperties: false;
  readonly required: readonly (keyof ProposalDraftVersionDetailResponse)[];
  readonly properties: Record<string, unknown>;
};

export const proposalDraftSaveCurrentRequestSchema = strictObjectSchema(
  "ProposalDraftSaveCurrentRequest",
  ["expected_revision_no", "sections"] as const,
  {
    expected_revision_no: { type: "integer", minimum: 0 },
    sections: proposalDraftSectionsSchema,
  },
) satisfies {
  readonly title: "ProposalDraftSaveCurrentRequest";
  readonly type: "object";
  readonly additionalProperties: false;
  readonly required: readonly (keyof ProposalDraftSaveCurrentRequest)[];
  readonly properties: Record<string, unknown>;
};

export const proposalDraftSaveVersionRequestSchema = strictObjectSchema(
  "ProposalDraftSaveVersionRequest",
  ["expected_revision_no", "version_note", "sections"] as const,
  {
    expected_revision_no: { type: "integer", minimum: 0 },
    version_note: nullableStringSchema,
    sections: proposalDraftSectionsSchema,
  },
) satisfies {
  readonly title: "ProposalDraftSaveVersionRequest";
  readonly type: "object";
  readonly additionalProperties: false;
  readonly required: readonly (keyof ProposalDraftSaveVersionRequest)[];
  readonly properties: Record<string, unknown>;
};

export const proposalDraftGenerateRequestSchema = strictObjectSchema(
  "ProposalDraftGenerateRequest",
  ["template_key", "use_opportunity_overrides", "force_low_confidence"] as const,
  {
    template_key: workspaceTemplateKeySchema,
    use_opportunity_overrides: { type: "boolean" },
    force_low_confidence: { type: "boolean" },
  },
) satisfies {
  readonly title: "ProposalDraftGenerateRequest";
  readonly type: "object";
  readonly additionalProperties: false;
  readonly required: readonly (keyof ProposalDraftGenerateRequest)[];
  readonly properties: Record<string, unknown>;
};

export const proposalDraftGenerateResponseSchema = strictObjectSchema(
  "ProposalDraftGenerateResponse",
  ["status", "redirect_to", "proposal_draft"] as const,
  {
    status: {
      type: "string",
      enum: ["queued"] as const,
    },
    redirect_to: { type: "string" },
    proposal_draft: {
      anyOf: [proposalDraftCurrentResourceSchema, { type: "null" }],
    },
  },
) satisfies {
  readonly title: "ProposalDraftGenerateResponse";
  readonly type: "object";
  readonly additionalProperties: false;
  readonly required: readonly (keyof ProposalDraftGenerateResponse)[];
  readonly properties: Record<string, unknown>;
};

export const proposalDraftSectionRegenerateRequestSchema = strictObjectSchema(
  "ProposalDraftSectionRegenerateRequest",
  ["expected_revision_no", "overwrite_current_edit"] as const,
  {
    expected_revision_no: { type: "integer", minimum: 0 },
    overwrite_current_edit: { type: "boolean" },
  },
) satisfies {
  readonly title: "ProposalDraftSectionRegenerateRequest";
  readonly type: "object";
  readonly additionalProperties: false;
  readonly required: readonly (keyof ProposalDraftSectionRegenerateRequest)[];
  readonly properties: Record<string, unknown>;
};

export const proposalDraftConflictResponseSchema = strictObjectSchema(
  "ProposalDraftConflictResponse",
  ["current_revision_no", "expected_revision_no", "latest_version_no", "message", "reload_hint"] as const,
  {
    current_revision_no: { type: "integer", minimum: 0 },
    expected_revision_no: { type: "integer", minimum: 0 },
    latest_version_no: {
      anyOf: [{ type: "integer", minimum: 1 }, { type: "null" }],
    },
    message: { type: "string" },
    reload_hint: { type: "string" },
  },
) satisfies {
  readonly title: "ProposalDraftConflictResponse";
  readonly type: "object";
  readonly additionalProperties: false;
  readonly required: readonly (keyof ProposalDraftConflictResponse)[];
  readonly properties: Record<string, unknown>;
};
