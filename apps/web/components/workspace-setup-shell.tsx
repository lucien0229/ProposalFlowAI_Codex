import type { ReactNode } from "react";

type WorkspaceSetupShellProps = {
  children: ReactNode;
};

const setupHighlights = [
  {
    label: "Captured now",
    value: "Workspace name, industry, template, and tone.",
  },
  {
    label: "Editable later",
    value: "Tune the defaults once the workspace is live.",
  },
];

export function WorkspaceSetupShell({ children }: WorkspaceSetupShellProps) {
  return (
    <main className="workspace-shell">
      <section className="workspace-shell__frame">
        <aside className="workspace-shell__intro">
          <div className="workspace-shell__brand">
            <span className="workspace-shell__badge">ProposalFlow AI</span>
            <span className="workspace-shell__kicker">Workspace setup</span>
          </div>
          <h1 className="workspace-shell__title">Set the defaults that guide every proposal draft.</h1>
          <p className="workspace-shell__description">
            Capture the smallest stable business context so the first proposal starts fast, stays consistent, and feels on brand.
          </p>

          <div className="workspace-shell__summary">
            {setupHighlights.map((item) => (
              <div className="workspace-shell__summary-row" key={item.label}>
                <strong>{item.label}</strong>
                <span>{item.value}</span>
              </div>
            ))}
          </div>
        </aside>

        <section className="workspace-shell__panel">{children}</section>
      </section>
    </main>
  );
}
