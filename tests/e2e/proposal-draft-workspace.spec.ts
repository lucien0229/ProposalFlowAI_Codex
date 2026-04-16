import { expect, test, type Page } from "@playwright/test";

import {
  expectProposalDraftReady,
  openDiscoveryWorkspaceWithLeadBrief,
  openProposalDraftWorkspaceWithDiscoveryReady,
  openProposalDraftWorkspaceWithoutCurrentDraft,
} from "./helpers/discovery";
import {
  createOpportunityAndOpenOverview,
  expectWorkflowStepper,
  gotoOpportunityStep,
} from "./helpers/opportunity-overview";

function proposalDraftRoute(opportunityId: string) {
  return new RegExp(`/api/v1/opportunities/${opportunityId}/proposal-draft$`);
}

function proposalDraftGenerateRoute(opportunityId: string) {
  return new RegExp(`/api/v1/opportunities/${opportunityId}/proposal-draft/generate$`);
}

async function setProposalDraftViewport(page: Page, width: number = 1440) {
  await page.setViewportSize({ width, height: 960 });
}

async function expectProposalDraftShell(page: Page) {
  await expect(page.getByTestId("proposal-draft-header").getByRole("heading", { name: "Proposal Draft" })).toBeVisible({
    timeout: 15_000,
  });
  await expect(page.getByTestId("proposal-draft-header")).toContainText(
    "Turn the current brief, discovery, and rules into a proposal-ready draft you can edit, version, and export.",
    { timeout: 15_000 },
  );
  await expect(page.getByTestId("proposal-draft-rules-summary")).toBeVisible({ timeout: 15_000 });
  await expect(page.getByTestId("proposal-draft-rules-summary")).toContainText("Rules Summary");
  await expectWorkflowStepper(page);
}

