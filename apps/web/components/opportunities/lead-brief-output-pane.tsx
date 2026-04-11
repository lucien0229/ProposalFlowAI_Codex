import Link from "next/link";
import type { ReactNode } from "react";

import { BUSINESS_ROUTE_PATHS } from "@proposalflow/shared-config";
import type { LeadBriefCurrentResource, LeadBriefFields, LeadBriefFieldKey, LeadBriefVersion } from "@proposalflow/shared-types";

import { ProductStateBlock } from "@/components/product-state-block";
import { LEAD_BRIEF_PAGE_COPY, LEAD_BRIEF_FIELD_GROUPS, buildLeadBriefSummary } from "@/lib/lead-brief-copy";
import { LeadBriefFieldCard } from "@/components/opportunities/lead-brief-field-card";

type LeadBriefOutputPaneProps = {
  opportunityId: string;
  currentResource: LeadBriefCurrentResource | null;
  draftFields: LeadBriefFields | null;
  workspaceState: "loading" | "empty" | "error" | "ready";
  versions: LeadBriefVersion[];
  drawerOpen: boolean;
  selectedVersion: LeadBriefVersion | null;
  restoreTargetVersionNo: number | null;
  isWorking: boolean;
  notice: string | null;
  noticeTone: "info" | "success" | "error" | null;
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
  onFieldChange: (fieldKey: LeadBriefFieldKey, value: string) => void;
  onFieldConfirm: (fieldKey: LeadBriefFieldKey) => void;
};

function ActionGroup({ children }: { children: ReactNode }) {
  return <div className="lead-brief-output-pane__actions">{children}</div>;
}

