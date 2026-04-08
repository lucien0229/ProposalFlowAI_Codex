import type { ReactNode } from "react";

import { ADMIN_ROUTE_PREFIX, APP_ENVIRONMENT_LABELS } from "@proposalflow/shared-config";

type AdminShellProps = {
  children: ReactNode;
};

export function AdminShell({ children }: AdminShellProps) {
  return (
    <main className="admin-shell">
      <section className="admin-shell__canvas">
        <header className="admin-shell__topbar">
          <div className="admin-brand">
            <p className="admin-brand__kicker">ProposalFlow AI</p>
            <h1 className="admin-brand__title">Internal operations console.</h1>
            <p className="admin-brand__note">
              This surface stays read-only and boundary-first while customer workflows ship
              elsewhere.
            </p>
          </div>

          <span className="admin-badge">Internal only</span>
        </header>

        <section className="admin-card">
          <div className="admin-grid">
            <div className="admin-card__copy">
              <p className="admin-card__eyebrow">Admin boundary</p>
              <h2 className="admin-card__title">Separate surface, same visual language.</h2>
              <p className="admin-card__body">
                The admin app uses the shared dark baseline while keeping the content minimal so
                it never masquerades as the customer workflow.
              </p>
            </div>

            <aside className="admin-card__rail">
              <div className="admin-chip">
                <strong>Route</strong>
                <span>{ADMIN_ROUTE_PREFIX}</span>
              </div>
              <div className="admin-chip">
                <strong>Environment</strong>
                <span>{APP_ENVIRONMENT_LABELS.local}</span>
              </div>
              <div className="admin-chip">
                <strong>Mode</strong>
                <span>read-only</span>
              </div>
            </aside>
          </div>
        </section>

        {children}
      </section>
    </main>
  );
}
