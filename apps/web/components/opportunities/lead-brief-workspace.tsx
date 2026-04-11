"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type {
  LeadBriefCurrentResource,
  LeadBriefFields,
  LeadBriefFieldKey,
  LeadBriefVersion,
} from "@proposalflow/shared-types";
import type { OpportunityIntakeOverviewResponse } from "@/lib/opportunities-api";

import { ProductStateBlock } from "@/components/product-state-block";
import {
  buildLeadBriefSummary,
  LEAD_BRIEF_PAGE_COPY,
} from "@/lib/lead-brief-copy";
import {
  fetchLeadBriefVersionDetail,
  fetchLeadBriefWorkspace,
  generateLeadBrief,
  regenerateLeadBrief,
  restoreLeadBriefVersion,
  saveLeadBriefCurrent,
  saveLeadBriefVersion,
} from "@/lib/lead-brief-api";
import { readBrowserCsrfToken, ProductApiError } from "@/lib/product-api";
import { LeadBriefOutputPane } from "@/components/opportunities/lead-brief-output-pane";
import { LeadBriefSourcePane } from "@/components/opportunities/lead-brief-source-pane";

type LeadBriefWorkspaceProps = {
  opportunityId: string;
  opportunityDetail: OpportunityIntakeOverviewResponse;
};

type WorkspaceState = "loading" | "empty" | "error" | "ready";
type NoticeTone = "info" | "success" | "error";
type MutationAction = "generate" | "regenerate" | "save_current" | "save_version" | "restore" | null;

function cloneFields(fields: LeadBriefFields): LeadBriefFields {
  return JSON.parse(JSON.stringify(fields)) as LeadBriefFields;
}

function normalizeDraftFields(fields: LeadBriefFields): LeadBriefFields {
  return cloneFields(fields);
}

function formatApiError(error: unknown, fallback: string) {
  if (error instanceof ProductApiError) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return fallback;
}

function buildNotice(message: string) {
  return message;
}

function LeadBriefStepper() {
  const steps = ["Lead Intake", "Lead Brief", "Discovery", "Proposal Draft", "Follow-up"] as const;
  return (
    <nav className="lead-brief-stepper" aria-label="Opportunity workflow">
      {steps.map((step, index) => (
        <span
          key={step}
          className="lead-brief-stepper__item"
          data-active={step === "Lead Brief"}
          data-complete={index < 1}
        >
          <span className="lead-brief-stepper__index">{index + 1}</span>
          <span>{step}</span>
        </span>
      ))}
    </nav>
  );
}

