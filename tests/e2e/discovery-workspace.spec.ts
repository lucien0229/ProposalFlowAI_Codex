import { expect, test } from "@playwright/test";

import {
  expectDiscoveryActionSurface,
  expectDiscoveryDesktopLayout,
  expectDiscoveryEmptyState,
  expectDiscoveryFieldStates,
  expectDiscoveryLoadingState,
  expectDiscoveryShellCopy,
  openDiscoveryWorkspaceWithLeadBrief,
  openEmptyDiscoveryWorkspace,
  setDiscoveryViewport,
} from "./helpers/discovery";

test.describe("discovery workspace", () => {
  test("renders the workspace title and split-pane shell", async ({ page, baseURL }) => {
    const webBase = baseURL ?? "http://127.0.0.1:3000";
    await openEmptyDiscoveryWorkspace(page, webBase);

    await expectDiscoveryShellCopy(page);
    await expectDiscoveryDesktopLayout(page);
  });

  test("shows the empty state and thin-evidence generate action before discovery is generated", async ({
    page,
    baseURL,
  }) => {
    const webBase = baseURL ?? "http://127.0.0.1:3000";
    await openEmptyDiscoveryWorkspace(page, webBase);

    await expectDiscoveryEmptyState(page);
    await expectDiscoveryDesktopLayout(page);
  });

  test("shows a loading state while discovery resolves", async ({ page, baseURL }) => {
    const webBase = baseURL ?? "http://127.0.0.1:3000";
    const opportunityId = await openEmptyDiscoveryWorkspace(page, webBase);

    await page.route(new RegExp(`/api/v1/opportunities/${opportunityId}/discovery$`), async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 1200));
      await route.continue();
    });

    await page.goto(new URL(`/opportunities/${opportunityId}/discovery`, webBase).toString(), {
      waitUntil: "domcontentloaded",
    });

    await expectDiscoveryLoadingState(page);
  });

  test("recovers from a discovery load failure with the retry action", async ({ page, baseURL }) => {
    const webBase = baseURL ?? "http://127.0.0.1:3000";
    const opportunityId = await openEmptyDiscoveryWorkspace(page, webBase);
    let requestCount = 0;

    await page.route(new RegExp(`/api/v1/opportunities/${opportunityId}/discovery$`), async (route) => {
      requestCount += 1;
      if (requestCount === 1) {
        await route.fulfill({
          status: 500,
          contentType: "application/json",
          body: JSON.stringify({
            detail: "Temporary discovery load failure.",
          }),
        });
        return;
      }
      await route.continue();
    });

    await page.goto(new URL(`/opportunities/${opportunityId}/discovery`, webBase).toString(), {
      waitUntil: "domcontentloaded",
    });

    await expect(page.getByRole("heading", { name: "We couldn't load this discovery workspace." })).toBeVisible({
      timeout: 15_000,
    });

    await Promise.all([
      page.waitForResponse((response) => response.url().includes(`/discovery`) && response.status() === 200),
      page.getByRole("button", { name: "Retry" }).click(),
    ]);

    await expectDiscoveryEmptyState(page);
  });

  test("generates discovery, edits fields, saves current, saves a version, and restores it", async ({
    page,
    baseURL,
  }) => {
    const webBase = baseURL ?? "http://127.0.0.1:3000";
    const opportunityId = await openDiscoveryWorkspaceWithLeadBrief(page, webBase);

    await Promise.all([
      page.waitForResponse(
        (response) =>
          response.url().includes(`/api/v1/opportunities/${opportunityId}/discovery/generate`) &&
          response.request().method() === "POST" &&
          response.status() === 202,
      ),
      page.getByRole("button", { name: "Generate discovery" }).click(),
    ]);

    await expectDiscoveryActionSurface(page);

    const goalsCard = page.locator('[data-field-key="goals"]');
    const goalsInput = goalsCard.getByLabel("Goals");
    await goalsInput.fill("Shape a proposal-ready discovery around the redesign and migration scope.");
    await expect(goalsCard).toHaveAttribute("data-state", "needs_review", { timeout: 15_000 });
    const savedGoals = await goalsInput.inputValue();

    const followUpCard = page.locator('[data-field-key="follow_up_questions"]');
    const followUpInput = followUpCard.getByLabel("Follow-up questions");
    await followUpInput.fill("");
    await followUpCard.getByRole("button", { name: "Mark reviewed" }).click();
    await expect(followUpCard).toHaveAttribute("data-state", "missing", { timeout: 15_000 });
    await expectDiscoveryFieldStates(page, { expectMissing: true });

    if ((await page.locator(".discovery-source-note").count()) === 0) {
      await page.getByRole("button", { name: "Add note" }).click();
    }
    const firstNote = page.locator(".discovery-source-note").first();
    await firstNote.getByLabel("Source label").fill("Discovery call note");
    await firstNote
      .getByLabel("Note")
      .fill("Client wants a proposal-ready discovery summary with SEO and migration constraints preserved.");

    await Promise.all([
      page.waitForResponse(
        (response) =>
          response.url().includes(`/api/v1/opportunities/${opportunityId}/discovery`) &&
          response.request().method() === "PATCH" &&
          response.status() === 200,
      ),
      page.getByRole("button", { name: "Save current" }).click(),
    ]);

    await expect(page.getByTestId("discovery-header")).toContainText("Revision 3", { timeout: 15_000 });

    await Promise.all([
      page.waitForResponse(
        (response) =>
          response.url().includes(`/save-version`) &&
          response.request().method() === "POST" &&
          response.status() === 200,
      ),
      page.getByRole("button", { name: "Save version" }).click(),
    ]);

    await page.getByRole("button", { name: "Versions" }).click();
    await expect(page.getByTestId("discovery-version-drawer")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole("button", { name: /Version 1/ })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole("button", { name: "Restore" })).toBeVisible({ timeout: 15_000 });

    await goalsInput.fill("Restore target draft: updated discovery goal for verification.");
    await Promise.all([
      page.waitForResponse(
        (response) =>
          response.url().includes(`/api/v1/opportunities/${opportunityId}/discovery`) &&
          response.request().method() === "PATCH" &&
          response.status() === 200,
      ),
      page.getByRole("button", { name: "Save current" }).click(),
    ]);
    await page.getByRole("button", { name: "Restore" }).click();
    await expect(page.getByText("Restoring replaces the current working discovery. Save a version first if you want to preserve the current state.")).toBeVisible({
      timeout: 15_000,
    });
    await Promise.all([
      page.waitForResponse(
        (response) =>
          response.url().includes(`/restore`) &&
          response.request().method() === "POST" &&
          response.status() === 200,
      ),
      page.getByRole("button", { name: "Restore version" }).click(),
    ]);
    await expect(page.getByText("Version restored.")).toBeVisible({ timeout: 15_000 });
    await expect(goalsInput).toHaveValue(savedGoals, { timeout: 15_000 });
  });

  test("disables regenerate actions while discovery edits are unsaved", async ({ page, baseURL }) => {
    const webBase = baseURL ?? "http://127.0.0.1:3000";
    const opportunityId = await openDiscoveryWorkspaceWithLeadBrief(page, webBase);

    await Promise.all([
      page.waitForResponse(
        (response) =>
          response.url().includes(`/api/v1/opportunities/${opportunityId}/discovery/generate`) &&
          response.request().method() === "POST" &&
          response.status() === 202,
      ),
      page.getByRole("button", { name: "Generate discovery" }).click(),
    ]);

    const generateButton = page.getByRole("button", { name: "Generate discovery" });
    const regenerateButton = page.getByRole("button", { name: "Regenerate discovery" });
    const goalsCard = page.locator('[data-field-key="goals"]');
    const goalsInput = goalsCard.getByLabel("Goals");

    await goalsInput.fill("Shape a proposal-ready discovery around the redesign and migration scope.");

    await expect(generateButton).toBeDisabled({ timeout: 15_000 });
    await expect(regenerateButton).toBeDisabled({ timeout: 15_000 });

    await Promise.all([
      page.waitForResponse(
        (response) =>
          response.url().includes(`/api/v1/opportunities/${opportunityId}/discovery`) &&
          response.request().method() === "PATCH" &&
          response.status() === 200,
      ),
      page.getByRole("button", { name: "Save current" }).click(),
    ]);

    await expect(generateButton).toBeEnabled({ timeout: 15_000 });
    await expect(regenerateButton).toBeEnabled({ timeout: 15_000 });
  });

  test("keeps the source note label focused while editing", async ({ page, baseURL }) => {
    const webBase = baseURL ?? "http://127.0.0.1:3000";
    await openEmptyDiscoveryWorkspace(page, webBase);

    if ((await page.locator(".discovery-source-note").count()) === 0) {
      await page.getByRole("button", { name: "Add note" }).click();
    }

    const sourceNote = page.locator(".discovery-source-note").first();
    const sourceLabel = sourceNote.getByLabel("Source label");
    await sourceLabel.fill("Discovery note");
    await expect(sourceLabel).toBeFocused({ timeout: 15_000 });

    await sourceLabel.fill("Discovery call note");
    await expect(sourceLabel).toBeFocused({ timeout: 15_000 });
  });

  test("blocks the Proposal Draft handoff when any discovery field is missing", async ({ page, baseURL }) => {
    const webBase = baseURL ?? "http://127.0.0.1:3000";
    const opportunityId = await openDiscoveryWorkspaceWithLeadBrief(page, webBase);

    await Promise.all([
      page.waitForResponse(
        (response) =>
          response.url().includes(`/api/v1/opportunities/${opportunityId}/discovery/generate`) &&
          response.request().method() === "POST" &&
          response.status() === 202,
      ),
      page.getByRole("button", { name: "Generate discovery" }).click(),
    ]);

    const followUpCard = page.locator('[data-field-key="follow_up_questions"]');
    const followUpInput = followUpCard.getByLabel("Follow-up questions");
    await followUpInput.fill("");
    await followUpCard.getByRole("button", { name: "Mark reviewed" }).click();

    const proposalDraftLink = page.getByRole("link", { name: "Continue to Proposal Draft" });
    await expect(proposalDraftLink).toHaveAttribute("aria-disabled", "true", { timeout: 15_000 });
  });

  test("surfaces nested conflict hints from the API in the workspace notice", async ({ page, baseURL }) => {
    const webBase = baseURL ?? "http://127.0.0.1:3000";
    const opportunityId = await openDiscoveryWorkspaceWithLeadBrief(page, webBase);

    await page.route(new RegExp(`/api/v1/opportunities/${opportunityId}/discovery/save-version$`), async (route) => {
      await route.fulfill({
        status: 409,
        contentType: "application/json",
        body: JSON.stringify({
          error: {
            code: "DISCOVERY_CONFLICT",
            message: "Discovery changed elsewhere.",
            details: {
              reload_hint: "Reload the latest discovery before saving or restoring.",
            },
            restriction_reason: null,
          },
        }),
      });
    });

    await Promise.all([
      page.waitForResponse(
        (response) =>
          response.url().includes(`/api/v1/opportunities/${opportunityId}/discovery/generate`) &&
          response.request().method() === "POST" &&
          response.status() === 202,
      ),
      page.getByRole("button", { name: "Generate discovery" }).click(),
    ]);
    await expectDiscoveryActionSurface(page);
    await page.getByRole("button", { name: "Save version" }).click();

    await expect(page.locator(".discovery-output-pane__notice")).toContainText(
      "Reload the latest discovery before saving or restoring.",
      { timeout: 15_000 },
    );
  });

  test("does not show a success notice when discovery reload fails after generate", async ({
    page,
    baseURL,
  }) => {
    const webBase = baseURL ?? "http://127.0.0.1:3000";
    const opportunityId = await openDiscoveryWorkspaceWithLeadBrief(page, webBase);
    let discoveryLoadCount = 0;

    await page.route(new RegExp(`/api/v1/opportunities/${opportunityId}/discovery$`), async (route) => {
      discoveryLoadCount += 1;
      if (discoveryLoadCount === 1) {
        await route.fulfill({
          status: 500,
          contentType: "application/json",
          body: JSON.stringify({
            detail: "Temporary discovery reload failure.",
          }),
        });
        return;
      }
      await route.continue();
    });

    await Promise.all([
      page.waitForResponse(
        (response) =>
          response.url().includes(`/api/v1/opportunities/${opportunityId}/discovery/generate`) &&
          response.request().method() === "POST" &&
          response.status() === 202,
      ),
      page.getByRole("button", { name: "Generate discovery" }).click(),
    ]);

    await expect(page.getByText("The workspace service is unavailable right now.")).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByText("Discovery generated and loaded.")).toHaveCount(0);
  });

  test("surfaces a conservative needs-more-evidence gate when source material is too thin", async ({
    page,
    baseURL,
  }) => {
    const webBase = baseURL ?? "http://127.0.0.1:3000";
    await openEmptyDiscoveryWorkspace(page, webBase);

    await Promise.all([
      page.waitForResponse(
        (response) =>
          response.url().includes(`/api/v1/opportunities/`) &&
          response.url().includes(`/discovery/generate`) &&
          response.request().method() === "POST" &&
          response.status() === 202,
      ),
      page.getByRole("button", { name: "Generate discovery" }).click(),
    ]);

    await expect(page.locator(".discovery-output-pane__notice")).toContainText("Needs more evidence", {
      timeout: 15_000,
    });
  });

  test("opens version history as a right-side workspace panel", async ({ page, baseURL }) => {
    const webBase = baseURL ?? "http://127.0.0.1:3000";
    const opportunityId = await openDiscoveryWorkspaceWithLeadBrief(page, webBase);

    await Promise.all([
      page.waitForResponse(
        (response) =>
          response.url().includes(`/api/v1/opportunities/${opportunityId}/discovery/generate`) &&
          response.request().method() === "POST" &&
          response.status() === 202,
      ),
      page.getByRole("button", { name: "Generate discovery" }).click(),
    ]);

    await page.getByRole("button", { name: "Versions" }).click();
    await expect(page.getByTestId("discovery-version-drawer")).toBeVisible({ timeout: 15_000 });

    const outputBox = await page.locator('[data-testid="discovery-output-main"]').boundingBox();
    const drawerBox = await page.locator('[data-testid="discovery-version-drawer"]').boundingBox();

    expect(outputBox).not.toBeNull();
    expect(drawerBox).not.toBeNull();
    expect(drawerBox?.x ?? 0).toBeGreaterThan((outputBox?.x ?? 0) + (outputBox?.width ?? 0) - 48);
  });

  for (const width of [1024, 1280, 1440]) {
    test(`stays readable and non-overflowing at ${width}px`, async ({ page, baseURL }) => {
      const webBase = baseURL ?? "http://127.0.0.1:3000";
      await setDiscoveryViewport(page, width);
      await openDiscoveryWorkspaceWithLeadBrief(page, webBase);

      await expectDiscoveryDesktopLayout(page);

      const shellBox = await page.locator('[data-testid="discovery-workspace"]').boundingBox();
      expect(shellBox).not.toBeNull();
      expect(shellBox?.x ?? 0).toBeGreaterThanOrEqual(0);
      expect(shellBox?.width ?? 0).toBeLessThanOrEqual(width);
    });
  }
});
