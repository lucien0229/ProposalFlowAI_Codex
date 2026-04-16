import {
  API_ROUTE_PATHS,
  OPPORTUNITY_API_ROUTE_DEFINITIONS,
  OPPORTUNITY_API_ROUTE_TEMPLATES,
  buildOpportunityEffectiveRulesApiPath,
  buildOpportunityRuleOverrideApiPath,
  buildProposalDraftApiPath,
  buildProposalDraftExportApiPath,
  buildProposalDraftGenerateApiPath,
  buildProposalDraftSaveVersionApiPath,
  buildProposalDraftSectionRegenerateApiPath,
  buildProposalDraftVersionDetailApiPath,
  buildProposalDraftVersionRestoreApiPath,
  buildProposalDraftVersionsApiPath,
  buildTemplatesApiPath,
  buildWorkspaceRulesApiPath,
  buildWorkspaceRulesValidateApiPath,
} from "@proposalflow/shared-config";
import {
  effectiveRuleSummarySchema,
  opportunityRuleOverrideResponseSchema,
  opportunityRuleOverrideSchema,
  proposalDraftConflictResponseSchema,
  proposalDraftCurrentResourceResponseSchema,
  proposalDraftCurrentResourceSchema,
  proposalDraftExportFormatSchema,
  proposalDraftGenerateRequestSchema,
  proposalDraftGenerateResponseSchema,
  proposalDraftSaveCurrentRequestSchema,
  proposalDraftSaveVersionRequestSchema,
  proposalDraftSectionRegenerateRequestSchema,
  proposalDraftSectionSchema,
  proposalDraftSectionKeySchema,
  proposalDraftSectionsSchema,
  proposalDraftVersionDetailResponseSchema,
  proposalDraftVersionDetailSchema,
  proposalDraftVersionListResponseSchema,
  proposalDraftVersionSchema,
  templateDefinitionSchema,
  workspaceRuleSetResponseSchema,
  workspaceRuleSetSchema,
  workspaceRuleSetUpdateRequestSchema,
  workspaceRuleValidationResponseSchema,
} from "@proposalflow/shared-schemas";
import type {
  EffectiveRuleSummary,
  OpportunityRuleOverride,
  OpportunityRuleOverrideResponse,
  ProposalDraftConflictResponse,
  ProposalDraftCurrentResource,
  ProposalDraftCurrentResourceResponse,
  ProposalDraftExportFormat,
  ProposalDraftGenerateRequest,
  ProposalDraftGenerateResponse,
  ProposalDraftSaveCurrentRequest,
  ProposalDraftSaveVersionRequest,
  ProposalDraftSection,
  ProposalDraftSectionKey,
  ProposalDraftSectionRegenerateRequest,
  ProposalDraftSections,
  ProposalDraftVersion,
  ProposalDraftVersionDetail,
  ProposalDraftVersionSummary,
  ProposalDraftVersionDetailResponse,
  ProposalDraftVersionListResponse,
  TemplateDefinition,
  WorkspaceRuleSet,
  WorkspaceRuleSetResponse,
  WorkspaceRuleSetUpdateRequest,
  WorkspaceRuleValidationResponse,
} from "@proposalflow/shared-types";

type Assert<T extends true> = T;
type IsExact<T, U> =
  (<G>() => G extends T ? 1 : 2) extends (<G>() => G extends U ? 1 : 2) ? true : false;

const sampleTemplateDefinition: TemplateDefinition = {
  key: "development_agency",
  name: "Development Agency Template",
  industry_scope: "web_development_agency",
  section_order: [
    "executive_summary",
    "objectives",
    "recommended_approach",
    "deliverables",
    "timeline",
    "assumptions",
    "exclusions",
    "next_steps",
  ],
  required_sections: [
    "executive_summary",
    "recommended_approach",
    "assumptions",
    "exclusions",
    "next_steps",
  ],
  default_service_modules: ["strategy", "delivery"],
  is_active: true,
};

const sampleRuleSet: WorkspaceRuleSet = {
  workspace_id: "workspace_test",
  template_key: "development_agency",
  tone_profile: "consultative",
  preferred_terminology: ["delivery plan"],
  banned_terminology: ["synergy"],
  default_assumptions: ["Client feedback arrives within two business days."],
  default_exclusions: ["Paid media management is excluded."],
  service_modules: ["strategy", "delivery"],
  section_order: [
    "executive_summary",
    "objectives",
    "recommended_approach",
    "deliverables",
    "timeline",
    "assumptions",
    "exclusions",
    "next_steps",
  ],
  required_sections: [
    "executive_summary",
    "recommended_approach",
    "assumptions",
    "exclusions",
    "next_steps",
  ],
  default_cta_style: "schedule_workshop",
  updated_at: "2026-04-12T10:00:00Z",
};

