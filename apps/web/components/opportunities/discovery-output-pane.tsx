"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import { BUSINESS_ROUTE_PATHS } from "@proposalflow/shared-config";
import type {
  DiscoveryCurrentResource,
  DiscoveryFields,
  DiscoveryFieldKey,
  DiscoverySourceNotes,
  DiscoveryVersion,
} from "@proposalflow/shared-types";

import { ProductStateBlock } from "@/components/product-state-block";
import { DiscoveryFieldCard } from "@/components/opportunities/discovery-field-card";
import { DiscoveryVersionDrawer } from "@/components/opportunities/discovery-version-drawer";
import {
  DISCOVERY_FIELD_GROUPS,
  DISCOVERY_PAGE_COPY,
} from "@/lib/discovery-copy";

type DiscoveryOutputPaneProps = {
  opportunityId: string;
  currentResource: DiscoveryCurrentResource | null;
  draftFields: DiscoveryFields | null;
  draftSourceNotes: DiscoverySourceNotes;
  workspaceState: "loading" | "empty" | "error" | "ready";
  versions: DiscoveryVersion[];
  drawerOpen: boolean;
  selectedVersion: DiscoveryVersion | null;
  restoreTargetVersionNo: number | null;
  isWorking: boolean;
  notice: string | null;
  noticeTone: "info" | "success" | "error" | null;
  canContinueToProposalDraft: boolean;
  hasUnsavedDiscoveryChanges: boolean;
  onGenerate: () => Promise<void>;
  onSaveCurrent: () => Promise<void>;
  onSaveVersion: () => Promise<void>;
  onRegenerate: () => Promise<void>;
  onCopySummary: () => Promise<void>;
  onToggleDrawer: () => void;
  onSelectVersion: (versionNo: number) => Promise<void>;
  onRequestRestore: (versionNo: number) => void;
  onConfirmRestore: () => Promise<void>;
  onCancelRestore: () => void;
  onFieldChange: (fieldKey: DiscoveryFieldKey, value: string) => void;
  onFieldConfirm: (fieldKey: DiscoveryFieldKey) => void;
};

function ActionGroup({ children }: { children: ReactNode }) {
  return <div className="discovery-output-pane__actions">{children}</div>;
}

function hasMeaningfulDraft(fields: DiscoveryFields | null) {
  if (!fields) {
    return false;
  }
  return Object.values(fields).some((field) => field.state !== "needs_review");
}

