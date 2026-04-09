import { expect, test, type Page } from "@playwright/test";

import { AUTH_ROUTE_PATHS, RETURN_URL_QUERY_PARAM } from "@proposalflow/shared-config";

function uniqueEmail(prefix: string) {
  return `${prefix}+${Date.now()}@example.com`;
}

async function onboardToDashboard(page: Page, baseURL: string) {
  const signUpUrl = new URL(AUTH_ROUTE_PATHS.signUp, baseURL);
  signUpUrl.searchParams.set(RETURN_URL_QUERY_PARAM, "/dashboard");

  await page.goto(signUpUrl.toString());
  await page.getByLabel("Email").fill(uniqueEmail("phase3-a11y"));
  await page.getByLabel("Full name").fill("Phase 3 A11y");
  await page.getByLabel("Password").fill("secret-123");
  await page.getByRole("button", { name: "Create account" }).click();

  await expect(page).toHaveURL(/\/setup\/workspace/);
  await page.getByLabel("Workspace name").fill("North Star Studio");
  await page.getByLabel("Industry type").selectOption("product_ux_agency");
  await page.getByLabel("Default template").selectOption("product_ux_agency");
  await page.getByLabel("Default tone preference").selectOption("consultative");
  await page.getByRole("button", { name: /continue to dashboard/i }).click();

  await expect(page).toHaveURL(/\/dashboard/);
}

test.describe("dashboard command center accessibility", () => {
  test.use({ viewport: { width: 1024, height: 768 } });

  test("preserves keyboard flow and shared empty state semantics", async ({ page, baseURL }) => {
    const webBase = baseURL ?? "http://127.0.0.1:3000";

    await onboardToDashboard(page, webBase);

    const navigation = page.getByRole("navigation", { name: /primary product navigation/i });

    await navigation.getByRole("link", { name: "Dashboard" }).focus();
    await expect(navigation.getByRole("link", { name: "Dashboard" })).toBeFocused();
    await expect(navigation.getByRole("link", { name: "Dashboard" })).toHaveAttribute("aria-current", "page");

    await page.keyboard.press("Tab");
    await expect(navigation.getByRole("link", { name: "Opportunities" })).toBeFocused();

    await page.keyboard.press("Tab");
    await expect(navigation.getByRole("link", { name: "Templates & Rules" })).toBeFocused();

    await page.keyboard.press("Tab");
    await expect(navigation.getByRole("link", { name: "Billing" })).toBeFocused();

    await page.keyboard.press("Tab");
    await expect(navigation.getByRole("link", { name: "Settings" })).toBeFocused();

    await expect(page.getByRole("heading", { name: "No opportunities yet." })).toBeVisible();
    await expect(page.getByRole("region", { name: /empty workspace state/i })).toBeVisible();

    const noOverflow = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
    expect(noOverflow).toBeTruthy();
  });
});
