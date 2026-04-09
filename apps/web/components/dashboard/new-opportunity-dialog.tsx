"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { X } from "lucide-react";

import { OPPORTUNITY_SOURCE_TYPES } from "@proposalflow/shared-types";
import type {
  CreateOpportunityRequest,
  OpportunitySourceType,
} from "@proposalflow/shared-types";
import { createDashboardOpportunity } from "@/lib/dashboard-api";
import { ProductApiError } from "@/lib/product-api";

type NewOpportunityDialogProps = {
  open: boolean;
  onClose: () => void;
  onCreated: (redirectTo: string) => void;
};

type FormState = {
  title: string;
  company_name: string;
  requested_service: string;
  source_type: OpportunitySourceType;
};

type FieldErrors = Partial<Record<"title" | "company_name", string>>;

const initialState: FormState = {
  title: "",
  company_name: "",
  requested_service: "",
  source_type: "manual",
};

export function NewOpportunityDialog({
  open,
  onClose,
  onCreated,
}: NewOpportunityDialogProps) {
  const [formState, setFormState] = useState<FormState>(initialState);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const restoreFocusRef = useRef(false);

  useEffect(() => {
    if (!open) {
      if (restoreFocusRef.current) {
        returnFocusRef.current?.focus();
        restoreFocusRef.current = false;
      }
      return;
    }

    restoreFocusRef.current = true;
    returnFocusRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setFormState(initialState);
    setFieldErrors({});
    setError(null);
    setIsSubmitting(false);
    titleRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape" && !isSubmitting) {
        onClose();
      }
    }

    function handleTabTrap(event: KeyboardEvent) {
      if (event.key !== "Tab" || !dialogRef.current) {
        return;
      }

      const focusableElements = dialogRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );

      if (focusableElements.length === 0) {
        return;
      }

      const firstElement = focusableElements.item(0);
      const lastElement = focusableElements.item(focusableElements.length - 1);
      const activeElement = document.activeElement instanceof HTMLElement ? document.activeElement : null;

      if (!firstElement || !lastElement) {
        return;
      }

      if (!activeElement || !dialogRef.current.contains(activeElement)) {
        event.preventDefault();
        firstElement.focus();
        return;
      }

      if (event.shiftKey && activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
        return;
      }

      if (!event.shiftKey && activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    }

    window.addEventListener("keydown", handleEscape);
    window.addEventListener("keydown", handleTabTrap);
    return () => {
      window.removeEventListener("keydown", handleEscape);
      window.removeEventListener("keydown", handleTabTrap);
    };
  }, [isSubmitting, onClose, open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  function validateForm() {
    const nextErrors: FieldErrors = {};

    if (!formState.title.trim()) {
      nextErrors.title = "Title is required.";
    }

    if (!formState.company_name.trim()) {
      nextErrors.company_name = "Company name is required.";
    }

    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    const payload: CreateOpportunityRequest = {
      title: formState.title.trim(),
      company_name: formState.company_name.trim(),
      requested_service: formState.requested_service.trim() || null,
      source_type: formState.source_type,
    };

    try {
      const response = await createDashboardOpportunity(payload);
      onCreated(response.redirect_to);
      onClose();
    } catch (caughtError) {
      setError(
        caughtError instanceof ProductApiError
          ? caughtError.message
          : "The opportunity could not be created.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!open) {
    return null;
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <div
        className="modal-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-opportunity-title"
        ref={dialogRef}
      >
        <div className="modal-card__header">
          <div>
            <span className="panel-kicker">Start intake</span>
            <h2 id="new-opportunity-title">New opportunity</h2>
          </div>

          <button
            type="button"
            className="icon-button"
            onClick={onClose}
            aria-label="Close new opportunity dialog"
            disabled={isSubmitting}
          >
            <X aria-hidden="true" size={16} />
          </button>
        </div>

        <form className="modal-form" onSubmit={handleSubmit}>
          <label className="field">
            <span>Title</span>
            <input
              ref={titleRef}
              type="text"
              value={formState.title}
              onChange={(event) => setFormState((current) => ({ ...current, title: event.target.value }))}
              aria-invalid={fieldErrors.title ? "true" : "false"}
            />
            {fieldErrors.title ? <small className="field-error">{fieldErrors.title}</small> : null}
          </label>

          <label className="field">
            <span>Company name</span>
            <input
              type="text"
              value={formState.company_name}
              onChange={(event) =>
                setFormState((current) => ({ ...current, company_name: event.target.value }))
              }
              aria-invalid={fieldErrors.company_name ? "true" : "false"}
            />
            {fieldErrors.company_name ? (
              <small className="field-error">{fieldErrors.company_name}</small>
            ) : null}
          </label>

          <label className="field">
            <span>Requested service</span>
            <textarea
              value={formState.requested_service}
              onChange={(event) =>
                setFormState((current) => ({
                  ...current,
                  requested_service: event.target.value,
                }))
              }
              rows={4}
            />
          </label>

          <label className="field">
            <span>Source type</span>
            <select
              value={formState.source_type}
              onChange={(event) =>
                setFormState((current) => ({
                  ...current,
                  source_type: event.target.value as OpportunitySourceType,
                }))
              }
            >
              {OPPORTUNITY_SOURCE_TYPES.map((value) => (
                <option key={value} value={value}>
                  {value.replaceAll("_", " ")}
                </option>
              ))}
            </select>
          </label>

          {error ? (
            <div className="inline-alert inline-alert--error" role="alert" aria-live="assertive">
              {error}
            </div>
          ) : null}

          <div className="modal-card__actions">
            <button
              type="button"
              className="product-button product-button--ghost"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button type="submit" className="product-button product-button--primary" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Continue to overview"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