const sampleEffectiveRuleSummary: EffectiveRuleSummary = {
  template_key: "development_agency",
  template_label: "Development Agency Template",
  tone_profile: "consultative",
  section_order: [
    "executive_summary",
    "objectives",
    "recommended_approach",
    "deliverables",
    "timeline",
    "assumptions",
    "exclusions",
    "next_steps",
  ],
  required_sections: [
    "executive_summary",
    "recommended_approach",
    "assumptions",
    "exclusions",
    "next_steps",
  ],
  assumptions_preview: ["Client feedback arrives within two business days."],
  exclusions_preview: ["Paid media management is excluded."],
  preferred_terminology: ["delivery plan"],
  banned_terminology: ["synergy"],
  service_modules: ["strategy", "delivery"],
  rule_sources: {
    template_definition: "development_agency",
    workspace_rule_set: "workspace_rule_sets",
    opportunity_override: null,
  },
};

const sampleOverride: OpportunityRuleOverride = {
  opportunity_id: "opp_test",
  template_key_override: "web_delivery_proposal",
  tone_profile_override: "direct",
  assumptions_override: ["Client can approve the sitemap within three business days."],
  exclusions_override: ["Analytics migration is out of scope."],
  service_modules_override: ["strategy", "delivery"],
  preferred_terminology_additions: ["launch plan"],
  banned_terminology_additions: ["cheap"],
  default_cta_style_override: "book_scope_review",
  updated_at: "2026-04-12T11:00:00Z",
};

const sampleProposalSection: ProposalDraftSection = {
  key: "assumptions",
  label: "Assumptions",
  content: "Client feedback arrives within two business days.",
  last_edited_at: "2026-04-12T09:00:00Z",
  last_generated_at: "2026-04-12T08:55:00Z",
  is_user_edited: false,
  confidence: "medium",
  warning: null,
};

const sampleProposalSections: ProposalDraftSections = {
  executive_summary: { ...sampleProposalSection, key: "executive_summary", label: "Executive Summary" },
  objectives: { ...sampleProposalSection, key: "objectives", label: "Objectives" },
  recommended_approach: {
    ...sampleProposalSection,
    key: "recommended_approach",
    label: "Recommended Approach",
  },
  deliverables: { ...sampleProposalSection, key: "deliverables", label: "Deliverables" },
  timeline: { ...sampleProposalSection, key: "timeline", label: "Timeline" },
  assumptions: sampleProposalSection,
  exclusions: { ...sampleProposalSection, key: "exclusions", label: "Exclusions" },
  next_steps: { ...sampleProposalSection, key: "next_steps", label: "Next Steps / CTA" },
};

const sampleProposalDraft: ProposalDraftCurrentResource = {
  id: "proposal_draft_test",
  opportunity_id: "opp_test",
  workspace_id: "workspace_test",
  template_key: "development_agency",
  current_revision_no: 4,
  latest_version_no: 2,
  sections: sampleProposalSections,
  confidence_notes: ["Timeline remains low confidence until launch timing is confirmed."],
  warnings: [
    {
      code: "MISSING_TIMELINE_CONFIDENCE",
      message: "Timeline remains a low-confidence section until discovery confirms launch timing.",
    },
  ],
  effective_rule_summary: sampleEffectiveRuleSummary,
  has_override: false,
  created_at: "2026-04-12T08:55:00Z",
  updated_at: "2026-04-12T09:00:00Z",
};

const sampleProposalDraftVersionSummary: ProposalDraftVersionSummary = {
  version_no: 2,
  version_origin: "save_version",
  version_note: "Approved working draft before section refresh.",
  saved_at: "2026-04-12T09:12:00Z",
  saved_by_user_id: "user_test",
  saved_by_name: "Mira Chen",
  template_key: "development_agency",
  sections: sampleProposalSections,
};

const sampleProposalDraftVersion: ProposalDraftVersionDetail = {
  ...sampleProposalDraft,
  version_no: 2,
  version_origin: "save_version",
  version_note: "Approved working draft before section refresh.",
  saved_at: "2026-04-12T09:12:00Z",
  saved_by_user_id: "user_test",
  saved_by_name: "Mira Chen",
};

