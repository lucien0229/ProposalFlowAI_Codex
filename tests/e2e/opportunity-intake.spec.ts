import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { expect, test } from "@playwright/test";

import {
  createOpportunityAndOpenOverview,
  expectRouteStateBlock,
  getFileStateCard,
  getRouteStateBlock,
  gotoOverviewState,
} from "./helpers/opportunity-overview";

test.describe("opportunity intake workspace", () => {
  test("covers raw-input editing, save trust copy, file states, and retry extraction", async ({
    page,
    baseURL,
  }) => {
    const webBase = baseURL ?? "http://127.0.0.1:3000";
    await createOpportunityAndOpenOverview(page, webBase);

    const rawInput = page.getByLabel(/raw input/i);
    await expect(rawInput).toBeVisible();
    const rawInputBox = await rawInput.boundingBox();
    expect(rawInputBox?.height ?? 0).toBeGreaterThanOrEqual(320);
    await expect(page.getByRole("button", { name: "Upload PDF" })).toBeVisible();
    await expect(page.locator(".product-chip", { hasText: "Saved just now" }).first()).toBeVisible();
    await page
      .getByLabel(/raw input/i)
      .fill("North Star needs a redesign, migration support, and analytics cleanup before proposal drafting.");
    await page.waitForTimeout(1000);
    await expect(page.locator("header").getByRole("button", { name: "Save opportunity" })).toBeVisible();
    await expect(page.getByText(/The latest intake changes are safe to generate from\./i)).toBeVisible({
      timeout: 15000,
    });

    await page.setInputFiles('[data-testid="pdf-upload-input"]', {
      name: "north-star-intake.pdf",
      mimeType: "application/pdf",
      buffer: readFileSync(resolve(process.cwd(), "tests/fixtures/north-star-intake.pdf")),
    });
    await expect(page.getByRole("button", { name: "Upload PDF" })).toBeVisible();
    await expect(getFileStateCard(page, "ready")).toContainText("north-star-intake.pdf", {
      timeout: 15000,
    });
    await expect(getFileStateCard(page, "ready")).toContainText("ready");
    await expect(getFileStateCard(page, "ready")).toContainText("North Star intake");
    await expect(getFileStateCard(page, "ready")).toContainText("Extracted text preview");
    await page.getByRole("button", { name: "Open extracted text preview" }).click();
    await expect(page.getByRole("heading", { name: "From the latest PDF upload" })).toBeVisible();
    await expect(page.getByText("North Star intake")).toBeVisible();
  });

  test("keeps blocked, retry, success, and lead-brief handoff semantics visible above inline file recovery", async ({
    page,
    baseURL,
  }) => {
    const webBase = baseURL ?? "http://127.0.0.1:3000";
    const opportunityId = await createOpportunityAndOpenOverview(page, webBase);

    await gotoOverviewState(page, webBase, opportunityId, "blocked");
    const blockedState = getRouteStateBlock(page, "blocked");
    await expect(blockedState).toContainText("Add the core opportunity details before generating the lead brief.");
    await expect(blockedState).toContainText(
      "Add raw source notes or wait for extracted text before generating the lead brief.",
    );
    await expect(blockedState).toContainText(
      "Your PDF is still processing. You can wait for extraction or add manual source notes now.",
    );
    await expect(page.getByRole("button", { name: "Generate lead brief" })).toBeDisabled();

    await gotoOverviewState(page, webBase, opportunityId, "retry");
    await expectRouteStateBlock(
      page,
      "retry",
      "We couldn't save the latest intake changes.",
      "Retry save before generating the lead brief.",
    );
    await expect(page.getByRole("button", { name: "Save opportunity" })).toBeVisible();

    await gotoOverviewState(page, webBase, opportunityId, "success");
    await expectRouteStateBlock(
      page,
      "success",
      "Ready to continue into the lead brief",
      "Generate lead brief becomes the dominant next step once the intake contract is satisfied.",
    );
    await expect(page.getByRole("button", { name: "Generate lead brief" })).toBeVisible();
    await page.getByRole("button", { name: "Generate lead brief" }).click();
    await expect(page).toHaveURL(new RegExp(`/opportunities/${opportunityId}/lead-brief$`));
  });
});
