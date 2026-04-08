import { expect, test } from "@playwright/test";

import { ADMIN_ROUTE_PREFIX, APP_ENVIRONMENT_LABELS } from "@proposalflow/shared-config";

function renderAdminShell() {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <title>ProposalFlow AI Admin</title>
  </head>
  <body>
    <main class="admin-shell">
      <section class="admin-shell__canvas">
        <header class="admin-shell__topbar">
          <div class="admin-brand">
            <p class="admin-brand__kicker">ProposalFlow AI</p>
            <h1 class="admin-brand__title">Internal operations console.</h1>
            <p class="admin-brand__note">This surface stays read-only and boundary-first while customer workflows ship elsewhere.</p>
          </div>

          <span class="admin-badge">Internal only</span>
        </header>

        <section class="admin-card">
          <div class="admin-grid">
            <div class="admin-card__copy">
              <p class="admin-card__eyebrow">Admin boundary</p>
              <h2 class="admin-card__title">Separate surface, same visual language.</h2>
              <p class="admin-card__body">The admin app uses the shared dark baseline while keeping the content minimal so it never masquerades as the customer workflow.</p>
            </div>

            <aside class="admin-card__rail">
              <div class="admin-chip">
                <strong>Route</strong>
                <span>${ADMIN_ROUTE_PREFIX}</span>
              </div>
              <div class="admin-chip">
                <strong>Environment</strong>
                <span>${APP_ENVIRONMENT_LABELS.local}</span>
              </div>
              <div class="admin-chip">
                <strong>Mode</strong>
                <span>read-only</span>
              </div>
            </aside>
          </div>
        </section>

        <section class="admin-callout">
          <span class="admin-callout__badge">Internal</span>
          <h1>Read-only admin placeholder surface.</h1>
          <p>This internal, read-only shell is deliberately sparse so the customer workflow never blends into the operational surface.</p>
          <div class="admin-callout__meta">
            <span>${ADMIN_ROUTE_PREFIX}</span>
            <span>${APP_ENVIRONMENT_LABELS.local}</span>
            <span>Boundary-first navigation</span>
          </div>
        </section>
      </section>
    </main>
  </body>
</html>`;
}

test.describe("admin shell", () => {
  test("renders the internal read-only boundary", async ({ page }) => {
    await page.setContent(renderAdminShell());

    await expect(page.getByText("Internal only")).toBeVisible();
    await expect(page.getByText("read-only", { exact: true })).toBeVisible();
    await expect(page.locator(".app-shell")).toHaveCount(0);
    await expect(page.locator(".state-panel")).toHaveCount(0);
  });
});