export function LeadBriefWorkspace({ opportunityId, opportunityDetail }: LeadBriefWorkspaceProps) {
  const [workspaceState, setWorkspaceState] = useState<WorkspaceState>("loading");
  const [leadBrief, setLeadBrief] = useState<LeadBriefCurrentResource | null>(null);
  const [versions, setVersions] = useState<LeadBriefVersion[]>([]);
  const [draftFields, setDraftFields] = useState<LeadBriefFields | null>(null);
  const [selectedVersion, setSelectedVersion] = useState<LeadBriefVersion | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [restoreTargetVersionNo, setRestoreTargetVersionNo] = useState<number | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [noticeTone, setNoticeTone] = useState<NoticeTone | null>(null);
  const [activeAction, setActiveAction] = useState<MutationAction>(null);
  const workspaceLoadRequestRef = useRef(0);
  const versionLoadRequestRef = useRef(0);

  async function loadWorkspace() {
    const requestId = workspaceLoadRequestRef.current + 1;
    workspaceLoadRequestRef.current = requestId;
    setWorkspaceState("loading");
    try {
      const payload = await fetchLeadBriefWorkspace(opportunityId);
      if (workspaceLoadRequestRef.current !== requestId) {
        return;
      }
      if (!payload.lead_brief) {
        setLeadBrief(null);
        setDraftFields(null);
        setVersions(payload.versions);
        setSelectedVersion(null);
        setWorkspaceState("empty");
        return;
      }

      setLeadBrief(payload.lead_brief);
      setDraftFields(normalizeDraftFields(payload.lead_brief.fields));
      setVersions(payload.versions);
      setWorkspaceState("ready");
    } catch (error) {
      if (workspaceLoadRequestRef.current !== requestId) {
        return;
      }
      if (error instanceof ProductApiError && error.status === 404) {
        setLeadBrief(null);
        setDraftFields(null);
        setVersions([]);
        setWorkspaceState("empty");
        return;
      }

      setWorkspaceState("error");
      setNotice(formatApiError(error, "We couldn't load this lead brief."));
    }
  }

  useEffect(() => {
    void loadWorkspace();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opportunityId]);

  function updateField(fieldKey: LeadBriefFieldKey, value: string) {
    setDraftFields((current) => {
      if (!current) {
        return current;
      }
      const next = cloneFields(current);
      next[fieldKey] = {
        ...next[fieldKey],
        value,
        state: "needs_review",
      };
      return next;
    });
    setNotice(null);
    setNoticeTone(null);
  }

  function confirmField(fieldKey: LeadBriefFieldKey) {
    setDraftFields((current) => {
      if (!current) {
        return current;
      }
      const next = cloneFields(current);
      next[fieldKey] = {
        ...next[fieldKey],
        state: next[fieldKey].value?.trim() ? "confirmed" : "missing",
      };
      return next;
    });
  }

  async function loadVersion(versionNo: number) {
    const requestId = versionLoadRequestRef.current + 1;
    versionLoadRequestRef.current = requestId;
    setNotice(null);
    setNoticeTone(null);
    try {
      const response = await fetchLeadBriefVersionDetail(opportunityId, versionNo);
      if (versionLoadRequestRef.current !== requestId) {
        return;
      }
      setSelectedVersion(response.version);
    } catch (error) {
      if (versionLoadRequestRef.current !== requestId) {
        return;
      }
      setNotice(formatApiError(error, "We couldn't load that version."));
      setNoticeTone("error");
    }
  }

  async function handleGenerate() {
    setActiveAction("generate");
    setNotice("Generating lead brief…");
    setNoticeTone("info");
    try {
      await generateLeadBrief(opportunityId);
      await loadWorkspace();
      setNotice(buildNotice("Lead brief generated and loaded."));
      setNoticeTone("success");
    } catch (error) {
      setNoticeTone("error");
      setNotice(formatApiError(error, "Lead brief generation failed."));
    } finally {
      setActiveAction(null);
    }
  }

  async function handleRegenerate() {
    setActiveAction("regenerate");
    setNotice("Regenerating lead brief…");
    setNoticeTone("info");
    try {
      await regenerateLeadBrief(opportunityId);
      await loadWorkspace();
      setNotice(buildNotice("Lead brief regenerated from the latest intake."));
      setNoticeTone("success");
    } catch (error) {
      setNoticeTone("error");
      setNotice(formatApiError(error, "Lead brief regeneration failed."));
    } finally {
      setActiveAction(null);
    }
  }

  async function handleSaveCurrent() {
    if (!leadBrief || !draftFields) {
      return;
    }
    setActiveAction("save_current");
    setNotice("Saving current brief…");
    setNoticeTone("info");
    try {
      const response = await saveLeadBriefCurrent(
        opportunityId,
        {
          expected_revision_no: leadBrief.current_revision_no,
          fields: draftFields,
        },
        { csrfToken: readBrowserCsrfToken() },
      );
      setLeadBrief(response.lead_brief);
      setDraftFields(response.lead_brief ? normalizeDraftFields(response.lead_brief.fields) : null);
      setVersions(response.versions);
      setNotice(buildNotice("Current brief saved."));
      setNoticeTone("success");
    } catch (error) {
      setNoticeTone("error");
      setNotice(formatApiError(error, LEAD_BRIEF_PAGE_COPY.conflictMessage));
    } finally {
      setActiveAction(null);
    }
  }

  async function handleSaveVersion() {
    if (!leadBrief || !draftFields) {
      return;
    }
    setActiveAction("save_version");
    setNotice("Saving version snapshot…");
    setNoticeTone("info");
    try {
      const response = await saveLeadBriefVersion(
        opportunityId,
        {
          expected_revision_no: leadBrief.current_revision_no,
          fields: draftFields,
        },
        { csrfToken: readBrowserCsrfToken() },
      );
      setLeadBrief(response.lead_brief);
      setDraftFields(response.lead_brief ? normalizeDraftFields(response.lead_brief.fields) : null);
      setVersions(response.versions);
      setNotice(buildNotice("Version saved."));
      setNoticeTone("success");
    } catch (error) {
      setNoticeTone("error");
      setNotice(formatApiError(error, LEAD_BRIEF_PAGE_COPY.conflictMessage));
    } finally {
      setActiveAction(null);
    }
  }

  async function handleCopySummary() {
    if (!draftFields) {
      return;
    }
    try {
      const summary = buildLeadBriefSummary(draftFields);
      await navigator.clipboard.writeText(summary);
      setNotice("Lead brief summary copied.");
      setNoticeTone("success");
    } catch (error) {
      setNotice(formatApiError(error, "We couldn't copy the summary."));
      setNoticeTone("error");
    }
  }

  async function handleRestore() {
    if (!leadBrief || restoreTargetVersionNo === null) {
      return;
    }
    setActiveAction("restore");
    setNotice("Restoring version snapshot…");
    setNoticeTone("info");
    try {
      const response = await restoreLeadBriefVersion(
        opportunityId,
        {
          expected_revision_no: leadBrief.current_revision_no,
          version_no: restoreTargetVersionNo,
        },
        { csrfToken: readBrowserCsrfToken() },
      );
      setLeadBrief(response.lead_brief);
      setDraftFields(response.lead_brief ? normalizeDraftFields(response.lead_brief.fields) : null);
      setVersions(response.versions);
      setRestoreTargetVersionNo(null);
      setNotice("Version restored.");
      setNoticeTone("success");
    } catch (error) {
      setNoticeTone("error");
      setNotice(formatApiError(error, LEAD_BRIEF_PAGE_COPY.conflictMessage));
    } finally {
      setActiveAction(null);
    }
  }

  function openVersions() {
    setDrawerOpen((current) => !current);
    setNotice(null);
    setNoticeTone(null);
    if (!selectedVersion && versions[0]) {
      void loadVersion(versions[0].version_no);
    }
  }

  function requestRestore(versionNo: number) {
    setRestoreTargetVersionNo(versionNo);
    setNotice(null);
    setNoticeTone(null);
  }

  function cancelRestore() {
    setRestoreTargetVersionNo(null);
  }

  const workspaceSummary = useMemo(() => {
    if (workspaceState === "loading") {
      return {
        label: "Loading workspace",
        detail: "Fetching the current brief…",
      };
    }

    if (!leadBrief) {
      return {
        label: "Empty workspace",
        detail: opportunityDetail.intake.generation_gate.detail,
      };
    }

    return {
      label: `Revision ${leadBrief.current_revision_no}`,
      detail: `${opportunityDetail.opportunity.company_name} · Lead Brief`,
    };
  }, [
    leadBrief,
    opportunityDetail.intake.generation_gate.detail,
    opportunityDetail.opportunity.company_name,
    workspaceState,
  ]);

  if (workspaceState === "error") {
    return (
      <ProductStateBlock
        state="error"
        title="We couldn't load this lead brief."
        body="Retry to restore the workspace without losing the opportunity context."
        detail={notice ?? undefined}
        primaryAction={{
          label: "Retry",
          onAction: () => {
            void loadWorkspace();
          },
        }}
      />
    );
  }

  return (
    <div className="lead-brief-workspace" data-testid="lead-brief-workspace">
      <header className="lead-brief-workspace__header" data-testid="lead-brief-header">
        <div className="lead-brief-workspace__copy">
          <span className="panel-kicker">Lead Brief workspace</span>
          <h2>Current brief</h2>
          <p>{LEAD_BRIEF_PAGE_COPY.subtitle}</p>
        </div>

        <div className="lead-brief-workspace__meta">
          <span className="product-chip">{workspaceSummary.label}</span>
          <span className="product-chip">{workspaceSummary.detail}</span>
          <LeadBriefStepper />
        </div>
      </header>

      <div className="lead-brief-workspace__grid">
        <LeadBriefSourcePane
          opportunityDetail={opportunityDetail}
          currentResource={leadBrief}
          workspaceState={workspaceState}
        />
        <LeadBriefOutputPane
          opportunityId={opportunityId}
          currentResource={leadBrief}
          draftFields={draftFields}
          workspaceState={workspaceState}
          versions={versions}
          drawerOpen={drawerOpen}
          selectedVersion={selectedVersion}
          restoreTargetVersionNo={restoreTargetVersionNo}
          isWorking={activeAction !== null}
          notice={notice}
          noticeTone={noticeTone}
          onGenerate={() => handleGenerate()}
          onSaveCurrent={() => handleSaveCurrent()}
          onSaveVersion={() => handleSaveVersion()}
          onRegenerate={() => handleRegenerate()}
          onCopySummary={() => handleCopySummary()}
          onToggleDrawer={openVersions}
          onSelectVersion={loadVersion}
          onRequestRestore={requestRestore}
          onConfirmRestore={handleRestore}
          onCancelRestore={cancelRestore}
          onFieldChange={updateField}
          onFieldConfirm={confirmField}
        />
      </div>
    </div>
  );
}
