"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import {
  WORKSPACE_SETUP_DEFAULTS_BY_INDUSTRY,
  WORKSPACE_INDUSTRY_VALUES,
  WORKSPACE_TEMPLATE_VALUES,
  WORKSPACE_TONE_PREFERENCE_VALUES,
} from "@proposalflow/shared-config";
import type {
  WorkspaceIndustryType,
  WorkspaceTemplateKey,
  WorkspaceTonePreference,
} from "@proposalflow/shared-types";

type WorkspaceSetupFormProps = {
  returnUrl: string | null;
};

type WorkspaceState = {
  workspaceName: string;
  industryType: WorkspaceIndustryType;
  templateKey: WorkspaceTemplateKey;
  tonePreference: WorkspaceTonePreference;
};

const INDUSTRY_LABELS: Partial<Record<WorkspaceIndustryType, string>> = {
  web_development_agency: "Web development agency",
  product_ux_agency: "Product and UX agency",
};

const TEMPLATE_LABELS: Partial<Record<WorkspaceTemplateKey, string>> = {
  development_agency: "Development agency",
  product_ux_agency: "Product and UX agency",
};

const TONE_LABELS: Partial<Record<WorkspaceTonePreference, string>> = {
  balanced: "Balanced",
  direct: "Direct",
  consultative: "Consultative",
};

function formatFallbackLabel(value: string) {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getOptionLabel<T extends string>(labels: Partial<Record<T, string>>, value: T) {
  return labels[value] ?? formatFallbackLabel(value);
}

function getDefaults(industryType: WorkspaceIndustryType) {
  return WORKSPACE_SETUP_DEFAULTS_BY_INDUSTRY[industryType];
}

export function WorkspaceSetupForm({ returnUrl }: WorkspaceSetupFormProps) {
  const router = useRouter();
  const [state, setState] = useState<WorkspaceState>({
    workspaceName: "",
    industryType: WORKSPACE_INDUSTRY_VALUES[0],
    templateKey: WORKSPACE_SETUP_DEFAULTS_BY_INDUSTRY[WORKSPACE_INDUSTRY_VALUES[0]]
      .default_template_key,
    tonePreference: WORKSPACE_SETUP_DEFAULTS_BY_INDUSTRY[WORKSPACE_INDUSTRY_VALUES[0]]
      .default_tone_preference,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateIndustryType(industryType: WorkspaceIndustryType) {
    const defaults = getDefaults(industryType);
    setState((current) => ({
      ...current,
      industryType,
      templateKey: defaults.default_template_key,
      tonePreference: defaults.default_tone_preference,
    }));
  }

  async function submitForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/v1/workspaces", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "x-csrf-token": document.cookie
            .split("; ")
            .find((cookie) => cookie.startsWith("pf_csrf_token="))
            ?.split("=")[1] ?? "",
        },
        body: JSON.stringify({
          workspace_name: state.workspaceName,
          industry_type: state.industryType,
          default_template_key: state.templateKey,
          default_tone_preference: state.tonePreference,
          return_url: returnUrl,
        }),
      });

      const data = (await response.json().catch(() => ({}))) as Record<string, unknown>;
      if (!response.ok) {
        const message = typeof data.detail === "string" ? data.detail : "Unable to create workspace.";
        setError(message);
        return;
      }

      const nextUrl =
        typeof data.redirect_to === "string"
          ? data.redirect_to
          : typeof data.next_url === "string"
            ? data.next_url
            : "/dashboard";
      router.replace(nextUrl);
    } catch {
      setError("Unable to create workspace.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="workspace-form" onSubmit={submitForm} aria-busy={isSubmitting}>
      <label className="field">
        <span>Workspace name</span>
        <input
          type="text"
          required
          minLength={2}
          value={state.workspaceName}
          onChange={(event) => setState((current) => ({ ...current, workspaceName: event.target.value }))}
          placeholder="North Star Studio"
        />
      </label>

      <label className="field">
        <span>Industry type</span>
        <select
          value={state.industryType}
          onChange={(event) => updateIndustryType(event.target.value as WorkspaceIndustryType)}
        >
          {WORKSPACE_INDUSTRY_VALUES.map((value) => (
            <option key={value} value={value}>
              {getOptionLabel(INDUSTRY_LABELS, value)}
            </option>
          ))}
        </select>
      </label>

      <div className="workspace-form__grid">
        <label className="field">
          <span>Default template</span>
          <select
            value={state.templateKey}
            onChange={(event) => setState((current) => ({ ...current, templateKey: event.target.value as WorkspaceTemplateKey }))}
          >
            {WORKSPACE_TEMPLATE_VALUES.map((value) => (
              <option key={value} value={value}>
                {getOptionLabel(TEMPLATE_LABELS, value)}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span>Default tone preference</span>
          <select
            value={state.tonePreference}
            onChange={(event) =>
              setState((current) => ({
                ...current,
                tonePreference: event.target.value as WorkspaceTonePreference,
              }))
            }
          >
            {WORKSPACE_TONE_PREFERENCE_VALUES.map((value) => (
              <option key={value} value={value}>
                {getOptionLabel(TONE_LABELS, value)}
              </option>
            ))}
          </select>
        </label>
      </div>

      {error ? (
        <div
          className="workspace-form__alert workspace-form__alert--error"
          role="alert"
          aria-live="assertive"
        >
          {error}
        </div>
      ) : null}

      <button className="workspace-form__submit" type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Creating workspace..." : "Continue to dashboard"}
      </button>
    </form>
  );
}
