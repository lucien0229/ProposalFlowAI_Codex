import { expect, test } from "@playwright/test";

import {
  fillMinimumOpportunityForm,
  openNewOpportunity,
  setOpportunitiesToolbarFilters,
  submitOpportunityForm,
} from "./helpers/opportunities";
import { onboardToDashboard } from "./helpers/onboarding";

test.describe("dashboard and opportunities integration", () => {
  test("keeps create, archive, and restore state consistent across both surfaces", async ({ page, baseURL }) => {
    const webBase = baseURL ?? "http://127.0.0.1:3000";

    await onboardToDashboard(page, webBase);

    await openNewOpportunity(page);
    await fillMinimumOpportunityForm(page, {
      title: "North Star redesign",
      companyName: "North Star Studio",
      requestedService: "Proposal drafting",
    });
    await submitOpportunityForm(page);

    await expect(page).toHaveURL(/\/opportunities\/.+\/overview/);

    await page.goto(new URL("/dashboard", webBase).toString());
    await expect(page.locator(".dashboard-list").getByRole("link", { name: /North Star redesign/i })).toBeVisible();

    await page.goto(new URL("/opportunities", webBase).toString());
    const queueRow = page.getByRole("article").filter({ hasText: "North Star redesign" });
    await expect(queueRow.getByRole("link", { name: /North Star redesign/i })).toBeVisible();
    await queueRow.getByRole("button", { name: "Archive opportunity" }).click();
    await expect(page.getByRole("link", { name: /North Star redesign/i })).toHaveCount(0);

    await page.goto(new URL("/dashboard", webBase).toString());
    await expect(page.getByRole("heading", { name: "No opportunities yet." })).toBeVisible();

    await page.goto(new URL("/opportunities", webBase).toString());
    await setOpportunitiesToolbarFilters(page, { archived: true });
    const archivedRow = page.getByRole("article").filter({ hasText: "North Star redesign" });
    await expect(archivedRow.getByRole("link", { name: /North Star redesign/i })).toBeVisible();
    await archivedRow.getByRole("button", { name: "Unarchive opportunity" }).click();
    await expect(page.getByRole("link", { name: /North Star redesign/i })).toHaveCount(0);

    await setOpportunitiesToolbarFilters(page, { archived: false });
    await expect(page.getByRole("link", { name: /North Star redesign/i })).toBeVisible();

    await page.goto(new URL("/dashboard", webBase).toString());
    await expect(page.locator(".dashboard-list").getByRole("link", { name: /North Star redesign/i })).toBeVisible();
  });
});
