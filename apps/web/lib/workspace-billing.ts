type WorkspaceBillingLike = {
  trial_status?: string | null;
  billing_status?: string | null;
};

const RESTRICTED_BILLING_STATES = new Set(["past_due", "canceled", "inactive"]);

function humanizeToken(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  return value.replaceAll("_", " ");
}

export function getWorkspaceRestrictionReason(workspace: WorkspaceBillingLike | null | undefined) {
  if (!workspace) {
    return null;
  }

  if (workspace.trial_status === "trial_expired") {
    return "trial_expired";
  }

  if (workspace.billing_status && RESTRICTED_BILLING_STATES.has(workspace.billing_status)) {
    return workspace.billing_status;
  }

  return null;
}

export function isWorkspaceRestricted(workspace: WorkspaceBillingLike | null | undefined) {
  return Boolean(getWorkspaceRestrictionReason(workspace));
}

export function formatWorkspaceRestrictionReason(reason: string | null | undefined) {
  return humanizeToken(reason);
}

export function getBlockedCreateActionCopy(reason: string | null | undefined) {
  const formattedReason = formatWorkspaceRestrictionReason(reason);
  if (!formattedReason) {
    return "Creating new work is currently blocked.";
  }

  return `Blocked by ${formattedReason}.`;
}
