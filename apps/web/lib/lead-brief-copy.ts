import type {
  LeadBriefFieldKey,
  LeadBriefFieldState,
  LeadBriefFields,
} from "@proposalflow/shared-types";

export const LEAD_BRIEF_PAGE_COPY = {
  title: "Lead Brief",
  subtitle: "Shape the current opportunity into a brief you can trust, version, and hand off.",
  emptyTitle: "No current lead brief.",
  emptyBody:
    "Generate a structured brief from the intake source, then confirm each field before handing off to Discovery.",
  emptyAction: "Generate lead brief",
  saveCurrent: "Save current",
  saveVersion: "Save version",
  regenerate: "Regenerate brief",
  versions: "Versions",
  copySummary: "Copy summary",
  continueToDiscovery: "Continue to Discovery",
  restoreWarning:
    "Restoring replaces the current working brief. Save a version first if you want to keep the current state.",
  conflictMessage:
    "This brief changed elsewhere. Reload the latest version before saving or regenerating.",
} as const;

export const LEAD_BRIEF_FIELD_LABELS: Record<LeadBriefFieldKey, string> = {
  client_company: "Client / company",
  contact: "Contact",
  requested_service: "Requested service",
  business_context: "Business context",
  urgency_timeline: "Urgency / timeline",
  budget_signal: "Budget signal",
  fit_assessment: "Fit assessment",
  missing_information: "Missing information",
  recommended_next_step: "Recommended next step",
};

export const LEAD_BRIEF_FIELD_HELPER_TEXT: Record<LeadBriefFieldKey, string> = {
  client_company: "Anchor the brief to the buying company.",
  contact: "Who we are speaking with and how to reach them.",
  requested_service: "The request as the opportunity described it.",
  business_context: "What is happening in the account and why this matters now.",
  urgency_timeline: "When the work needs to move and any milestone pressure.",
  budget_signal: "Any pricing, scope, or budget cues worth preserving.",
  fit_assessment: "Your judgment about whether this is a fit and why.",
  missing_information: "What still needs confirmation before Discovery.",
  recommended_next_step: "The next action the team should take from this brief.",
};

export const LEAD_BRIEF_FIELD_GROUPS: Array<{ title: string; fields: LeadBriefFieldKey[] }> = [
  { title: "Core identity", fields: ["client_company", "contact"] },
  {
    title: "Request summary",
    fields: ["requested_service", "business_context"],
  },
  {
    title: "Decision context",
    fields: ["urgency_timeline", "budget_signal"],
  },
  {
    title: "Judgment area",
    fields: ["fit_assessment", "missing_information", "recommended_next_step"],
  },
];

export type LeadBriefSnapshotSection = {
  title: string;
  fields: Array<{
    key: LeadBriefFieldKey;
    label: string;
    stateLabel: string;
    value: string | null;
    sourceExcerpt: string | null;
  }>;
};

export function formatLeadBriefFieldState(state: LeadBriefFieldState) {
  switch (state) {
    case "confirmed":
      return "Confirmed";
    case "inferred":
      return "Inferred";
    case "missing":
      return "Missing";
    case "needs_review":
      return "Needs Review";
    default:
      return state;
  }
}

export function buildLeadBriefSummary(fields: LeadBriefFields) {
  return [
    fields.client_company.value,
    fields.contact.value,
    fields.requested_service.value,
    fields.business_context.value,
    fields.fit_assessment.value,
  ]
    .filter((value): value is string => Boolean(value && value.trim()))
    .join("\n");
}

export function buildLeadBriefSnapshotSections(fields: LeadBriefFields): LeadBriefSnapshotSection[] {
  return LEAD_BRIEF_FIELD_GROUPS.map((group) => ({
    title: group.title,
    fields: group.fields.map((fieldKey) => ({
      key: fieldKey,
      label: LEAD_BRIEF_FIELD_LABELS[fieldKey],
      stateLabel: formatLeadBriefFieldState(fields[fieldKey].state),
      value: fields[fieldKey].value,
      sourceExcerpt: fields[fieldKey].source_excerpt,
    })),
  }));
}
