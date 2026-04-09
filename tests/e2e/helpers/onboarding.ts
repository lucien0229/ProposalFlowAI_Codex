import { expect, type Page } from "@playwright/test";

import { AUTH_ROUTE_PATHS, RETURN_URL_QUERY_PARAM } from "@proposalflow/shared-config";

export function uniqueEmail(prefix: string) {
  const nonce = Math.random().toString(36).slice(2, 10);
  return `${prefix}+${Date.now()}-${nonce}@example.com`;
}

export async function onboardToDashboard(
  page: Page,
  baseURL: string,
  workspaceName: string = "North Star Studio",
) {
  const signUpUrl = new URL(AUTH_ROUTE_PATHS.signUp, baseURL);
  signUpUrl.searchParams.set(RETURN_URL_QUERY_PARAM, "/dashboard");

  await page.goto(signUpUrl.toString());
  await page.getByLabel("Email").fill(uniqueEmail("phase3-onboarding"));
  await page.getByLabel("Full name").fill("Phase 3 Operator");
  await page.getByLabel("Password").fill("secret-123");
  await page.getByRole("button", { name: "Create account" }).click();

  await expect(page).toHaveURL(/\/setup\/workspace/);
  await page.getByLabel("Workspace name").fill(workspaceName);
  await page.getByLabel("Industry type").selectOption("product_ux_agency");
  await page.getByLabel("Default template").selectOption("product_ux_agency");
  await page.getByLabel("Default tone preference").selectOption("consultative");
  await Promise.all([
    page.waitForResponse((response) => {
      return (
        response.url().includes("/api/v1/workspaces") &&
        response.request().method() === "POST" &&
        response.status() === 201
      );
    }),
    page.getByRole("button", { name: /continue to dashboard/i }).click(),
  ]);

  await expect(page).toHaveURL(/\/dashboard/, { timeout: 15_000 });
}
