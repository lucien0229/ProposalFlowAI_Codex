"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

import {
  type ProposalDraftSectionKey,
  type WorkspaceRuleSet,
} from "@proposalflow/shared-types";

import { ProductStateBlock } from "@/components/product-state-block";
import {
  RuleImpactNote,
} from "@/components/templates-rules/rule-impact-note";
import {
  TemplatesRulesForm,
  type TemplatesRulesFieldErrors,
  type TemplatesRulesFieldKey,
} from "@/components/templates-rules/templates-rules-form";
import { ProductApiError } from "@/lib/product-api";
import {
  fetchTemplates,
  fetchWorkspaceRules,
  saveWorkspaceRules,
  validateWorkspaceRules,
  type TemplateListItem,
} from "@/lib/templates-rules-api";

type TemplatesRulesPageProps = {
  returnTo: string | null;
};

type WorkspaceState = "loading" | "ready" | "error";

type StatusBandState = {
  state: "error" | "retry" | "blocked" | "success";
  title: string;
  body: string;
  detail?: string | null;
  items?: string[];
  retry?: () => void;
};

type TemplatesRulesValidationState = {
  fieldErrors: TemplatesRulesFieldErrors;
  saveBlockers: string[];
};

const LOCKED_REQUIRED_SECTIONS = ["assumptions", "exclusions"] as const;

