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
export type WorkspaceTemplateKey =
  | "development_agency"
  | "product_ux_agency"
  | "web_delivery_proposal";
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
  "web_delivery_proposal",
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

export type LeadBriefFieldState = "confirmed" | "inferred" | "missing" | "needs_review";
export type LeadBriefFieldKey =
  | "client_company"
  | "contact"
  | "requested_service"
  | "business_context"
  | "urgency_timeline"
  | "budget_signal"
  | "fit_assessment"
  | "missing_information"
  | "recommended_next_step";

export type LeadBriefFieldValue = {
  value: string | null;
  state: LeadBriefFieldState;
  source_excerpt: string | null;
};

export type LeadBriefFields = Record<LeadBriefFieldKey, LeadBriefFieldValue>;

export const LEAD_BRIEF_FIELD_STATES = [
  "confirmed",
  "inferred",
  "missing",
  "needs_review",
] as const satisfies readonly LeadBriefFieldState[];

export const LEAD_BRIEF_FIELD_KEYS = [
  "client_company",
  "contact",
  "requested_service",
  "business_context",
  "urgency_timeline",
  "budget_signal",
  "fit_assessment",
  "missing_information",
  "recommended_next_step",
] as const satisfies readonly LeadBriefFieldKey[];

export type LeadBriefCurrentResource = {
  id: string;
  opportunity_id: string;
  workspace_id: string;
  current_revision_no: number;
  fields: LeadBriefFields;
  created_at: string;
  updated_at: string;
};

export type LeadBriefVersion = LeadBriefCurrentResource & {
  version_no: number;
  saved_at: string;
  saved_by_user_id: string | null;
  saved_by_name: string | null;
};

export type LeadBriefCurrentResourceResponse = {
  lead_brief: LeadBriefCurrentResource | null;
  versions: LeadBriefVersion[];
};

export type LeadBriefVersionListResponse = {
  items: LeadBriefVersion[];
};

export type LeadBriefVersionDetailResponse = {
  version: LeadBriefVersion;
};

export type LeadBriefSaveCurrentRequest = {
  expected_revision_no: number;
  fields: LeadBriefFields;
};

export type LeadBriefSaveVersionRequest = {
  expected_revision_no: number;
  fields: LeadBriefFields;
};

export type LeadBriefRestoreRequest = {
  expected_revision_no: number;
  version_no: number;
};

export type LeadBriefConflictResponse = {
  current_revision_no: number;
  expected_revision_no: number;
  latest_version_no: number | null;
  message: string;
  reload_hint: string;
};

export type DiscoverySourceNote = {
  content: string;
  source_label: string | null;
};

export type DiscoverySourceNotes = DiscoverySourceNote[];

export type DiscoveryFieldState = LeadBriefFieldState;
export type DiscoveryFieldKey =
  | "goals"
  | "constraints"
  | "ambiguities"
  | "risk_flags"
  | "follow_up_questions";

export type DiscoveryFieldValue = LeadBriefFieldValue;
export type DiscoveryFields = Record<DiscoveryFieldKey, DiscoveryFieldValue>;

export type DiscoveryCurrentResource = {
  id: string;
  opportunity_id: string;
  workspace_id: string;
  current_revision_no: number;
  fields: DiscoveryFields;
  source_notes: DiscoverySourceNotes;
  created_at: string;
  updated_at: string;
};

export type DiscoveryVersion = DiscoveryCurrentResource & {
  version_no: number;
  saved_at: string;
  saved_by_user_id: string | null;
  saved_by_name: string | null;
};

export type DiscoveryCurrentResourceResponse = {
  discovery: DiscoveryCurrentResource | null;
  versions: DiscoveryVersion[];
};

export type DiscoveryVersionListResponse = {
  items: DiscoveryVersion[];
};

export type DiscoveryVersionDetailResponse = {
  version: DiscoveryVersion;
};

