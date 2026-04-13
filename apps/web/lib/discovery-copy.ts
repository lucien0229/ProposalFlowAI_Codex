import type {
  DiscoveryFieldKey,
  DiscoveryFieldState,
  DiscoveryFields,
  DiscoverySourceNotes,
} from "@proposalflow/shared-types";

export const DISCOVERY_PAGE_COPY = {
  title: "Discovery",
  subtitle:
    "Capture the evidence, make the gaps visible, and keep the current discovery record versioned.",
  emptyTitle: "No current discovery.",
  emptyBody:
    "Generate discovery from the current opportunity context, then keep the working copy current as source evidence changes.",
  emptyAction: "Generate discovery",
  saveCurrent: "Save current",
  saveVersion: "Save version",
  regenerate: "Regenerate discovery",
  versions: "Versions",
  copySummary: "Copy summary",
  continueToProposalDraft: "Continue to Proposal Draft",
  continueToProposalDraftBlocked:
    "Resolve every missing or review-only field before moving to Proposal Draft.",
  unsavedChangesBeforeGenerate:
    "Save current before generating, regenerating, or restoring a version.",
  unsavedChangesBeforeRestore:
    "Save current before restoring a version snapshot.",
  sourceNotesTitle: "Source notes",
  sourceNotesHint:
    "Add short notes from calls, transcripts, or extracts. They stay with the current working copy and version snapshots.",
  addSourceNote: "Add note",
  restoreWarning:
    "Restoring replaces the current working discovery. Save a version first if you want to preserve the current state.",
  conflictMessage:
    "This discovery changed elsewhere. Reload the latest version before saving or regenerating.",
  thinEvidenceTitle: "Needs more evidence",
  thinEvidenceBody:
    "Add source notes or more extracted evidence, then generate the discovery workspace again.",
} as const;

export const DISCOVERY_FIELD_LABELS: Record<DiscoveryFieldKey, string> = {
  goals: "Goals",
  constraints: "Constraints",
  ambiguities: "Ambiguities",
  risk_flags: "Risk flags",
  follow_up_questions: "Follow-up questions",
};

export const DISCOVERY_FIELD_HELPER_TEXT: Record<DiscoveryFieldKey, string> = {
  goals: "What this discovery needs to answer and keep in focus.",
  constraints: "Delivery, brand, technical, or commercial guardrails that must hold.",
  ambiguities: "Open questions, unknowns, and places where the evidence is still thin.",
  risk_flags: "Risks that could affect scope, timing, or confidence in the proposal.",
  follow_up_questions: "Questions the team should resolve before Proposal Draft starts.",
};

export const DISCOVERY_FIELD_GROUPS: Array<{ title: string; fields: DiscoveryFieldKey[] }> = [
  { title: "Direction", fields: ["goals"] },
  { title: "Guardrails", fields: ["constraints", "risk_flags"] },
  { title: "Open questions", fields: ["ambiguities", "follow_up_questions"] },
];

export function formatDiscoveryFieldState(state: DiscoveryFieldState) {
  switch (state) {
    case "confirmed":
      return "Confirmed";
    case "inferred":
      return "Inferred";
    case "missing":
      return "Missing";
    case "needs_review":
      return "Needs more evidence";
    default:
      return state;
  }
}

export function buildDiscoverySummary(fields: DiscoveryFields, sourceNotes: DiscoverySourceNotes) {
  return [
    fields.goals.value,
    fields.constraints.value,
    fields.ambiguities.value,
    fields.risk_flags.value,
    fields.follow_up_questions.value,
    ...sourceNotes.map((note) => note.content),
  ]
    .filter((value): value is string => Boolean(value && value.trim()))
    .join("\n");
}
