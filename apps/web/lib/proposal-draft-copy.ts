import { BUSINESS_ROUTE_PATHS } from "@proposalflow/shared-config";
import type {
  EffectiveRuleSummary,
  OpportunityRuleOverride,
  ProposalDraftCurrentResource,
  ProposalDraftSection,
  ProposalDraftSectionKey,
  ProposalDraftSections,
} from "@proposalflow/shared-types";
import { PROPOSAL_DRAFT_SECTION_KEYS } from "@proposalflow/shared-types";

export const PROPOSAL_DRAFT_PAGE_COPY = {
  title: "Proposal Draft",
  subtitle:
    "Turn the current brief, discovery, and rules into a proposal-ready draft you can edit, version, and export.",
  emptyTitle: "No current proposal draft.",
  emptyBody:
    "Generate the first draft from the current Lead Brief, Discovery, template, and effective rules.",
  emptyAction: "Generate draft",
  saveCurrent: "Save current",
  saveVersion: "Save version",
  regenerateAll: "Regenerate all",
  copyAll: "Copy all",
  export: "Export",
  exportText: "Text",
  exportMarkdown: "Markdown",
  versions: "Versions",
  rulesSummaryTitle: "Rules Summary",
  overrideAction: "Edit override",
  clearOverride: "Clear override",
  overrideDrawerTitle: "Opportunity override",
  versionDrawerTitle: "Version history",
  restoreWarning:
    "Restoring replaces the current working draft. Save a version first if you want to keep the current state.",
  loadingTitle: "Loading proposal draft",
  loadingBody: "Fetching the current draft, rules summary, and version history.",
  blockedLeadBrief: "Generate Lead Brief before creating a proposal draft.",
  blockedDiscovery: "Complete Discovery before generating a proposal draft.",
  validationTitle: "This ruleset has conflicts. Fix them before saving.",
  errorTitle: "We couldn't load this proposal draft.",
} as const;

export type ProposalDraftCopyResultState =
  | "success"
  | "permission_denied"
  | "unavailable";

export type ProposalDraftDerivedStatusBand = {
  state: "warning";
  title: string;
  body: string;
  detail?: string | null;
};

export const PROPOSAL_DRAFT_COPY_RESULT_STATES = [
  "success",
  "permission_denied",
  "unavailable",
] as const satisfies readonly ProposalDraftCopyResultState[];

const RULES_CONFLICT_WARNING = {
  code: "RULES_CONFLICT",
  message: "The current ruleset conflicts with the saved assumptions and exclusions.",
} as const;

const RULES_CONFLICT_NOTE =
  "Resolve the assumptions and exclusions mismatch before exporting or regenerating the draft.";

const RULES_CONFLICT_SECTION_WARNINGS: Partial<Record<ProposalDraftSectionKey, string>> = {
  assumptions: "Rules conflict: assumptions need alignment before the draft is exported.",
  exclusions: "Rules conflict: exclusions need alignment before the draft is exported.",
};

function orderedSectionKeys(
  sections: ProposalDraftSections | null,
  summary?: EffectiveRuleSummary | null,
) {
  if (!sections) {
    return [] as ProposalDraftSectionKey[];
  }

  const ordered: ProposalDraftSectionKey[] = [];
  const seen = new Set<ProposalDraftSectionKey>();
  for (const sectionKey of summary?.section_order ?? []) {
    if (sectionKey in sections && !seen.has(sectionKey)) {
      ordered.push(sectionKey);
      seen.add(sectionKey);
    }
  }
  for (const sectionKey of PROPOSAL_DRAFT_SECTION_KEYS) {
    if (!seen.has(sectionKey)) {
      ordered.push(sectionKey);
    }
  }
  return ordered;
}

