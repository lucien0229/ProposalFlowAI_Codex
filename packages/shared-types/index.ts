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
export type SortDirection = "asc" | "desc";
export type WorkspaceIndustryType = "web_development_agency" | "product_ux_agency";
export type WorkspaceTemplateKey = "development_agency" | "product_ux_agency";
export type WorkspaceTonePreference = "balanced" | "direct" | "consultative";
export type OpportunitySourceType = "manual" | "email_thread" | "pdf_upload";
export type OpportunityCurrentStep =
  | "overview"
  | "lead_brief"
  | "discovery"
  | "proposal_draft"
  | "follow_up";
export type OpportunityStatus =
  | "new"
  | "lead_brief_generated"
  | "discovery_added"
  | "discovery_reviewed"
  | "proposal_draft_generated"
  | "proposal_in_review"
  | "proposal_ready"
  | "follow_up_drafted"
  | "archived";
export type NeedsAttentionReason =
  | "missing_input"
  | "file_failed"
  | "generation_failed"
  | "billing_restricted"
  | "review_required";
export type OpportunityWorkflowState =
  | "not_started"
  | "in_progress"
  | "needs_attention"
  | "completed";
export type OpportunityStepReadiness = "not_started" | "ready" | "blocked" | "completed";
export type OpportunitySortField = "updated_at" | "created_at";
export type OpportunityInputType = "raw_input" | "extracted_text";
export type OpportunityFileStatus = "uploaded" | "processing" | "ready" | "failed";
export type OpportunityFileProcessingJobStatus =
  | "pending"
  | "processing"
  | "ready"
  | "failed";
export type OpportunityGenerationGateReason =
  | "missing_fields"
  | "missing_source"
  | "file_processing"
  | "save_failed";

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
export const SORT_DIRECTIONS = ["asc", "desc"] as const satisfies readonly SortDirection[];
export const WORKSPACE_INDUSTRY_TYPES = [
  "web_development_agency",
  "product_ux_agency",
] as const satisfies readonly WorkspaceIndustryType[];
export const WORKSPACE_TEMPLATE_KEYS = [
  "development_agency",
  "product_ux_agency",
] as const satisfies readonly WorkspaceTemplateKey[];
export const WORKSPACE_TONE_PREFERENCES = [
  "balanced",
  "direct",
  "consultative",
] as const satisfies readonly WorkspaceTonePreference[];
export const OPPORTUNITY_SOURCE_TYPES = [
  "manual",
  "email_thread",
  "pdf_upload",
] as const satisfies readonly OpportunitySourceType[];
export const OPPORTUNITY_CURRENT_STEPS = [
  "overview",
  "lead_brief",
  "discovery",
  "proposal_draft",
  "follow_up",
] as const satisfies readonly OpportunityCurrentStep[];
export const OPPORTUNITY_STATUSES = [
  "new",
  "lead_brief_generated",
  "discovery_added",
  "discovery_reviewed",
  "proposal_draft_generated",
  "proposal_in_review",
  "proposal_ready",
  "follow_up_drafted",
  "archived",
] as const satisfies readonly OpportunityStatus[];
export const NEEDS_ATTENTION_REASONS = [
  "missing_input",
  "file_failed",
  "generation_failed",
  "billing_restricted",
  "review_required",
] as const satisfies readonly NeedsAttentionReason[];
export const OPPORTUNITY_WORKFLOW_STATES = [
  "not_started",
  "in_progress",
  "needs_attention",
  "completed",
] as const satisfies readonly OpportunityWorkflowState[];
export const OPPORTUNITY_STEP_READINESS_STATES = [
  "not_started",
  "ready",
  "blocked",
  "completed",
] as const satisfies readonly OpportunityStepReadiness[];
export const OPPORTUNITY_SORT_FIELDS = [
  "updated_at",
  "created_at",
] as const satisfies readonly OpportunitySortField[];
export const OPPORTUNITY_INPUT_TYPES = [
  "raw_input",
  "extracted_text",
] as const satisfies readonly OpportunityInputType[];
export const OPPORTUNITY_FILE_STATUSES = [
  "uploaded",
  "processing",
  "ready",
  "failed",
] as const satisfies readonly OpportunityFileStatus[];
export const OPPORTUNITY_FILE_PROCESSING_JOB_STATUSES = [
  "pending",
  "processing",
  "ready",
  "failed",
] as const satisfies readonly OpportunityFileProcessingJobStatus[];
export const OPPORTUNITY_GENERATION_GATE_REASONS = [
  "missing_fields",
  "missing_source",
  "file_processing",
  "save_failed",
] as const satisfies readonly OpportunityGenerationGateReason[];

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