const sampleRuleSetResponse: WorkspaceRuleSetResponse = {
  workspace_rule_set: sampleRuleSet,
  meta: {
    source_of_truth: "workspace_rule_sets",
  },
};

const sampleRuleValidationResponse: WorkspaceRuleValidationResponse = {
  valid: true,
  summary: {
    field_errors: [],
    save_blockers: [],
  },
};

const sampleOverrideResponse: OpportunityRuleOverrideResponse = {
  override: sampleOverride,
  effective_rule_summary: sampleEffectiveRuleSummary,
  warning: {
    title: "Override active",
    message: "This opportunity is using local rule changes that do not rewrite the workspace baseline.",
  },
};

const sampleCurrentResourceResponse: ProposalDraftCurrentResourceResponse = {
  proposal_draft: sampleProposalDraft,
  versions: [sampleProposalDraftVersionSummary],
};

const sampleVersionListResponse: ProposalDraftVersionListResponse = {
  items: [sampleProposalDraftVersionSummary],
};

const sampleVersionDetailResponse: ProposalDraftVersionDetailResponse = {
  version: sampleProposalDraftVersion,
};

const sampleSaveCurrentRequest: ProposalDraftSaveCurrentRequest = {
  expected_revision_no: 4,
  sections: sampleProposalSections,
};

const sampleSaveVersionRequest: ProposalDraftSaveVersionRequest = {
  expected_revision_no: 4,
  version_note: "Approved working draft before section refresh.",
  sections: sampleProposalSections,
};

const sampleGenerateRequest: ProposalDraftGenerateRequest = {
  template_key: "development_agency",
  use_opportunity_overrides: true,
  force_low_confidence: false,
};

const sampleGenerateResponse: ProposalDraftGenerateResponse = {
  status: "queued",
  redirect_to: "/opportunities/opp_test/proposal-draft",
  proposal_draft: sampleProposalDraft,
};

const sampleRegenerateRequest: ProposalDraftSectionRegenerateRequest = {
  expected_revision_no: 4,
  overwrite_current_edit: true,
};

const sampleConflictResponse: ProposalDraftConflictResponse = {
  current_revision_no: 5,
  expected_revision_no: 4,
  latest_version_no: 2,
  message: "Proposal Draft changed before your save completed.",
  reload_hint: "Reload the latest proposal draft before saving again.",
};

const sampleExportFormat: ProposalDraftExportFormat = "markdown";
const sampleSectionKey: ProposalDraftSectionKey = "recommended_approach";
const sampleRuleSetUpdateRequest: WorkspaceRuleSetUpdateRequest = {
  expected_updated_at: "2026-04-12T10:00:00Z",
  rule_set: sampleRuleSet,
};

const templatesPath: "/api/v1/templates" = buildTemplatesApiPath();
const workspaceRulesPath: "/api/v1/workspaces/current/rules" = buildWorkspaceRulesApiPath();
const workspaceRulesValidatePath: "/api/v1/workspaces/current/rules/validate" =
  buildWorkspaceRulesValidateApiPath();

const proposalDraftPath: string = buildProposalDraftApiPath("opp_test");
const proposalDraftGeneratePath: string = buildProposalDraftGenerateApiPath("opp_test");
const proposalDraftSaveVersionPath: string = buildProposalDraftSaveVersionApiPath("opp_test");
const proposalDraftVersionsPath: string = buildProposalDraftVersionsApiPath("opp_test");
const proposalDraftVersionDetailPath: string = buildProposalDraftVersionDetailApiPath("opp_test", 3);
const proposalDraftVersionRestorePath: string = buildProposalDraftVersionRestoreApiPath("opp_test", 3);
const proposalDraftRegeneratePath: string = buildProposalDraftSectionRegenerateApiPath(
  "opp_test",
  "recommended_approach",
);
const proposalDraftExportPath: string = buildProposalDraftExportApiPath("opp_test");
const effectiveRulesPath: string = buildOpportunityEffectiveRulesApiPath("opp_test");
const overridePath: string = buildOpportunityRuleOverrideApiPath("opp_test");

const proposalDraftRouteTemplate:
  "/opportunities/${opportunityId}/proposal-draft" = OPPORTUNITY_API_ROUTE_TEMPLATES.proposalDraft;
