import { expect, test } from "@playwright/test";

import {
  expectLeadBriefActionSurface,
  expectLeadBriefDesktopLayout,
  expectLeadBriefEmptyState,
  expectLeadBriefFieldStates,
  expectLeadBriefLoadingState,
  expectLeadBriefShellCopy,
  openEmptyLeadBriefWorkspace,
  openPopulatedLeadBriefWorkspace,
  setLeadBriefViewport,
} from "./helpers/lead-brief";
import { createOpportunityAndOpenOverview } from "./helpers/opportunity-overview";

test.describe("lead brief workspace", () => {
  test("renders the workspace title and two-pane shell", async ({ page, baseURL }) => {
    const webBase = baseURL ?? "http://127.0.0.1:3000";
    await openEmptyLeadBriefWorkspace(page, webBase);

    await expectLeadBriefShellCopy(page);
    await expectLeadBriefDesktopLayout(page);
  });

  test("shows the empty state and the primary generate action before a brief exists", async ({
    page,
    baseURL,
  }) => {
    const webBase = baseURL ?? "http://127.0.0.1:3000";
    await openEmptyLeadBriefWorkspace(page, webBase);

    await expectLeadBriefEmptyState(page);
    await expectLeadBriefDesktopLayout(page);
  });

  test("shows a loading state while the lead brief resolves", async ({ page, baseURL }) => {
    const webBase = baseURL ?? "http://127.0.0.1:3000";
    const opportunityId = await createOpportunityAndOpenOverview(page, webBase);

    await page.route(new RegExp(`/api/v1/opportunities/${opportunityId}/lead-brief$`), async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 1200));
      await route.continue();
    });

    await page.goto(new URL(`/opportunities/${opportunityId}/lead-brief`, webBase).toString(), {
      waitUntil: "domcontentloaded",
    });

    await expectLeadBriefLoadingState(page);
  });

  test("shows the populated workspace actions after lead brief generation", async ({ page, baseURL }) => {
    const webBase = baseURL ?? "http://127.0.0.1:3000";
    await openPopulatedLeadBriefWorkspace(page, webBase);

    await expectLeadBriefActionSurface(page);
    await expectLeadBriefFieldStates(page);
    await expectLeadBriefDesktopLayout(page);
  });

  test("surfaces the locked field-state vocabulary in the browser", async ({ page, baseURL }) => {
    const webBase = baseURL ?? "http://127.0.0.1:3000";
    await openPopulatedLeadBriefWorkspace(page, webBase);

    await expectLeadBriefFieldStates(page);
    await expect(page.getByRole("region", { name: "Core identity" })).toBeVisible({ timeout: 15_000 });
  });

  test("surfaces version history and restore confirmation", async ({ page, baseURL }) => {
    const webBase = baseURL ?? "http://127.0.0.1:3000";
    await openPopulatedLeadBriefWorkspace(page, webBase);

    await Promise.all([
      page.waitForResponse(
        (response) =>
          response.url().includes("/lead-brief/save-version") &&
          response.request().method() === "POST" &&
          response.status() === 200,
      ),
      page.getByRole("button", { name: "Save version" }).click(),
    ]);
    const versionsButton = page.getByRole("button", { name: "Versions" });
    await expect(versionsButton).toHaveAttribute("aria-controls", "lead-brief-version-drawer");
    await expect(versionsButton).toHaveAttribute("aria-expanded", "false");
    await versionsButton.click();
    await expect(versionsButton).toHaveAttribute("aria-expanded", "true");

    const versionDrawer = page.getByTestId("lead-brief-version-drawer");
    await expect(versionDrawer).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole("button", { name: /Version 1/ })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole("button", { name: "Restore" })).toBeVisible({ timeout: 15_000 });
    await expect(versionDrawer.getByText("Urgency / timeline", { exact: true })).toBeVisible({ timeout: 15_000 });
    await expect(versionDrawer.getByText("Budget signal", { exact: true })).toBeVisible({ timeout: 15_000 });
    await expect(versionDrawer.getByText("Missing information", { exact: true })).toBeVisible({ timeout: 15_000 });
    await expect(versionDrawer.getByText("Recommended next step", { exact: true })).toBeVisible({ timeout: 15_000 });

    const businessContextCard = page.locator('[data-field-key="business_context"]');
    const businessContextInput = businessContextCard.getByLabel("Business context");
    const originalBusinessContext = await businessContextInput.inputValue();

    await businessContextInput.fill("Version restore draft: updated business context for verification.");
    await expect(businessContextCard).toHaveAttribute("data-state", "needs_review", { timeout: 15_000 });

    await Promise.all([
      page.waitForResponse(
        (response) =>
          response.url().includes("/lead-brief") &&
          response.request().method() === "PATCH" &&
          response.status() === 200,
      ),
      page.getByRole("button", { name: "Save current" }).click(),
    ]);
    await expect(page.getByRole("button", { name: "Versions" })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId("lead-brief-header").getByText("Revision 2", { exact: true })).toBeVisible({
      timeout: 15_000,
    });

    await page.getByRole("button", { name: "Restore" }).click();
    await expect(page.getByText("Restoring replaces the current working brief.", { exact: false })).toBeVisible({
      timeout: 15_000,
    });
    await Promise.all([
      page.waitForResponse(
        (response) =>
          response.url().includes("/restore") &&
          response.request().method() === "POST" &&
          response.status() === 200,
      ),
      page.getByRole("button", { name: "Restore version" }).click(),
    ]);
    await expect(page.getByText("Version restored.")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId("lead-brief-header").getByText("Revision 3", { exact: true })).toBeVisible({
      timeout: 15_000,
    });
    await expect(businessContextInput).toHaveValue(originalBusinessContext, { timeout: 15_000 });
  });

  test("shows a busy notice while regenerating the lead brief", async ({ page, baseURL }) => {
    const webBase = baseURL ?? "http://127.0.0.1:3000";
    const opportunityId = await openPopulatedLeadBriefWorkspace(page, webBase);

    await page.route(new RegExp(`/api/v1/opportunities/${opportunityId}/lead-brief/generate$`), async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 1200));
      await route.continue();
    });

    const generateResponse = page.waitForResponse(
      (response) =>
        response.url().includes(`/api/v1/opportunities/${opportunityId}/lead-brief/generate`) &&
        response.request().method() === "POST" &&
        response.status() === 202,
    );

    await page.getByRole("button", { name: "Regenerate brief" }).click();

    await expect(page.locator(".lead-brief-output-pane__notice")).toContainText("Regenerating lead brief…", {
      timeout: 15_000,
    });
    await expect(page.getByRole("button", { name: "Regenerate brief" })).toBeDisabled({ timeout: 15_000 });
    await expect(
      page.locator('[data-field-key="business_context"]').getByRole("textbox").first(),
    ).toBeDisabled({ timeout: 15_000 });

    await generateResponse;
    await expect(page.getByRole("button", { name: "Save current" })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole("link", { name: "Continue to Discovery" })).toBeVisible({
      timeout: 15_000,
    });
  });

  test("surfaces nested conflict hints from the API in the workspace notice", async ({ page, baseURL }) => {
    const webBase = baseURL ?? "http://127.0.0.1:3000";
    const opportunityId = await openPopulatedLeadBriefWorkspace(page, webBase);

    await page.route(new RegExp(`/api/v1/opportunities/${opportunityId}/lead-brief/save-version$`), async (route) => {
      await route.fulfill({
        status: 409,
        contentType: "application/json",
        body: JSON.stringify({
          error: {
            code: "LEAD_BRIEF_CONFLICT",
            message: "Lead brief changed elsewhere.",
            details: {
              reload_hint: "Reload the latest lead brief before saving or restoring.",
            },
            restriction_reason: null,
          },
        }),
      });
    });

    await page.getByRole("button", { name: "Save version" }).click();

    await expect(page.locator(".lead-brief-output-pane__notice")).toContainText(
      "Reload the latest lead brief before saving or restoring.",
      { timeout: 15_000 },
    );
  });

  for (const width of [1024, 1280, 1440]) {
    test(`stays readable and non-overflowing at ${width}px`, async ({ page, baseURL }) => {
      const webBase = baseURL ?? "http://127.0.0.1:3000";
      await setLeadBriefViewport(page, width);
      await openPopulatedLeadBriefWorkspace(page, webBase);

      await expectLeadBriefDesktopLayout(page);

      const shellBox = await page.locator('[data-testid="lead-brief-workspace"]').boundingBox();
      expect(shellBox).not.toBeNull();
      expect(shellBox?.x ?? 0).toBeGreaterThanOrEqual(0);
      expect((shellBox?.width ?? 0)).toBeLessThanOrEqual(width);
    });
  }
});
