import { expect, test } from "@playwright/test";

import {
  fillMinimumOpportunityForm,
  openNewOpportunity,
  submitOpportunityForm,
} from "./helpers/opportunities";
import { onboardToDashboard } from "./helpers/onboarding";
import {
  getWorkspaceIdForCurrentSession,
  readWorkspaceBillingState,
  updateWorkspaceBillingState,
} from "./helpers/workspace";

test.describe("dashboard and opportunities error recovery", () => {
  test("keeps the dashboard create dialog open when create fails", async ({ page, baseURL }) => {
    const webBase = baseURL ?? "http://127.0.0.1:3000";

    await onboardToDashboard(page, webBase);
    await page.route("**/api/v1/opportunities", async (route) => {
      await route.fulfill({
        status: 503,
        contentType: "application/json",
        body: JSON.stringify({ detail: "service unavailable" }),
      });
    });

    await openNewOpportunity(page);
    await fillMinimumOpportunityForm(page, {
      title: "North Star redesign",
      companyName: "North Star Studio",
    });
    await submitOpportunityForm(page);

    const dialog = page.getByRole("dialog", { name: "New opportunity" });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("alert")).toContainText("The workspace service is unavailable right now.");
    await expect(dialog.getByRole("button", { name: "Continue to overview" })).toBeVisible();
  });

  test("preserves the visible queue when archive fails and surfaces retry guidance", async ({ page, baseURL }) => {
    const webBase = baseURL ?? "http://127.0.0.1:3000";

    await onboardToDashboard(page, webBase);
    await page.goto(new URL("/opportunities", webBase).toString());

    await openNewOpportunity(page);
    await fillMinimumOpportunityForm(page, {
      title: "Atlas migration",
      companyName: "Atlas Labs",
      requestedService: "Migration plan",
    });
    await submitOpportunityForm(page);

    await expect(page).toHaveURL(/\/opportunities\/.+\/overview/);
    await page.goto(new URL("/opportunities", webBase).toString());

    await page.route(/\/api\/v1\/opportunities\/.+\/archive$/, async (route) => {
      await route.fulfill({
        status: 503,
        contentType: "application/json",
        body: JSON.stringify({ detail: "service unavailable" }),
      });
    });

    const row = page.getByRole("article").filter({ hasText: "Atlas migration" });
    await row.getByRole("button", { name: "Archive opportunity" }).click();

    await expect(page.getByRole("heading", { name: "We couldn't load this opportunity view." })).toBeVisible();
    await expect(page.getByRole("button", { name: "Retry" })).toBeVisible();
    await expect(row.getByRole("link", { name: /Atlas migration/i })).toBeVisible();
  });

  test("disables create actions and explains the billing block when the workspace is restricted", async ({
    page,
    baseURL,
  }) => {
    const webBase = baseURL ?? "http://127.0.0.1:3000";

    await onboardToDashboard(page, webBase);

    const workspaceId = await getWorkspaceIdForCurrentSession(page);
    const previousState = readWorkspaceBillingState(workspaceId);

    try {
      updateWorkspaceBillingState(workspaceId, {
        ...previousState,
        trialStatus: "trial_expired",
      });

      await page.goto(new URL("/dashboard", webBase).toString());
      await expect(page.getByRole("heading", { name: /some actions are blocked by workspace billing/i })).toBeVisible();

      const dashboardCreateButton = page
        .locator(".product-page-header__actions")
        .getByRole("button", { name: "New opportunity" });
      await expect(dashboardCreateButton).toBeDisabled();
      await expect(page.getByText(/blocked by trial expired/i)).toBeVisible();

      await page.goto(new URL("/opportunities", webBase).toString());
      const toolbarCreateButton = page
        .getByRole("region", { name: /opportunities toolbar/i })
        .getByRole("button", { name: "New opportunity" });
      await expect(toolbarCreateButton).toBeDisabled();
      await expect(page.getByText(/review billing to create new work/i)).toBeVisible();
    } finally {
      updateWorkspaceBillingState(workspaceId, previousState);
    }
  });
});
