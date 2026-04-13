"use client";

import { useEffect, useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, FileText, RefreshCw, Save, Sparkles, Upload } from "lucide-react";

import { BUSINESS_ROUTE_PATHS } from "@proposalflow/shared-config";

import { ProductShell } from "@/components/product-shell";
import { ProductStateBlock } from "@/components/product-state-block";
import {
  completeOpportunityFileUpload,
  createOpportunityFileUploadUrl,
  createOpportunityInput,
  fetchOpportunityFileDetail,
  generateLeadBrief,
  retryOpportunityFileProcessing,
  type OpportunityFileAsset,
  type OpportunityIntakeInput,
  type OpportunityIntakeOverviewResponse,
  updateOpportunityInput,
  updateOpportunityIntake,
} from "@/lib/opportunities-api";
import { readBrowserCsrfToken } from "@/lib/product-api";
import { ProductApiError } from "@/lib/product-api";

type RouteState = "loading" | "empty" | "error" | "blocked" | "retry" | "success" | "not-found" | null;

type OpportunityIntakeSurfaceProps = {
  workspaceName: string | null;
  initialDetail: OpportunityIntakeOverviewResponse | null;
  initialError: string | null;
  routeState: RouteState;
};

type DraftState = {
  title: string;
  company_name: string;
  contact_name: string;
  contact_email: string;
  requested_service: string;
  source_type: string;
  raw_input: string;
};

const ROUTE_STATE_COPY: Record<
  Exclude<RouteState, null | "not-found">,
  { title: string; body: string; detail?: string }
> = {
  loading: {
    title: "Loading opportunity intake",
    body: "Loading this intake workspace should preserve the shell while the overview record is still resolving.",
  },
  empty: {
    title: "No source material yet.",
    body: "Paste raw notes or upload a PDF to start shaping this opportunity. The minimum context stays editable while source material catches up.",
  },
  error: {
    title: "We couldn't load this opportunity overview.",
    body: "Retry this workspace fetch or return to Opportunities and reopen the record.",
  },
  blocked: {
    title: "Lead brief generation is blocked.",
    body: "Add the core opportunity details before generating the lead brief.",
    detail: "Add raw source notes or wait for extracted text before generating the lead brief.",
  },
  retry: {
    title: "We couldn't save the latest intake changes.",
    body: "Retry save before generating the lead brief.",
    detail: "The last save attempt failed, so the lead brief should stay blocked until the intake is synced.",
  },
  success: {
    title: "Ready to continue into the lead brief",
    body: "Generate lead brief becomes the dominant next step once the intake contract is satisfied.",
    detail: "The latest intake changes are safe to generate from.",
  },
};

function serializeDraft(draft: DraftState) {
  return JSON.stringify(draft);
}

function normalizeText(value: string | null | undefined) {
  const nextValue = value?.trim() ?? "";
  return nextValue;
}

function getFileStateCopy(state: OpportunityIntakeInput["file_status"] | OpportunityFileAsset["file_status"]) {
  switch (state) {
    case "uploaded":
      return {
        title: "Uploaded",
        body: "Waiting for extraction to begin.",
      };
    case "processing":
      return {
        title: "Processing",
        body: "Processing your PDF. Keep editing raw input while extraction runs.",
      };
    case "ready":
      return {
        title: "Ready",
        body: "Extracted text preview",
      };
    case "failed":
      return {
        title: "Failed",
        body: "Processing failed. Retry extraction or continue with manual source material.",
      };
    default:
      return {
        title: "Uploaded",
        body: "Waiting for extraction to begin.",
      };
  }
}