export type DiscoverySaveCurrentRequest = {
  expected_revision_no: number;
  fields: DiscoveryFields;
  source_notes: DiscoverySourceNotes;
};

export type DiscoverySaveVersionRequest = {
  expected_revision_no: number;
  fields: DiscoveryFields;
  source_notes: DiscoverySourceNotes;
};

export type DiscoveryRestoreRequest = {
  expected_revision_no: number;
  version_no: number;
};

export type DiscoveryConflictResponse = {
  current_revision_no: number;
  expected_revision_no: number;
  latest_version_no: number | null;
  message: string;
  reload_hint: string;
};

export type DiscoveryGenerateResponse = {
  opportunity_id: string;
  redirect_to: string;
  generation_started_at: string;
  gate: OpportunityGenerationGate;
};

export type DiscoverySourceNotesRequest = {
  source_notes: DiscoverySourceNotes;
};

export type TemplateDefinition = {
  key: WorkspaceTemplateKey;
  name: string;
  industry_scope: WorkspaceIndustryType;
  section_order: ProposalDraftSectionKey[];
  required_sections: ProposalDraftSectionKey[];
  default_service_modules: string[];
  is_active: boolean;
};

export type WorkspaceRuleSet = {
  workspace_id: string;
  template_key: WorkspaceTemplateKey;
  tone_profile: WorkspaceTonePreference;
  preferred_terminology: string[];
  banned_terminology: string[];
  default_assumptions: string[];
  default_exclusions: string[];
  service_modules: string[];
  section_order: ProposalDraftSectionKey[];
  required_sections: ProposalDraftSectionKey[];
  default_cta_style: string;
  updated_at: string;
};

export type WorkspaceRuleSetResponse = {
  workspace_rule_set: WorkspaceRuleSet;
  meta: {
    source_of_truth: "workspace_rule_sets";
  };
};

export type WorkspaceRuleSetUpdateRequest = {
  expected_updated_at: string;
  rule_set: WorkspaceRuleSet;
};

export type WorkspaceRuleValidationIssue = {
  code: string;
  field: string | null;
  message: string;
};

export type WorkspaceRuleValidationSummary = {
  field_errors: string[];
  save_blockers: string[];
};

export type WorkspaceRuleValidationResponse = {
  valid: boolean;
  summary: WorkspaceRuleValidationSummary;
};

export type OpportunityRuleOverride = {
  opportunity_id: string;
  template_key_override: WorkspaceTemplateKey | null;
  tone_profile_override: WorkspaceTonePreference | null;
  assumptions_override: string[];
  exclusions_override: string[];
  service_modules_override: string[];
  preferred_terminology_additions: string[];
  banned_terminology_additions: string[];
  default_cta_style_override: string | null;
  updated_at: string;
};

export type EffectiveRuleSummary = {
  template_key: WorkspaceTemplateKey;
  tone_profile: WorkspaceTonePreference;
  section_order: ProposalDraftSectionKey[];
  required_sections: ProposalDraftSectionKey[];
  assumptions_preview: string[];
  exclusions_preview: string[];
  template_label?: string;
  preferred_terminology?: string[];
  banned_terminology?: string[];
  service_modules?: string[];
  rule_sources?: {
    template_definition: string;
    workspace_rule_set: string;
    opportunity_override: string | null;
  };
  has_override?: boolean;
};

export type OpportunityRuleOverrideResponse = {
  override?: OpportunityRuleOverride | null;
  effective_rule_summary?: EffectiveRuleSummary;
  warning?: {
    title: string;
    message: string;
  } | null;
  cleared?: boolean;
  meta?: {
    source_of_truth: "opportunity_rule_overrides";
  };
};

export type ProposalDraftSectionKey =
  | "executive_summary"
  | "objectives"
  | "recommended_approach"
  | "deliverables"
  | "timeline"
  | "assumptions"
  | "exclusions"
  | "next_steps";

export type ProposalDraftSectionConfidence = "low" | "medium" | "high";

