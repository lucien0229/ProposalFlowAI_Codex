import { expect, type Locator, type Page } from "@playwright/test";

import { fillMinimumOpportunityForm, openNewOpportunity, submitOpportunityForm } from "./opportunities";
import { onboardToDashboard } from "./onboarding";

const WORKFLOW_STEPS = [
  "Lead Intake",
  "Lead Brief",
  "Discovery",
  "Proposal Draft",
  "Follow-up",
] as const;

const PRODUCT_ROUTE_STATES = [
  "loading",
  "empty",
  "error",
  "blocked",
  "retry",
  "success",
] as const;

export type ProductRouteState = (typeof PRODUCT_ROUTE_STATES)[number];

export function getOpportunityShell(page: Page) {
  return {
    eyebrow: page.locator(".product-page-header__eyebrow"),
    header: page.locator(".product-page-header"),
    stepper: page.getByRole("navigation", { name: /opportunity workflow/i }),
    surface: page.locator(".product-shell__surface"),
    recoveryNotice: page.getByTestId("opportunity-overview-recovery"),
  };
}

export function getRouteStateBlock(page: Page, state: ProductRouteState): Locator {
  return page.locator(`.product-state-block[data-state="${state}"]`);
}

export function getFileStateCard(
  page: Page,
  state: "uploaded" | "processing" | "ready" | "failed",
): Locator {
  return page.getByTestId("opportunity-file-state").filter({
    has: page.locator(`[data-file-state="${state}"]`),
  });
}

export async function createOpportunityAndOpenOverview(page: Page, baseURL: string) {
  await onboardToDashboard(page, baseURL);
  await page.goto(new URL("/opportunities", baseURL).toString());
  await openNewOpportunity(page);
  await fillMinimumOpportunityForm(page, {
    title: "North Star redesign",
    companyName: "North Star Studio",
    requestedService: "Website redesign and migration support",
  });
  await submitOpportunityForm(page);
  await expect(page).toHaveURL(/\/opportunities\/[^/]+\/overview$/, { timeout: 15_000 });
  const opportunityId = new URL(page.url()).pathname.split("/")[2];
  if (!opportunityId) {
    throw new Error(`Expected opportunity id in overview URL, got ${page.url()}.`);
  }

  await page.goto(new URL(`/opportunities/${opportunityId}/overview`, baseURL).toString(), {
    waitUntil: "domcontentloaded",
  });
  await expect(page).toHaveURL(new RegExp(`/opportunities/${opportunityId}/overview$`));

  return opportunityId;
}

export async function gotoOverviewRoute(page: Page, baseURL: string, opportunityId: string) {
  await page.goto(new URL(`/opportunities/${opportunityId}/overview`, baseURL).toString());
}

export async function gotoOverviewState(
  page: Page,
  baseURL: string,
  opportunityId: string,
  state: ProductRouteState | "not-found",
) {
  const path =
    state === "not-found"
      ? `/opportunities/${opportunityId}/overview?view=not-found`
      : `/opportunities/${opportunityId}/overview?state=${state}`;
  await page.goto(new URL(path, baseURL).toString());
}

export async function expectWorkflowStepper(page: Page) {
  const stepper = getOpportunityShell(page).stepper;
  await expect(stepper).toBeVisible();

  for (const step of WORKFLOW_STEPS) {
    await expect(stepper.getByText(step, { exact: true })).toBeVisible();
  }
}

export async function expectRouteStateBlock(
  page: Page,
  state: ProductRouteState,
  title: string,
  body: string,
) {
  const block = getRouteStateBlock(page, state);
  await expect(block).toBeVisible();
  await expect(block).toContainText(title);
  await expect(block).toContainText(body);
}
