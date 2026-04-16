import { expect, type Page } from "@playwright/test";

import { openPopulatedLeadBriefWorkspace } from "./lead-brief";
import { createOpportunityAndOpenOverview, gotoOpportunityStep } from "./opportunity-overview";

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
  await gotoOpportunityStep(page, baseURL, opportunityId, "discovery");
  await expect(page.getByRole("button", { name: "Generate discovery" })).toBeVisible({ timeout: 15_000 });
  return opportunityId;
}

export async function generateDiscovery(page: Page, opportunityId: string) {
  await Promise.all([
    page.waitForResponse(
      (response) =>
        response.url().includes(`/api/v1/opportunities/${opportunityId}/discovery/generate`) &&
        response.request().method() === "POST" &&
        response.status() === 202,
    ),
    page.getByRole("button", { name: "Generate discovery" }).click(),
  ]);

  await expect(page.getByRole("button", { name: "Save current" })).toBeVisible({ timeout: 15_000 });
}

export async function expectProposalDraftReady(page: Page) {
  await expect(page.getByTestId("proposal-draft-header").getByRole("heading", { name: "Proposal Draft" })).toBeVisible({
    timeout: 15_000,
  });
  await expect(page.getByTestId("proposal-draft-rules-summary")).toBeVisible({ timeout: 15_000 });
  await expect(page.getByTestId("proposal-draft-loading-state")).toHaveCount(0, { timeout: 15_000 });
  await expect(page.getByRole("button", { name: "Save current" })).toBeVisible({ timeout: 15_000 });
  await expect(
    page.getByTestId("proposal-draft-stage").getByRole("heading", { name: "Executive Summary" }),
  ).toBeVisible({ timeout: 15_000 });
}

async function markDiscoveryReady(page: Page, opportunityId: string) {
  const csrfToken = await page.evaluate(() => {
    const match = document.cookie
      .split(";")
      .map((entry) => entry.trim())
      .find((entry) => entry.startsWith("pf_csrf_token="));
    return match ? decodeURIComponent(match.slice("pf_csrf_token=".length)) : null;
  });

  if (!csrfToken) {
    throw new Error("Expected a browser CSRF token for discovery ready-state setup.");
  }

  const patchResult = await page.evaluate(
    async ({ opportunityId, csrfToken }) => {
      const workspaceResponse = await fetch(`/api/v1/opportunities/${opportunityId}/discovery`, {
        credentials: "include",
      });

      const workspaceBody = await workspaceResponse.text();
      if (!workspaceResponse.ok) {
        return {
          status: workspaceResponse.status,
          bodyText: workspaceBody,
        };
      }

      const workspacePayload = JSON.parse(workspaceBody) as {
        discovery: {
          current_revision_no: number;
          fields: Record<string, { value: string | null; state: string; source_excerpt: string | null }>;
          source_notes: Array<{ content: string; source_label: string | null }>;
        } | null;
      };

      if (!workspacePayload.discovery) {
        return {
          status: 500,
          bodyText: "Discovery current resource was missing during ready-state setup.",
        };
      }

      const readyFieldStates: Record<string, "confirmed" | "inferred"> = {
        goals: "confirmed",
        constraints: "confirmed",
        ambiguities: "inferred",
        risk_flags: "inferred",
        follow_up_questions: "confirmed",
      };
      const fields = Object.fromEntries(
        Object.entries(workspacePayload.discovery.fields).map(([key, field]) => [
          key,
          {
            ...field,
            state: readyFieldStates[key] ?? "confirmed",
            source_excerpt:
              field.source_excerpt ??
              field.value ??
              "Discovery readiness was confirmed during browser setup.",
          },
        ]),
      );

      const patchResponse = await fetch(`/api/v1/opportunities/${opportunityId}/discovery`, {
        method: "PATCH",
        credentials: "include",
        headers: {
          "content-type": "application/json",
          "x-csrf-token": csrfToken,
        },
        body: JSON.stringify({
          expected_revision_no: workspacePayload.discovery.current_revision_no,
          fields,
          source_notes: workspacePayload.discovery.source_notes ?? [],
        }),
      });

      return {
        status: patchResponse.status,
        bodyText: await patchResponse.text(),
      };
    },
    { opportunityId, csrfToken },
  );

  if (patchResult.status !== 200) {
    throw new Error(`Expected discovery ready-state setup to save cleanly, got ${patchResult.status}: ${patchResult.bodyText}`);
  }
}

export async function openProposalDraftWorkspaceWithDiscoveryReady(page: Page, baseURL: string) {
  const opportunityId = await openProposalDraftWorkspaceWithoutCurrentDraft(page, baseURL);
  await Promise.all([
    page.waitForResponse(
      (response) =>
        response.url().includes(`/api/v1/opportunities/${opportunityId}/proposal-draft/generate`) &&
        response.request().method() === "POST" &&
        response.status() === 202,
    ),
    page.getByRole("button", { name: "Generate draft" }).click(),
  ]);
  await expectProposalDraftReady(page);
  return opportunityId;
}

export async function openProposalDraftWorkspaceWithoutCurrentDraft(page: Page, baseURL: string) {
  const opportunityId = await openDiscoveryWorkspaceWithLeadBrief(page, baseURL);
  await generateDiscovery(page, opportunityId);
  await markDiscoveryReady(page, opportunityId);
  await gotoOpportunityStep(page, baseURL, opportunityId, "proposal-draft");
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
