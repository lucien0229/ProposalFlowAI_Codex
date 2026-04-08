import Link from "next/link";

import { PRODUCT_STATES, type ProductState } from "@proposalflow/shared-types";

type StatusPanelProps = {
  state: ProductState;
};

const stateContent: Record<
  ProductState,
  {
    label: string;
    title: string;
    body: string;
    primaryAction: string;
    secondaryAction: string;
  }
> = {
  loading: {
    label: "Loading",
    title: "Gathering workspace context.",
    body: "The shell is live while data and permissions resolve in the background.",
    primaryAction: "Review queued work",
    secondaryAction: "Try success",
  },
  empty: {
    label: "Empty",
    title: "Nothing has been attached to this opportunity yet.",
    body: "Use the next task to add structured content without replacing the shell.",
    primaryAction: "Create first item",
    secondaryAction: "See blocked state",
  },
  error: {
    label: "Error",
    title: "A downstream request failed.",
    body: "This state keeps the page readable and recovery-oriented rather than collapsing.",
    primaryAction: "Retry request",
    secondaryAction: "View loading",
  },
  blocked: {
    label: "Blocked",
    title: "An access rule is holding the next step.",
    body: "The shell clearly tells the user what is blocked and who can unblock it.",
    primaryAction: "Request access",
    secondaryAction: "See retry state",
  },
  retry: {
    label: "Retry",
    title: "The user can safely try again.",
    body: "The recovery path stays visible, legible, and distinct from the error state.",
    primaryAction: "Retry now",
    secondaryAction: "View success",
  },
  success: {
    label: "Success",
    title: "The workspace is ready for the next action.",
    body: "This is the baseline shipping surface that later workflow pages will inherit.",
    primaryAction: "Continue",
    secondaryAction: "Review states",
  },
};

export function StatusPanel({ state }: StatusPanelProps) {
  const content = stateContent[state];

  return (
    <section className="status-panel" aria-label="Customer product state panel">
      <div className="status-panel__header">
        <div>
          <span className="state-badge">{content.label}</span>
          <h2 className="status-panel__title">{content.title}</h2>
          <p className="status-panel__copy">{content.body}</p>
        </div>
        <span className="meta-chip">Current state: {state}</span>
      </div>

      <div className="state-panel">
        <div className="state-panel__visual">
          <div className="state-orb" aria-hidden="true" />
          <div className="state-copy">
            <h3>{content.primaryAction}</h3>
            <p>
              The action area keeps the shell feeling like a working product surface instead of a
              demo note.
            </p>
          </div>
        </div>

        <div className="state-actions">
          <a className="state-primary" href={`/?state=${state}`}>
            {content.primaryAction}
          </a>
          <a className="state-secondary" href={`/?state=${state}`}>
            {content.secondaryAction}
          </a>
        </div>

        <div className="state-switcher" aria-label="Product state switcher">
          {PRODUCT_STATES.map((candidate) => (
            <Link
              key={candidate}
              href={`/?state=${candidate}`}
              className="state-pill"
              data-active={candidate === state}
            >
              {candidate}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
