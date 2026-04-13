import { expect, test } from "@playwright/test";

import { AUTH_ROUTE_PATHS, RETURN_URL_QUERY_PARAM, SETUP_ROUTE_PATHS } from "@proposalflow/shared-config";

function uniqueEmail(prefix: string) {
  return `${prefix}+${Date.now()}@example.com`;
}

test.describe("auth-setup accessibility", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("keeps keyboard flow and mobile layout accessible", async ({ page, baseURL }) => {
    const webBase = baseURL ?? "http://localhost:3000";
    const signInUrl = new URL(AUTH_ROUTE_PATHS.signIn, webBase);
    signInUrl.searchParams.set(RETURN_URL_QUERY_PARAM, "/dashboard");

    await page.goto(signInUrl.toString());
    await expect(page.getByRole("heading", { name: "Write proposals faster." })).toBeVisible();

    await page.getByRole("link", { name: /continue with google/i }).focus();
    await expect(page.getByRole("link", { name: /continue with google/i })).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(page.getByLabel("Email")).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(page.getByLabel("Password")).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(page.getByRole("button", { name: "Sign in" })).toBeFocused();

    const createAccountBox = await page.getByRole("link", { name: "Create account" }).boundingBox();
    const forgotPasswordBox = await page.getByRole("link", { name: "Forgot password?" }).boundingBox();
    const separatorBox = await page.locator(".auth-form__footer").getByText("·").boundingBox();
    expect(Math.abs((separatorBox?.y ?? 0) - (createAccountBox?.y ?? 0))).toBeLessThan(4);
    expect(Math.abs((separatorBox?.y ?? 0) - (forgotPasswordBox?.y ?? 0))).toBeLessThan(4);

    const noOverflow = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
    expect(noOverflow).toBeTruthy();

    await page.goto(new URL(SETUP_ROUTE_PATHS.workspace, webBase).toString());
    await expect(page).toHaveURL(/\/auth\/sign-in/);
  });

  test("exposes error and status regions with live feedback", async ({ page, baseURL }) => {
    const webBase = baseURL ?? "http://localhost:3000";
    const signUpUrl = new URL(AUTH_ROUTE_PATHS.signUp, webBase);
    signUpUrl.searchParams.set(RETURN_URL_QUERY_PARAM, "/dashboard");
    await page.goto(signUpUrl.toString());

    await page.getByLabel("Email").fill(uniqueEmail("a11y"));
    await page.getByLabel("Full name").fill("A11y Owner");
    await page.getByLabel("Password").fill("secret-123");
    await page.getByRole("button", { name: "Create account" }).click();
    await expect(page).toHaveURL(/\/setup\/workspace/);

    await expect(page.getByRole("heading", { name: /set the defaults/i })).toBeVisible();
    await expect(page.getByLabel("Workspace name")).toBeVisible();
    await expect(page.getByLabel("Industry type")).toBeVisible();
    await expect(page.getByLabel("Default template")).toBeVisible();
    await expect(page.getByLabel("Default tone preference")).toBeVisible();

    const noOverflow = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
    expect(noOverflow).toBeTruthy();
  });
});
