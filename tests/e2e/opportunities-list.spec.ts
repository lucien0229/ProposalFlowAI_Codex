import { expect, test, type Page } from "@playwright/test";

import { openNewOpportunity, fillMinimumOpportunityForm, setOpportunitiesToolbarFilters, submitOpportunityForm } from "./helpers/opportunities";
import { onboardToDashboard } from "./helpers/onboarding";

async function createOpportunityFromList(
  page: Page,
  input: Parameters<typeof fillMinimumOpportunityForm>[1],
) {
  await openNewOpportunity(page);
  await fillMinimumOpportunityForm(page, input);
  await submitOpportunityForm(page);
  await expect(page).toHaveURL(/\/opportunities\/.+\/overview/);
  await page.goto("/opportunities");
}

test.describe("opportunities list", () => {
  test("supports search, sort, open, archive, and archived recovery", async ({ page, baseURL }) => {
    const webBase = baseURL ?? "http://127.0.0.1:3000";

    await onboardToDashboard(page, webBase);
    await page.goto(new URL("/opportunities", webBase).toString());

    await expect(
      page.locator(".product-page-header").getByRole("heading", { name: "Opportunities", exact: true }),
    ).toBeVisible();
    await expect(page.getByRole("searchbox", { name: "Search" })).toBeVisible();
    await expect(page.getByLabel("Status")).toBeVisible();
    await expect(page.getByRole("checkbox", { name: "Archived" })).toBeVisible();
    await expect(page.getByLabel("Sort")).toBeVisible();

    await createOpportunityFromList(page, {
      title: "North Star redesign",
      companyName: "North Star Studio",
      requestedService: "Proposal drafting",
    });
    await createOpportunityFromList(page, {
      title: "Atlas migration",
      companyName: "Atlas Labs",
      requestedService: "Migration plan",
    });

    await expect(page.getByRole("link", { name: /North Star redesign/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /Atlas migration/i })).toBeVisible();

    await setOpportunitiesToolbarFilters(page, { search: "North Star" });
    await expect(page).toHaveURL(/q=North\+Star|q=North%20Star/);
    await expect(page.getByRole("link", { name: /North Star redesign/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /Atlas migration/i })).toHaveCount(0);

    await setOpportunitiesToolbarFilters(page, { search: "Atlas Labs" });
    await expect(page.getByRole("link", { name: /Atlas migration/i })).toBeVisible();

    await setOpportunitiesToolbarFilters(page, { search: "", sortLabel: "Oldest updated" });
    await expect(page).toHaveURL(/order_direction=asc/);

    await page.getByRole("link", { name: /Atlas migration/i }).click();
    await expect(page).toHaveURL(/\/opportunities\/.+\/overview/);
    await page.goto("/opportunities");

    await page.getByRole("article").filter({ hasText: "North Star redesign" }).getByRole("button", { name: "Archive opportunity" }).click();
    await expect(page.getByRole("link", { name: /North Star redesign/i })).toHaveCount(0);

    await setOpportunitiesToolbarFilters(page, { archived: true });
    await expect(page).toHaveURL(/archived=true/);
    await expect(page.getByRole("link", { name: /North Star redesign/i })).toBeVisible();
    await page.getByRole("article").filter({ hasText: "North Star redesign" }).getByRole("button", { name: "Unarchive opportunity" }).click();
    await expect(page.getByRole("link", { name: /North Star redesign/i })).toHaveCount(0);

    await setOpportunitiesToolbarFilters(page, { search: "no-match", archived: false });
    await expect(page.getByRole("heading", { name: "No opportunities match this view." })).toBeVisible();
    await expect(page.getByRole("button", { name: "Reset filters" })).toBeVisible();
  });
});