export type OpportunityListItem = {
  id: string;
  workspace_id: string;
  owner_user_id: string | null;
  owner_name: string | null;
  title: string;
  company_name: string;
  contact_name: string | null;
  contact_email: string | null;
  requested_service: string | null;
  source_type: OpportunitySourceType | string | null;
  status: OpportunityStatus;
  current_step: OpportunityCurrentStep;
  current_step_url: string;
  workflow_state: OpportunityWorkflowState;
  needs_attention_reason: NeedsAttentionReason | null;
  restriction_reason: string | null;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
  step_readiness: OpportunityStepReadiness;
};

export type CreateOpportunityRequest = {
  title: string;
  company_name: string;
  requested_service: string | null;
  source_type: OpportunitySourceType;
};

export type CreateOpportunityResponse = {
  opportunity: OpportunityListItem;
  redirect_to: string;
};

export type NeedsAttentionItem = {
  id: string;
  title: string;
  current_step_url: string;
  current_step: OpportunityCurrentStep;
  needs_attention_reason: NeedsAttentionReason;
  attention_body: string;
};

export type DashboardSummaryCounts = {
  active: number;
  needs_attention: number;
  proposal_ready: number;
  archived: number;
};

export type DashboardBillingSnapshot = {
  trial_status: string | null;
  billing_status: string | null;
  plan_type: string | null;
  is_restricted: boolean;
  restriction_reason: string | null;
};

export type DashboardSummary = {
  summary_counts: DashboardSummaryCounts;
  recent_opportunities: OpportunityListItem[];
  needs_attention: NeedsAttentionItem[];
  billing_snapshot: DashboardBillingSnapshot;
};

export type OpportunityInput = {
  id: string;
  opportunity_id: string;
  input_type: OpportunityInputType;
  content: string;
  source_label: string | null;
  created_at: string;
  updated_at: string;
};

export type OpportunityFileProcessingJob = {
  id: string;
  file_asset_id: string;
  status: OpportunityFileProcessingJobStatus;
  attempt_number: number;
  error_message: string | null;
  queued_at: string | null;
  started_at: string | null;
  completed_at: string | null;
};

export type OpportunityFileAsset = {
  id: string;
  opportunity_id: string;
  file_name: string;
  mime_type: string;
  storage_key: string;
  file_status: OpportunityFileStatus;
  latest_job_status: OpportunityFileProcessingJobStatus | null;
  uploaded_at: string | null;
  extracted_text: string | null;
  latest_job: OpportunityFileProcessingJob | null;
  created_at: string;
  updated_at: string;
};

export type OpportunityGenerationGate = {
  can_generate: boolean;
  reasons: OpportunityGenerationGateReason[];
  primary_reason: OpportunityGenerationGateReason | null;
  message: string;
  source_ready: "manual" | "file" | "both" | "none";
};

export type OpportunityOverview = OpportunityListItem & {
  contact_name: string | null;
  contact_email: string | null;
  generation_gate: OpportunityGenerationGate;
};

export type OpportunityOverviewResponse = {
  opportunity: OpportunityOverview;
  inputs: OpportunityInput[];
  latest_file: OpportunityFileAsset | null;
};

export type UpdateOpportunityOverviewRequest = {
  title?: string;
  company_name?: string;
  contact_name?: string | null;
  contact_email?: string | null;
  requested_service?: string | null;
  source_type?: OpportunitySourceType;
};

export type OpportunityFileDetailResponse = {
  file: OpportunityFileAsset;
};

export type LeadBriefGenerateResponse = {
  opportunity_id: string;
  redirect_to: string;
  generation_started_at: string;
  gate: OpportunityGenerationGate;
};
