import type { ReactNode } from "react";

import {
  APP_ENVIRONMENT_LABELS,
  DEFAULT_PAGE_SIZE,
  SHARED_EVENT_NAMES,
  SESSION_COOKIE,
  WEB_ROUTE_PREFIX,
} from "@proposalflow/shared-config";
import type { ProductState } from "@proposalflow/shared-types";

type AppShellProps = {
  children: ReactNode;
  state: ProductState;
};

const surfaceSummary = [
  { label: "Route", value: WEB_ROUTE_PREFIX },
  { label: "Env", value: APP_ENVIRONMENT_LABELS.local },
  { label: "Session", value: SESSION_COOKIE.web },
  { label: "Events", value: SHARED_EVENT_NAMES.ACTIVITY_LOG_CREATED },
];

export function AppShell({ children, state }: AppShellProps) {
  return (
    <main className="app-shell">
      <section className="app-shell__canvas">
        <header className="app-shell__topbar">
          <div className="brand-stack">
            <p className="brand-kicker">ProposalFlow AI</p>
            <h1 className="brand-title">A focused workspace for sales operations.</h1>
            <p className="brand-note">
              Shipping shell, shared contract vocabulary, and a boundary-first customer
              experience.
            </p>
          </div>

          <div className="topbar-actions">
            <span className="pill">
              <strong>State</strong>
              {state}
            </span>
            <a className="soft-button" href={`${WEB_ROUTE_PREFIX}?state=success`}>
              Reset demo
            </a>
          </div>
        </header>

        <section className="surface-card">
          <div className="surface-grid">
            <div className="surface-copy">
              <p className="eyebrow">Customer shell</p>
              <h2 className="headline">A product surface, not a spec page.</h2>
              <p className="lede">
                The shell stays visually dense enough to feel shipped while leaving room for the
                later workflow pages to mount without reworking the frame.
              </p>

              <div className="surface-meta">
                <span className="meta-chip">Default page size {DEFAULT_PAGE_SIZE}</span>
                <span className="meta-chip">Shared session vocabulary</span>
                <span className="meta-chip">Activity log ready</span>
              </div>
            </div>

            <aside className="side-column">
              <div className="shell-rail">
                <p className="shell-rail__title">Boundary ledger</p>
                <div className="shell-rail__items">
                  {surfaceSummary.map((item) => (
                    <div className="shell-rail__item" key={item.label}>
                      <span>{item.label}</span>
                      <span>{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="shell-rail">
                <p className="shell-rail__title">Interaction notes</p>
                <div className="shell-rail__items">
                  <div className="shell-rail__item">
                    <span>Product lane</span>
                    <span>Readable, task-oriented</span>
                  </div>
                  <div className="shell-rail__item">
                    <span>Shared events</span>
                    <span>{SHARED_EVENT_NAMES.CSRF_REQUIRED}</span>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </section>

        {children}
      </section>
    </main>
  );
}
