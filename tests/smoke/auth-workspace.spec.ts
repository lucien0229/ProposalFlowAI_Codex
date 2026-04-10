import { expect, test } from "@playwright/test";

import {
  AUTH_ROUTE_PATHS,
  BUSINESS_ROUTE_PATHS,
  RETURN_URL_QUERY_PARAM,
  SETUP_ROUTE_PATHS,
} from "@proposalflow/shared-config";

function uniqueEmail(prefix: string) {
  return `${prefix}+${Date.now()}@example.com`;
}

test.describe("auth workspace smoke", () => {
  test("auth pages preserve intent and expose productized forms", async ({ page, context, baseURL }) => {
    const signInUrl = new URL(AUTH_ROUTE_PATHS.signIn, baseURL ?? "http://127.0.0.1:3000");
    signInUrl.searchParams.set(RETURN_URL_QUERY_PARAM, "/dashboard");

    await page.goto(signInUrl.toString());

    await expect(page.getByRole("heading", { name: "Write proposals faster." })).toBeVisible();
    await expect(page.getByRole("link", { name: /continue with google/i })).toHaveAttribute(
      "href",
      /\/auth\/google\/start\?return_url=%2Fdashboard/,
    );
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Password")).toBeVisible();

    const signUpUrl = new URL(AUTH_ROUTE_PATHS.signUp, baseURL ?? "http://127.0.0.1:3000");
    signUpUrl.searchParams.set(RETURN_URL_QUERY_PARAM, "/dashboard");

    await page.goto(signUpUrl.toString());
    await expect(page.getByRole("heading", { name: "Build a repeatable workspace." })).toBeVisible();
    await expect(page.getByLabel("Full name")).toBeVisible();
    await expect(page.locator(".auth-form__footer").getByRole("link", { name: "Sign in" })).toBeVisible();

    await page.goto(new URL(SETUP_ROUTE_PATHS.workspace, baseURL ?? "http://127.0.0.1:3000").toString());
    await expect(page).toHaveURL(/\/auth\/sign-in/);

    const opportunitiesUrl = new URL(BUSINESS_ROUTE_PATHS.opportunities, baseURL ?? "http://127.0.0.1:3000");
    opportunitiesUrl.searchParams.set("q", "North-Star");
    await page.goto(opportunitiesUrl.toString());
    await expect(page).toHaveURL(/\/auth\/sign-in/);
    expect(new URL(page.url()).searchParams.get(RETURN_URL_QUERY_PARAM)).toBe("/opportunities?q=North-Star");
  });

  test("workspace setup flow redirects from auth to dashboard", async ({ page, baseURL }) => {
    const webBase = baseURL ?? "http://127.0.0.1:3000";
    const email = uniqueEmail("workspace-smoke");

    const signUpUrl = new URL(AUTH_ROUTE_PATHS.signUp, webBase);
    signUpUrl.searchParams.set(RETURN_URL_QUERY_PARAM, "/dashboard");
    await page.goto(signUpUrl.toString());

    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Full name").fill("Workspace Owner");
    await page.getByLabel("Password").fill("secret-123");
    await page.getByRole("button", { name: "Create account" }).click();

    await expect(page).toHaveURL(/\/setup\/workspace/);
    await expect(page.getByRole("heading", { name: /set the defaults/i })).toBeVisible();

    await page.getByLabel("Workspace name").fill("North Star Studio");
    await page.getByLabel("Industry type").selectOption("product_ux_agency");
    await page.getByLabel("Default template").selectOption("product_ux_agency");
    await page.getByLabel("Default tone preference").selectOption("consultative");
    await page.getByRole("button", { name: /continue to dashboard/i }).click();

    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
    await expect(page.getByText("North Star Studio")).toBeVisible();
    await expect(
      page.locator(".product-page-header__actions").getByRole("button", { name: "New opportunity" }),
    ).toBeVisible();
  });
});