test.describe("proposal draft workspace", () => {
  test.describe.configure({ mode: "serial" });
  test.setTimeout(60_000);

  test("rules summary and chapter stage stay credible across desktop widths", async ({ page, baseURL }) => {
    const webBase = baseURL ?? "http://127.0.0.1:3000";
    await openProposalDraftWorkspaceWithDiscoveryReady(page, webBase);

    await expectProposalDraftReady(page);
    await expect(page.getByRole("button", { name: "Save current" })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole("button", { name: "Save version" })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole("button", { name: "Regenerate all" })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole("button", { name: "Versions" })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole("button", { name: "Copy all" })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole("button", { name: "Export" })).toBeVisible({ timeout: 15_000 });

    const stage = page.getByTestId("proposal-draft-stage");
    await expect(stage).toBeVisible({ timeout: 15_000 });
    await expect(stage.getByRole("heading", { name: "Executive Summary" })).toBeVisible({ timeout: 15_000 });
    await expect(stage.getByRole("heading", { name: "Assumptions" })).toBeVisible({ timeout: 15_000 });
    await expect(stage.getByRole("heading", { name: "Exclusions" })).toBeVisible({ timeout: 15_000 });
    await expect(stage.getByLabel("Executive Summary")).toBeVisible({ timeout: 15_000 });

    const rulesSummary = page.getByTestId("proposal-draft-rules-summary");
    await expect(rulesSummary).toContainText("Current template");
    await expect(rulesSummary).toContainText("Effective rules");
    await expect(rulesSummary).toContainText("Terminology");
    await expect(rulesSummary.getByRole("button", { name: "Edit override" })).toBeVisible({ timeout: 15_000 });

    for (const width of [1024, 1280, 1440]) {
      await test.step(`desktop width ${width}`, async () => {
        await setProposalDraftViewport(page, width);
        await expect(rulesSummary).toBeVisible();
        await expect(stage).toBeVisible();
        await expect(page.getByRole("button", { name: "Versions" })).toBeVisible();
        await expect(page.getByRole("button", { name: "Export" })).toBeVisible();
        expect(
          await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
        ).toBeTruthy();
      });
    }
  });

  test("template and override drawer updates the rules summary without leaving proposal draft", async ({
    page,
    baseURL,
  }) => {
    const webBase = baseURL ?? "http://127.0.0.1:3000";
    const opportunityId = await openProposalDraftWorkspaceWithDiscoveryReady(page, webBase);

    await expectProposalDraftReady(page);

    const rulesSummary = page.getByTestId("proposal-draft-rules-summary");
    const editOverrideButton = rulesSummary.getByRole("button", { name: "Edit override" });

    await editOverrideButton.click();
    const overrideDrawer = page.getByTestId("proposal-draft-override-drawer");
    await expect(overrideDrawer).toBeVisible({ timeout: 15_000 });
    await expect(overrideDrawer.getByRole("heading", { name: "Opportunity override" })).toBeVisible({
      timeout: 15_000,
    });
    await expect(overrideDrawer.getByLabel("Template for this opportunity")).toBeFocused({ timeout: 15_000 });

    await overrideDrawer.getByLabel("Template for this opportunity").selectOption("product_ux_agency");
    await overrideDrawer
      .getByLabel("Assumptions for this opportunity")
      .fill("Client stakeholders can approve workshop outputs within three business days.");
    await overrideDrawer
      .getByLabel("Preferred terminology additions")
      .fill("prototype sprint\nexperience goals");

    await Promise.all([
      page.waitForResponse(
        (response) =>
          response.url().includes(`/api/v1/opportunities/${opportunityId}/rules/override`) &&
          response.request().method() === "PUT" &&
          response.status() === 200,
      ),
      overrideDrawer.getByRole("button", { name: "Save override" }).click(),
    ]);

    await expect(rulesSummary).toContainText("Product / UX Agency Template", { timeout: 15_000 });
    await expect(rulesSummary).toContainText("prototype sprint");
    await expect(rulesSummary).toContainText("Override active");
    await expect(page.getByText("Rules conflict needs resolution")).toBeVisible({ timeout: 15_000 });
    await expect(
      page.getByText("The current ruleset conflicts with the saved assumptions and exclusions."),
    ).toBeVisible({ timeout: 15_000 });
    await expect(
      page.getByText("Rules conflict: assumptions need alignment before the draft is exported."),
    ).toBeVisible({ timeout: 15_000 });

    await Promise.all([
      page.waitForResponse(
        (response) =>
          response.url().includes(`/api/v1/opportunities/${opportunityId}/rules/override`) &&
          response.request().method() === "DELETE" &&
          response.status() === 200,
      ),
      overrideDrawer.getByRole("button", { name: "Clear override" }).click(),
    ]);

    await expect(rulesSummary).toContainText("Development Agency Template", { timeout: 15_000 });
    await expect(rulesSummary).not.toContainText("Override active");
    await expect(page.getByText("Rules conflict needs resolution")).toHaveCount(0);
    await expect(
      page.getByText("Rules conflict: assumptions need alignment before the draft is exported."),
    ).toHaveCount(0);

    await overrideDrawer.getByRole("button", { name: "Close" }).click();
    await expect(editOverrideButton).toBeFocused({ timeout: 15_000 });
  });

  test("round-tripping through Templates & Rules refreshes the workspace baseline without clearing the opportunity override", async ({
    page,
    baseURL,
  }) => {
    const webBase = baseURL ?? "http://127.0.0.1:3000";
    const opportunityId = await openProposalDraftWorkspaceWithDiscoveryReady(page, webBase);

    await expectProposalDraftReady(page);

    const rulesSummary = page.getByTestId("proposal-draft-rules-summary");
    await rulesSummary.getByRole("button", { name: "Edit override" }).click();

    const overrideDrawer = page.getByTestId("proposal-draft-override-drawer");
    await overrideDrawer.getByLabel("Template for this opportunity").selectOption("product_ux_agency");
    await overrideDrawer.getByLabel("Preferred terminology additions").fill("prototype sprint");

    await Promise.all([
      page.waitForResponse(
        (response) =>
          response.url().includes(`/api/v1/opportunities/${opportunityId}/rules/override`) &&
          response.request().method() === "PUT" &&
          response.status() === 200,
      ),
      overrideDrawer.getByRole("button", { name: "Save override" }).click(),
    ]);

    await expect(rulesSummary).toContainText("Product / UX Agency Template", { timeout: 15_000 });
    await expect(rulesSummary).toContainText("prototype sprint");
    await expect(rulesSummary).toContainText("Override active");

    await Promise.all([
      page.waitForURL(new RegExp(`/templates-rules\\?returnTo=.*${opportunityId}`)),
      rulesSummary.getByRole("link", { name: "Open Templates & Rules" }).click(),
    ]);

    await expect(page.getByTestId("templates-rules-header")).toBeVisible({ timeout: 15_000 });
    await page.getByLabel("Preferred terminology").fill("delivery plan\nexperience map");

    await Promise.all([
      page.waitForResponse(
        (response) =>
          response.url().endsWith("/api/v1/workspaces/current/rules") &&
          response.request().method() === "PUT" &&
          response.status() === 200,
      ),
      page.getByRole("button", { name: "Save rules" }).click(),
    ]);

    await Promise.all([
      page.waitForURL(new RegExp(`/opportunities/${opportunityId}/proposal-draft$`)),
      page.getByRole("link", { name: "Return to Proposal Draft" }).click(),
    ]);

    await expectProposalDraftReady(page);
    await expect(rulesSummary).toContainText("Product / UX Agency Template", { timeout: 15_000 });
    await expect(rulesSummary).toContainText("experience map");
    await expect(rulesSummary).toContainText("Override active");

    await Promise.all([
      page.waitForResponse(
        (response) =>
          response.url().includes(`/api/v1/opportunities/${opportunityId}/rules/override`) &&
          response.request().method() === "DELETE" &&
          response.status() === 200,
      ),
      rulesSummary.getByRole("button", { name: "Clear override" }).click(),
    ]);

    await expect(rulesSummary).toContainText("Development Agency Template", { timeout: 15_000 });
    await expect(rulesSummary).toContainText("experience map");
    await expect(rulesSummary).not.toContainText("Override active");
  });

  test("versions drawer previews without restore on selection and restores only after confirmation", async ({
    page,
    baseURL,
  }) => {
    const webBase = baseURL ?? "http://127.0.0.1:3000";
    const opportunityId = await openProposalDraftWorkspaceWithDiscoveryReady(page, webBase);

    await expectProposalDraftReady(page);

    const executiveSummary = page.getByLabel("Executive Summary");
    await executiveSummary.fill("Saved version preview copy. This should return after restore.");

    await Promise.all([
      page.waitForResponse(
        (response) =>
          response.url().includes(`/api/v1/opportunities/${opportunityId}/proposal-draft`) &&
          response.request().method() === "PATCH" &&
          response.status() === 200,
      ),
      page.getByRole("button", { name: "Save current" }).click(),
    ]);

    await Promise.all([
      page.waitForResponse(
        (response) =>
          response.url().includes(`/api/v1/opportunities/${opportunityId}/proposal-draft/save-version`) &&
          response.request().method() === "POST" &&
          response.status() === 200,
      ),
      page.getByRole("button", { name: "Save version" }).click(),
    ]);

    await executiveSummary.fill("Version drawer verification draft. This copy should be replaced after restore.");
    await Promise.all([
      page.waitForResponse(
        (response) =>
          response.url().includes(`/api/v1/opportunities/${opportunityId}/proposal-draft`) &&
          response.request().method() === "PATCH" &&
          response.status() === 200,
      ),
      page.getByRole("button", { name: "Save current" }).click(),
    ]);

    const versionsButton = page.getByRole("button", { name: "Versions" });
    await versionsButton.click();

    const versionDrawer = page.getByTestId("proposal-draft-version-drawer");
    await expect(versionDrawer).toBeVisible({ timeout: 15_000 });
    await expect(versionDrawer.getByRole("heading", { name: "Version history" })).toBeVisible({ timeout: 15_000 });

    await Promise.all([
      page.waitForResponse(
        (response) =>
          response.url().includes(`/api/v1/opportunities/${opportunityId}/proposal-draft/versions/1`) &&
          response.request().method() === "GET" &&
          response.status() === 200,
      ),
      versionDrawer.getByRole("button", { name: /Version 1/ }).click(),
    ]);

    await expect(versionDrawer).toContainText("Saved version preview copy. This should return after restore.", {
      timeout: 15_000,
    });
    await expect(versionDrawer.getByRole("button", { name: "Restore" })).toBeVisible({ timeout: 15_000 });
    await expect(versionDrawer.getByText("Restoring replaces the current working draft.")).toHaveCount(0);
    await expect(executiveSummary).toHaveValue(
      "Version drawer verification draft. This copy should be replaced after restore.",
    );

    await versionDrawer.getByRole("button", { name: "Restore" }).click();
    await expect(versionDrawer.getByText("Restoring replaces the current working draft.")).toBeVisible({
      timeout: 15_000,
    });

    await Promise.all([
      page.waitForResponse(
        (response) =>
          response.url().includes(`/api/v1/opportunities/${opportunityId}/proposal-draft/versions/1/restore`) &&
          response.request().method() === "POST" &&
          response.status() === 200,
      ),
      versionDrawer.getByRole("button", { name: "Restore version" }).click(),
    ]);

    await expect(executiveSummary).toHaveValue(
      "Saved version preview copy. This should return after restore.",
      { timeout: 15_000 },
    );

    await versionDrawer.getByRole("button", { name: "Close" }).click();
    await expect(versionsButton).toBeFocused({ timeout: 15_000 });
  });

  test("regenerate prompts before replacing unsaved edits and keeps the update scoped to that chapter", async ({
    page,
    baseURL,
  }) => {
    const webBase = baseURL ?? "http://127.0.0.1:3000";
    const opportunityId = await openProposalDraftWorkspaceWithDiscoveryReady(page, webBase);

    await expectProposalDraftReady(page);

    const objectivesInput = page.getByLabel("Objectives");
    const executiveSummaryInput = page.getByLabel("Executive Summary");
    const originalObjectives = await objectivesInput.inputValue();
    const originalExecutiveSummary = await executiveSummaryInput.inputValue();
    const objectivesBlock = page.locator(".proposal-draft-chapter-block").filter({
      has: page.getByRole("heading", { name: "Objectives" }),
    });

    await objectivesInput.fill("Unsaved objective rewrite that should require confirmation before regenerate.");
    await objectivesBlock.getByRole("button", { name: "Regenerate section" }).click();

    await expect(
      objectivesBlock.getByText(
        "This section has unsaved edits. Save current first or confirm that you want to replace them.",
      ),
    ).toBeVisible({ timeout: 15_000 });
    await expect(objectivesBlock.getByRole("button", { name: "Replace section" })).toBeVisible({
      timeout: 15_000,
    });

    await Promise.all([
      page.waitForResponse(
        (response) =>
          response.url().includes(`/api/v1/opportunities/${opportunityId}/proposal-draft/sections/objectives/regenerate`) &&
          response.request().method() === "POST" &&
          response.status() === 200,
      ),
      objectivesBlock.getByRole("button", { name: "Replace section" }).click(),
    ]);

    await expect(objectivesInput).not.toHaveValue(
      "Unsaved objective rewrite that should require confirmation before regenerate.",
    );
    await expect(objectivesInput).toHaveValue(originalObjectives, { timeout: 15_000 });
    await expect(executiveSummaryInput).toHaveValue(originalExecutiveSummary, { timeout: 15_000 });
  });

  test("low confidence shows a page status band and a local timeline marker", async ({ page, baseURL }) => {
    const webBase = baseURL ?? "http://127.0.0.1:3000";
    await openProposalDraftWorkspaceWithDiscoveryReady(page, webBase);

    await expectProposalDraftReady(page);

    const statusBand = page.getByTestId("proposal-draft-status-band");
    await expect(statusBand).toContainText("Low confidence needs review", { timeout: 15_000 });
    await expect(statusBand).toContainText("Timeline remains a low-confidence section until discovery confirms launch timing.");

    const timelineBlock = page.locator(".proposal-draft-chapter-block").filter({
      has: page.getByRole("heading", { name: "Timeline" }),
    });
    await expect(timelineBlock).toContainText("Timeline depends on feedback turnaround.", { timeout: 15_000 });
  });

  test("rules conflict stays visible in the status band and affected chapter marker", async ({ page, baseURL }) => {
    const webBase = baseURL ?? "http://127.0.0.1:3000";
    const opportunityId = await openProposalDraftWorkspaceWithDiscoveryReady(page, webBase);

    await expectProposalDraftReady(page);
    const rulesSummary = page.getByTestId("proposal-draft-rules-summary");

    await Promise.all([
      page.waitForURL(new RegExp(`/templates-rules\\?returnTo=.*${opportunityId}`)),
      rulesSummary.getByRole("link", { name: "Open Templates & Rules" }).click(),
    ]);
    await expect(page.getByTestId("templates-rules-header")).toBeVisible({ timeout: 15_000 });

    await page.getByLabel("Default assumptions").fill("Client can approve the sitemap within three business days.");
    await page.getByLabel("Default exclusions").fill("Analytics migration is out of scope unless added later.");

    await Promise.all([
      page.waitForResponse(
        (response) =>
          response.url().endsWith("/api/v1/workspaces/current/rules") &&
          response.request().method() === "PUT" &&
          response.status() === 200,
      ),
      page.getByRole("button", { name: "Save rules" }).click(),
    ]);

    await Promise.all([
      page.waitForURL(new RegExp(`/opportunities/${opportunityId}/proposal-draft$`)),
      page.getByRole("link", { name: "Return to Proposal Draft" }).click(),
    ]);

    await expectProposalDraftReady(page);
    const statusBand = page.getByTestId("proposal-draft-status-band");
    await expect(statusBand).toContainText("Rules conflict needs resolution", { timeout: 15_000 });
    await expect(statusBand).toContainText("The current ruleset conflicts with the saved assumptions and exclusions.");
    await expect(statusBand).toContainText(
      "Resolve the assumptions and exclusions mismatch before exporting or regenerating the draft.",
    );

    const assumptionsBlock = page.locator(".proposal-draft-chapter-block").filter({
      has: page.getByRole("heading", { name: "Assumptions" }),
    });
    await expect(assumptionsBlock).toContainText(
      "Rules conflict: assumptions need alignment before the draft is exported.",
      { timeout: 15_000 },
    );

    const exclusionsBlock = page.locator(".proposal-draft-chapter-block").filter({
      has: page.getByRole("heading", { name: "Exclusions" }),
    });
    await expect(exclusionsBlock).toContainText(
      "Rules conflict: exclusions need alignment before the draft is exported.",
      { timeout: 15_000 },
    );
  });

  test("billing restriction disables blocked actions but keeps copy available", async ({ page, baseURL }) => {
    const webBase = baseURL ?? "http://127.0.0.1:3000";
    const opportunityId = await openProposalDraftWorkspaceWithDiscoveryReady(page, webBase);

    await page.route(new RegExp(`/api/v1/opportunities/${opportunityId}/proposal-draft$`), async (route) => {
      if (route.request().method() !== "PATCH") {
        await route.continue();
        return;
      }
      await route.fulfill({
        status: 403,
        contentType: "application/json",
        body: JSON.stringify({
          error: {
            code: "WORKSPACE_RESTRICTED",
            message: "Proposal Draft action is blocked by workspace billing status.",
            details: {
              action_label: "Save Current",
              blocked_actions: ["generate", "regenerate", "save current", "save-version", "restore", "export"],
            },
            restriction_reason: "past_due",
          },
        }),
      });
    });

    await expectProposalDraftReady(page);

    await Promise.all([
      page.waitForResponse(
        (response) =>
          response.url().includes(`/api/v1/opportunities/${opportunityId}/proposal-draft/save-version`) &&
          response.request().method() === "POST" &&
          response.status() === 200,
      ),
      page.getByRole("button", { name: "Save version" }).click(),
    ]);

    await page.getByRole("button", { name: "Save current" }).click();

    const statusBand = page.getByTestId("proposal-draft-status-band");
    await expect(statusBand).toContainText("Proposal Draft action is blocked by workspace billing status.", {
      timeout: 15_000,
    });
    await expect(statusBand).toContainText("save current", { timeout: 15_000 });
    await expect(page.getByRole("link", { name: "Manage billing" })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole("button", { name: "Save current" })).toBeDisabled({ timeout: 15_000 });
    await expect(page.getByRole("button", { name: "Save version" })).toBeDisabled({ timeout: 15_000 });
    await expect(page.getByRole("button", { name: "Export" })).toBeDisabled({ timeout: 15_000 });
    const firstChapterBlock = page.locator(".proposal-draft-chapter-block").first();
    await expect(firstChapterBlock.getByRole("button", { name: "Regenerate section" })).toBeDisabled({
      timeout: 15_000,
    });
    await expect(firstChapterBlock).toContainText("Regenerate is blocked until billing access is restored.", {
      timeout: 15_000,
    });

    const versionsButton = page.getByRole("button", { name: "Versions" });
    await versionsButton.click();

    const versionDrawer = page.getByTestId("proposal-draft-version-drawer");
    await expect(versionDrawer).toBeVisible({ timeout: 15_000 });

    await Promise.all([
      page.waitForResponse(
        (response) =>
          response.url().includes(`/api/v1/opportunities/${opportunityId}/proposal-draft/versions/1`) &&
          response.request().method() === "GET" &&
          response.status() === 200,
      ),
      versionDrawer.getByRole("button", { name: /Version 1/ }).click(),
    ]);

    await expect(versionDrawer).toContainText("Restore is blocked until billing access is restored.", {
      timeout: 15_000,
    });
    await expect(versionDrawer.getByRole("button", { name: "Restore" })).toBeDisabled({ timeout: 15_000 });
    await expect(page.getByRole("button", { name: "Copy all" })).toBeEnabled({ timeout: 15_000 });
  });

  test("copy and export use the chapter order and show browser recovery when clipboard access is blocked", async ({
    page,
    baseURL,
  }) => {
    const webBase = baseURL ?? "http://127.0.0.1:3000";
    await openProposalDraftWorkspaceWithDiscoveryReady(page, webBase);

    await expectProposalDraftReady(page);

    await page.evaluate(() => {
      const clipboard = {
        writeText: async (value: string) => {
          (window as typeof window & { __proposalDraftCopy?: string }).__proposalDraftCopy = value;
        },
      };
      Object.defineProperty(navigator, "clipboard", {
        configurable: true,
        value: clipboard,
      });
    });

    await page.getByRole("button", { name: "Copy all" }).click();
    await expect(page.getByText("Proposal draft copied in chapter order.", { exact: false })).toBeVisible({
      timeout: 15_000,
    });

    const copiedText = await page.evaluate(() => {
      return (window as typeof window & { __proposalDraftCopy?: string }).__proposalDraftCopy ?? "";
    });
    expect(copiedText.indexOf("Executive Summary")).toBeLessThan(copiedText.indexOf("Objectives"));
    expect(copiedText.indexOf("Assumptions")).toBeLessThan(copiedText.indexOf("Exclusions"));

    await page.evaluate(() => {
      const clipboard = {
        writeText: async () => {
          throw new DOMException("Clipboard blocked", "NotAllowedError");
        },
      };
      Object.defineProperty(navigator, "clipboard", {
        configurable: true,
        value: clipboard,
      });
    });

    await page.getByRole("button", { name: "Copy all" }).click();
    await expect(page.getByText("Clipboard access is blocked. Use Text export or copy from the editor instead.")).toBeVisible({
      timeout: 15_000,
    });

    await page.getByRole("button", { name: "Export" }).click();
    const [textDownload] = await Promise.all([
      page.waitForEvent("download"),
      page.getByRole("button", { name: "Text" }).click(),
    ]);
    expect(textDownload.suggestedFilename()).toContain(".txt");

    await page.getByRole("button", { name: "Export" }).click();
    const [markdownDownload] = await Promise.all([
      page.waitForEvent("download"),
      page.getByRole("button", { name: "Markdown" }).click(),
    ]);
    expect(markdownDownload.suggestedFilename()).toContain(".md");
  });

  test("shows the empty proposal draft state with Generate draft and rules summary context", async ({
    page,
    baseURL,
  }) => {
    const webBase = baseURL ?? "http://127.0.0.1:3000";
    await setProposalDraftViewport(page);
    await openProposalDraftWorkspaceWithoutCurrentDraft(page, webBase);

    await expectProposalDraftShell(page);
    await expect(page.getByTestId("proposal-draft-empty-state")).toContainText("No current proposal draft.", {
      timeout: 15_000,
    });
    await expect(page.getByTestId("proposal-draft-empty-state")).toContainText(
      "Generate the first draft from the current Lead Brief, Discovery, template, and effective rules.",
      { timeout: 15_000 },
    );
    await expect(page.getByRole("button", { name: "Generate draft" })).toBeVisible({ timeout: 15_000 });
  });

  test("shows the blocked proposal draft state when Lead Brief is still missing", async ({ page, baseURL }) => {
    const webBase = baseURL ?? "http://127.0.0.1:3000";
    const opportunityId = await createOpportunityAndOpenOverview(page, webBase);
    await gotoOpportunityStep(page, webBase, opportunityId, "proposal-draft");

    await expectProposalDraftShell(page);

    await Promise.all([
      page.waitForResponse(
        (response) =>
          response.url().includes(`/api/v1/opportunities/${opportunityId}/proposal-draft/generate`) &&
          response.request().method() === "POST" &&
          response.status() === 409,
      ),
      page.getByRole("button", { name: "Generate draft" }).click(),
    ]);

    const statusBand = page.getByTestId("proposal-draft-status-band");
    await expect(statusBand).toContainText("Generate Lead Brief before creating a proposal draft.", {
      timeout: 15_000,
    });
    await expect(statusBand).toContainText("Lead Brief");
    await expect(page.getByRole("link", { name: "Go to Lead Brief" })).toBeVisible({ timeout: 15_000 });
  });

  test("shows the blocked proposal draft state when Discovery is still missing", async ({ page, baseURL }) => {
    const webBase = baseURL ?? "http://127.0.0.1:3000";
    const opportunityId = await openDiscoveryWorkspaceWithLeadBrief(page, webBase);
    await gotoOpportunityStep(page, webBase, opportunityId, "proposal-draft");

    await expectProposalDraftShell(page);

    await Promise.all([
      page.waitForResponse(
        (response) =>
          response.url().includes(`/api/v1/opportunities/${opportunityId}/proposal-draft/generate`) &&
          response.request().method() === "POST" &&
          response.status() === 409,
      ),
      page.getByRole("button", { name: "Generate draft" }).click(),
    ]);

    const statusBand = page.getByTestId("proposal-draft-status-band");
    await expect(statusBand).toContainText("Complete Discovery before generating a proposal draft.", {
      timeout: 15_000,
    });
    await expect(statusBand).toContainText("Discovery");
    await expect(page.getByRole("link", { name: "Go to Discovery" })).toBeVisible({ timeout: 15_000 });
  });

  test("shows the loading proposal draft shell while the working copy resolves", async ({ page, baseURL }) => {
    const webBase = baseURL ?? "http://127.0.0.1:3000";
    const opportunityId = await openProposalDraftWorkspaceWithDiscoveryReady(page, webBase);

    await page.route(proposalDraftRoute(opportunityId), async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 1_200));
      await route.continue();
    });

    await page.goto(new URL(`/opportunities/${opportunityId}/proposal-draft`, webBase).toString(), {
      waitUntil: "domcontentloaded",
    });

    await expectProposalDraftShell(page);
    await expect(page.getByTestId("proposal-draft-loading-state")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId("proposal-draft-loading-state")).toContainText("Loading proposal draft");
    await expect(page.getByTestId("proposal-draft-loading-state")).toContainText(
      "Fetching the current draft, rules summary, and version history.",
    );
  });

  test("shows the billing restricted proposal draft state with a visible billing CTA", async ({
    page,
    baseURL,
  }) => {
    const webBase = baseURL ?? "http://127.0.0.1:3000";
    const opportunityId = await openProposalDraftWorkspaceWithoutCurrentDraft(page, webBase);

    await page.route(proposalDraftGenerateRoute(opportunityId), async (route) => {
      await route.fulfill({
        status: 403,
        contentType: "application/json",
        body: JSON.stringify({
          error: {
            code: "WORKSPACE_RESTRICTED",
            message: "Proposal Draft action is blocked by workspace billing status.",
            details: {
              action_label: "Generate Draft",
              blocked_actions: ["generate", "regenerate", "save current", "save-version", "restore", "export"],
            },
            restriction_reason: "past_due",
          },
        }),
      });
    });

    await expectProposalDraftShell(page);

    await page.getByRole("button", { name: "Generate draft" }).click();

    const statusBand = page.getByTestId("proposal-draft-status-band");
    await expect(statusBand).toContainText("Proposal Draft action is blocked by workspace billing status.", {
      timeout: 15_000,
    });
    await expect(statusBand).toContainText("Generate Draft");
    await expect(statusBand).toContainText("past due");
    await expect(
      page.getByRole("link", { name: /Upgrade plan|Manage billing/ }).first(),
    ).toBeVisible({ timeout: 15_000 });
  });

  test("shows the error proposal draft state with retry while keeping shell hierarchy", async ({
    page,
    baseURL,
  }) => {
    const webBase = baseURL ?? "http://127.0.0.1:3000";
    const opportunityId = await openProposalDraftWorkspaceWithDiscoveryReady(page, webBase);

    await page.route(proposalDraftRoute(opportunityId), async (route) => {
      await route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({
          error: {
            code: "PROPOSAL_DRAFT_LOAD_FAILED",
            message: "We couldn't load this proposal draft.",
            details: {
              reload_hint: "Retry the workspace request.",
            },
            restriction_reason: null,
          },
        }),
      });
    });

    await page.goto(new URL(`/opportunities/${opportunityId}/proposal-draft`, webBase).toString(), {
      waitUntil: "domcontentloaded",
    });

    await expectProposalDraftShell(page);
    const statusBand = page.getByTestId("proposal-draft-status-band");
    await expect(statusBand).toContainText("We couldn't load this proposal draft.", { timeout: 15_000 });
    await expect(statusBand).toContainText("Retry the workspace request.");
    await expect(page.getByRole("button", { name: "Retry" })).toBeVisible({ timeout: 15_000 });
  });
});
