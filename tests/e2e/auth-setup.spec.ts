import { expect, test } from "@playwright/test";

import { AUTH_ROUTE_PATHS, RETURN_URL_QUERY_PARAM } from "@proposalflow/shared-config";

function uniqueEmail(prefix: string) {
  return `${prefix}+${Date.now()}@example.com`;
}

test.describe("auth-setup", () => {
  test("completes the onboarding handoff from auth to dashboard", async ({ page, baseURL }) => {
    const webBase = baseURL ?? "http://localhost:3000";
    const email = uniqueEmail("e2e-journey");

    const signUpUrl = new URL(AUTH_ROUTE_PATHS.signUp, webBase);
    signUpUrl.searchParams.set(RETURN_URL_QUERY_PARAM, "/dashboard");

    await page.goto(signUpUrl.toString());
    await expect(page.getByRole("heading", { name: "Build a repeatable workspace." })).toBeVisible();

    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Full name").fill("Journey Owner");
    await page.getByLabel("Password").fill("secret-123");
    await page.getByRole("button", { name: "Create account" }).click();

    await expect(page).toHaveURL(/\/setup\/workspace/);
    await expect(page.getByRole("heading", { name: /set the defaults/i })).toBeVisible();
    await expect(page.getByLabel("Default template")).toHaveValue("development_agency");
    await expect(page.getByLabel("Default tone preference")).toHaveValue("direct");

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

  test("surfaces invalid login and recovery feedback visibly", async ({ page, baseURL }) => {
    const webBase = baseURL ?? "http://localhost:3000";

    const signInUrl = new URL(AUTH_ROUTE_PATHS.signIn, webBase);
    signInUrl.searchParams.set(RETURN_URL_QUERY_PARAM, "/dashboard");
    await page.goto(signInUrl.toString());

    await page.getByLabel("Email").fill(uniqueEmail("wrong-password"));
    await page.getByLabel("Password").fill("not-the-right-password");
    await page.getByRole("button", { name: "Sign in" }).click();

    const error = page.locator(".auth-form__alert--error");
    await expect(error).toBeVisible();
    await expect(error).toHaveText("Invalid email or password.");

    await page.getByRole("link", { name: /forgot password/i }).click();
    await expect(page).toHaveURL(/\/auth\/forgot-password/);
    await page.waitForLoadState("networkidle");
    await expect(page.getByRole("heading", { name: "Reset access safely." })).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
    await page.getByLabel("Email").fill(uniqueEmail("forgot-password"));
    await page.getByRole("button", { name: "Send reset link" }).click();
    await expect(page.locator(".auth-form__alert--success")).toContainText(
      "If the account exists, a reset link has been sent.",
    );
  });
});
