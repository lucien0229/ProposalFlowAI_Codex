import { expect, test } from "@playwright/test";

import { AUTH_ROUTE_PATHS, RETURN_URL_QUERY_PARAM } from "@proposalflow/shared-config";

function uniqueEmail(prefix: string) {
  return `${prefix}+${Date.now()}@example.com`;
}

test.describe("workspace guard smoke", () => {
  test("redirects unauthenticated business traffic to sign-in", async ({ page, baseURL }) => {
    const dashboardUrl = new URL("/dashboard", baseURL ?? "http://127.0.0.1:3000");
    await page.goto(dashboardUrl.toString());

    await expect(page).toHaveURL(/\/auth\/sign-in/);
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.url()).toContain(`${RETURN_URL_QUERY_PARAM}=%2Fdashboard`);
  });

  test("redirects incomplete workspaces to setup before dashboard", async ({ page, baseURL }) => {
    const webBase = baseURL ?? "http://127.0.0.1:3000";
    const signUpUrl = new URL(AUTH_ROUTE_PATHS.signUp, webBase);
    const email = uniqueEmail("guard-smoke");

    await page.goto(signUpUrl.toString());
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Full name").fill("Guard Owner");
    await page.getByLabel("Password").fill("secret-123");
    await page.getByRole("button", { name: "Create account" }).click();

    await expect(page).toHaveURL(/\/setup\/workspace/);

    await page.goto(new URL("/dashboard", webBase).toString());
    await expect(page).toHaveURL(/\/setup\/workspace/);
    await expect(page.url()).toContain(`${RETURN_URL_QUERY_PARAM}=%2Fdashboard`);
  });
});
