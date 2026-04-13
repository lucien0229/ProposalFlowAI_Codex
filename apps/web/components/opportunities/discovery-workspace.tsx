"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import type {
  DiscoveryCurrentResource,
  DiscoveryFields,
  DiscoveryFieldKey,
  DiscoverySourceNotes,
  DiscoveryVersion,
} from "@proposalflow/shared-types";
import type { OpportunityIntakeOverviewResponse } from "@/lib/opportunities-api";

import { ProductStateBlock } from "@/components/product-state-block";
import { DiscoveryOutputPane } from "@/components/opportunities/discovery-output-pane";
import { DiscoverySourcePane } from "@/components/opportunities/discovery-source-pane";
import {
  buildDiscoverySummary,
  DISCOVERY_PAGE_COPY,
} from "@/lib/discovery-copy";
import {
  fetchDiscoveryVersionDetail,
  fetchDiscoveryWorkspace,
  generateDiscovery,
  regenerateDiscovery,
  restoreDiscoveryVersion,
  saveDiscoveryCurrent,
  saveDiscoveryVersion,
} from "@/lib/discovery-api";
import { readBrowserCsrfToken, ProductApiError } from "@/lib/product-api";

type DiscoveryWorkspaceProps = {
  opportunityId: string;
  opportunityDetail: OpportunityIntakeOverviewResponse;
};

type WorkspaceState = "loading" | "empty" | "error" | "ready";
type NoticeTone = "info" | "success" | "error";
type MutationAction = "generate" | "regenerate" | "save_current" | "save_version" | "restore" | null;

function cloneFields(fields: DiscoveryFields): DiscoveryFields {
  return JSON.parse(JSON.stringify(fields)) as DiscoveryFields;
}

function cloneNotes(notes: DiscoverySourceNotes): DiscoverySourceNotes {
  return JSON.parse(JSON.stringify(notes)) as DiscoverySourceNotes;
}

function normalizeDraftFields(fields: DiscoveryFields): DiscoveryFields {
  return cloneFields(fields);
}

function normalizeDraftNotes(notes: DiscoverySourceNotes): DiscoverySourceNotes {
  return cloneNotes(notes);
}

