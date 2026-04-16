"use client";

import type { RefObject } from "react";

import type {
  ProposalDraftCurrentResource,
  ProposalDraftVersion,
  ProposalDraftVersionDetail,
} from "@proposalflow/shared-types";

import { PROPOSAL_DRAFT_PAGE_COPY, buildProposalDraftCopyPayload } from "@/lib/proposal-draft-copy";

type ProposalDraftVersionDrawerProps = {
  currentResource: ProposalDraftCurrentResource | null;
  versions: ProposalDraftVersion[];
  selectedVersion: ProposalDraftVersionDetail | null;
  restoreTargetVersionNo: number | null;
  isWorking: boolean;
  isDraftDirty: boolean;
  restoreBlockedReason?: string | null;
  closeButtonRef: RefObject<HTMLButtonElement | null>;
  onSelectVersion: (versionNo: number) => Promise<void>;
  onRequestRestore: (versionNo: number) => void;
  onConfirmRestore: () => Promise<void>;
  onCancelRestore: () => void;
  onClose: () => void;
};

export function ProposalDraftVersionDrawer({
  currentResource,
  versions,
  selectedVersion,
  restoreTargetVersionNo,
  isWorking,
  isDraftDirty,
  restoreBlockedReason,
  closeButtonRef,
  onSelectVersion,
  onRequestRestore,
  onConfirmRestore,
  onCancelRestore,
  onClose,
}: ProposalDraftVersionDrawerProps) {
  return (
    <aside className="product-panel proposal-draft-drawer" data-testid="proposal-draft-version-drawer">
      <div className="proposal-draft-drawer__header">
        <div>
          <p className="panel-kicker">{PROPOSAL_DRAFT_PAGE_COPY.versions}</p>
          <h3>{PROPOSAL_DRAFT_PAGE_COPY.versionDrawerTitle}</h3>
          <p>Preview an immutable snapshot first, then confirm before restoring it over the working copy.</p>
        </div>
        <button
          ref={closeButtonRef}
          type="button"
          className="product-button product-button--ghost"
          onClick={onClose}
          disabled={isWorking}
        >
          Close
        </button>
      </div>

      <div className="proposal-draft-version-drawer__content">
        <div className="proposal-draft-version-drawer__list">
          {versions.length ? (
            versions.map((version) => (
              <button
                key={version.version_no}
                type="button"
                className="proposal-draft-version-row"
                data-active={selectedVersion?.version_no === version.version_no}
                onClick={() => void onSelectVersion(version.version_no)}
                disabled={isWorking}
              >
                <strong>Version {version.version_no}</strong>
                <span>{version.saved_by_name ?? "System"}</span>
              </button>
            ))
          ) : (
            <p className="product-muted">No versions saved yet.</p>
          )}
        </div>

        <div className="proposal-draft-version-drawer__preview">
          {currentResource ? (
            <p className="proposal-draft-version-drawer__current-copy">
              Current working draft revision {currentResource.current_revision_no}
            </p>
          ) : null}

          {selectedVersion ? (
            <>
              <p className="proposal-draft-version-drawer__preview-title">
                Version {selectedVersion.version_no} · {selectedVersion.saved_by_name ?? "System"}
              </p>
              {selectedVersion.version_note ? (
                <p className="proposal-draft-version-drawer__preview-note">{selectedVersion.version_note}</p>
              ) : null}
              <pre>
                {buildProposalDraftCopyPayload(
                  selectedVersion.sections,
                  selectedVersion.effective_rule_summary,
                )}
              </pre>
              {restoreBlockedReason ? (
                <p className="proposal-draft-version-drawer__blocked-copy">{restoreBlockedReason}</p>
              ) : null}

              {restoreTargetVersionNo === selectedVersion.version_no ? (
                <div className="proposal-draft-version-drawer__restore">
                  <p>{PROPOSAL_DRAFT_PAGE_COPY.restoreWarning}</p>
                  <div className="proposal-draft-version-drawer__restore-actions">
                    <button
                      type="button"
                      className="product-button product-button--primary"
                      onClick={() => void onConfirmRestore()}
                      disabled={isWorking || isDraftDirty || Boolean(restoreBlockedReason)}
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
                  className="product-button product-button--primary"
                  onClick={() => onRequestRestore(selectedVersion.version_no)}
                  disabled={isWorking || isDraftDirty || Boolean(restoreBlockedReason)}
                >
                  Restore
                </button>
              )}
            </>
          ) : (
            <p className="product-muted">Select a version to preview it before restore.</p>
          )}
        </div>
      </div>
    </aside>
  );
}