function normalizeSectionLines(value: string) {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function normalizeRulePreview(values: string[] | undefined) {
  return (values ?? []).map((value) => value.trim()).filter(Boolean);
}

export function buildProposalDraftCopyPayload(
  sections: ProposalDraftSections | null,
  summary?: EffectiveRuleSummary | null,
) {
  if (!sections) {
    return "";
  }

  return orderedSectionKeys(sections, summary).map((sectionKey) => {
    const section = sections[sectionKey];
    return `${section.label}\n\n${section.content.trim()}`;
  }).join("\n\n");
}

export function resolveProposalDraftCopyResultState(
  error?: unknown,
): ProposalDraftCopyResultState {
  if (!error) {
    return "success";
  }

  if (
    error instanceof DOMException &&
    (error.name === "NotAllowedError" || error.name === "SecurityError")
  ) {
    return "permission_denied";
  }

  return "unavailable";
}

export function formatProposalDraftRestrictionReason(
  restrictionReason: string | null | undefined,
) {
  return restrictionReason ? restrictionReason.replaceAll("_", " ") : null;
}

export function resolveProposalDraftBillingAction(
  restrictionReason: string | null | undefined,
) {
  if (restrictionReason === "trial_expired" || restrictionReason === "inactive") {
    return {
      label: "Upgrade plan",
      href: BUSINESS_ROUTE_PATHS.billing,
    };
  }

  return {
    label: "Manage billing",
    href: BUSINESS_ROUTE_PATHS.billing,
  };
}

export function buildRulesSummaryRows(
  summary: EffectiveRuleSummary | null,
) {
  if (!summary) {
    return [
      { label: "Current template", value: "Loading current rule stack" },
      { label: "Effective rules", value: "Loading the active section and module guidance" },
      { label: "Tone", value: "Waiting for current baseline" },
    ];
  }

  const requiredSectionLabels = summary.required_sections
    .slice(0, 3)
    .map((sectionKey) => formatSectionKey(sectionKey));
  const effectiveRules = [
    requiredSectionLabels.length ? `${requiredSectionLabels.join(" · ")} required` : null,
    summary.service_modules?.slice(0, 2).join(" · ") ?? null,
  ]
    .filter(Boolean)
    .join(" · ");

  return [
    {
      label: "Current template",
      value: summary.template_label ?? summary.template_key.replaceAll("_", " "),
    },
    {
      label: "Effective rules",
      value: effectiveRules || "Using the current workspace section and module guidance",
    },
    {
      label: "Tone",
      value: summary.tone_profile.replaceAll("_", " "),
    },
    {
      label: "Assumptions",
      value: summary.assumptions_preview.slice(0, 2).join(" · ") || "No assumptions yet",
    },
    {
      label: "Exclusions",
      value: summary.exclusions_preview.slice(0, 2).join(" · ") || "No exclusions yet",
    },
    {
      label: "Terminology",
      value:
        summary.preferred_terminology?.slice(0, 3).join(" · ") ||
        "No preferred terminology yet",
    },
  ];
}

export function getProposalDraftSectionList(
  sections: ProposalDraftSections | null,
  summary?: EffectiveRuleSummary | null,
) {
  if (!sections) {
    return [] as ProposalDraftSection[];
  }

  return orderedSectionKeys(sections, summary).map((sectionKey) => sections[sectionKey]);
}

export type ProposalDraftOverrideFormState = {
  updatedAt: string | null;
  templateKeyOverride: string | null;
  toneProfileOverride: string | null;
  assumptionsOverride: string;
  exclusionsOverride: string;
  serviceModulesOverride: string;
  preferredTerminologyAdditions: string;
  bannedTerminologyAdditions: string;
  defaultCtaStyleOverride: string | null;
};

export function createProposalDraftOverrideFormState(
  override: OpportunityRuleOverride | null | undefined,
  summary: EffectiveRuleSummary | null,
): ProposalDraftOverrideFormState {
  return {
    updatedAt: override?.updated_at ?? null,
    templateKeyOverride: override?.template_key_override ?? summary?.template_key ?? "development_agency",
    toneProfileOverride: override?.tone_profile_override ?? summary?.tone_profile ?? "consultative",
    assumptionsOverride: (override?.assumptions_override ?? summary?.assumptions_preview ?? []).join("\n"),
    exclusionsOverride: (override?.exclusions_override ?? summary?.exclusions_preview ?? []).join("\n"),
    serviceModulesOverride: (override?.service_modules_override ?? summary?.service_modules ?? []).join("\n"),
    preferredTerminologyAdditions: (override?.preferred_terminology_additions ?? []).join("\n"),
    bannedTerminologyAdditions: (override?.banned_terminology_additions ?? []).join("\n"),
    defaultCtaStyleOverride: override?.default_cta_style_override ?? "schedule_workshop",
  };
}

export function normalizeRuleListInput(value: string) {
  return value
    .split(/\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function formatSectionKey(sectionKey: ProposalDraftSectionKey) {
  return sectionKey
    .replaceAll("_", " ")
    .replace(/\b\w/g, (match) => match.toUpperCase());
}

export function deriveProposalDraftRenderState(
  proposalDraft: ProposalDraftCurrentResource | null,
  draftSections: ProposalDraftSections | null,
  summary: EffectiveRuleSummary | null,
): ProposalDraftCurrentResource | null {
  if (!proposalDraft || !draftSections || !summary) {
    return proposalDraft;
  }

  const nextSections = Object.fromEntries(
    Object.entries(draftSections).map(([sectionKey, section]) => [sectionKey, { ...section }]),
  ) as ProposalDraftSections;
  const warnings = proposalDraft.warnings.filter((warning) => warning.code !== RULES_CONFLICT_WARNING.code);
  const confidenceNotes = proposalDraft.confidence_notes.filter((note) => note !== RULES_CONFLICT_NOTE);

  const assumptionsConflict =
    JSON.stringify(normalizeSectionLines(nextSections.assumptions.content)) !==
    JSON.stringify(normalizeRulePreview(summary.assumptions_preview));
  const exclusionsConflict =
    JSON.stringify(normalizeSectionLines(nextSections.exclusions.content)) !==
    JSON.stringify(normalizeRulePreview(summary.exclusions_preview));
  const rulesConflict = assumptionsConflict || exclusionsConflict;

  if (rulesConflict) {
    warnings.push({ ...RULES_CONFLICT_WARNING });
    confidenceNotes.push(RULES_CONFLICT_NOTE);
  }

  for (const sectionKey of ["assumptions", "exclusions"] as const) {
    const hasConflict =
      (sectionKey === "assumptions" && assumptionsConflict) ||
      (sectionKey === "exclusions" && exclusionsConflict);
    nextSections[sectionKey] = {
      ...nextSections[sectionKey],
      warning: hasConflict
        ? RULES_CONFLICT_SECTION_WARNINGS[sectionKey] ?? nextSections[sectionKey].warning
        : nextSections[sectionKey].warning === RULES_CONFLICT_SECTION_WARNINGS[sectionKey]
          ? null
          : nextSections[sectionKey].warning,
    };
  }

  return {
    ...proposalDraft,
    sections: nextSections,
    warnings,
    confidence_notes: confidenceNotes,
    effective_rule_summary: summary,
    has_override: summary.has_override ?? proposalDraft.has_override,
  };
}

export function deriveProposalDraftStatusBand(
  proposalDraft: ProposalDraftCurrentResource | null,
): ProposalDraftDerivedStatusBand | null {
  if (!proposalDraft) {
    return null;
  }

  const primaryWarning =
    proposalDraft.warnings.find((warning) => warning.code.includes("RULES_CONFLICT")) ??
    proposalDraft.warnings.find((warning) => warning.code.includes("INPUT")) ??
    proposalDraft.warnings[0];
  if (!primaryWarning) {
    return null;
  }

  if (primaryWarning.code.includes("RULES_CONFLICT")) {
    const rulesConflictDetail =
      proposalDraft.confidence_notes.find((note) =>
        note.toLowerCase().includes("assumptions and exclusions mismatch"),
      ) ?? proposalDraft.confidence_notes[0];
    return {
      state: "warning",
      title: "Rules conflict needs resolution",
      body: primaryWarning.message,
      detail:
        rulesConflictDetail ??
        "Affected actions: regenerate, save current, save-version, export",
    };
  }

  if (primaryWarning.code.includes("INPUT")) {
    return {
      state: "warning",
      title: "Missing inputs are holding the draft back",
      body: primaryWarning.message,
      detail:
        proposalDraft.confidence_notes[0] ??
        "Affected actions: generate, regenerate, export",
    };
  }

  if (primaryWarning.code.includes("CONFIDENCE") || proposalDraft.confidence_notes.length) {
    return {
      state: "warning",
      title: "Low confidence needs review",
      body: primaryWarning.message,
      detail:
        proposalDraft.confidence_notes[0] ??
        "Review the flagged chapter before copying or exporting the draft.",
    };
  }

  return {
    state: "warning",
    title: "Draft warning needs review",
    body: primaryWarning.message,
    detail: proposalDraft.confidence_notes[0] ?? null,
  };
}
