import type {
  NeedsAttentionReason,
  OpportunityCurrentStep,
  OpportunityListItem,
  OpportunityStatus,
} from "@proposalflow/shared-types";

const STEP_LABELS: Record<OpportunityCurrentStep, string> = {
  overview: "Overview",
  lead_brief: "Lead brief",
  discovery: "Discovery",
  proposal_draft: "Proposal draft",
  follow_up: "Follow-up",
};

const STATUS_LABELS: Record<OpportunityStatus, string> = {
  new: "Ready to scope",
  lead_brief_generated: "Lead brief ready",
  discovery_added: "Discovery added",
  discovery_reviewed: "Discovery reviewed",
  proposal_draft_generated: "Draft ready",
  proposal_in_review: "In review",
  proposal_ready: "Proposal ready",
  follow_up_drafted: "Follow-up drafted",
  archived: "Archived",
};

const NEEDS_ATTENTION_LABELS: Record<NeedsAttentionReason, string> = {
  missing_input: "Needs intake details",
  file_failed: "File processing failed",
  generation_failed: "Draft generation failed",
  billing_restricted: "Billing restricted",
  review_required: "Needs review",
};

export function formatOpportunityStepLabel(value: OpportunityCurrentStep) {
  return STEP_LABELS[value];
}

export function formatOpportunityStatusLabel(value: OpportunityStatus) {
  return STATUS_LABELS[value];
}

export function formatNeedsAttentionReasonLabel(value: NeedsAttentionReason) {
  return NEEDS_ATTENTION_LABELS[value];
}

export function formatOpportunityQueueStatus(item: OpportunityListItem) {
  if (item.needs_attention_reason) {
    return formatNeedsAttentionReasonLabel(item.needs_attention_reason);
  }

  if (item.restriction_reason) {
    return "Billing restricted";
  }

  return formatOpportunityStatusLabel(item.status);
}
