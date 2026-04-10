import { expect, test } from "@playwright/test";

import {
  createOpportunityAndOpenOverview,
  expectRouteStateBlock,
  expectWorkflowStepper,
  getOpportunityShell,
  gotoOverviewRoute,
  gotoOverviewState,
} from "./helpers/opportunity-overview";

test.describe("opportunity overview shell", () => {
  test("locks the overview shell hierarchy, copy, and workflow stepper", async ({ page, baseURL }) => {
    const webBase = baseURL ?? "http://127.0.0.1:3000";
    await createOpportunityAndOpenOverview(page, webBase);

    const shell = getOpportunityShell(page);

    await expect(shell.eyebrow).toHaveText("Opportunity intake");
    await expectWorkflowStepper(page);
    await expect(page.getByRole("heading", { name: "Source material" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Minimum opportunity context" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "No source material yet." })).toBeVisible();
    await expect(page.getByText(/The minimum context stays editable while source material catches up\./i)).toBeVisible();
    await expect(shell.recoveryNotice).toContainText("Generate lead brief");

    const headerBox = await shell.header.boundingBox();
    const stepperBox = await shell.stepper.boundingBox();
    const surfaceBox = await shell.surface.boundingBox();
    const recoveryBox = await shell.recoveryNotice.boundingBox();

    expect(headerBox?.y ?? Number.POSITIVE_INFINITY).toBeLessThan(stepperBox?.y ?? 0);
    expect(stepperBox?.y ?? Number.POSITIVE_INFINITY).toBeLessThan(surfaceBox?.y ?? 0);
    expect(surfaceBox?.y ?? Number.POSITIVE_INFINITY).toBeLessThan(recoveryBox?.y ?? 0);
  });

  test("covers ProductStateBlock route states, no-source empty workspace, and opportunity not found handling", async ({
    page,
    baseURL,
  }) => {
    const webBase = baseURL ?? "http://127.0.0.1:3000";
    const opportunityId = await createOpportunityAndOpenOverview(page, webBase);

    await gotoOverviewState(page, webBase, opportunityId, "loading");
    await expectRouteStateBlock(
      page,
      "loading",
      "Loading opportunity intake",
      "Loading this intake workspace should preserve the shell while the overview record is still resolving.",
    );

    await gotoOverviewState(page, webBase, opportunityId, "empty");
    await expectRouteStateBlock(
      page,
      "empty",
      "No source material yet.",
      "Paste raw notes or upload a PDF to start shaping this opportunity. The minimum context stays editable while source material catches up.",
    );

    await gotoOverviewState(page, webBase, opportunityId, "error");
    await expectRouteStateBlock(
      page,
      "error",
      "We couldn't load this opportunity overview.",
      "Retry this workspace fetch or return to Opportunities and reopen the record.",
    );

    await gotoOverviewState(page, webBase, opportunityId, "blocked");
    await expectRouteStateBlock(
      page,
      "blocked",
      "Lead brief generation is blocked.",
      "Add the core opportunity details before generating the lead brief.",
    );

    await gotoOverviewState(page, webBase, opportunityId, "retry");
    await expectRouteStateBlock(
      page,
      "retry",
      "We couldn't save the latest intake changes.",
      "Retry save before generating the lead brief.",
    );

    await gotoOverviewState(page, webBase, opportunityId, "success");
    await expectRouteStateBlock(
      page,
      "success",
      "Ready to continue into the lead brief",
      "Generate lead brief becomes the dominant next step once the intake contract is satisfied.",
    );

    await gotoOverviewRoute(page, webBase, "opp_missing_phase4");
    await expect(page.getByRole("heading", { name: "Opportunity not found." })).toBeVisible();
    await expect(page.getByText(/return to opportunities and reopen the record/i)).toBeVisible();
  });
});
