import { expect, type Page } from "@playwright/test";

import { openPopulatedLeadBriefWorkspace } from "./lead-brief";
import { createOpportunityAndOpenOverview } from "./opportunity-overview";

export function getDiscoveryWorkspace(page: Page) {
  return {
    shell: page.locator('[data-testid="discovery-workspace"]'),
    header: page.locator('[data-testid="discovery-header"]'),
    sourcePane: page.locator('[data-testid="discovery-source-pane"]'),
    outputPane: page.locator('[data-testid="discovery-output-pane"]'),
    emptyState: page.locator('[data-testid="discovery-empty-state"]'),
    fieldStates: page.locator('[data-testid="discovery-field-state"]'),
    versionDrawer: page.locator('[data-testid="discovery-version-drawer"]'),
  };
}

export async function setDiscoveryViewport(page: Page, width: number) {
  await page.setViewportSize({ width, height: 900 });
}

export async function openEmptyDiscoveryWorkspace(page: Page, baseURL: string) {
  const opportunityId = await createOpportunityAndOpenOverview(page, baseURL);
  await page.goto(new URL(`/opportunities/${opportunityId}/discovery`, baseURL).toString(), {
    waitUntil: "domcontentloaded",
  });
  return opportunityId;
}

export async function openDiscoveryWorkspaceWithLeadBrief(page: Page, baseURL: string) {
  const opportunityId = await openPopulatedLeadBriefWorkspace(page, baseURL);
  await page.goto(new URL(`/opportunities/${opportunityId}/discovery`, baseURL).toString(), {
    waitUntil: "domcontentloaded",
  });
  await expect(page.getByRole("button", { name: "Generate discovery" })).toBeVisible({ timeout: 15_000 });
  return opportunityId;
}

export async function expectDiscoveryDesktopLayout(page: Page) {
  const shell = getDiscoveryWorkspace(page);
  await expect(shell.shell).toBeVisible({ timeout: 15_000 });
  await expect(shell.header).toBeVisible({ timeout: 15_000 });
  await expect(shell.sourcePane).toBeVisible({ timeout: 15_000 });
  await expect(shell.outputPane).toBeVisible({ timeout: 15_000 });

  const noOverflow = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
  expect(noOverflow).toBe(true);
}

export async function expectDiscoveryShellCopy(page: Page) {
  await expect(page.getByTestId("discovery-header").getByRole("heading", { name: "Current discovery" })).toBeVisible({
    timeout: 15_000,
  });
  await expect(page.getByTestId("discovery-header")).toContainText(
    "Capture the evidence, make the gaps visible, and keep the current discovery record versioned.",
    { timeout: 15_000 },
  );
}

export async function expectDiscoveryLoadingState(page: Page) {
  await expect(page.getByTestId("discovery-output-pane")).toContainText("Loading discovery", { timeout: 15_000 });
  await expect(page.getByTestId("discovery-output-pane")).toContainText(
    "Fetching the current discovery working copy and version history.",
    { timeout: 15_000 },
  );
}

export async function expectDiscoveryEmptyState(page: Page) {
  const shell = getDiscoveryWorkspace(page);
  await expect(shell.emptyState).toContainText("No current discovery.", { timeout: 15_000 });
  await expect(page.getByRole("button", { name: "Generate discovery" })).toBeVisible({ timeout: 15_000 });
}

export async function expectDiscoveryActionSurface(page: Page) {
  await expect(page.getByRole("button", { name: "Save current" })).toBeVisible({ timeout: 15_000 });
  await expect(page.getByRole("button", { name: "Save version" })).toBeVisible({ timeout: 15_000 });
  await expect(page.getByRole("button", { name: "Regenerate discovery" })).toBeVisible({ timeout: 15_000 });
  await expect(page.getByRole("button", { name: "Versions" })).toBeVisible({ timeout: 15_000 });
  await expect(page.getByRole("button", { name: "Copy summary" })).toBeVisible({ timeout: 15_000 });
  await expect(page.getByRole("link", { name: "Continue to Proposal Draft" })).toBeVisible({ timeout: 15_000 });
}

export async function expectDiscoveryFieldStates(page: Page, options: { expectMissing?: boolean } = {}) {
  const fieldStates = getDiscoveryWorkspace(page).fieldStates;
  await expect(fieldStates.filter({ hasText: "Confirmed" }).first()).toBeVisible({ timeout: 15_000 });
  await expect(fieldStates.filter({ hasText: "Inferred" }).first()).toBeVisible({ timeout: 15_000 });
  await expect(fieldStates.filter({ hasText: "Needs more evidence" }).first()).toBeVisible({ timeout: 15_000 });

  if (options.expectMissing) {
    await expect(fieldStates.filter({ hasText: "Missing" }).first()).toBeVisible({ timeout: 15_000 });
  }
}