export function DiscoveryOutputPane({
  opportunityId,
  currentResource,
  draftFields,
  draftSourceNotes,
  workspaceState,
  versions,
  drawerOpen,
  selectedVersion,
  restoreTargetVersionNo,
  isWorking,
  notice,
  noticeTone,
  canContinueToProposalDraft,
  hasUnsavedDiscoveryChanges,
  onGenerate,
  onSaveCurrent,
  onSaveVersion,
  onRegenerate,
  onCopySummary,
  onToggleDrawer,
  onSelectVersion,
  onRequestRestore,
  onConfirmRestore,
  onCancelRestore,
  onFieldChange,
  onFieldConfirm,
}: DiscoveryOutputPaneProps) {
  if (workspaceState === "loading") {
    return (
      <section
        className="product-panel discovery-output-pane discovery-output-pane--loading"
        data-testid="discovery-output-pane"
        aria-labelledby="discovery-output-heading"
        aria-busy="true"
      >
        <div className="dashboard-panel__header">
          <div>
            <span className="panel-kicker">Discovery record</span>
            <h2 id="discovery-output-heading">Discovery record</h2>
          </div>
          <span className="product-chip">{DISCOVERY_PAGE_COPY.emptyTitle}</span>
        </div>

        <ProductStateBlock
          state="loading"
          title="Loading discovery"
          body="Fetching the current discovery working copy and version history."
        />
      </section>
    );
  }

  if (workspaceState === "empty" || !currentResource || !draftFields) {
    return (
      <section
        className="product-panel discovery-output-pane discovery-output-pane--empty"
        data-testid="discovery-output-pane"
        aria-labelledby="discovery-output-heading"
      >
        <div className="dashboard-panel__header">
          <div>
            <span className="panel-kicker">Discovery record</span>
            <h2 id="discovery-output-heading">Discovery record</h2>
          </div>
          <span className="product-chip">{DISCOVERY_PAGE_COPY.emptyTitle}</span>
        </div>

        {notice ? (
          <p
            className={`inline-alert discovery-output-pane__notice discovery-output-pane__notice--${noticeTone ?? "info"}`}
            role={noticeTone === "error" ? "alert" : "status"}
            aria-live={noticeTone === "error" ? "assertive" : "polite"}
            aria-atomic="true"
          >
            {notice}
          </p>
        ) : null}

        <div className="discovery-empty-state" data-testid="discovery-empty-state">
          <div className="discovery-empty-state__copy">
            <h3>{DISCOVERY_PAGE_COPY.emptyTitle}</h3>
            <p>{DISCOVERY_PAGE_COPY.emptyBody}</p>
          </div>
          <ActionGroup>
            <button
              type="button"
              className="product-button product-button--primary"
              onClick={() => void onGenerate()}
              disabled={isWorking || hasUnsavedDiscoveryChanges}
            >
              {DISCOVERY_PAGE_COPY.emptyAction}
            </button>
          </ActionGroup>
        </div>
      </section>
    );
  }

  return (
    <section
      className="product-panel discovery-output-pane"
      data-testid="discovery-output-pane"
      aria-labelledby="discovery-output-heading"
    >
      <div className="dashboard-panel__header">
        <div>
          <span className="panel-kicker">Discovery record</span>
          <h2 id="discovery-output-heading">Discovery record</h2>
        </div>
        <div className="discovery-output-pane__header-meta">
          <span className="product-chip">Revision {currentResource.current_revision_no}</span>
          <span className="product-chip">{draftSourceNotes.length} source notes</span>
        </div>
      </div>

      <div className="discovery-output-pane__toolbar">
        <ActionGroup>
          <button
            type="button"
            className="product-button product-button--primary"
            onClick={() => void onSaveCurrent()}
            disabled={isWorking}
          >
            {DISCOVERY_PAGE_COPY.saveCurrent}
          </button>
          <button
            type="button"
            className="product-button product-button--ghost"
            onClick={() => void onSaveVersion()}
            disabled={isWorking}
          >
            {DISCOVERY_PAGE_COPY.saveVersion}
          </button>
          <button
            type="button"
            className="product-button product-button--ghost"
            onClick={() => void onRegenerate()}
            disabled={isWorking || hasUnsavedDiscoveryChanges}
          >
            {DISCOVERY_PAGE_COPY.regenerate}
          </button>
          <button type="button" className="product-button product-button--ghost" onClick={onToggleDrawer}>
            {DISCOVERY_PAGE_COPY.versions}
          </button>
        </ActionGroup>
        <ActionGroup>
          <button type="button" className="product-button product-button--ghost" onClick={() => void onCopySummary()}>
            {DISCOVERY_PAGE_COPY.copySummary}
          </button>
          <Link
            href={BUSINESS_ROUTE_PATHS.opportunityStep(opportunityId, "proposal_draft")}
            className="product-button product-button--ghost"
            aria-disabled={!canContinueToProposalDraft}
            tabIndex={canContinueToProposalDraft ? 0 : -1}
            onClick={(event) => {
              if (!canContinueToProposalDraft) {
                event.preventDefault();
              }
            }}
            data-disabled={!canContinueToProposalDraft}
          >
            {DISCOVERY_PAGE_COPY.continueToProposalDraft}
          </Link>
        </ActionGroup>
      </div>

      {notice ? (
        <p
          className={`inline-alert discovery-output-pane__notice discovery-output-pane__notice--${noticeTone ?? "info"}`}
          role={noticeTone === "error" ? "alert" : "status"}
          aria-live={noticeTone === "error" ? "assertive" : "polite"}
          aria-atomic="true"
        >
          {notice}
        </p>
      ) : null}

      <div className="discovery-output-pane__body" data-drawer-open={drawerOpen}>
        <div className="discovery-output-pane__main" data-testid="discovery-output-main">
          {!hasMeaningfulDraft(draftFields) ? (
            <div className="discovery-output-pane__thin-evidence" role="status" aria-live="polite">
              <h3>{DISCOVERY_PAGE_COPY.thinEvidenceTitle}</h3>
              <p>{DISCOVERY_PAGE_COPY.thinEvidenceBody}</p>
            </div>
          ) : null}

          <div className="discovery-field-groups">
            {DISCOVERY_FIELD_GROUPS.map((group, index) => (
              <section className="discovery-field-group" key={group.title} aria-labelledby={`discovery-group-${index}`}>
                <div className="discovery-field-group__header">
                  <h3 id={`discovery-group-${index}`}>{group.title}</h3>
                  <p>Keep the discovery output grounded in the visible evidence and open questions.</p>
                </div>
                <div className="discovery-field-grid">
                  {group.fields.map((fieldKey) => {
                    const value = draftFields[fieldKey];
                    return (
                      <DiscoveryFieldCard
                        key={fieldKey}
                        fieldKey={fieldKey}
                        state={value.state}
                        value={value.value}
                        sourceExcerpt={value.source_excerpt}
                        disabled={isWorking}
                        onChange={(nextValue) => onFieldChange(fieldKey, nextValue)}
                        onConfirm={() => onFieldConfirm(fieldKey)}
                      />
                    );
                  })}
                </div>
              </section>
            ))}
          </div>

          <div className="discovery-output-pane__handoff">
            {!canContinueToProposalDraft ? (
              <p className="discovery-output-pane__handoff-note">{DISCOVERY_PAGE_COPY.continueToProposalDraftBlocked}</p>
            ) : null}
            {hasUnsavedDiscoveryChanges ? (
              <p className="discovery-output-pane__handoff-note discovery-output-pane__handoff-note--warning">
                {DISCOVERY_PAGE_COPY.unsavedChangesBeforeGenerate}
              </p>
            ) : null}
          </div>
        </div>

        {drawerOpen ? (
          <DiscoveryVersionDrawer
            currentResource={currentResource}
            versions={versions}
            selectedVersion={selectedVersion}
            restoreTargetVersionNo={restoreTargetVersionNo}
            isWorking={isWorking}
            isDraftDirty={hasUnsavedDiscoveryChanges}
            onToggleDrawer={onToggleDrawer}
            onSelectVersion={onSelectVersion}
            onRequestRestore={onRequestRestore}
            onConfirmRestore={onConfirmRestore}
            onCancelRestore={onCancelRestore}
          />
        ) : null}
      </div>
    </section>
  );
}
