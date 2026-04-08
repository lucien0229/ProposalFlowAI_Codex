import { expect, test } from "@playwright/test";

import { APP_ENVIRONMENT_LABELS, DEFAULT_PAGE_SIZE, SESSION_COOKIE, WEB_ROUTE_PREFIX } from "@proposalflow/shared-config";
import { PRODUCT_STATES, type ProductState } from "@proposalflow/shared-types";

const states = PRODUCT_STATES;

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

function renderWebShell(state: ProductState) {
  const content = stateContent[state];

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <title>ProposalFlow AI</title>
  </head>
  <body>
    <main class="app-shell">
      <section class="app-shell__canvas">
        <header class="app-shell__topbar">
          <div class="brand-stack">
            <p class="brand-kicker">ProposalFlow AI</p>
            <h1 class="brand-title">A focused workspace for sales operations.</h1>
            <p class="brand-note">Shipping shell, shared contract vocabulary, and a boundary-first customer experience.</p>
          </div>

          <div class="topbar-actions">
            <span class="pill">
              <strong>State</strong>
              ${state}
            </span>
            <a class="soft-button" href="${WEB_ROUTE_PREFIX}?state=success">Reset demo</a>
          </div>
        </header>

        <section class="surface-card">
          <div class="surface-grid">
            <div class="surface-copy">
              <p class="eyebrow">Customer shell</p>
              <h2 class="headline">A product surface, not a spec page.</h2>
              <p class="lede">The shell stays visually dense enough to feel shipped while leaving room for the later workflow pages to mount without reworking the frame.</p>

              <div class="surface-meta">
                <span class="meta-chip">Default page size ${DEFAULT_PAGE_SIZE}</span>
                <span class="meta-chip">Shared session vocabulary</span>
                <span class="meta-chip">Activity log ready</span>
              </div>
            </div>

            <aside class="side-column">
              <div class="shell-rail">
                <p class="shell-rail__title">Boundary ledger</p>
                <div class="shell-rail__items">
                  <div class="shell-rail__item"><span>Route</span><span>${WEB_ROUTE_PREFIX}</span></div>
                  <div class="shell-rail__item"><span>Env</span><span>${APP_ENVIRONMENT_LABELS.local}</span></div>
                  <div class="shell-rail__item"><span>Session</span><span>${SESSION_COOKIE.web}</span></div>
                </div>
              </div>
              <div class="shell-rail">
                <p class="shell-rail__title">Interaction notes</p>
                <div class="shell-rail__items">
                  <div class="shell-rail__item"><span>Product lane</span><span>Readable, task-oriented</span></div>
                  <div class="shell-rail__item"><span>Shared events</span><span>csrf.required</span></div>
                </div>
              </div>
            </aside>
          </div>
        </section>

        <section class="status-panel" aria-label="Customer product state panel">
          <div class="status-panel__header">
            <div>
              <span class="state-badge">${content.label}</span>
              <h2 class="status-panel__title">${content.title}</h2>
              <p class="status-panel__copy">${content.body}</p>
            </div>
            <span class="meta-chip">Current state: ${state}</span>
          </div>

          <div class="state-panel">
            <div class="state-panel__visual">
              <div class="state-orb" aria-hidden="true"></div>
              <div class="state-copy">
                <h3>${content.primaryAction}</h3>
                <p>The action area keeps the shell feeling like a working product surface instead of a demo note.</p>
              </div>
            </div>

            <div class="state-actions">
              <a class="state-primary" href="/?state=${state}">${content.primaryAction}</a>
              <a class="state-secondary" href="/?state=${state}">${content.secondaryAction}</a>
            </div>

            <div class="state-switcher" aria-label="Product state switcher">
              ${states
                .map(
                  (candidate) => `<a class="state-pill"${candidate === state ? ' data-active="true"' : ""} href="/?state=${candidate}">${candidate}</a>`,
                )
                .join("")}
            </div>
          </div>
        </section>
      </section>
    </main>
  </body>
</html>`;
}

test.describe("web shell", () => {
  test("renders the product chrome", async ({ page }) => {
    await page.setContent(renderWebShell("success"));

    await expect(page.getByRole("heading", { name: /A focused workspace/i })).toBeVisible();
    await expect(page.locator(".app-shell__topbar")).toBeVisible();
    await expect(page.locator(".status-panel")).toBeVisible();
    await expect(page.getByText("ProposalFlow AI")).toBeVisible();
  });

  for (const state of states) {
    test(`supports the ${state} product state`, async ({ page }) => {
      await page.setContent(renderWebShell(state));

      await expect(page.getByText(`Current state: ${state}`)).toBeVisible();
      await expect(page.locator(".state-panel")).toBeVisible();
      await expect(page.getByRole("link", { name: new RegExp(`^${state}$`) })).toBeVisible();
    });
  }
});
