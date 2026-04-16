"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

import { BUSINESS_ROUTE_PATHS } from "@proposalflow/shared-config";
import type {
  EffectiveRuleSummary,
  ProposalDraftCurrentResource,
  ProposalDraftSectionKey,
  ProposalDraftSections,
  ProposalDraftVersion,
  ProposalDraftVersionDetail,
} from "@proposalflow/shared-types";
import type { OpportunityIntakeOverviewResponse } from "@/lib/opportunities-api";

import { ProductStateBlock } from "@/components/product-state-block";
import { ProposalDraftChapterBlock } from "@/components/opportunities/proposal-draft-chapter-block";
import { ProposalDraftOverrideDrawer } from "@/components/opportunities/proposal-draft-override-drawer";
import { ProposalDraftRulesBar } from "@/components/opportunities/proposal-draft-rules-bar";
import { ProposalDraftStatusBand } from "@/components/opportunities/proposal-draft-status-band";
import { ProposalDraftVersionDrawer } from "@/components/opportunities/proposal-draft-version-drawer";
import {
  exportProposalDraft,
  fetchProposalDraftVersionDetail,
  fetchProposalDraftWorkspace,
  generateProposalDraft,
  regenerateProposalDraftSection,
  restoreProposalDraftVersion,
  saveProposalDraftCurrent,
  saveProposalDraftVersion,
} from "@/lib/proposal-draft-api";
import {
  PROPOSAL_DRAFT_PAGE_COPY,
  buildProposalDraftCopyPayload,
  createProposalDraftOverrideFormState,
  deriveProposalDraftRenderState,
  deriveProposalDraftStatusBand,
  formatProposalDraftRestrictionReason,
  getProposalDraftSectionList,
  normalizeRuleListInput,
  resolveProposalDraftBillingAction,
  resolveProposalDraftCopyResultState,
  type ProposalDraftOverrideFormState,
} from "@/lib/proposal-draft-copy";
import { readBrowserCsrfToken, ProductApiError } from "@/lib/product-api";
import {
  clearOpportunityRuleOverride,
  fetchOpportunityEffectiveRules,
  fetchOpportunityRuleOverride,
  fetchTemplates,
  saveOpportunityRuleOverride,
  type OpportunityRuleOverrideUpdateRequest,
  type TemplateListItem,
} from "@/lib/templates-rules-api";

type ProposalDraftWorkspaceProps = {
  opportunityId: string;
  opportunityDetail: OpportunityIntakeOverviewResponse;
};

type WorkspaceState = "loading" | "empty" | "ready" | "error";
type NoticeTone = "info" | "success" | "error";
type DrawerMode = "override" | "versions" | null;
type MutationAction =
  | "generate"
  | "save_current"
  | "save_version"
  | "copy"
  | "override"
  | "restore"
  | "export"
  | `regenerate:${ProposalDraftSectionKey}`
  | null;

type StatusBandState = {
  state: "blocked" | "error" | "retry" | "success" | "warning";
  title: string;
  body: string;
  detail?: string | null;
  primaryAction?: {
    label: string;
    href?: string;
    onAction?: () => void;
  };
};

const PROPOSAL_DRAFT_BLOCKED_ACTIONS = {
  generate: "generate",
  regenerate: "regenerate",
  saveCurrent: "save current",
  saveVersion: "save-version",
  restore: "restore",
  export: "export",
} as const;

function ProposalDraftStepper() {
  const steps = ["Lead Intake", "Lead Brief", "Discovery", "Proposal Draft", "Follow-up"] as const;
  return (
    <nav className="proposal-draft-stepper" aria-label="Opportunity workflow">
      {steps.map((step, index) => (
        <span
          key={step}
          className="proposal-draft-stepper__item"
          data-active={step === "Proposal Draft"}
          data-complete={index < 3}
        >
          <span className="proposal-draft-stepper__index">{index + 1}</span>
          <span>{step}</span>
        </span>
      ))}
    </nav>
  );
}

function cloneSections(sections: ProposalDraftSections): ProposalDraftSections {
  return JSON.parse(JSON.stringify(sections)) as ProposalDraftSections;
}

