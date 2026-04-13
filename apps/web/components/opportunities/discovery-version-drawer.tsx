"use client";

import type { ReactNode } from "react";

import type { DiscoveryCurrentResource, DiscoveryVersion } from "@proposalflow/shared-types";

import { DISCOVERY_PAGE_COPY, buildDiscoverySummary } from "@/lib/discovery-copy";

type DiscoveryVersionDrawerProps = {
  currentResource: DiscoveryCurrentResource | null;
  versions: DiscoveryVersion[];
  selectedVersion: DiscoveryVersion | null;
  restoreTargetVersionNo: number | null;
  isWorking: boolean;
  isDraftDirty: boolean;
  onToggleDrawer: () => void;
  onSelectVersion: (versionNo: number) => Promise<void>;
  onRequestRestore: (versionNo: number) => void;
  onConfirmRestore: () => Promise<void>;
  onCancelRestore: () => void;
};

function DrawerActionGroup({ children }: { children: ReactNode }) {
  return <div className="discovery-version-drawer__actions">{children}</div>;
}

export function DiscoveryVersionDrawer({
  currentResource,
  versions,
  selectedVersion,
  restoreTargetVersionNo,
  isWorking,
  isDraftDirty,
  onToggleDrawer,
  onSelectVersion,
  onRequestRestore,
  onConfirmRestore,
  onCancelRestore,
}: DiscoveryVersionDrawerProps) {
  return (
    <aside className="discovery-version-drawer" data-testid="discovery-version-drawer">
      <div className="discovery-version-drawer__header">
        <div>
          <span className="panel-kicker">{DISCOVERY_PAGE_COPY.versions}</span>
          <h3>Version history</h3>
        </div>
        <button type="button" className="product-button product-button--ghost" onClick={onToggleDrawer} disabled={isWorking}>
          Close
        </button>
      </div>

      <div className="discovery-version-drawer__content">
        <div className="discovery-version-drawer__list">
          {versions.length ? (
            versions.map((version) => (
              <button
                key={version.version_no}
                type="button"
                className="discovery-version-row"
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

        <div className="discovery-version-drawer__preview">
          <span className="panel-kicker">Preview</span>
          {currentResource ? (
            <p className="discovery-version-drawer__current-copy">
              Current working copy revision {currentResource.current_revision_no}
            </p>
          ) : null}
          {selectedVersion ? (
            <>
              <p className="discovery-version-drawer__preview-title">
                Version {selectedVersion.version_no} · {selectedVersion.saved_by_name ?? "System"}
              </p>
              <pre>{buildDiscoverySummary(selectedVersion.fields, selectedVersion.source_notes)}</pre>
              {restoreTargetVersionNo === selectedVersion.version_no ? (
                <div className="discovery-version-drawer__restore">
                  <p>{DISCOVERY_PAGE_COPY.restoreWarning}</p>
                  <DrawerActionGroup>
                  <button
                    type="button"
                    className="product-button product-button--primary"
                    onClick={() => void onConfirmRestore()}
                    disabled={isWorking || isDraftDirty}
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
                  </DrawerActionGroup>
                </div>
              ) : (
                <button
                  type="button"
                  className="product-button product-button--primary"
                  onClick={() => onRequestRestore(selectedVersion.version_no)}
                  disabled={isWorking || isDraftDirty}
                >
                  Restore
                </button>
              )}
            </>
          ) : (
            <p className="product-muted">Select a version to preview its fields and source notes.</p>
          )}
        </div>
      </div>
    </aside>
  );
}
