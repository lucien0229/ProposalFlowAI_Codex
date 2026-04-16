import { API_ROUTE_PATHS } from "@proposalflow/shared-config";
import type {
  EffectiveRuleSummary,
  OpportunityRuleOverrideResponse,
  TemplateDefinition,
  WorkspaceRuleSet,
  WorkspaceRuleSetResponse,
} from "@proposalflow/shared-types";

import { requestProductJson } from "@/lib/product-api";

type TemplatesRulesRequestOptions = {
  cookieHeader?: string | null;
  csrfToken?: string | null;
};

export type TemplateListItem = Pick<
  TemplateDefinition,
  "key" | "name" | "industry_scope" | "required_sections" | "is_active"
>;

export type TemplatesListResponse = {
  data: TemplateListItem[];
  meta: {
    source_of_truth: string;
  };
};

export type EffectiveRulesResponse = {
  opportunity_id: string;
  has_override: boolean;
  effective_rule_summary: EffectiveRuleSummary;
};

export type WorkspaceRuleValidationSummary = {
  field_errors: string[];
  save_blockers: string[];
};

export type WorkspaceRuleValidationResult = {
  valid: boolean;
  summary?: WorkspaceRuleValidationSummary;
};

export type OpportunityRuleOverrideUpdateRequest = {
  expected_updated_at: string;
  override: {
    template_key_override: WorkspaceRuleSet["template_key"] | null;
    tone_profile_override: WorkspaceRuleSet["tone_profile"] | null;
    assumptions_override: string[];
    exclusions_override: string[];
    service_modules_override: string[];
    preferred_terminology_additions: string[];
    banned_terminology_additions: string[];
    default_cta_style_override: string | null;
    updated_at: string | null;
  };
};

function serializeWorkspaceRuleSet(ruleSet: WorkspaceRuleSet) {
  const { workspace_id: _workspaceId, ...rest } = ruleSet;
  return rest;
}

export function fetchTemplates(options: TemplatesRulesRequestOptions = {}) {
  return requestProductJson<TemplatesListResponse>(API_ROUTE_PATHS.templates, {
    method: "GET",
    cookieHeader: options.cookieHeader,
  });
}

export function fetchWorkspaceRules(options: TemplatesRulesRequestOptions = {}) {
  return requestProductJson<WorkspaceRuleSetResponse>(API_ROUTE_PATHS.workspaceRules, {
    method: "GET",
    cookieHeader: options.cookieHeader,
  });
}

export function saveWorkspaceRules(
  body: {
    expected_updated_at: string;
    rule_set: WorkspaceRuleSet;
  },
  options: TemplatesRulesRequestOptions = {},
) {
  return requestProductJson<WorkspaceRuleSetResponse>(API_ROUTE_PATHS.workspaceRules, {
    method: "PUT",
    body: {
      ...body,
      rule_set: serializeWorkspaceRuleSet(body.rule_set),
    },
    cookieHeader: options.cookieHeader,
    csrfToken: options.csrfToken,
  });
}

export function validateWorkspaceRules(
  body: {
    rule_set: WorkspaceRuleSet;
  },
  options: TemplatesRulesRequestOptions = {},
) {
  return requestProductJson<WorkspaceRuleValidationResult>(API_ROUTE_PATHS.workspaceRulesValidate, {
    method: "POST",
    body: {
      rule_set: serializeWorkspaceRuleSet(body.rule_set),
    },
    cookieHeader: options.cookieHeader,
    csrfToken: options.csrfToken,
  });
}

export function fetchOpportunityEffectiveRules(
  opportunityId: string,
  options: TemplatesRulesRequestOptions = {},
) {
  return requestProductJson<EffectiveRulesResponse>(API_ROUTE_PATHS.opportunityEffectiveRules(opportunityId), {
    method: "GET",
    cookieHeader: options.cookieHeader,
  });
}

export function fetchOpportunityRuleOverride(
  opportunityId: string,
  options: TemplatesRulesRequestOptions = {},
) {
  return requestProductJson<OpportunityRuleOverrideResponse>(API_ROUTE_PATHS.opportunityRuleOverride(opportunityId), {
    method: "GET",
    cookieHeader: options.cookieHeader,
  });
}

export function saveOpportunityRuleOverride(
  opportunityId: string,
  body: OpportunityRuleOverrideUpdateRequest,
  options: TemplatesRulesRequestOptions = {},
) {
  return requestProductJson<OpportunityRuleOverrideResponse>(API_ROUTE_PATHS.opportunityRuleOverride(opportunityId), {
    method: "PUT",
    body,
    cookieHeader: options.cookieHeader,
    csrfToken: options.csrfToken,
  });
}

export function clearOpportunityRuleOverride(
  opportunityId: string,
  options: TemplatesRulesRequestOptions = {},
) {
  return requestProductJson<OpportunityRuleOverrideResponse>(API_ROUTE_PATHS.opportunityRuleOverride(opportunityId), {
    method: "DELETE",
    cookieHeader: options.cookieHeader,
    csrfToken: options.csrfToken,
  });
}
