import { expect, test } from "@playwright/test";

import { onboardToDashboard } from "./helpers/onboarding";

test.describe("opportunities list accessibility", () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test("preserves keyboard flow and dialog semantics", async ({ page, baseURL }) => {
    const webBase = baseURL ?? "http://127.0.0.1:3000";

    await onboardToDashboard(page, webBase);
    await page.goto(new URL("/opportunities", webBase).toString());

    const navigation = page.getByRole("navigation", { name: /primary product navigation/i });
    await expect(navigation.getByRole("link", { name: "Opportunities" })).toHaveAttribute("aria-current", "page");

    const skipLink = page.getByRole("link", { name: "Skip to main content" });
    await skipLink.focus();
    await expect(skipLink).toBeFocused();
    await page.keyboard.press("Enter");

    const toolbar = page.getByRole("region", { name: /opportunities toolbar/i });
    const newOpportunityButton = toolbar.getByRole("button", { name: "New opportunity" });
    const searchbox = toolbar.getByRole("searchbox", { name: "Search" });
    const status = toolbar.getByRole("combobox", { name: "Status" });
    const archived = toolbar.getByRole("checkbox", { name: "Archived" });
    const sort = toolbar.getByRole("combobox", { name: "Sort" });

    await newOpportunityButton.focus();
    await expect(newOpportunityButton).toBeFocused();

    await page.keyboard.press("Tab");
    await expect(searchbox).toBeFocused();

    await page.keyboard.press("Tab");
    await expect(status).toBeFocused();

    await page.keyboard.press("Tab");
    await expect(archived).toBeFocused();

    await page.keyboard.press("Tab");
    await expect(sort).toBeFocused();

    await newOpportunityButton.click();

    const dialog = page.getByRole("dialog", { name: "New opportunity" });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByLabel("Title")).toBeFocused();

    await page.keyboard.press("Shift+Tab");
    await expect(dialog.getByRole("button", { name: "Close new opportunity dialog" })).toBeFocused();

    await page.keyboard.press("Tab");
    await expect(dialog.getByLabel("Title")).toBeFocused();

    await page.keyboard.press("Escape");
    await expect(dialog).toHaveCount(0);
    await expect(newOpportunityButton).toBeFocused();

    await newOpportunityButton.click();
    await dialog.getByLabel("Title").fill("Semantics review");
    await dialog.getByLabel("Company name").fill("North Star Studio");
    await dialog.getByRole("button", { name: /create opportunity|continue to overview/i }).click();
    await expect(page).toHaveURL(/\/opportunities\/.+\/overview/);
    await page.goto(new URL("/opportunities", webBase).toString());

    const list = page.getByRole("list");
    await expect(list).toBeVisible();
    await expect(list.getByRole("listitem")).toHaveCount(1);

    const noOverflow = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
    expect(noOverflow).toBeTruthy();
  });
});