function readObject(payload: unknown, key: string) {
  if (!payload || typeof payload !== "object") {
    return null;
  }
  const value = (payload as Record<string, unknown>)[key];
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

function readString(payload: unknown, key: string) {
  if (!payload || typeof payload !== "object") {
    return null;
  }
  const value = (payload as Record<string, unknown>)[key];
  return typeof value === "string" ? value : null;
}

function readStringArray(payload: unknown, key: string) {
  if (!payload || typeof payload !== "object") {
    return [];
  }
  const value = (payload as Record<string, unknown>)[key];
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter((entry): entry is string => typeof entry === "string");
}

function getApiErrorDetails(error: unknown, fallbackMessage: string) {
  if (error instanceof ProductApiError) {
    const errorPayload = readObject(error.payload, "error");
    const details = readObject(errorPayload, "details");

    return {
      status: error.status,
      message:
        readString(errorPayload, "message") ??
        readString(errorPayload, "detail") ??
        error.message ??
        fallbackMessage,
      detail:
        readString(details, "reload_hint") ??
        readString(details, "detail") ??
        readString(errorPayload, "detail"),
      restrictionReason: readString(errorPayload, "restriction_reason"),
      blockedBy: readString(details, "blocked_by"),
      actionLabel: readString(details, "action_label"),
      overwriteWarning: readString(details, "overwrite_warning"),
      blockedActions: readStringArray(details, "blocked_actions"),
    };
  }

  if (error instanceof Error) {
    return {
      status: 500,
      message: error.message,
      detail: null,
      restrictionReason: null,
      blockedBy: null,
      actionLabel: null,
      overwriteWarning: null,
      blockedActions: [],
    };
  }

  return {
    status: 500,
    message: fallbackMessage,
    detail: null,
    restrictionReason: null,
    blockedBy: null,
    actionLabel: null,
    overwriteWarning: null,
    blockedActions: [],
  };
}

function hasUnsavedProposalDraftChanges(
  currentDraft: ProposalDraftCurrentResource | null,
  draftSections: ProposalDraftSections | null,
) {
  if (!currentDraft || !draftSections) {
    return false;
  }

  return JSON.stringify(currentDraft.sections) !== JSON.stringify(draftSections);
}

function createVersionList(versions: ProposalDraftVersion[]) {
  return versions.slice().sort((left, right) => right.version_no - left.version_no);
}

function buildSaveOverridePayload(
  formState: ProposalDraftOverrideFormState,
): OpportunityRuleOverrideUpdateRequest {
  return {
    expected_updated_at: formState.updatedAt ?? new Date(0).toISOString(),
    override: {
      template_key_override:
        (formState.templateKeyOverride as OpportunityRuleOverrideUpdateRequest["override"]["template_key_override"]) ??
        "development_agency",
      tone_profile_override:
        (formState.toneProfileOverride as OpportunityRuleOverrideUpdateRequest["override"]["tone_profile_override"]) ??
        "consultative",
      assumptions_override: normalizeRuleListInput(formState.assumptionsOverride),
      exclusions_override: normalizeRuleListInput(formState.exclusionsOverride),
      service_modules_override: normalizeRuleListInput(formState.serviceModulesOverride),
      preferred_terminology_additions: normalizeRuleListInput(formState.preferredTerminologyAdditions),
      banned_terminology_additions: normalizeRuleListInput(formState.bannedTerminologyAdditions),
      default_cta_style_override: formState.defaultCtaStyleOverride ?? "schedule_workshop",
      updated_at: formState.updatedAt,
    },
  };
}

function downloadProposalDraftExport(
  opportunityId: string,
  format: "text" | "markdown",
  content: string,
) {
  const blob = new Blob([content], {
    type: format === "markdown" ? "text/markdown;charset=utf-8" : "text/plain;charset=utf-8",
  });
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = `proposal-draft-${opportunityId}.${format === "markdown" ? "md" : "txt"}`;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 0);
}

