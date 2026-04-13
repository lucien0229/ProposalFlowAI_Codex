"use client";

import type { OpportunityIntakeOverviewResponse } from "@/lib/opportunities-api";
import type { DiscoveryCurrentResource, DiscoverySourceNotes } from "@proposalflow/shared-types";

import { formatOpportunityTimestamp } from "@/lib/opportunities-api";
import { ProductStateBlock } from "@/components/product-state-block";
import { DISCOVERY_PAGE_COPY } from "@/lib/discovery-copy";

type DiscoverySourcePaneProps = {
  opportunityDetail: OpportunityIntakeOverviewResponse;
  currentResource: DiscoveryCurrentResource | null;
  workspaceState: "loading" | "empty" | "error" | "ready";
  sourceNotesDraft: DiscoverySourceNotes;
  onSourceNoteChange: (index: number, field: "content" | "source_label", value: string) => void;
  onAddSourceNote: () => void;
  onRemoveSourceNote: (index: number) => void;
  disabled?: boolean;
};

function buildSourcePreview(detail: OpportunityIntakeOverviewResponse) {
  return (
    detail.intake.primary_input?.content ??
    detail.intake.latest_file?.extracted_text ??
    "No source material has been captured yet."
  );
}

export function DiscoverySourcePane({
  opportunityDetail,
  currentResource,
  workspaceState,
  sourceNotesDraft,
  onSourceNoteChange,
  onAddSourceNote,
  onRemoveSourceNote,
  disabled = false,
}: DiscoverySourcePaneProps) {
  const sourcePreview = buildSourcePreview(opportunityDetail);
  const latestSourceUpdatedAt =
    opportunityDetail.intake.latest_file?.updated_at ??
    opportunityDetail.intake.primary_input?.updated_at ??
    opportunityDetail.opportunity.updated_at;

  if (workspaceState === "loading") {
    return (
      <section
        className="product-panel discovery-source-pane discovery-source-pane--loading"
        data-testid="discovery-source-pane"
        aria-labelledby="discovery-source-heading"
        aria-busy="true"
      >
        <div className="dashboard-panel__header">
          <div>
            <span className="panel-kicker">Source material</span>
            <h2 id="discovery-source-heading">Source material</h2>
          </div>
          <span className="product-chip">{DISCOVERY_PAGE_COPY.thinEvidenceTitle}</span>
        </div>

        <ProductStateBlock
          state="loading"
          title="Loading discovery source material"
          body="Fetching the current opportunity context and source notes."
        />
      </section>
    );
  }

  return (
    <section
      className="product-panel discovery-source-pane"
      data-testid="discovery-source-pane"
      aria-labelledby="discovery-source-heading"
    >
      <div className="dashboard-panel__header">
        <div>
          <span className="panel-kicker">Source material</span>
          <h2 id="discovery-source-heading">Source material</h2>
        </div>
        <span className="product-chip" data-state={currentResource ? "active" : "empty"}>
          {currentResource
            ? `Current revision ${currentResource.current_revision_no}`
            : "No current discovery"}
        </span>
      </div>

      <div className="discovery-source-pane__summary">
        <div>
          <span className="panel-kicker">Opportunity</span>
          <p>{opportunityDetail.opportunity.title}</p>
        </div>
        <div>
          <span className="panel-kicker">Company</span>
          <p>{opportunityDetail.opportunity.company_name}</p>
        </div>
        <div>
          <span className="panel-kicker">Source type</span>
          <p>{opportunityDetail.minimum_context.fields.source_type ?? "manual"}</p>
        </div>
      </div>

      <div className="discovery-source-pane__provenance">
        <span className="product-chip product-chip--step">Opportunity intake</span>
        {opportunityDetail.intake.primary_input ? <span className="product-chip">Manual notes</span> : null}
        {opportunityDetail.intake.latest_file ? <span className="product-chip">Latest file</span> : null}
        <span className="product-chip">Updated {formatOpportunityTimestamp(latestSourceUpdatedAt)}</span>
      </div>

      <div className="discovery-source-pane__excerpt">
        <span className="panel-kicker">Source excerpt</span>
        <p>{sourcePreview}</p>
      </div>

      <div className="discovery-source-pane__notes">
        <div className="discovery-source-pane__notes-header">
          <div>
            <span className="panel-kicker">{DISCOVERY_PAGE_COPY.sourceNotesTitle}</span>
            <p>{DISCOVERY_PAGE_COPY.sourceNotesHint}</p>
          </div>
          <button
            type="button"
            className="product-button product-button--ghost"
            onClick={onAddSourceNote}
            disabled={disabled}
          >
            {DISCOVERY_PAGE_COPY.addSourceNote}
          </button>
        </div>

        <div className="discovery-source-pane__notes-list">
          {sourceNotesDraft.length ? (
            sourceNotesDraft.map((note, index) => (
              <article className="discovery-source-note" key={index}>
                <div className="discovery-source-note__header">
                  <span className="product-chip">Note {index + 1}</span>
                  <button
                    type="button"
                    className="product-button product-button--ghost"
                    onClick={() => onRemoveSourceNote(index)}
                    disabled={disabled}
                  >
                    Remove
                  </button>
                </div>
                <label className="field discovery-source-note__field">
                  <span>Source label</span>
                  <input
                    type="text"
                    value={note.source_label ?? ""}
                    onChange={(event) =>
                      onSourceNoteChange(index, "source_label", event.target.value)
                    }
                    disabled={disabled}
                    placeholder="Call note, transcript, file extract"
                  />
                </label>
                <label className="field discovery-source-note__field">
                  <span>Note</span>
                  <textarea
                    value={note.content}
                    onChange={(event) => onSourceNoteChange(index, "content", event.target.value)}
                    rows={4}
                    disabled={disabled}
                    placeholder="Capture the evidence in one or two sentences."
                  />
                </label>
              </article>
            ))
          ) : (
            <p className="product-muted discovery-source-pane__notes-empty">
              No discovery notes yet. Add one before generating if the source is thin.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