export function OpportunityIntakeSurface({
  workspaceName,
  initialDetail,
  initialError,
  routeState,
}: OpportunityIntakeSurfaceProps) {
  const router = useRouter();
  const [detail, setDetail] = useState(initialDetail);
  const [latestFileAsset, setLatestFileAsset] = useState<OpportunityFileAsset | null>(null);
  const [error, setError] = useState(initialError);
  const [draft, setDraft] = useState<DraftState | null>(null);
  const [saveLabel, setSaveLabel] = useState("Saved just now");
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [expandedPreviewFileId, setExpandedPreviewFileId] = useState<string | null>(null);
  const saveTimerRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const lastSavedSnapshotRef = useRef<string | null>(null);
  const saveAttemptRef = useRef(0);

  useEffect(() => {
    setDetail(initialDetail);
    setLatestFileAsset(null);
    setExpandedPreviewFileId(null);
    setError(initialError);
    setActionError(null);

    if (initialDetail) {
      const nextDraft: DraftState = {
        title: initialDetail.minimum_context.fields.title,
        company_name: initialDetail.minimum_context.fields.company_name,
        contact_name: initialDetail.minimum_context.fields.contact_name ?? "",
        contact_email: initialDetail.minimum_context.fields.contact_email ?? "",
        requested_service: initialDetail.minimum_context.fields.requested_service ?? "",
        source_type: initialDetail.minimum_context.fields.source_type ?? "manual",
        raw_input: initialDetail.intake.primary_input?.content ?? "",
      };
      setDraft(nextDraft);
      setSaveLabel(initialDetail.save_state.label);
      lastSavedSnapshotRef.current = serializeDraft(nextDraft);
    } else {
      setDraft(null);
      setSaveLabel("Saved just now");
      lastSavedSnapshotRef.current = null;
    }
  }, [initialDetail, initialError]);

  useEffect(() => {
    const latestFile = detail?.intake?.latest_file;
    if (!latestFile?.id || latestFileAsset?.id === latestFile.id) {
      return;
    }

    setLatestFileAsset(latestFile);
  }, [detail, latestFileAsset]);

  useEffect(() => {
    if (!draft || !detail || routeState) {
      return;
    }

    const snapshot = serializeDraft(draft);
    if (snapshot === lastSavedSnapshotRef.current) {
      return;
    }

    setIsSaving(true);
    setSaveLabel("Saving...");

    if (saveTimerRef.current) {
      window.clearTimeout(saveTimerRef.current);
    }

    saveTimerRef.current = window.setTimeout(() => {
      const attempt = saveAttemptRef.current + 1;
      saveAttemptRef.current = attempt;
      void persistDraft(snapshot, attempt);
    }, 350);

    return () => {
      if (saveTimerRef.current) {
        window.clearTimeout(saveTimerRef.current);
      }
    };
  }, [detail, draft, routeState]);

  async function persistDraft(snapshot: string, attempt: number) {
    if (!draft || !detail) {
      return;
    }

    try {
      const response = await updateOpportunityIntake(detail.opportunity.id, {
        title: normalizeText(draft.title),
        company_name: normalizeText(draft.company_name),
        contact_name: normalizeText(draft.contact_name) || null,
        contact_email: normalizeText(draft.contact_email) || null,
        requested_service: normalizeText(draft.requested_service) || null,
        source_type: (draft.source_type || "manual") as "manual" | "email_thread" | "pdf_upload",
        raw_input: normalizeText(draft.raw_input) || null,
        file_gate: detail.intake.latest_file
          ? {
              file_status: detail.intake.latest_file.file_status,
              content: detail.intake.latest_file.extracted_text,
            }
          : null,
      });

      if (attempt !== saveAttemptRef.current) {
        return;
      }

      setDetail(response);
      setError(null);
      setIsSaving(false);
      setSaveLabel(response.save_state.label);
      lastSavedSnapshotRef.current = snapshot;
    } catch (caughtError) {
      if (attempt !== saveAttemptRef.current) {
        return;
      }

      setIsSaving(false);
      setSaveLabel("Save failed");
      setActionError(
        caughtError instanceof ProductApiError
          ? caughtError.message
          : "We couldn't sync the latest intake changes.",
      );
    }
  }

  function updateDraftField<K extends keyof DraftState>(field: K, value: DraftState[K]) {
    setActionError(null);
    setDraft((current) => (current ? { ...current, [field]: value } : current));
  }

  async function handleManualSave() {
    if (!draft || !detail) {
      return;
    }

    if (saveTimerRef.current) {
      window.clearTimeout(saveTimerRef.current);
    }

    setIsSaving(true);
    setSaveLabel("Saving...");

    const snapshot = serializeDraft(draft);
    saveAttemptRef.current += 1;
    await persistDraft(snapshot, saveAttemptRef.current);
  }

  async function handleGenerateLeadBrief() {
    if (!detail) {
      return;
    }

    try {
      const response = await generateLeadBrief(detail.opportunity.id);
      router.push(response.redirect_to);
    } catch (caughtError) {
      setActionError(
        caughtError instanceof ProductApiError ? caughtError.message : "Lead brief generation failed.",
      );
    }
  }

  async function handleRetryExtraction(fileAssetId: string | null) {
    if (!detail || !fileAssetId) {
      return;
    }

    try {
      const response = await retryOpportunityFileProcessing(detail.opportunity.id, fileAssetId);
      setActionError(null);
      setLatestFileAsset(response.file);
      setDetail((current) =>
        current
          ? {
              ...current,
              intake: {
                ...current.intake,
                latest_file: current.intake.latest_file
                  ? {
                      ...current.intake.latest_file,
                      file_status: response.file.file_status,
                      extracted_text: response.file.extracted_text,
                      latest_job_status: response.file.latest_job_status,
                      latest_job: response.file.latest_job,
                    }
                  : response.file,
              },
            }
          : current,
      );
    } catch (caughtError) {
      setActionError(
        caughtError instanceof ProductApiError ? caughtError.message : "Retry extraction failed.",
      );
    }
  }

  async function handlePdfFile(file: File | null) {
    if (!detail || !file) {
      return;
    }

    setActionError(null);
    setIsUploading(true);

    try {
      const upload = await createOpportunityFileUploadUrl(detail.opportunity.id, {
        file_name: file.name || "opportunity-intake.pdf",
        mime_type: file.type || "application/pdf",
        size_bytes: file.size || 1,
      });
      const csrfToken = readBrowserCsrfToken();
      const uploadResponse = await fetch(upload.upload.upload_url, {
        method: "PUT",
        body: file,
        headers: {
          "content-type": file.type || "application/pdf",
          ...(csrfToken ? { "x-csrf-token": csrfToken } : {}),
        },
        credentials: "include",
      });
      if (!uploadResponse.ok) {
        throw new Error("PDF upload failed.");
      }
      const uploaded = await completeOpportunityFileUpload(detail.opportunity.id, upload.file.id, {
        object_key: upload.upload.object_key,
      });
      setLatestFileAsset(uploaded.file);
      setDetail((current) =>
        current
          ? {
              ...current,
              intake: {
                ...current.intake,
                latest_file: uploaded.file,
              },
            }
          : current,
      );
      if (draft) {
        setDraft((current) => (current ? { ...current, source_type: "pdf_upload" } : current));
      }
    } catch (caughtError) {
      setActionError(
        caughtError instanceof ProductApiError ? caughtError.message : "PDF upload failed.",
      );
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  async function handlePdfInputChange(event: ChangeEvent<HTMLInputElement>) {
    await handlePdfFile(event.target.files?.[0] ?? null);
  }

  function handlePdfDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    void handlePdfFile(event.dataTransfer.files?.[0] ?? null);
  }

  async function handleToggleExtractedTextPreview(fileAssetId: string | null) {
    if (!detail || !fileAssetId) {
      return;
    }

    if (expandedPreviewFileId === fileAssetId) {
      setExpandedPreviewFileId(null);
      return;
    }

    const currentLatestFile = latestFileAsset ?? detail.intake.latest_file ?? null;
    if (currentLatestFile?.id === fileAssetId && currentLatestFile.extracted_text) {
      setExpandedPreviewFileId(fileAssetId);
      setActionError(null);
      return;
    }

    try {
      const fileDetail = await fetchOpportunityFileDetail(detail.opportunity.id, fileAssetId);
      setLatestFileAsset(fileDetail.file);
      setDetail((current) =>
        current
          ? {
              ...current,
              intake: {
                ...current.intake,
                latest_file: fileDetail.file,
              },
          }
          : current,
      );
      setExpandedPreviewFileId(fileAssetId);
      setActionError(null);
    } catch {
      setActionError("We couldn't load the extracted text preview.");
    }
  }

  async function handleCreateManualInput() {
    if (!detail) {
      return;
    }

    try {
      const created = await createOpportunityInput(detail.opportunity.id, {
        input_type: "raw_input",
        content:
          "North Star needs a redesign, migration support, and analytics cleanup before proposal drafting.",
        source_label: "manual notes",
      });
      setDetail((current) =>
        current
          ? {
              ...current,
              intake: {
                ...current.intake,
                primary_input: created.input,
              },
            }
          : current,
      );
      if (draft) {
        setDraft((current) => (current ? { ...current, raw_input: created.input.content } : current));
      }
    } catch (caughtError) {
      setActionError(
        caughtError instanceof ProductApiError ? caughtError.message : "Could not create raw notes.",
      );
    }
  }

  async function handleUpdateManualInput(inputId: string | null) {
    if (!detail || !inputId) {
      return;
    }

    try {
      const updated = await updateOpportunityInput(
        detail.opportunity.id,
        inputId,
        {
          content:
            "North Star needs a redesign, migration support, and analytics cleanup before proposal drafting.",
          source_label: "manual notes",
        },
      );
      setDetail((current) =>
        current
          ? {
              ...current,
              intake: {
                ...current.intake,
                primary_input: updated.input,
              },
            }
          : current,
      );
    } catch {
      // Best effort.
    }
  }

  const resolvedLatestFile = latestFileAsset ?? detail?.intake?.latest_file ?? null;
  const latestFileState = resolvedLatestFile?.file_status ?? null;
  const isPreviewExpanded = expandedPreviewFileId !== null && expandedPreviewFileId === resolvedLatestFile?.id;
  const previewText = isPreviewExpanded ? resolvedLatestFile?.extracted_text ?? null : null;

  if (routeState === "not-found") {
    return (
      <ProductShell
        workspaceName={workspaceName}
        pageTitle="Opportunity not found."
        pageDescription="The requested opportunity is not available in this workspace."
        eyebrow="Opportunity intake"
      >
        <ProductStateBlock
          state="error"
          title="Opportunity not found."
          body="Return to Opportunities and reopen the record."
          detail="The requested opportunity record is missing or unavailable."
          primaryAction={{
            label: "Back to opportunities",
            href: BUSINESS_ROUTE_PATHS.opportunities,
          }}
        />
      </ProductShell>
    );
  }

  if (routeState) {
    const copy = ROUTE_STATE_COPY[routeState];
    const showSaveButton = routeState === "retry";
    const showGenerateButton = routeState === "success" || routeState === "blocked";

    return (
      <ProductShell
        workspaceName={workspaceName}
        pageTitle="Opportunity intake"
        pageDescription="The intake workspace keeps the shell visible while route states resolve."
        eyebrow="Opportunity intake"
        headerActions={
          showSaveButton ? (
            <button type="button" className="product-button product-button--ghost" onClick={handleManualSave}>
              <Save aria-hidden="true" size={16} />
              <span>Save opportunity</span>
            </button>
          ) : null
        }
      >
        <div className="intake-state-stack">
          <ProductStateBlock
            state={routeState}
            title={copy.title}
            body={copy.body}
            detail={copy.detail}
            primaryAction={
              showGenerateButton
                ? {
                    label: "Generate lead brief",
                    onAction: handleGenerateLeadBrief,
                    disabled: routeState === "blocked",
                  }
                : routeState === "error"
                  ? {
                      label: "Retry now",
                      onAction: () => router.refresh(),
                    }
                  : routeState === "loading"
                    ? {
                        label: "Loading opportunity intake",
                        disabled: true,
                    }
                : undefined
            }
          >
            {routeState === "blocked" ? (
              <p className="product-muted">
                Your PDF is still processing. You can wait for extraction or add manual source notes now.
              </p>
            ) : null}
            {routeState === "retry" ? (
              <p className="product-muted">
                The last save attempt failed, so keep the visible intake contract intact and retry once the record is stable.
              </p>
            ) : null}
          </ProductStateBlock>
        </div>
      </ProductShell>
    );
  }

  if (!detail) {
    return (
      <ProductShell
        workspaceName={workspaceName}
        pageTitle="Opportunity intake"
        pageDescription="We couldn't load this opportunity overview."
        eyebrow="Opportunity intake"
      >
        <ProductStateBlock
          state={error ? "error" : "loading"}
          title={error ? "We couldn't load this opportunity overview." : "Loading opportunity intake"}
          body={error ?? "Loading this intake workspace should preserve the shell while the overview record is still resolving."}
        />
      </ProductShell>
    );
  }

  const intake =
    detail.intake ?? {
      primary_input: null,
      latest_file: null,
      generation_gate: {
        can_generate: false,
        reason: null,
        detail: "Loading opportunity intake...",
      },
    };
  const generationGate = intake.generation_gate;
  const sourceMaterialPresent = Boolean(draft?.raw_input.trim()) || Boolean(intake.primary_input);
  const sourceMaterialHeading = sourceMaterialPresent ? "Current source material" : "No source material yet.";
  const latestFileName = resolvedLatestFile?.file_name ?? "No file uploaded";
  const latestFileUploadedAt = resolvedLatestFile?.uploaded_at ? new Date(resolvedLatestFile.uploaded_at) : null;

  return (
    <ProductShell
      workspaceName={workspaceName}
      pageTitle={detail.opportunity.title}
      pageDescription={`${detail.opportunity.company_name} · Lead intake workspace`}
      eyebrow={detail.workspace.eyebrow}
      headerMeta={<span className="product-chip">{saveLabel}</span>}
      headerActions={
        <div className="product-action-stack">
          <div className="product-action-stack__row">
            <button
              type="button"
              className="product-button product-button--primary"
              onClick={handleGenerateLeadBrief}
              disabled={!generationGate.can_generate}
            >
              <Sparkles aria-hidden="true" size={16} />
              <span>Generate lead brief</span>
            </button>
            <button
              type="button"
              className="product-button product-button--ghost"
              onClick={handleManualSave}
              disabled={isSaving}
            >
              <Save aria-hidden="true" size={16} />
              <span>Save opportunity</span>
            </button>
          </div>
          <p className="product-action-stack__note">
            {`Generate lead brief: ${generationGate.detail}`}
          </p>
          {Boolean(draft?.raw_input.trim()) || Boolean(intake.primary_input) ? (
            <p className="product-action-stack__note">The latest intake changes are safe to generate from.</p>
          ) : null}
        </div>
      }
    >
      <div className="intake-layout">
        <section className="product-panel intake-panel" aria-labelledby="source-material-heading">
          <div className="dashboard-panel__header">
            <div>
              <span className="panel-kicker">Source material</span>
              <h2 id="source-material-heading">Source material</h2>
            </div>
            <button type="button" className="product-button product-button--ghost" onClick={handleCreateManualInput}>
              <FileText aria-hidden="true" size={16} />
              <span>Seed raw notes</span>
            </button>
          </div>

          <div className="intake-panel__intro">
            <h3>{sourceMaterialHeading}</h3>
            <p>
              {sourceMaterialPresent
                ? "The primary notes stay editable while PDF extraction and manual notes converge into one intake record."
                : "Paste raw notes or upload a PDF to start shaping this opportunity. The minimum context stays editable while source material catches up."}
            </p>
          </div>

          <div
            className="intake-upload-zone"
            onDragOver={(event) => event.preventDefault()}
            onDrop={handlePdfDrop}
          >
            <div className="intake-upload-zone__copy">
              <span className="panel-kicker">PDF intake</span>
              <h3>Upload a PDF</h3>
              <p>
                Drop a file here or choose one manually. Extraction starts immediately and the rest of the intake stays editable.
              </p>
            </div>
            <div className="intake-upload-zone__actions">
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf,.pdf"
                data-testid="pdf-upload-input"
                onChange={handlePdfInputChange}
              />
              <button
                type="button"
                className="product-button product-button--ghost"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                <Upload aria-hidden="true" size={16} />
                <span>{isUploading ? "Uploading..." : "Upload PDF"}</span>
              </button>
            </div>
          </div>

          <label className="field">
            <span>Raw input</span>
            <textarea
              className="intake-raw-input"
              value={draft?.raw_input ?? ""}
              onChange={(event) => {
                if (!draft) {
                  return;
                }
                updateDraftField("raw_input", event.target.value);
              }}
              rows={10}
              aria-label="Raw input"
            />
          </label>

          {intake.primary_input ? (
            <div className="intake-source-summary">
              <div>
                <span className="panel-kicker">Primary source</span>
                <h3>{intake.primary_input.source_label ?? "Manual notes"}</h3>
              </div>
              <p>{intake.primary_input.content}</p>
              <div className="intake-inline-actions">
                <button
                  type="button"
                  className="product-button product-button--ghost"
                  onClick={() => void handleUpdateManualInput(intake.primary_input?.id ?? null)}
                >
                  <RefreshCw aria-hidden="true" size={16} />
                  <span>Refresh raw notes</span>
                </button>
              </div>
            </div>
          ) : null}

          {resolvedLatestFile && latestFileState ? (
            <div className="intake-file-states" data-testid="opportunity-file-state">
              <article
                className="intake-file-card"
                data-file-state={latestFileState}
                data-active="true"
              >
                <div className="intake-file-card__header">
                  <span className="product-chip product-chip--step">{getFileStateCopy(latestFileState).title}</span>
                  <span className="product-chip">Current</span>
                </div>
                <h3>{getFileStateCopy(latestFileState).title}</h3>
                <p className="intake-file-card__meta">
                  {latestFileName}
                  {latestFileUploadedAt ? ` · uploaded ${latestFileUploadedAt.toLocaleString()}` : ""}
                </p>
                <p>{getFileStateCopy(latestFileState).body}</p>
                {latestFileState === "failed" ? (
                  <button
                    type="button"
                    className="product-button product-button--ghost"
                    onClick={() => void handleRetryExtraction(resolvedLatestFile.id)}
                  >
                    Retry extraction
                  </button>
                ) : null}
                {latestFileState === "processing" ? (
                  <p className="product-muted">Keep editing raw input while extraction runs.</p>
                ) : null}
                {latestFileState === "ready" ? (
                  <div className="intake-preview-toggle">
                    <button
                      type="button"
                      className="product-button product-button--ghost"
                      onClick={() => void handleToggleExtractedTextPreview(resolvedLatestFile.id)}
                    >
                      {isPreviewExpanded ? "Hide extracted text preview" : "Open extracted text preview"}
                    </button>
                  </div>
                ) : null}
              </article>
            </div>
          ) : (
            <section className="intake-file-empty" data-testid="opportunity-file-state" aria-label="PDF intake status">
              <span className="panel-kicker">PDF status</span>
              <h3>No PDF uploaded yet</h3>
              <p>Upload a PDF to start extraction. Raw input stays editable even without a file.</p>
            </section>
          )}

          {isPreviewExpanded ? (
            <section className="intake-preview-panel" aria-labelledby="extracted-text-preview-heading">
              <div className="intake-preview-panel__header">
                <div>
                  <span className="panel-kicker">Extracted text preview</span>
                  <h3 id="extracted-text-preview-heading">From the latest PDF upload</h3>
                </div>
                <button
                  type="button"
                  className="product-button product-button--ghost"
                  onClick={() => setExpandedPreviewFileId(null)}
                >
                  Close preview
                </button>
              </div>
              <pre className="intake-preview-panel__body">{previewText || "No extracted text is available yet."}</pre>
            </section>
          ) : null}
        </section>

        <section className="product-panel intake-panel" aria-labelledby="minimum-context-heading">
          <div className="dashboard-panel__header">
            <div>
              <span className="panel-kicker">Minimum opportunity context</span>
              <h2 id="minimum-context-heading">Minimum opportunity context</h2>
            </div>
            <span className="product-chip">{detail.workflow.current_step.label}</span>
          </div>

          <form
            className="intake-form"
            onSubmit={(event) => {
              event.preventDefault();
              void handleManualSave();
            }}
          >
            <label className="field">
              <span>Title</span>
              <input
                type="text"
                value={draft?.title ?? ""}
                onChange={(event) => {
                  if (!draft) {
                    return;
                  }
                  updateDraftField("title", event.target.value);
                }}
              />
            </label>

            <label className="field">
              <span>Company name</span>
              <input
                type="text"
                value={draft?.company_name ?? ""}
                onChange={(event) => {
                  if (!draft) {
                    return;
                  }
                  updateDraftField("company_name", event.target.value);
                }}
              />
            </label>

            <label className="field">
              <span>Requested service</span>
              <textarea
                value={draft?.requested_service ?? ""}
                onChange={(event) => {
                  if (!draft) {
                    return;
                  }
                  updateDraftField("requested_service", event.target.value);
                }}
                rows={4}
              />
            </label>

            <div className="intake-form__grid">
              <label className="field">
                <span>Contact name</span>
                <input
                  type="text"
                  value={draft?.contact_name ?? ""}
                  onChange={(event) => {
                    if (!draft) {
                      return;
                    }
                    updateDraftField("contact_name", event.target.value);
                  }}
                />
              </label>

              <label className="field">
                <span>Contact email</span>
                <input
                  type="email"
                  value={draft?.contact_email ?? ""}
                  onChange={(event) => {
                    if (!draft) {
                      return;
                    }
                    updateDraftField("contact_email", event.target.value);
                  }}
                />
              </label>
            </div>

            <label className="field">
              <span>Source type</span>
              <select
                value={draft?.source_type ?? "manual"}
                onChange={(event) => {
                  if (!draft) {
                    return;
                  }
                  updateDraftField("source_type", event.target.value);
                }}
              >
                <option value="manual">Manual</option>
                <option value="email_thread">Email thread</option>
                <option value="pdf_upload">PDF upload</option>
              </select>
            </label>

            <div className="intake-context-summary">
              <div>
                <span className="panel-kicker">Owner</span>
                <p>{detail.minimum_context.owner.name ?? "Unknown owner"}</p>
              </div>
              <div>
                <span className="panel-kicker">Saved state</span>
                <p>{saveLabel}</p>
              </div>
            </div>

            {actionError ? <p className="inline-alert">{actionError}</p> : null}

            <p className="product-muted">
              Use the header actions to save changes or move this opportunity into the lead brief once the intake is ready.
            </p>
          </form>
        </section>
      </div>
    </ProductShell>
  );
}