function hasUnsavedDiscoveryChanges(
  discovery: DiscoveryCurrentResource | null,
  draftFields: DiscoveryFields | null,
  draftSourceNotes: DiscoverySourceNotes,
) {
  if (!discovery || !draftFields) {
    return false;
  }

  return (
    JSON.stringify(draftFields) !== JSON.stringify(discovery.fields) ||
    JSON.stringify(draftSourceNotes) !== JSON.stringify(discovery.source_notes)
  );
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

function DiscoveryStepper() {
  const steps = ["Lead Intake", "Lead Brief", "Discovery", "Proposal Draft", "Follow-up"] as const;
  return (
    <nav className="discovery-stepper" aria-label="Opportunity workflow">
      {steps.map((step, index) => (
        <span
          key={step}
          className="discovery-stepper__item"
          data-active={step === "Discovery"}
          data-complete={index < 2}
        >
          <span className="discovery-stepper__index">{index + 1}</span>
          <span>{step}</span>
        </span>
      ))}
    </nav>
  );
}

function hasUsableDiscoveryFields(fields: DiscoveryFields | null) {
  if (!fields) {
    return false;
  }
  return Object.values(fields).every(
    (field) => field.state === "confirmed" || field.state === "inferred",
  );
}

export function DiscoveryWorkspace({ opportunityId, opportunityDetail }: DiscoveryWorkspaceProps) {
  const [workspaceState, setWorkspaceState] = useState<WorkspaceState>("loading");
  const [discovery, setDiscovery] = useState<DiscoveryCurrentResource | null>(null);
  const [versions, setVersions] = useState<DiscoveryVersion[]>([]);
  const [draftFields, setDraftFields] = useState<DiscoveryFields | null>(null);
  const [draftSourceNotes, setDraftSourceNotes] = useState<DiscoverySourceNotes>([]);
  const [selectedVersion, setSelectedVersion] = useState<DiscoveryVersion | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [restoreTargetVersionNo, setRestoreTargetVersionNo] = useState<number | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [noticeTone, setNoticeTone] = useState<NoticeTone | null>(null);
  const [activeAction, setActiveAction] = useState<MutationAction>(null);
  const workspaceLoadRequestRef = useRef(0);
  const versionLoadRequestRef = useRef(0);

  async function loadWorkspace(): Promise<boolean> {
    const requestId = workspaceLoadRequestRef.current + 1;
    workspaceLoadRequestRef.current = requestId;
    setWorkspaceState("loading");
    try {
      const payload = await fetchDiscoveryWorkspace(opportunityId);
      if (workspaceLoadRequestRef.current !== requestId) {
        return false;
      }
      if (!payload.discovery) {
        setDiscovery(null);
        setDraftFields(null);
        setDraftSourceNotes([]);
        setVersions(payload.versions);
        setSelectedVersion(null);
        setWorkspaceState("empty");
        return true;
      }

      setDiscovery(payload.discovery);
      setDraftFields(normalizeDraftFields(payload.discovery.fields));
      setDraftSourceNotes(normalizeDraftNotes(payload.discovery.source_notes));
      setVersions(payload.versions);
      setSelectedVersion(null);
      setWorkspaceState(
        payload.discovery.current_revision_no === 1 && payload.versions.length === 0 ? "empty" : "ready",
      );
      return true;
    } catch (error) {
      if (workspaceLoadRequestRef.current !== requestId) {
        return false;
      }
      if (error instanceof ProductApiError && error.status === 404) {
        setDiscovery(null);
        setDraftFields(null);
        setDraftSourceNotes([]);
        setVersions([]);
        setSelectedVersion(null);
        setWorkspaceState("empty");
        return true;
      }

      setWorkspaceState("error");
      setNotice(formatApiError(error, "We couldn't load this discovery workspace."));
      return false;
    }
  }

  useEffect(() => {
    void loadWorkspace();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opportunityId]);

  function updateField(fieldKey: DiscoveryFieldKey, value: string) {
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

  function confirmField(fieldKey: DiscoveryFieldKey) {
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

  function updateSourceNote(index: number, field: "content" | "source_label", value: string) {
    setDraftSourceNotes((current) => {
      const next = cloneNotes(current);
      if (!next[index]) {
        return current;
      }
      next[index] = {
        ...next[index],
        [field]: value,
      };
      return next;
    });
    setNotice(null);
    setNoticeTone(null);
  }

  function addSourceNote() {
    setDraftSourceNotes((current) => [
      ...current,
      {
        content: "",
        source_label: null,
      },
    ]);
    setNotice(null);
    setNoticeTone(null);
  }

  function removeSourceNote(index: number) {
    setDraftSourceNotes((current) => current.filter((_, currentIndex) => currentIndex !== index));
    setNotice(null);
    setNoticeTone(null);
  }

  async function loadVersion(versionNo: number) {
    const requestId = versionLoadRequestRef.current + 1;
    versionLoadRequestRef.current = requestId;
    setNotice(null);
    setNoticeTone(null);
    try {
      const response = await fetchDiscoveryVersionDetail(opportunityId, versionNo);
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
    if (hasUnsavedDiscoveryChanges(discovery, draftFields, draftSourceNotes)) {
      setNotice(DISCOVERY_PAGE_COPY.unsavedChangesBeforeGenerate);
      setNoticeTone("error");
      return;
    }
    setActiveAction("generate");
    setNotice("Generating discovery…");
    setNoticeTone("info");
    try {
      const response = await generateDiscovery(
        opportunityId,
        { source_notes: draftSourceNotes },
        { csrfToken: readBrowserCsrfToken() },
      );
      if (!response.gate.can_generate) {
        setNotice(response.gate.message);
        setNoticeTone("error");
        return;
      }
      const reloaded = await loadWorkspace();
      if (!reloaded) {
        return;
      }
      setNotice("Discovery generated and loaded.");
      setNoticeTone("success");
    } catch (error) {
      setNoticeTone("error");
      setNotice(formatApiError(error, "Discovery generation failed."));
    } finally {
      setActiveAction(null);
    }
  }

  async function handleRegenerate() {
    if (hasUnsavedDiscoveryChanges(discovery, draftFields, draftSourceNotes)) {
      setNotice(DISCOVERY_PAGE_COPY.unsavedChangesBeforeGenerate);
      setNoticeTone("error");
      return;
    }
    setActiveAction("regenerate");
    setNotice("Regenerating discovery…");
    setNoticeTone("info");
    try {
      const response = await regenerateDiscovery(
        opportunityId,
        { source_notes: draftSourceNotes },
        { csrfToken: readBrowserCsrfToken() },
      );
      if (!response.gate.can_generate) {
        setNotice(response.gate.message);
        setNoticeTone("error");
        return;
      }
      const reloaded = await loadWorkspace();
      if (!reloaded) {
        return;
      }
      setNotice("Discovery regenerated from the latest source notes.");
      setNoticeTone("success");
    } catch (error) {
      setNoticeTone("error");
      setNotice(formatApiError(error, "Discovery regeneration failed."));
    } finally {
      setActiveAction(null);
    }
  }

  async function handleSaveCurrent() {
    if (!discovery || !draftFields) {
      return;
    }
    setActiveAction("save_current");
    setNotice("Saving current discovery…");
    setNoticeTone("info");
    try {
      const response = await saveDiscoveryCurrent(
        opportunityId,
        {
          expected_revision_no: discovery.current_revision_no,
          fields: draftFields,
          source_notes: draftSourceNotes,
        },
        { csrfToken: readBrowserCsrfToken() },
      );
      setDiscovery(response.discovery);
      setDraftFields(response.discovery ? normalizeDraftFields(response.discovery.fields) : null);
      setDraftSourceNotes(response.discovery ? normalizeDraftNotes(response.discovery.source_notes) : []);
      setVersions(response.versions);
      setWorkspaceState(
        response.discovery && response.discovery.current_revision_no === 1 && response.versions.length === 0
          ? "empty"
          : "ready",
      );
      setNotice("Current discovery saved.");
      setNoticeTone("success");
    } catch (error) {
      setNoticeTone("error");
      setNotice(formatApiError(error, DISCOVERY_PAGE_COPY.conflictMessage));
    } finally {
      setActiveAction(null);
    }
  }

  async function handleSaveVersion() {
    if (!discovery || !draftFields) {
      return;
    }
    setActiveAction("save_version");
    setNotice("Saving version snapshot…");
    setNoticeTone("info");
    try {
      const response = await saveDiscoveryVersion(
        opportunityId,
        {
          expected_revision_no: discovery.current_revision_no,
          fields: draftFields,
          source_notes: draftSourceNotes,
        },
        { csrfToken: readBrowserCsrfToken() },
      );
      setDiscovery(response.discovery);
      setDraftFields(response.discovery ? normalizeDraftFields(response.discovery.fields) : null);
      setDraftSourceNotes(response.discovery ? normalizeDraftNotes(response.discovery.source_notes) : []);
      setVersions(response.versions);
      setWorkspaceState(
        response.discovery && response.discovery.current_revision_no === 1 && response.versions.length === 0
          ? "empty"
          : "ready",
      );
      setNotice("Version saved.");
      setNoticeTone("success");
    } catch (error) {
      setNoticeTone("error");
      setNotice(formatApiError(error, DISCOVERY_PAGE_COPY.conflictMessage));
    } finally {
      setActiveAction(null);
    }
  }

  async function handleCopySummary() {
    if (!draftFields) {
      return;
    }
    try {
      const summary = buildDiscoverySummary(draftFields, draftSourceNotes);
      await navigator.clipboard.writeText(summary);
      setNotice("Discovery summary copied.");
      setNoticeTone("success");
    } catch (error) {
      setNotice(formatApiError(error, "We couldn't copy the summary."));
      setNoticeTone("error");
    }
  }

  async function handleRestore() {
    if (!discovery || restoreTargetVersionNo === null) {
      return;
    }
    if (hasUnsavedDiscoveryChanges(discovery, draftFields, draftSourceNotes)) {
      setNotice(DISCOVERY_PAGE_COPY.unsavedChangesBeforeRestore);
      setNoticeTone("error");
      return;
    }
    setActiveAction("restore");
    setNotice("Restoring version snapshot…");
    setNoticeTone("info");
    try {
      const response = await restoreDiscoveryVersion(
        opportunityId,
        {
          expected_revision_no: discovery.current_revision_no,
          version_no: restoreTargetVersionNo,
        },
        { csrfToken: readBrowserCsrfToken() },
      );
      setDiscovery(response.discovery);
      setDraftFields(response.discovery ? normalizeDraftFields(response.discovery.fields) : null);
      setDraftSourceNotes(response.discovery ? normalizeDraftNotes(response.discovery.source_notes) : []);
      setVersions(response.versions);
      setRestoreTargetVersionNo(null);
      setWorkspaceState(
        response.discovery && response.discovery.current_revision_no === 1 && response.versions.length === 0
          ? "empty"
          : "ready",
      );
      setNotice("Version restored.");
      setNoticeTone("success");
    } catch (error) {
      setNoticeTone("error");
      setNotice(formatApiError(error, DISCOVERY_PAGE_COPY.conflictMessage));
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
        detail: "Fetching the current discovery record…",
      };
    }

    if (!discovery || !draftFields) {
      return {
        label: "Empty workspace",
        detail: DISCOVERY_PAGE_COPY.thinEvidenceTitle,
      };
    }

    return {
      label: `Revision ${discovery.current_revision_no}`,
      detail: `${opportunityDetail.opportunity.company_name} · Discovery`,
    };
  }, [
    discovery,
    draftFields,
    opportunityDetail.opportunity.company_name,
    workspaceState,
  ]);

  const hasDirtyDiscoveryDraft = hasUnsavedDiscoveryChanges(discovery, draftFields, draftSourceNotes);
  const canContinueToProposalDraft = workspaceState === "ready" && hasUsableDiscoveryFields(draftFields) && !hasDirtyDiscoveryDraft;

  if (workspaceState === "error") {
    return (
      <ProductStateBlock
        state="error"
        title="We couldn't load this discovery workspace."
        body="Retry to restore the opportunity context without losing the current working copy."
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
    <div className="discovery-workspace" data-testid="discovery-workspace">
      <header className="discovery-workspace__header" data-testid="discovery-header">
        <div className="discovery-workspace__copy">
          <span className="panel-kicker">Discovery workspace</span>
          <h2>Current discovery</h2>
          <p>{DISCOVERY_PAGE_COPY.subtitle}</p>
        </div>

        <div className="discovery-workspace__meta">
          <span className="product-chip">{workspaceSummary.label}</span>
          <span className="product-chip">{workspaceSummary.detail}</span>
          <DiscoveryStepper />
        </div>
      </header>

      <div className="discovery-workspace__grid">
        <DiscoverySourcePane
          opportunityDetail={opportunityDetail}
          currentResource={discovery}
          workspaceState={workspaceState}
          sourceNotesDraft={draftSourceNotes}
          onSourceNoteChange={updateSourceNote}
          onAddSourceNote={addSourceNote}
          onRemoveSourceNote={removeSourceNote}
          disabled={activeAction !== null}
        />
        <DiscoveryOutputPane
          opportunityId={opportunityId}
          currentResource={discovery}
          draftFields={draftFields}
          draftSourceNotes={draftSourceNotes}
          workspaceState={workspaceState}
          versions={versions}
          drawerOpen={drawerOpen}
          selectedVersion={selectedVersion}
          restoreTargetVersionNo={restoreTargetVersionNo}
          isWorking={activeAction !== null}
          notice={notice}
          noticeTone={noticeTone}
          canContinueToProposalDraft={canContinueToProposalDraft}
          hasUnsavedDiscoveryChanges={hasDirtyDiscoveryDraft}
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