export function LeadBriefOutputPane({
  opportunityId,
  currentResource,
  draftFields,
  workspaceState,
  versions,
  drawerOpen,
  selectedVersion,
  restoreTargetVersionNo,
  isWorking,
  notice,
  noticeTone,
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
}: LeadBriefOutputPaneProps) {
  if (workspaceState === "loading") {
    return (
      <section
        className="product-panel lead-brief-output-pane lead-brief-output-pane--loading"
        data-testid="lead-brief-output-pane"
        aria-labelledby="lead-brief-output-heading"
        aria-busy="true"
      >
        <div className="dashboard-panel__header">
          <div>
            <span className="panel-kicker">Structured brief</span>
            <h2 id="lead-brief-output-heading">Structured brief</h2>
          </div>
          <span className="product-chip">{LEAD_BRIEF_PAGE_COPY.emptyTitle}</span>
        </div>

        {notice ? (
          <p
            className={`inline-alert lead-brief-output-pane__notice lead-brief-output-pane__notice--${noticeTone ?? "info"}`}
            role={noticeTone === "error" ? "alert" : "status"}
            aria-live={noticeTone === "error" ? "assertive" : "polite"}
            aria-atomic="true"
          >
            {notice}
          </p>
        ) : null}

        <div className="lead-brief-loading-state" data-testid="lead-brief-loading-state">
          <ProductStateBlock
            state="loading"
            title="Loading current brief"
            body="Fetching the latest brief and version history from the workspace."
          />
        </div>
      </section>
    );
  }

  if (!currentResource || !draftFields) {
    return (
      <section
        className="product-panel lead-brief-output-pane lead-brief-output-pane--empty"
        data-testid="lead-brief-output-pane"
        aria-labelledby="lead-brief-output-heading"
      >
        <div className="dashboard-panel__header">
          <div>
            <span className="panel-kicker">Structured brief</span>
            <h2 id="lead-brief-output-heading">Structured brief</h2>
          </div>
          <span className="product-chip">{LEAD_BRIEF_PAGE_COPY.emptyTitle}</span>
        </div>

        {notice ? (
          <p
            className={`inline-alert lead-brief-output-pane__notice lead-brief-output-pane__notice--${noticeTone ?? "info"}`}
            role={noticeTone === "error" ? "alert" : "status"}
            aria-live={noticeTone === "error" ? "assertive" : "polite"}
            aria-atomic="true"
          >
            {notice}
          </p>
        ) : null}

        <div className="lead-brief-empty-state" data-testid="lead-brief-empty-state">
          <div className="lead-brief-empty-state__copy">
            <h3>{LEAD_BRIEF_PAGE_COPY.emptyTitle}</h3>
            <p>{LEAD_BRIEF_PAGE_COPY.emptyBody}</p>
          </div>
          <ActionGroup>
            <button
              type="button"
              className="product-button product-button--primary"
              onClick={() => void onGenerate()}
              disabled={isWorking}
            >
              {LEAD_BRIEF_PAGE_COPY.emptyAction}
            </button>
          </ActionGroup>
        </div>
      </section>
    );
  }

  return (
    <section
      className="product-panel lead-brief-output-pane"
      data-testid="lead-brief-output-pane"
      aria-labelledby="lead-brief-output-heading"
    >
      <div className="dashboard-panel__header">
        <div>
          <span className="panel-kicker">Structured brief</span>
          <h2 id="lead-brief-output-heading">Structured brief</h2>
        </div>
        <span className="product-chip">Revision {currentResource.current_revision_no}</span>
      </div>

      <div className="lead-brief-output-pane__toolbar">
        <ActionGroup>
          <button
            type="button"
            className="product-button product-button--primary"
            onClick={() => void onSaveCurrent()}
            disabled={isWorking}
          >
            {LEAD_BRIEF_PAGE_COPY.saveCurrent}
          </button>
          <button
            type="button"
            className="product-button product-button--ghost"
            onClick={() => void onSaveVersion()}
            disabled={isWorking}
          >
            {LEAD_BRIEF_PAGE_COPY.saveVersion}
          </button>
          <button
            type="button"
            className="product-button product-button--ghost"
            onClick={() => void onRegenerate()}
            disabled={isWorking}
          >
            {LEAD_BRIEF_PAGE_COPY.regenerate}
          </button>
          <button type="button" className="product-button product-button--ghost" onClick={onToggleDrawer}>
            {LEAD_BRIEF_PAGE_COPY.versions}
          </button>
        </ActionGroup>
        <ActionGroup>
          <button type="button" className="product-button product-button--ghost" onClick={() => void onCopySummary()}>
            {LEAD_BRIEF_PAGE_COPY.copySummary}
          </button>
          <Link
            href={BUSINESS_ROUTE_PATHS.opportunityStep(opportunityId, "discovery")}
            className="product-button product-button--ghost"
          >
            {LEAD_BRIEF_PAGE_COPY.continueToDiscovery}
          </Link>
        </ActionGroup>
      </div>

      {notice ? (
        <p
          className={`inline-alert lead-brief-output-pane__notice lead-brief-output-pane__notice--${noticeTone ?? "info"}`}
          role={noticeTone === "error" ? "alert" : "status"}
          aria-live={noticeTone === "error" ? "assertive" : "polite"}
          aria-atomic="true"
        >
          {notice}
        </p>
      ) : null}

      <div className="lead-brief-field-groups">
        {LEAD_BRIEF_FIELD_GROUPS.map((group, index) => (
          <section className="lead-brief-field-group" key={group.title} aria-labelledby={`lead-brief-group-${index}`}>
            <div className="lead-brief-field-group__header">
              <h3 id={`lead-brief-group-${index}`}>{group.title}</h3>
              <p>Keep the right-hand brief current while the source pane stays fixed.</p>
            </div>
            <div className="lead-brief-field-grid">
              {group.fields.map((fieldKey) => {
                const value = draftFields[fieldKey];
                return (
                  <LeadBriefFieldCard
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

      {drawerOpen ? (
        <aside className="lead-brief-version-drawer" data-testid="lead-brief-version-drawer">
          <div className="lead-brief-version-drawer__header">
            <div>
              <span className="panel-kicker">{LEAD_BRIEF_PAGE_COPY.versions}</span>
              <h3>Version history</h3>
            </div>
            <button type="button" className="product-button product-button--ghost" onClick={onToggleDrawer} disabled={isWorking}>
              Close
            </button>
          </div>

          <div className="lead-brief-version-drawer__content">
            <div className="lead-brief-version-drawer__list">
              {versions.length ? (
                versions.map((version) => (
                  <button
                    key={version.version_no}
                    type="button"
                    className="lead-brief-version-row"
                    data-active={selectedVersion?.version_no === version.version_no}
                    disabled={isWorking}
                    onClick={() => void onSelectVersion(version.version_no)}
                  >
                    <strong>Version {version.version_no}</strong>
                    <span>{version.saved_by_name ?? "System"}</span>
                  </button>
                ))
              ) : (
                <p className="product-muted">No versions saved yet.</p>
              )}
            </div>

            <div className="lead-brief-version-drawer__preview">
              <span className="panel-kicker">Preview</span>
              {selectedVersion ? (
                <>
                  <p className="lead-brief-version-drawer__preview-title">
                    Version {selectedVersion.version_no}
                  </p>
                  <pre>{buildLeadBriefSummary(selectedVersion.fields)}</pre>
                  {restoreTargetVersionNo === selectedVersion.version_no ? (
                    <div className="lead-brief-version-drawer__restore">
                      <p>{LEAD_BRIEF_PAGE_COPY.restoreWarning}</p>
                      <div className="lead-brief-version-drawer__restore-actions">
                        <button
                          type="button"
                          className="product-button product-button--primary"
                          onClick={() => void onConfirmRestore()}
                          disabled={isWorking}
                        >
                          Restore version
                        </button>
                        <button
                          type="button"
                          className="product-button product-button--ghost"
                          onClick={onCancelRestore}
                          disabled={isWorking}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="product-button product-button--ghost"
                      onClick={() => onRequestRestore(selectedVersion.version_no)}
                      disabled={isWorking}
                    >
                      Restore
                    </button>
                  )}
                </>
              ) : (
                <p className="product-muted">Select a version to preview it here.</p>
              )}
            </div>
          </div>
        </aside>
      ) : null}
    </section>
  );
}