function textareaValueToList(value: string) {
  return value
    .split("\n")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function readObject(payload: unknown, key: string) {
  if (!payload || typeof payload !== "object") {
    return null;
  }
  const value = (payload as Record<string, unknown>)[key];
  return value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : null;
}

function readString(payload: unknown, key: string) {
  if (!payload || typeof payload !== "object") {
    return null;
  }
  const value = (payload as Record<string, unknown>)[key];
  return typeof value === "string" ? value : null;
}

function dedupeList(values: string[]) {
  return Array.from(new Set(values));
}

function createValidationStatusBand(
  validation: TemplatesRulesValidationState,
  detail?: string | null,
): StatusBandState {
  const fallbackDetail =
    detail ??
    validation.fieldErrors.preferred_terminology ??
    validation.fieldErrors.required_sections ??
    validation.fieldErrors.section_order ??
    null;

  return {
    state: "blocked",
    title: "Rules validation needs attention",
    body: "This ruleset has conflicts. Fix them before saving.",
    detail: fallbackDetail,
    items: validation.saveBlockers,
  };
}

function buildLocalValidationState(
  ruleSet: WorkspaceRuleSet,
): TemplatesRulesValidationState {
  const fieldErrors: TemplatesRulesFieldErrors = {};
  const saveBlockers: string[] = [];

  const preferred = ruleSet.preferred_terminology.map((value) =>
    value.trim().toLowerCase(),
  );
  const banned = new Set(
    ruleSet.banned_terminology.map((value) => value.trim().toLowerCase()),
  );

  const overlappingTerms = preferred.filter((value) => banned.has(value));
  if (overlappingTerms.length > 0) {
    const message =
      "Remove the overlap before saving so the drafting guidance stays unambiguous.";
    fieldErrors.preferred_terminology = message;
    fieldErrors.banned_terminology = message;
    saveBlockers.push("Preferred terminology and banned terminology overlap.");
  }

  const missingLockedSections = LOCKED_REQUIRED_SECTIONS.filter(
    (sectionKey) => !ruleSet.required_sections.includes(sectionKey),
  );
  if (missingLockedSections.length > 0) {
    fieldErrors.required_sections =
      "Assumptions and Exclusions must stay visible before Proposal Draft generation.";
    saveBlockers.push(
      "Assumptions and Exclusions must stay marked as required sections.",
    );
  }

  if (ruleSet.section_order.length === 0) {
    fieldErrors.section_order =
      "Add at least one section so Proposal Draft keeps a stable chapter order.";
    saveBlockers.push("Add at least one section to the chapter order.");
  }

  return {
    fieldErrors,
    saveBlockers: dedupeList(saveBlockers),
  };
}

function buildRemoteValidationState(
  error: unknown,
): { detail: string | null; validation: TemplatesRulesValidationState } | null {
  if (!(error instanceof ProductApiError) || error.status !== 422) {
    return null;
  }

  const errorPayload = readObject(error.payload, "error");
  const details = readObject(errorPayload, "details");
  const field = readString(details, "field");
  const uiWarning =
    readString(details, "ui_warning") ??
    "Resolve the rules conflict before saving.";

  const fieldErrors: TemplatesRulesFieldErrors = {};
  if (field === "preferred_terminology") {
    fieldErrors.preferred_terminology = uiWarning;
    fieldErrors.banned_terminology = uiWarning;
  } else if (
    field === "required_sections" ||
    field === "section_order" ||
    field === "default_assumptions" ||
    field === "default_exclusions" ||
    field === "service_modules" ||
    field === "banned_terminology"
  ) {
    fieldErrors[field] = uiWarning;
  }

  const label =
    field === "required_sections"
      ? "Required sections"
      : field === "section_order"
        ? "Section order"
        : field === "preferred_terminology" || field === "banned_terminology"
          ? "Terminology"
          : field === "service_modules"
            ? "Service modules"
            : "Rules";

  return {
    detail: uiWarning,
    validation: {
      fieldErrors,
      saveBlockers: [`${label}: ${uiWarning}`],
    },
  };
}

function readApiError(error: unknown, fallbackMessage: string) {
  if (error instanceof ProductApiError) {
    const errorPayload = readObject(error.payload, "error");
    const details = readObject(errorPayload, "details");
    return {
      status: error.status,
      message:
        readString(errorPayload, "message") ?? error.message ?? fallbackMessage,
      detail:
        readString(details, "ui_warning") ??
        readString(details, "reload_hint") ??
        readString(errorPayload, "detail"),
    };
  }

  if (error instanceof Error) {
    return {
      status: 500,
      message: error.message,
      detail: null,
    };
  }

  return {
    status: 500,
    message: fallbackMessage,
    detail: null,
  };
}

function moveSection(
  sections: ProposalDraftSectionKey[],
  sectionKey: ProposalDraftSectionKey,
  direction: "up" | "down",
) {
  const currentIndex = sections.indexOf(sectionKey);
  if (currentIndex === -1) {
    return sections;
  }

  const nextIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
  if (nextIndex < 0 || nextIndex >= sections.length) {
    return sections;
  }

  const nextSections = sections.slice();
  const currentSection = nextSections[currentIndex];
  const nextSection = nextSections[nextIndex];
  if (!currentSection || !nextSection) {
    return sections;
  }
  nextSections[currentIndex] = nextSection;
  nextSections[nextIndex] = currentSection;
  return nextSections;
}

function TemplatesRulesStatusBand({
  band,
}: {
  band: StatusBandState;
}) {
  return (
    <section
      className="inline-alert templates-rules-status-band"
      data-testid="templates-rules-status-band"
      data-state={band.state}
      role={band.state === "error" || band.state === "blocked" ? "alert" : "status"}
    >
      <div className="templates-rules-status-band__copy">
        <strong>{band.title}</strong>
        <p>{band.body}</p>
        {band.detail ? <span>{band.detail}</span> : null}
        {band.items?.length ? (
          <ul className="templates-rules-status-band__items">
            {band.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        ) : null}
      </div>

      {band.retry ? (
        <button
          type="button"
          className="product-button product-button--ghost"
          onClick={band.retry}
        >
          Retry
        </button>
      ) : null}
    </section>
  );
}

export function TemplatesRulesPage({ returnTo }: TemplatesRulesPageProps) {
  const [workspaceState, setWorkspaceState] =
    useState<WorkspaceState>("loading");
  const [templates, setTemplates] = useState<TemplateListItem[]>([]);
  const [ruleSet, setRuleSet] = useState<WorkspaceRuleSet | null>(null);
  const [draftRuleSet, setDraftRuleSet] = useState<WorkspaceRuleSet | null>(
    null,
  );
  const [statusBand, setStatusBand] = useState<StatusBandState | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [touchedFields, setTouchedFields] = useState<
    Partial<Record<TemplatesRulesFieldKey, boolean>>
  >({});
  const loadRequestRef = useRef(0);

  const activeTemplateOptions = useMemo(
    () => templates.filter((template) => template.is_active),
    [templates],
  );

  const templateOptions =
    activeTemplateOptions.length > 0 ? activeTemplateOptions : templates;

  const validationState = useMemo(
    () =>
      draftRuleSet
        ? buildLocalValidationState(draftRuleSet)
        : { fieldErrors: {}, saveBlockers: [] },
    [draftRuleSet],
  );

  const visibleFieldErrors = useMemo(() => {
    if (!draftRuleSet) {
      return {} as TemplatesRulesFieldErrors;
    }

    return Object.entries(validationState.fieldErrors).reduce(
      (accumulator, [field, message]) => {
        if (submitAttempted || touchedFields[field as TemplatesRulesFieldKey]) {
          accumulator[field as TemplatesRulesFieldKey] = message;
        }
        return accumulator;
      },
      {} as TemplatesRulesFieldErrors,
    );
  }, [draftRuleSet, submitAttempted, touchedFields, validationState.fieldErrors]);

  const hasPendingChanges = useMemo(() => {
    if (!draftRuleSet) {
      return false;
    }
    return JSON.stringify(ruleSet) !== JSON.stringify(draftRuleSet);
  }, [draftRuleSet, ruleSet]);

  async function loadPage() {
    const requestId = loadRequestRef.current + 1;
    loadRequestRef.current = requestId;
    setWorkspaceState("loading");
    setStatusBand(null);
    setSubmitAttempted(false);
    setTouchedFields({});

    try {
      const templatesResponse = await fetchTemplates();
      if (loadRequestRef.current !== requestId) {
        return;
      }

      setTemplates(templatesResponse.data);

      try {
        const rulesResponse = await fetchWorkspaceRules();
        if (loadRequestRef.current !== requestId) {
          return;
        }

        setRuleSet(rulesResponse.workspace_rule_set);
        setDraftRuleSet(rulesResponse.workspace_rule_set);
        setWorkspaceState("ready");
      } catch (error) {
        if (loadRequestRef.current !== requestId) {
          return;
        }

        const details = readApiError(
          error,
          "We couldn't load Templates & Rules.",
        );
        setWorkspaceState("error");
        setStatusBand({
          state: "error",
          title: "Templates & Rules is unavailable",
          body: details.message,
          detail: details.detail,
          retry: () => {
            void loadPage();
          },
        });
      }
    } catch (error) {
      if (loadRequestRef.current !== requestId) {
        return;
      }

      const details = readApiError(error, "We couldn't load Templates & Rules.");
      setWorkspaceState("error");
      setStatusBand({
        state: "error",
        title: "Templates & Rules is unavailable",
        body: details.message,
        detail: details.detail,
        retry: () => {
          void loadPage();
        },
      });
    }
  }

  useEffect(() => {
    void loadPage();
  }, []);

  function markFieldTouched(field: TemplatesRulesFieldKey) {
    setTouchedFields((current) => ({
      ...current,
      [field]: true,
    }));
  }

  function updateDraftRuleSet<K extends keyof WorkspaceRuleSet>(
    key: K,
    value: WorkspaceRuleSet[K],
  ) {
    setDraftRuleSet((current) => {
      if (!current) {
        return current;
      }

      return {
        ...current,
        [key]: value,
      };
    });
    setStatusBand(null);
  }

  async function handleSaveRules() {
    if (!draftRuleSet) {
      return;
    }

    setIsSaving(true);
    setSubmitAttempted(true);
    setStatusBand(null);

    const localValidation = buildLocalValidationState(draftRuleSet);
    if (localValidation.saveBlockers.length > 0) {
      setStatusBand(createValidationStatusBand(localValidation));
      setIsSaving(false);
      return;
    }

    try {
      await validateWorkspaceRules({
        rule_set: draftRuleSet,
      });

      const response = await saveWorkspaceRules({
        expected_updated_at:
          ruleSet?.updated_at || draftRuleSet.updated_at || new Date(0).toISOString(),
        rule_set: draftRuleSet,
      });

      setRuleSet(response.workspace_rule_set);
      setDraftRuleSet(response.workspace_rule_set);
      setWorkspaceState("ready");
      setTouchedFields({});
      setStatusBand({
        state: "success",
        title: "Workspace rules saved",
        body: "Return to Proposal Draft to see the refreshed baseline in the effective rules summary.",
      });
    } catch (error) {
      const remoteValidation = buildRemoteValidationState(error);
      if (remoteValidation) {
        setStatusBand(
          createValidationStatusBand(
            remoteValidation.validation,
            remoteValidation.detail,
          ),
        );
      } else {
        const details = readApiError(error, "Saving rules failed.");
        setStatusBand({
          state: "retry",
          title: "Save rules failed",
          body: details.message,
          detail: details.detail,
          retry: () => {
            void handleSaveRules();
          },
        });
      }
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="templates-rules-page" data-testid="templates-rules-page">
      <header
        className="templates-rules-page__header"
        data-testid="templates-rules-header"
      >
        <div className="templates-rules-page__copy">
          <span className="panel-kicker">Workspace baseline editor</span>
          <h2>Templates &amp; Rules</h2>
          <p>Set the workspace defaults that shape every proposal draft.</p>
        </div>

        <div className="templates-rules-page__actions">
          {returnTo ? (
            <Link href={returnTo} className="product-button product-button--ghost">
              Return to Proposal Draft
            </Link>
          ) : null}
          <button
            type="button"
            className="product-button product-button--primary"
            onClick={() => void handleSaveRules()}
            disabled={isSaving || !draftRuleSet}
          >
            Save rules
          </button>
        </div>
      </header>

      {statusBand ? <TemplatesRulesStatusBand band={statusBand} /> : null}

      <div className="templates-rules-page__grid">
        <section className="product-panel templates-rules-editor">
          {workspaceState === "loading" ? (
            <ProductStateBlock
              state="loading"
              title="Loading Templates & Rules"
              body="Fetching the current workspace baseline, templates, and saved defaults."
            />
          ) : null}

          {workspaceState === "error" ? (
            <ProductStateBlock
              state="error"
              title="Templates & Rules is unavailable."
              body="Retry to reload the workspace defaults without leaving the customer shell."
            />
          ) : null}

          {workspaceState !== "loading" &&
          workspaceState !== "error" &&
          draftRuleSet ? (
            <TemplatesRulesForm
              ruleSet={draftRuleSet}
              templates={templateOptions}
              fieldErrors={visibleFieldErrors}
              isSaving={isSaving}
              onFieldBlur={markFieldTouched}
              onTemplateChange={(value) =>
                updateDraftRuleSet("template_key", value)
              }
              onToneChange={(value) =>
                updateDraftRuleSet("tone_profile", value)
              }
              onListFieldChange={(field, value) =>
                updateDraftRuleSet(
                  field,
                  textareaValueToList(value) as WorkspaceRuleSet[typeof field],
                )
              }
              onToggleRequiredSection={(sectionKey) => {
                setStatusBand(null);
                markFieldTouched("required_sections");
                setDraftRuleSet((current) => {
                  if (!current) {
                    return current;
                  }

                  const nextRequiredSections = current.required_sections.includes(
                    sectionKey,
                  )
                    ? current.required_sections.filter(
                        (value) => value !== sectionKey,
                      )
                    : [...current.required_sections, sectionKey];

                  return {
                    ...current,
                    required_sections: nextRequiredSections,
                  };
                });
              }}
              onMoveSection={(sectionKey, direction) => {
                setStatusBand(null);
                markFieldTouched("section_order");
                setDraftRuleSet((current) => {
                  if (!current) {
                    return current;
                  }

                  return {
                    ...current,
                    section_order: moveSection(
                      current.section_order,
                      sectionKey,
                      direction,
                    ),
                  };
                });
              }}
            />
          ) : null}
        </section>

        <aside className="product-panel templates-rules-sidebar">
          <section className="templates-rules-sidebar__section">
            <p className="panel-kicker">Return path</p>
            <h3>Proposal Draft continuity</h3>
            <p>
              Save rules here, then return to Proposal Draft to see the
              refreshed effective baseline without losing the current
              opportunity context.
            </p>
          </section>

          <RuleImpactNote
            ruleSet={draftRuleSet}
            templates={templateOptions}
            isSaved={statusBand?.state === "success"}
            hasPendingChanges={hasPendingChanges}
          />
        </aside>
      </div>
    </div>
  );
}