export type ProposalDraftSection = {
  key: ProposalDraftSectionKey;
  label: string;
  content: string;
  last_edited_at: string | null;
  last_generated_at: string | null;
  is_user_edited: boolean;
  confidence: ProposalDraftSectionConfidence;
  warning: string | null;
};

export type ProposalDraftSections = Record<ProposalDraftSectionKey, ProposalDraftSection>;

export type ProposalDraftWarning = {
  code: string;
  message: string;
};

export type ProposalDraftCurrentResource = {
  id: string;
  opportunity_id: string;
  workspace_id: string;
  template_key: WorkspaceTemplateKey;
  current_revision_no: number;
  latest_version_no: number;
  sections: ProposalDraftSections;
  confidence_notes: string[];
  warnings: ProposalDraftWarning[];
  effective_rule_summary: EffectiveRuleSummary;
  has_override: boolean;
  created_at: string;
  updated_at: string;
};

export type ProposalDraftVersionOrigin =
  | "generate"
  | "save_version"
  | "restore"
  | "regenerate_section";

export type ProposalDraftVersionSummary = {
  version_no: number;
  version_origin: ProposalDraftVersionOrigin;
  version_note: string | null;
  saved_at: string;
  saved_by_user_id: string | null;
  saved_by_name: string | null;
  template_key: WorkspaceTemplateKey;
  sections: ProposalDraftSections;
};

export type ProposalDraftVersion = ProposalDraftVersionSummary;

export type ProposalDraftVersionDetail = ProposalDraftCurrentResource &
  ProposalDraftVersionSummary;

export type ProposalDraftCurrentResourceResponse = {
  proposal_draft: ProposalDraftCurrentResource | null;
  versions: ProposalDraftVersionSummary[];
};

export type ProposalDraftVersionListResponse = {
  items: ProposalDraftVersionSummary[];
};

export type ProposalDraftVersionDetailResponse = {
  version: ProposalDraftVersionDetail;
};

export type ProposalDraftSaveCurrentRequest = {
  expected_revision_no: number;
  sections: ProposalDraftSections;
};

export type ProposalDraftSaveVersionRequest = {
  expected_revision_no: number;
  version_note: string | null;
  sections: ProposalDraftSections;
};

export type ProposalDraftRestoreRequest = {
  expected_revision_no: number;
  version_no: number;
};

export type ProposalDraftGenerateRequest = {
  template_key: WorkspaceTemplateKey;
  use_opportunity_overrides: boolean;
  force_low_confidence: boolean;
};

export type ProposalDraftGenerateResponse = {
  status: "queued";
  redirect_to: string;
  proposal_draft: ProposalDraftCurrentResource | null;
};

export type ProposalDraftSectionRegenerateRequest = {
  expected_revision_no: number;
  overwrite_current_edit: boolean;
};

export type ProposalDraftConflictResponse = {
  current_revision_no: number;
  expected_revision_no: number;
  latest_version_no: number | null;
  message: string;
  reload_hint: string;
};

export type ProposalDraftExportFormat = "text" | "markdown";

export const PROPOSAL_DRAFT_SECTION_KEYS = [
  "executive_summary",
  "objectives",
  "recommended_approach",
  "deliverables",
  "timeline",
  "assumptions",
  "exclusions",
  "next_steps",
] as const satisfies readonly ProposalDraftSectionKey[];

export const PROPOSAL_DRAFT_SECTION_CONFIDENCE_LEVELS = [
  "low",
  "medium",
  "high",
] as const satisfies readonly ProposalDraftSectionConfidence[];

export const PROPOSAL_DRAFT_VERSION_ORIGINS = [
  "generate",
  "save_version",
  "restore",
  "regenerate_section",
] as const satisfies readonly ProposalDraftVersionOrigin[];

export const PROPOSAL_DRAFT_EXPORT_FORMATS = [
  "text",
  "markdown",
] as const satisfies readonly ProposalDraftExportFormat[];
