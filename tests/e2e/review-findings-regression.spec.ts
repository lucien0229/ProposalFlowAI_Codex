import { expect, test } from "@playwright/test";

import { onboardToDashboard } from "./helpers/onboarding";
import {
  createOpportunityAndOpenOverview,
} from "./helpers/opportunity-overview";
import {
  fillMinimumOpportunityForm,
  openNewOpportunity,
  submitOpportunityForm,
} from "./helpers/opportunities";

test.describe("review findings regressions", () => {
  test("debounces search URL updates and exposes queue rows as list items", async ({ page, baseURL }) => {
    const webBase = baseURL ?? "http://127.0.0.1:3000";

    await onboardToDashboard(page, webBase);
    await page.goto(new URL("/opportunities", webBase).toString());

    await openNewOpportunity(page);
    await fillMinimumOpportunityForm(page, {
      title: "North Star redesign",
      companyName: "North Star Studio",
    });
    await submitOpportunityForm(page);
    await expect(page).toHaveURL(/\/opportunities\/.+\/overview/);

    await page.goto(new URL("/opportunities", webBase).toString());

    const searchbox = page.getByRole("searchbox", { name: "Search" });
    await searchbox.pressSequentially("North Star", { delay: 30 });
    await expect(page).not.toHaveURL(/q=North\+Star|q=North%20Star/);
    await page.waitForTimeout(450);
    await expect(page).toHaveURL(/q=North\+Star|q=North%20Star/);

    const list = page.getByRole("list");
    await expect(list).toBeVisible();
    await expect(list.getByRole("listitem")).toHaveCount(1);
  });

  test("shows one primary action cluster and only real PDF lifecycle state", async ({ page, baseURL }) => {
    const webBase = baseURL ?? "http://127.0.0.1:3000";
    await createOpportunityAndOpenOverview(page, webBase);

    await expect(page.getByRole("button", { name: "Save opportunity" })).toHaveCount(1);
    await expect(page.getByRole("button", { name: "Generate lead brief" })).toHaveCount(1);
    await expect(page.locator('[data-testid="opportunity-file-state"] [data-file-state]')).toHaveCount(0);
  });
});
