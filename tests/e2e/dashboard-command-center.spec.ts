import { expect, test } from "@playwright/test";

import { openNewOpportunity, fillMinimumOpportunityForm, submitOpportunityForm } from "./helpers/opportunities";
import { onboardToDashboard } from "./helpers/onboarding";

test.describe("dashboard command center", () => {
  test("shows empty guidance, validates create, and surfaces recent work", async ({ page, baseURL }) => {
    const webBase = baseURL ?? "http://127.0.0.1:3000";

    await onboardToDashboard(page, webBase);

    await expect(page.getByRole("heading", { name: "No opportunities yet." })).toBeVisible();
    await expect(page.getByText(/create the first opportunity/i)).toBeVisible();

    await openNewOpportunity(page);
    await submitOpportunityForm(page);
    await expect(page.getByText("Title is required.")).toBeVisible();
    await expect(page.getByText("Company name is required.")).toBeVisible();

    await fillMinimumOpportunityForm(page, {
      title: "North Star redesign",
      companyName: "North Star Studio",
    });
    await submitOpportunityForm(page);

    await expect(page).toHaveURL(/\/opportunities\/.+\/overview/);
    await expect(page.getByRole("heading", { name: "North Star redesign" })).toBeVisible();

    await page.goto(new URL("/dashboard", webBase).toString());
    await expect(page.getByRole("heading", { name: "Recent opportunities" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Needs attention" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Trial / Billing" })).toBeVisible();
    await expect(page.locator(".dashboard-list").getByRole("link", { name: /North Star redesign/i })).toBeVisible();

    const recentBox = await page.getByRole("heading", { name: "Recent opportunities" }).boundingBox();
    const attentionBox = await page.getByRole("heading", { name: "Needs attention" }).boundingBox();
    expect(recentBox?.y ?? Number.POSITIVE_INFINITY).toBeLessThan(attentionBox?.y ?? 0);

    await page.locator(".dashboard-list").getByRole("link", { name: /North Star redesign/i }).click();
    await expect(page).toHaveURL(/\/opportunities\/.+\/overview/);
  });
});
