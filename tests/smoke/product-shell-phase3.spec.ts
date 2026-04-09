import { expect, test, type Page } from "@playwright/test";

import { AUTH_ROUTE_PATHS, RETURN_URL_QUERY_PARAM } from "@proposalflow/shared-config";

function uniqueEmail(prefix: string) {
  return `${prefix}+${Date.now()}@example.com`;
}

async function onboardToDashboard(page: Page, baseURL: string) {
  const signUpUrl = new URL(AUTH_ROUTE_PATHS.signUp, baseURL);
  signUpUrl.searchParams.set(RETURN_URL_QUERY_PARAM, "/dashboard");

  await page.goto(signUpUrl.toString());

  await page.getByLabel("Email").fill(uniqueEmail("phase3-shell"));
  await page.getByLabel("Full name").fill("Phase 3 Shell");
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

test.describe("product shell phase 3", () => {
  test("renders the logged-in shell with stable navigation", async ({ page, baseURL }) => {
    const webBase = baseURL ?? "http://127.0.0.1:3000";

    await onboardToDashboard(page, webBase);

    const navigation = page.getByRole("navigation", { name: /primary product navigation/i });
    await expect(navigation).toBeVisible();
    await expect(navigation.getByRole("link", { name: "Dashboard" })).toHaveAttribute("aria-current", "page");
    await expect(navigation.getByRole("link", { name: "Opportunities" })).toBeVisible();
    await expect(navigation.getByRole("link", { name: "Templates & Rules" })).toBeVisible();
    await expect(navigation.getByRole("link", { name: "Billing" })).toBeVisible();
    await expect(navigation.getByRole("link", { name: "Settings" })).toBeVisible();

    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
    await expect(page.locator(".product-page-header").getByRole("button", { name: "New opportunity" })).toBeVisible();
    await expect(page.locator(".dashboard-shell__hero")).toHaveCount(0);
  });
});