export function ProposalDraftWorkspace({
  opportunityId,
  opportunityDetail,
}: ProposalDraftWorkspaceProps) {
  const [workspaceState, setWorkspaceState] = useState<WorkspaceState>("loading");
  const [currentDraft, setCurrentDraft] = useState<ProposalDraftCurrentResource | null>(null);
  const [draftSections, setDraftSections] = useState<ProposalDraftSections | null>(null);
  const [versions, setVersions] = useState<ProposalDraftVersion[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<ProposalDraftVersionDetail | null>(null);
  const [restoreTargetVersionNo, setRestoreTargetVersionNo] = useState<number | null>(null);
  const [rulesSummary, setRulesSummary] = useState<EffectiveRuleSummary | null>(null);
  const [templates, setTemplates] = useState<TemplateListItem[]>([]);
  const [overrideForm, setOverrideForm] = useState<ProposalDraftOverrideFormState | null>(null);
  const [drawerMode, setDrawerMode] = useState<DrawerMode>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [noticeTone, setNoticeTone] = useState<NoticeTone | null>(null);
  const [activeAction, setActiveAction] = useState<MutationAction>(null);
  const [statusBand, setStatusBand] = useState<StatusBandState | null>(null);
  const [blockedActions, setBlockedActions] = useState<string[]>([]);
  const [pendingRegenerateSection, setPendingRegenerateSection] = useState<ProposalDraftSectionKey | null>(null);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const loadRequestRef = useRef(0);
  const versionLoadRequestRef = useRef(0);
  const lastDrawerTriggerRef = useRef<HTMLElement | null>(null);
  const versionTriggerRef = useRef<HTMLButtonElement | null>(null);
  const overrideTemplateFieldRef = useRef<HTMLSelectElement | null>(null);
  const versionCloseButtonRef = useRef<HTMLButtonElement | null>(null);

  function clearRestrictionState() {
    setBlockedActions([]);
  }

  function applyRestriction(details: ReturnType<typeof getApiErrorDetails>) {
    const nextBlockedActions = details.blockedActions;
    const billingAction = resolveProposalDraftBillingAction(details.restrictionReason);
    setBlockedActions(nextBlockedActions);
    setStatusBand({
      state: "blocked",
      title: "Billing action required",
      body: details.message,
      detail: [
        details.actionLabel,
        formatProposalDraftRestrictionReason(details.restrictionReason),
        nextBlockedActions.length ? `Blocked actions: ${nextBlockedActions.join(", ")}` : null,
      ]
        .filter(Boolean)
        .join(" · "),
      primaryAction: billingAction,
    });
  }

  function isBlockedAction(action: string) {
    return blockedActions.includes(action);
  }

  function getBlockedActionCopy(action: string) {
    if (!isBlockedAction(action)) {
      return null;
    }

    if (action === PROPOSAL_DRAFT_BLOCKED_ACTIONS.regenerate) {
      return "Regenerate is blocked until billing access is restored.";
    }

    if (action === PROPOSAL_DRAFT_BLOCKED_ACTIONS.restore) {
      return "Restore is blocked until billing access is restored.";
    }

    return "This action is blocked until billing access is restored.";
  }

  async function refreshRulesSummary() {
    const payload = await fetchOpportunityEffectiveRules(opportunityId);
    setRulesSummary({
      ...payload.effective_rule_summary,
      has_override: payload.has_override,
    });
  }

  async function loadOverrideForm() {
    const payload = await fetchOpportunityRuleOverride(opportunityId);
    setOverrideForm(createProposalDraftOverrideFormState(payload.override, rulesSummary));
    return payload;
  }

  async function loadTemplatesIfNeeded() {
    if (templates.length) {
      return templates;
    }
    const payload = await fetchTemplates();
    setTemplates(payload.data);
    return payload.data;
  }

  async function loadWorkspace() {
    const requestId = loadRequestRef.current + 1;
    loadRequestRef.current = requestId;
    setWorkspaceState("loading");
    setStatusBand(null);
    setPendingRegenerateSection(null);
    clearRestrictionState();

    try {
      const [proposalPayload, effectiveRulesPayload] = await Promise.all([
        fetchProposalDraftWorkspace(opportunityId),
        fetchOpportunityEffectiveRules(opportunityId).catch(() => null),
      ]);

      if (loadRequestRef.current !== requestId) {
        return;
      }

      const nextVersions = createVersionList(proposalPayload.versions);
      setVersions(nextVersions);
      setSelectedVersion(null);
      setRestoreTargetVersionNo(null);
      setRulesSummary(
        effectiveRulesPayload
          ? {
              ...effectiveRulesPayload.effective_rule_summary,
              has_override: effectiveRulesPayload.has_override,
            }
          : proposalPayload.proposal_draft?.effective_rule_summary ?? null,
      );

      if (!proposalPayload.proposal_draft) {
        setCurrentDraft(null);
        setDraftSections(null);
        setWorkspaceState("empty");
        return;
      }

      setCurrentDraft(proposalPayload.proposal_draft);
      setDraftSections(cloneSections(proposalPayload.proposal_draft.sections));
      setWorkspaceState("ready");
    } catch (error) {
      if (loadRequestRef.current !== requestId) {
        return;
      }

      const details = getApiErrorDetails(error, PROPOSAL_DRAFT_PAGE_COPY.errorTitle);
      setWorkspaceState("error");
      setCurrentDraft(null);
      setDraftSections(null);
      setVersions([]);
      setStatusBand({
        state: "error",
        title: PROPOSAL_DRAFT_PAGE_COPY.errorTitle,
        body: details.message,
        detail: details.detail,
        primaryAction: {
          label: "Retry",
          onAction: () => {
            void loadWorkspace();
          },
        },
      });
    }
  }

  useEffect(() => {
    void loadWorkspace();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opportunityId]);

  useEffect(() => {
    if (drawerMode === "override") {
      requestAnimationFrame(() => {
        overrideTemplateFieldRef.current?.focus();
      });
    }
  }, [drawerMode, overrideForm]);

  function closeDrawer() {
    setDrawerMode(null);
    setRestoreTargetVersionNo(null);
    requestAnimationFrame(() => {
      lastDrawerTriggerRef.current?.focus();
    });
  }

  function updateSection(sectionKey: ProposalDraftSectionKey, value: string) {
    setDraftSections((current) => {
      if (!current) {
        return current;
      }
      const next = cloneSections(current);
      next[sectionKey] = {
        ...next[sectionKey],
        content: value,
        is_user_edited: true,
      };
      return next;
    });
    setNotice(null);
    setNoticeTone(null);
  }

  function updateOverrideField(field: keyof ProposalDraftOverrideFormState, value: string) {
    setOverrideForm((current) => {
      if (!current) {
        return current;
      }
      return {
        ...current,
        [field]: value,
      };
    });
  }

  async function openOverrideDrawer() {
    lastDrawerTriggerRef.current =
      typeof document !== "undefined" && document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    setDrawerMode("override");
    setNotice(null);
    setNoticeTone(null);

    try {
      await Promise.all([loadTemplatesIfNeeded(), loadOverrideForm(), refreshRulesSummary()]);
    } catch (error) {
      const details = getApiErrorDetails(error, "We couldn't load the current opportunity override.");
      setNotice(details.message);
      setNoticeTone("error");
    }
  }

  function openVersionsDrawer() {
    lastDrawerTriggerRef.current = versionTriggerRef.current;
    setDrawerMode("versions");
    setRestoreTargetVersionNo(null);
    setExportMenuOpen(false);
  }

  async function handleGenerate() {
    setActiveAction("generate");
    setNotice("Generating proposal draft…");
    setNoticeTone("info");
    setStatusBand(null);

    try {
      await generateProposalDraft(
        opportunityId,
        {
          template_key: rulesSummary?.template_key ?? "development_agency",
          use_opportunity_overrides: true,
          force_low_confidence: false,
        },
        { csrfToken: readBrowserCsrfToken() },
      );

      await loadWorkspace();
      clearRestrictionState();
      setNotice("Proposal draft ready for editing.");
      setNoticeTone("success");
    } catch (error) {
      const details = getApiErrorDetails(error, "Proposal Draft generation failed.");
      setNoticeTone("error");
      setNotice(details.message);

      if (details.status === 403) {
        applyRestriction(details);
      } else if (details.status === 409 && details.blockedBy === "lead_brief") {
        setStatusBand({
          state: "blocked",
          title: "Lead Brief is required",
          body: PROPOSAL_DRAFT_PAGE_COPY.blockedLeadBrief,
          detail: "Lead Brief",
          primaryAction: {
            label: "Go to Lead Brief",
            href: BUSINESS_ROUTE_PATHS.opportunityStep(opportunityId, "lead_brief"),
          },
        });
      } else if (details.status === 409 && details.blockedBy === "discovery") {
        setStatusBand({
          state: "blocked",
          title: "Discovery is required",
          body: PROPOSAL_DRAFT_PAGE_COPY.blockedDiscovery,
          detail: "Discovery",
          primaryAction: {
            label: "Go to Discovery",
            href: BUSINESS_ROUTE_PATHS.opportunityStep(opportunityId, "discovery"),
          },
        });
      } else {
        setStatusBand({
          state: "error",
          title: "Draft action failed",
          body: details.message,
          detail: details.detail,
          primaryAction: {
            label: "Retry",
            onAction: () => {
              void loadWorkspace();
            },
          },
        });
      }
    } finally {
      setActiveAction(null);
    }
  }

  async function handleSaveCurrent() {
    if (!currentDraft || !draftSections) {
      return;
    }
    setActiveAction("save_current");
    setNotice("Saving current draft…");
    setNoticeTone("info");

    try {
      const response = await saveProposalDraftCurrent(
        opportunityId,
        {
          expected_revision_no: currentDraft.current_revision_no,
          sections: draftSections,
        },
        { csrfToken: readBrowserCsrfToken() },
      );
      clearRestrictionState();
      setCurrentDraft(response.proposal_draft);
      setDraftSections(response.proposal_draft ? cloneSections(response.proposal_draft.sections) : null);
      setVersions(createVersionList(response.versions));
      setPendingRegenerateSection(null);
      setNotice("Current proposal draft saved.");
      setNoticeTone("success");
      void refreshRulesSummary();
    } catch (error) {
      const details = getApiErrorDetails(error, "Proposal Draft save failed.");
      setNotice(details.message);
      setNoticeTone("error");
      if (details.status === 403) {
        applyRestriction(details);
      } else {
        setStatusBand({
          state: "retry",
          title: "Save current needs attention",
          body: details.message,
          detail: details.detail,
        });
      }
    } finally {
      setActiveAction(null);
    }
  }

  async function handleSaveVersion() {
    if (!currentDraft || !draftSections) {
      return;
    }
    setActiveAction("save_version");
    setNotice("Saving version snapshot…");
    setNoticeTone("info");

    try {
      const response = await saveProposalDraftVersion(
        opportunityId,
        {
          expected_revision_no: currentDraft.current_revision_no,
          version_note: null,
          sections: draftSections,
        },
        { csrfToken: readBrowserCsrfToken() },
      );
      clearRestrictionState();
      setCurrentDraft(response.proposal_draft);
      setDraftSections(response.proposal_draft ? cloneSections(response.proposal_draft.sections) : null);
      setVersions(createVersionList(response.versions));
      setNotice("Proposal Draft version saved.");
      setNoticeTone("success");
    } catch (error) {
      const details = getApiErrorDetails(error, "Proposal Draft version save failed.");
      setNotice(details.message);
      setNoticeTone("error");
      if (details.status === 403) {
        applyRestriction(details);
      }
    } finally {
      setActiveAction(null);
    }
  }

  async function handleCopySummary() {
    if (!draftSections) {
      return;
    }

    setActiveAction("copy");
    const payload = buildProposalDraftCopyPayload(
      draftSections,
      rulesSummary ?? currentDraft?.effective_rule_summary ?? null,
    );

    try {
      await navigator.clipboard.writeText(payload);
      setNotice("Proposal draft copied in chapter order.");
      setNoticeTone("success");
    } catch (error) {
      const copyState = resolveProposalDraftCopyResultState(error);
      setNotice(
        copyState === "permission_denied"
          ? "Clipboard access is blocked. Use Text export or copy from the editor instead."
          : "Proposal draft copy is unavailable right now.",
      );
      setNoticeTone("error");
    } finally {
      setActiveAction(null);
    }
  }

  async function performRegenerateSection(
    sectionKey: ProposalDraftSectionKey,
    overwriteCurrentEdit: boolean,
  ) {
    if (!currentDraft) {
      return;
    }

    setActiveAction(`regenerate:${sectionKey}`);
    setNotice("Regenerating section…");
    setNoticeTone("info");

    try {
      const response = await regenerateProposalDraftSection(
        opportunityId,
        sectionKey,
        {
          expected_revision_no: currentDraft.current_revision_no,
          overwrite_current_edit: overwriteCurrentEdit,
        },
        { csrfToken: readBrowserCsrfToken() },
      );
      clearRestrictionState();
      setCurrentDraft(response.proposal_draft);
      setDraftSections(response.proposal_draft ? cloneSections(response.proposal_draft.sections) : null);
      setVersions(createVersionList(response.versions));
      setPendingRegenerateSection(null);
      setNotice("Section regenerated from the current rule stack.");
      setNoticeTone("success");
    } catch (error) {
      const details = getApiErrorDetails(error, "Section regenerate failed.");
      setNotice(details.message);
      setNoticeTone("error");
      if (details.status === 403) {
        applyRestriction(details);
      } else if (details.overwriteWarning) {
        setPendingRegenerateSection(sectionKey);
      }
    } finally {
      setActiveAction(null);
    }
  }

  function handleRequestRegenerate(sectionKey: ProposalDraftSectionKey) {
    if (!currentDraft || !draftSections) {
      return;
    }

    if (isBlockedAction(PROPOSAL_DRAFT_BLOCKED_ACTIONS.regenerate)) {
      return;
    }

    const currentSection = currentDraft.sections[sectionKey];
    const draftSection = draftSections[sectionKey];
    const hasUnsavedSectionEdit =
      currentSection.content !== draftSection.content ||
      currentSection.last_edited_at !== draftSection.last_edited_at;

    if (hasUnsavedSectionEdit) {
      setPendingRegenerateSection(sectionKey);
      return;
    }

    void performRegenerateSection(sectionKey, false);
  }

  async function handleConfirmRegenerate(sectionKey: ProposalDraftSectionKey) {
    await performRegenerateSection(sectionKey, true);
  }

  async function handleSaveOverride() {
    if (!overrideForm) {
      return;
    }
    setActiveAction("override");
    setNotice("Saving opportunity override…");
    setNoticeTone("info");

    try {
      const response = await saveOpportunityRuleOverride(
        opportunityId,
        buildSaveOverridePayload(overrideForm),
        { csrfToken: readBrowserCsrfToken() },
      );
      const effectiveRuleSummary = response.effective_rule_summary ?? rulesSummary;
      setRulesSummary(effectiveRuleSummary ? { ...effectiveRuleSummary, has_override: true } : null);
      setOverrideForm(createProposalDraftOverrideFormState(response.override, effectiveRuleSummary));
      setNotice(response.warning?.message ?? "Opportunity override saved.");
      setNoticeTone("success");
    } catch (error) {
      const details = getApiErrorDetails(error, "Opportunity override save failed.");
      setNotice(details.message);
      setNoticeTone("error");
    } finally {
      setActiveAction(null);
    }
  }

  async function handleClearOverride() {
    setActiveAction("override");
    setNotice("Clearing opportunity override…");
    setNoticeTone("info");

    try {
      const response = await clearOpportunityRuleOverride(opportunityId, {
        csrfToken: readBrowserCsrfToken(),
      });
      const reloadedOverride = await loadOverrideForm();
      const effectiveRuleSummary = response.effective_rule_summary ?? rulesSummary;
      setRulesSummary(effectiveRuleSummary ? { ...effectiveRuleSummary, has_override: false } : null);
      setOverrideForm(createProposalDraftOverrideFormState(reloadedOverride.override, effectiveRuleSummary));
      setNotice(response.warning?.message ?? "Opportunity override cleared.");
      setNoticeTone("success");
    } catch (error) {
      const details = getApiErrorDetails(error, "Opportunity override clear failed.");
      setNotice(details.message);
      setNoticeTone("error");
    } finally {
      setActiveAction(null);
    }
  }

  async function handleSelectVersion(versionNo: number) {
    const requestId = versionLoadRequestRef.current + 1;
    versionLoadRequestRef.current = requestId;
    setRestoreTargetVersionNo(null);

    try {
      const response = await fetchProposalDraftVersionDetail(opportunityId, versionNo);
      if (versionLoadRequestRef.current !== requestId) {
        return;
      }
      setSelectedVersion(response.version);
    } catch (error) {
      const details = getApiErrorDetails(error, "We couldn't load that version.");
      setNotice(details.message);
      setNoticeTone("error");
    }
  }

  async function handleConfirmRestore() {
    if (!currentDraft || restoreTargetVersionNo === null) {
      return;
    }

    setActiveAction("restore");
    setNotice("Restoring saved version…");
    setNoticeTone("info");

    try {
      const response = await restoreProposalDraftVersion(
        opportunityId,
        {
          expected_revision_no: currentDraft.current_revision_no,
          version_no: restoreTargetVersionNo,
        },
        { csrfToken: readBrowserCsrfToken() },
      );
      clearRestrictionState();
      setCurrentDraft(response.proposal_draft);
      setDraftSections(response.proposal_draft ? cloneSections(response.proposal_draft.sections) : null);
      setVersions(createVersionList(response.versions));
      setRestoreTargetVersionNo(null);
      setNotice("Version restored.");
      setNoticeTone("success");
    } catch (error) {
      const details = getApiErrorDetails(error, "Version restore failed.");
      setNotice(details.message);
      setNoticeTone("error");
      if (details.status === 403) {
        applyRestriction(details);
      }
    } finally {
      setActiveAction(null);
    }
  }

  async function handleExport(format: "text" | "markdown") {
    setActiveAction("export");
    setNotice(`Preparing ${format === "markdown" ? "Markdown" : "Text"} export…`);
    setNoticeTone("info");

    try {
      const content = await exportProposalDraft(opportunityId, format);
      clearRestrictionState();
      downloadProposalDraftExport(opportunityId, format, content);
      setNotice(`${format === "markdown" ? "Markdown" : "Text"} export is ready.`);
      setNoticeTone("success");
      setExportMenuOpen(false);
    } catch (error) {
      const details = getApiErrorDetails(error, "Proposal Draft export failed.");
      setNotice(details.message);
      setNoticeTone("error");
      if (details.status === 403) {
        applyRestriction(details);
      }
    } finally {
      setActiveAction(null);
    }
  }

  const workspaceSummary = useMemo(() => {
    if (workspaceState === "loading") {
      return {
        label: "Loading workspace",
        detail: "Proposal Draft",
      };
    }

    if (workspaceState === "empty") {
      return {
        label: "Empty workspace",
        detail: opportunityDetail.opportunity.company_name,
      };
    }

    if (currentDraft) {
      return {
        label: `Revision ${currentDraft.current_revision_no}`,
        detail: `${opportunityDetail.opportunity.company_name} · Proposal Draft`,
      };
    }

    return {
      label: "Route state",
      detail: "Proposal Draft",
    };
  }, [currentDraft, opportunityDetail.opportunity.company_name, workspaceState]);

  const hasDirtyDraft = hasUnsavedProposalDraftChanges(currentDraft, draftSections);
  const isWorking = activeAction !== null;
  const renderedDraftState = useMemo(
    () =>
      deriveProposalDraftRenderState(
        currentDraft,
        draftSections,
        rulesSummary ?? currentDraft?.effective_rule_summary ?? null,
      ),
    [currentDraft, draftSections, rulesSummary],
  );
  const derivedBand = useMemo(() => deriveProposalDraftStatusBand(renderedDraftState), [renderedDraftState]);
  const renderedStatusBand = statusBand ?? derivedBand;

  return (
    <div className="proposal-draft-workspace" data-testid="proposal-draft-workspace">
      <header className="proposal-draft-workspace__header" data-testid="proposal-draft-header">
        <div className="proposal-draft-workspace__copy">
          <span className="panel-kicker">Proposal Draft workspace</span>
          <h2>{PROPOSAL_DRAFT_PAGE_COPY.title}</h2>
          <p>{PROPOSAL_DRAFT_PAGE_COPY.subtitle}</p>
        </div>

        <div className="proposal-draft-workspace__meta">
          <span className="product-chip">{workspaceSummary.label}</span>
          <span className="product-chip">{workspaceSummary.detail}</span>
          <ProposalDraftStepper />
        </div>
      </header>

      <ProposalDraftRulesBar
        opportunityId={opportunityId}
        summary={rulesSummary}
        isWorking={isWorking}
        onOpenOverride={() => void openOverrideDrawer()}
        onClearOverride={() => void handleClearOverride()}
      />

      {renderedStatusBand ? <ProposalDraftStatusBand band={renderedStatusBand} /> : null}

      <div className="proposal-draft-workspace__grid" data-drawer-open={drawerMode ? "true" : "false"}>
        <section className="product-panel proposal-draft-stage" data-testid="proposal-draft-stage">
          {workspaceState === "loading" ? (
            <div className="proposal-draft-loading-state" data-testid="proposal-draft-loading-state">
              <ProductStateBlock
                state="loading"
                title={PROPOSAL_DRAFT_PAGE_COPY.loadingTitle}
                body={PROPOSAL_DRAFT_PAGE_COPY.loadingBody}
              />
            </div>
          ) : null}

          {workspaceState === "empty" ? (
            <div className="proposal-draft-empty-state" data-testid="proposal-draft-empty-state">
              <div className="proposal-draft-empty-state__copy">
                <h3>{PROPOSAL_DRAFT_PAGE_COPY.emptyTitle}</h3>
                <p>{PROPOSAL_DRAFT_PAGE_COPY.emptyBody}</p>
              </div>
              <button
                type="button"
                className="product-button product-button--primary"
                onClick={() => void handleGenerate()}
                disabled={isWorking || isBlockedAction(PROPOSAL_DRAFT_BLOCKED_ACTIONS.generate)}
              >
                {PROPOSAL_DRAFT_PAGE_COPY.emptyAction}
              </button>
            </div>
          ) : null}

          {workspaceState === "error" ? (
            <ProductStateBlock
              state="error"
              title="Proposal Draft is unavailable."
              body="Retry to reload the draft surface without losing the opportunity context."
            />
          ) : null}

          {workspaceState === "ready" && draftSections ? (
            <>
              <div className="proposal-draft-stage__toolbar">
                <div className="proposal-draft-stage__actions">
                  <div className="proposal-draft-stage__action-group">
                    <button
                      type="button"
                      className="product-button product-button--primary"
                      onClick={() => void handleSaveCurrent()}
                      disabled={isWorking || isBlockedAction(PROPOSAL_DRAFT_BLOCKED_ACTIONS.saveCurrent)}
                    >
                      {PROPOSAL_DRAFT_PAGE_COPY.saveCurrent}
                    </button>
                    <button
                      type="button"
                      className="product-button product-button--ghost"
                      onClick={() => void handleSaveVersion()}
                      disabled={isWorking || isBlockedAction(PROPOSAL_DRAFT_BLOCKED_ACTIONS.saveVersion)}
                    >
                      {PROPOSAL_DRAFT_PAGE_COPY.saveVersion}
                    </button>
                    <button
                      type="button"
                      className="product-button product-button--ghost"
                      disabled={isWorking || isBlockedAction(PROPOSAL_DRAFT_BLOCKED_ACTIONS.regenerate)}
                    >
                      {PROPOSAL_DRAFT_PAGE_COPY.regenerateAll}
                    </button>
                  </div>

                  <div className="proposal-draft-stage__action-group">
                    <button
                      ref={versionTriggerRef}
                      type="button"
                      className="product-button product-button--ghost"
                      onClick={openVersionsDrawer}
                      disabled={isWorking}
                    >
                      {PROPOSAL_DRAFT_PAGE_COPY.versions}
                    </button>
                    <button
                      type="button"
                      className="product-button product-button--ghost"
                      onClick={() => void handleCopySummary()}
                      disabled={activeAction === "copy"}
                    >
                      {PROPOSAL_DRAFT_PAGE_COPY.copyAll}
                    </button>
                    <div className="proposal-draft-export-menu">
                      <button
                        type="button"
                        className="product-button product-button--ghost"
                        onClick={() => setExportMenuOpen((current) => !current)}
                        disabled={isWorking || isBlockedAction(PROPOSAL_DRAFT_BLOCKED_ACTIONS.export)}
                        aria-expanded={exportMenuOpen}
                      >
                        {PROPOSAL_DRAFT_PAGE_COPY.export}
                      </button>
                      {exportMenuOpen ? (
                        <div className="proposal-draft-export-menu__panel">
                          <button
                            type="button"
                            className="product-button product-button--ghost"
                            onClick={() => void handleExport("text")}
                          >
                            {PROPOSAL_DRAFT_PAGE_COPY.exportText}
                          </button>
                          <button
                            type="button"
                            className="product-button product-button--ghost"
                            onClick={() => void handleExport("markdown")}
                          >
                            {PROPOSAL_DRAFT_PAGE_COPY.exportMarkdown}
                          </button>
                        </div>
                      ) : null}
                    </div>
                    <Link
                      href={BUSINESS_ROUTE_PATHS.opportunityStep(opportunityId, "follow_up")}
                      className="product-button product-button--ghost"
                    >
                      Go to Follow-up
                    </Link>
                  </div>
                </div>

                {notice ? (
                  <p
                    className={`inline-alert proposal-draft-stage__notice proposal-draft-stage__notice--${noticeTone ?? "info"}`}
                  >
                    {notice}
                  </p>
                ) : null}
              </div>

              <div className="proposal-draft-section-list">
                {getProposalDraftSectionList(
                  renderedDraftState?.sections ?? draftSections,
                  renderedDraftState?.effective_rule_summary ?? rulesSummary ?? null,
                ).map((section) => (
                  <ProposalDraftChapterBlock
                    key={section.key}
                    section={section}
                    disabled={isWorking}
                    isRegenerateBlocked={isBlockedAction(PROPOSAL_DRAFT_BLOCKED_ACTIONS.regenerate)}
                    blockedReason={getBlockedActionCopy(PROPOSAL_DRAFT_BLOCKED_ACTIONS.regenerate)}
                    showRegeneratePrompt={pendingRegenerateSection === section.key}
                    onChange={updateSection}
                    onRegenerate={handleRequestRegenerate}
                    onConfirmRegenerate={(sectionKey) => void handleConfirmRegenerate(sectionKey)}
                    onRequestSaveCurrent={() => void handleSaveCurrent()}
                    onCancelRegenerate={() => setPendingRegenerateSection(null)}
                  />
                ))}
              </div>
            </>
          ) : null}
        </section>

        {drawerMode === "override" ? (
          <ProposalDraftOverrideDrawer
            formState={overrideForm}
            templates={templates}
            isWorking={isWorking}
            templateFieldRef={overrideTemplateFieldRef}
            onChange={updateOverrideField}
            onSave={() => void handleSaveOverride()}
            onClear={() => void handleClearOverride()}
            onClose={closeDrawer}
          />
        ) : null}

        {drawerMode === "versions" ? (
          <ProposalDraftVersionDrawer
            currentResource={currentDraft}
            versions={versions}
            selectedVersion={selectedVersion}
            restoreTargetVersionNo={restoreTargetVersionNo}
            isWorking={isWorking}
            isDraftDirty={hasDirtyDraft}
            restoreBlockedReason={getBlockedActionCopy(PROPOSAL_DRAFT_BLOCKED_ACTIONS.restore)}
            closeButtonRef={versionCloseButtonRef}
            onSelectVersion={handleSelectVersion}
            onRequestRestore={setRestoreTargetVersionNo}
            onConfirmRestore={handleConfirmRestore}
            onCancelRestore={() => setRestoreTargetVersionNo(null)}
            onClose={closeDrawer}
          />
        ) : null}
      </div>
    </div>
  );
}
