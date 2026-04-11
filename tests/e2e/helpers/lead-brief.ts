import { expect, type Locator, type Page } from "@playwright/test";

import { createOpportunityAndOpenOverview } from "./opportunity-overview";

export function getLeadBriefWorkspace(page: Page) {
  return {
    shell: page.locator('[data-testid="lead-brief-workspace"]'),
    header: page.locator('[data-testid="lead-brief-header"]'),
    sourcePane: page.locator('[data-testid="lead-brief-source-pane"]'),
    outputPane: page.locator('[data-testid="lead-brief-output-pane"]'),
    emptyState: page.locator('[data-testid="lead-brief-empty-state"]'),
    fieldStates: page.locator('[data-testid="lead-brief-field-state"]'),
  };
}

export async function setLeadBriefViewport(page: Page, width: number) {
  await page.setViewportSize({ width, height: 900 });
}

export async function openEmptyLeadBriefWorkspace(page: Page, baseURL: string) {
  const opportunityId = await createOpportunityAndOpenOverview(page, baseURL);
  await page.goto(new URL(`/opportunities/${opportunityId}/lead-brief`, baseURL).toString(), {
    waitUntil: "domcontentloaded",
  });
  return opportunityId;
}

export async function openPopulatedLeadBriefWorkspace(page: Page, baseURL: string) {
  const opportunityId = await createOpportunityAndOpenOverview(page, baseURL);
  const csrfToken = await page.evaluate(() => {
    const match = document.cookie
      .split(";")
      .map((entry) => entry.trim())
      .find((entry) => entry.startsWith("pf_csrf_token="));
    return match ? decodeURIComponent(match.slice("pf_csrf_token=".length)) : null;
  });

  if (!csrfToken) {
    throw new Error("Expected a browser CSRF token for populated lead brief setup.");
  }

  const patchResult = await page.evaluate(
    async ({ opportunityId, csrfToken }) => {
      const response = await fetch(`/api/v1/opportunities/${opportunityId}`, {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
          "x-csrf-token": csrfToken,
        },
        body: JSON.stringify({
          title: "North Star redesign",
          company_name: "North Star Studio",
          contact_name: null,
          contact_email: null,
          requested_service: "Website redesign and migration support",
          source_type: "manual",
          raw_input: "North Star Studio needs a redesign, migration support, and analytics cleanup.",
          file_gate: null,
        }),
      });

      return {
        status: response.status,
        bodyText: await response.text(),
      };
    },
    { opportunityId, csrfToken },
  );

  if (patchResult.status !== 200) {
    throw new Error(`Expected populated intake setup to save cleanly, got ${patchResult.status}: ${patchResult.bodyText}`);
  }

  await page.goto(new URL(`/opportunities/${opportunityId}/lead-brief`, baseURL).toString(), {
    waitUntil: "load",
  });
  await page.waitForLoadState("networkidle");
  const generateLeadBriefButton = page.getByRole("button", { name: "Generate lead brief" });
  await expect(generateLeadBriefButton).toBeVisible({ timeout: 15_000 });
  await Promise.all([
    page.waitForResponse(
      (response) =>
        response.url().includes(`/api/v1/opportunities/${opportunityId}/lead-brief/generate`) &&
        response.request().method() === "POST" &&
        response.status() === 202,
    ),
    generateLeadBriefButton.click(),
  ]);

  const saveCurrentButton = page.getByRole("button", { name: "Save current" });
  await expect(saveCurrentButton).toBeVisible({ timeout: 15_000 });
  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(page.getByRole("button", { name: "Save current" })).toBeVisible({ timeout: 15_000 });
  return opportunityId;
}

export async function expectLeadBriefDesktopLayout(page: Page) {
  const shell = getLeadBriefWorkspace(page);
  await expect(shell.shell).toBeVisible({ timeout: 15_000 });
  await expect(shell.header).toBeVisible({ timeout: 15_000 });
  await expect(shell.sourcePane).toBeVisible({ timeout: 15_000 });
  await expect(shell.outputPane).toBeVisible({ timeout: 15_000 });

  const noOverflow = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
  expect(noOverflow).toBe(true);
}

export async function expectLeadBriefFieldStates(page: Page) {
  const fieldStates = getLeadBriefWorkspace(page).fieldStates;
  await expect(fieldStates.filter({ hasText: "Confirmed" }).first()).toBeVisible({ timeout: 15_000 });
  await expect(fieldStates.filter({ hasText: "Inferred" }).first()).toBeVisible({ timeout: 15_000 });
  await expect(fieldStates.filter({ hasText: "Missing" }).first()).toBeVisible({ timeout: 15_000 });
  await expect(fieldStates.filter({ hasText: "Needs Review" }).first()).toBeVisible({ timeout: 15_000 });
}

export async function expectLeadBriefActionSurface(page: Page) {
  await expect(page.getByRole("button", { name: "Save current" })).toBeVisible({ timeout: 15_000 });
  await expect(page.getByRole("button", { name: "Save version" })).toBeVisible({ timeout: 15_000 });
  await expect(page.getByRole("button", { name: "Regenerate brief" })).toBeVisible({ timeout: 15_000 });
  await expect(page.getByRole("button", { name: "Versions" })).toBeVisible({ timeout: 15_000 });
  await expect(page.getByRole("button", { name: "Copy summary" })).toBeVisible({ timeout: 15_000 });
  await expect(page.getByRole("link", { name: "Continue to Discovery" })).toBeVisible({ timeout: 15_000 });
}

export async function expectLeadBriefEmptyState(page: Page) {
  const shell = getLeadBriefWorkspace(page);
  await expect(shell.emptyState).toContainText("No current lead brief.", { timeout: 15_000 });
  await expect(page.getByRole("button", { name: "Generate lead brief" })).toBeVisible({ timeout: 15_000 });
}

export async function expectLeadBriefShellCopy(page: Page) {
  await expect(page.getByTestId("lead-brief-header").getByRole("heading", { name: "Current brief" })).toBeVisible({
    timeout: 15_000,
  });
  await expect(page.getByTestId("lead-brief-header")).toContainText(
    "Shape the current opportunity into a brief you can trust, version, and hand off.",
    { timeout: 15_000 },
  );
}

export async function expectLeadBriefLoadingState(page: Page) {
  await expect(page.getByTestId("lead-brief-loading-state")).toBeVisible({ timeout: 15_000 });
  await expect(page.getByTestId("lead-brief-loading-state").getByRole("heading", { name: "Loading current brief" })).toBeVisible({
    timeout: 15_000,
  });
  await expect(page.getByText("Fetching the latest brief and version history from the workspace.")).toBeVisible({
    timeout: 15_000,
  });
}