const proposalDraftVersionDetailRouteTemplate:
  "/opportunities/${opportunityId}/proposal-draft/versions/${versionNo}" =
  OPPORTUNITY_API_ROUTE_TEMPLATES.proposalDraftVersionDetail;
const proposalDraftRegenerateRouteTemplate:
  "/opportunities/${opportunityId}/proposal-draft/sections/${sectionKey}/regenerate" =
  OPPORTUNITY_API_ROUTE_TEMPLATES.proposalDraftSectionRegenerate;
const templatesRouteTemplate: "/templates" = OPPORTUNITY_API_ROUTE_TEMPLATES.templates;

const proposalDraftRouteDefinition:
  "GET /api/v1/opportunities/{opportunity_id}/proposal-draft" =
  OPPORTUNITY_API_ROUTE_DEFINITIONS.proposalDraftDetail.path;
const proposalDraftRestoreRouteDefinition:
  "POST /api/v1/opportunities/{opportunity_id}/proposal-draft/versions/{version_no}/restore" =
  OPPORTUNITY_API_ROUTE_DEFINITIONS.restoreProposalDraftVersion.path;
const workspaceRuleRouteDefinition:
  "PUT /api/v1/workspaces/current/rules" =
  OPPORTUNITY_API_ROUTE_DEFINITIONS.updateWorkspaceRules.path;

type _proposalDraftExportFormat = Assert<IsExact<ProposalDraftExportFormat, "text" | "markdown">>;
type _proposalDraftSectionKey = Assert<
  IsExact<
    ProposalDraftSectionKey,
    | "executive_summary"
    | "objectives"
    | "recommended_approach"
    | "deliverables"
    | "timeline"
    | "assumptions"
    | "exclusions"
    | "next_steps"
  >
>;

void sampleTemplateDefinition;
void sampleRuleSet;
void sampleEffectiveRuleSummary;
void sampleOverride;
void sampleProposalSection;
void sampleProposalSections;
void sampleProposalDraft;
void sampleProposalDraftVersionSummary;
void sampleProposalDraftVersion;
void sampleRuleSetResponse;
void sampleRuleValidationResponse;
void sampleOverrideResponse;
void sampleCurrentResourceResponse;
void sampleVersionListResponse;
void sampleVersionDetailResponse;
void sampleSaveCurrentRequest;
void sampleSaveVersionRequest;
void sampleGenerateRequest;
void sampleGenerateResponse;
void sampleRegenerateRequest;
void sampleConflictResponse;
void sampleExportFormat;
void sampleSectionKey;
void sampleRuleSetUpdateRequest;
void templatesPath;
void workspaceRulesPath;
void workspaceRulesValidatePath;
void proposalDraftPath;
void proposalDraftGeneratePath;
void proposalDraftSaveVersionPath;
void proposalDraftVersionsPath;
void proposalDraftVersionDetailPath;
void proposalDraftVersionRestorePath;
void proposalDraftRegeneratePath;
void proposalDraftExportPath;
void effectiveRulesPath;
void overridePath;
void proposalDraftRouteTemplate;
void proposalDraftVersionDetailRouteTemplate;
void proposalDraftRegenerateRouteTemplate;
void templatesRouteTemplate;
void proposalDraftRouteDefinition;
void proposalDraftRestoreRouteDefinition;
void workspaceRuleRouteDefinition;
void templateDefinitionSchema;
void workspaceRuleSetSchema;
void workspaceRuleSetResponseSchema;
void workspaceRuleSetUpdateRequestSchema;
void workspaceRuleValidationResponseSchema;
void opportunityRuleOverrideSchema;
void opportunityRuleOverrideResponseSchema;
void effectiveRuleSummarySchema;
void proposalDraftSectionKeySchema;
void proposalDraftSectionSchema;
void proposalDraftSectionsSchema;
void proposalDraftCurrentResourceSchema;
void proposalDraftVersionSchema;
void proposalDraftVersionDetailSchema;
void proposalDraftCurrentResourceResponseSchema;
void proposalDraftVersionListResponseSchema;
void proposalDraftVersionDetailResponseSchema;
void proposalDraftSaveCurrentRequestSchema;
void proposalDraftSaveVersionRequestSchema;
void proposalDraftGenerateRequestSchema;
void proposalDraftGenerateResponseSchema;
void proposalDraftSectionRegenerateRequestSchema;
void proposalDraftConflictResponseSchema;
void proposalDraftExportFormatSchema;
void API_ROUTE_PATHS;
