import { expect, test, type Page } from "@playwright/test";
import type { WorkspaceRuleSet } from "@proposalflow/shared-types";

import { createOpportunityAndOpenOverview } from "./helpers/opportunity-overview";

function templatesRoute(baseURL: string, returnTo?: string) {
  const url = new URL("/templates-rules", baseURL);
  if (returnTo) {
    url.searchParams.set("returnTo", returnTo);
  }
  return url.toString();
}

type EditableWorkspaceRuleSet = Omit<WorkspaceRuleSet, "workspace_id">;

async function readBrowserCsrfToken(page: Page) {
  const csrfToken = await page.evaluate(() => {
    const match = document.cookie
      .split(";")
      .map((entry) => entry.trim())
      .find((entry) => entry.startsWith("pf_csrf_token="));
    return match ? decodeURIComponent(match.slice("pf_csrf_token=".length)) : null;
  });

  if (!csrfToken) {
    throw new Error("Expected a browser CSRF token for Templates & Rules setup.");
  }

  return csrfToken;
}

async function readWorkspaceRules(page: Page): Promise<EditableWorkspaceRuleSet> {
  const result = await page.evaluate(async () => {
    const response = await fetch("/api/v1/workspaces/current/rules", {
      credentials: "include",
    });

    return {
      status: response.status,
      bodyText: await response.text(),
    };
  });

  if (result.status !== 200) {
    throw new Error(`Expected workspace rules fetch to succeed, got ${result.status}: ${result.bodyText}`);
  }

  const payload = JSON.parse(result.bodyText) as {
    workspace_rule_set: WorkspaceRuleSet & { workspace_id: string };
  };
  const { workspace_id: _workspaceId, ...ruleSet } = payload.workspace_rule_set;
  return ruleSet;
}

async function saveWorkspaceRulesViaApi(
  page: Page,
  nextRuleSet: EditableWorkspaceRuleSet,
) {
  const csrfToken = await readBrowserCsrfToken(page);
  const result = await page.evaluate(
    async ({ csrfToken, nextRuleSet }) => {
      const response = await fetch("/api/v1/workspaces/current/rules", {
        method: "PUT",
        credentials: "include",
        headers: {
          "content-type": "application/json",
          "x-csrf-token": csrfToken,
        },
        body: JSON.stringify({
          expected_updated_at: nextRuleSet.updated_at,
          rule_set: nextRuleSet,
        }),
      });

      return {
        status: response.status,
        bodyText: await response.text(),
      };
    },
    { csrfToken, nextRuleSet },
  );

  if (result.status !== 200) {
    throw new Error(`Expected workspace rules save to succeed, got ${result.status}: ${result.bodyText}`);
  }
}

test.describe("templates and rules page", () => {
  test.describe.configure({ mode: "serial" });
  test.setTimeout(60_000);

  test("loads the live workspace baseline and keeps the Proposal Draft return path visible", async ({
    page,
    baseURL,
  }) => {
    const webBase = baseURL ?? "http://127.0.0.1:3000";
    const opportunityId = await createOpportunityAndOpenOverview(page, webBase);
    const returnTo = `/opportunities/${opportunityId}/proposal-draft`;

    await page.goto(templatesRoute(webBase, returnTo), { waitUntil: "domcontentloaded" });

    await expect(page.getByTestId("templates-rules-header").getByRole("heading", { name: "Templates & Rules" })).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByTestId("templates-rules-header")).toContainText(
      "Set the workspace defaults that shape every proposal draft.",
      { timeout: 15_000 },
    );
    await expect(page.getByRole("navigation", { name: /opportunity workflow/i })).toHaveCount(0);
    await expect(page.getByRole("heading", { name: "Template Basics" })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole("heading", { name: "Assumptions & Exclusions" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Tone & Terminology" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Sections & Modules" })).toBeVisible();
    await expect(page.getByTestId("templates-rules-status-band")).toHaveCount(0);
    const impactNote = page.getByTestId("templates-rules-impact-note");
    await expect(impactNote).toContainText("Development Agency Template");
    await expect(impactNote).toContainText("consultative tone");
    await expect(impactNote).toContainText("discovery workshop");
    await expect(page.getByRole("button", { name: "Save rules" })).toBeEnabled({ timeout: 15_000 });
    await expect(page.getByRole("link", { name: "Return to Proposal Draft" })).toHaveAttribute("href", returnTo);
  });

  test("shows the validation state in-product and keeps the Proposal Draft return path visible", async ({
    page,
    baseURL,
  }) => {
    const webBase = baseURL ?? "http://127.0.0.1:3000";
    const opportunityId = await createOpportunityAndOpenOverview(page, webBase);
    const returnTo = `/opportunities/${opportunityId}/proposal-draft`;

    await page.goto(templatesRoute(webBase, returnTo), { waitUntil: "domcontentloaded" });

    await expect(page.getByTestId("templates-rules-header").getByRole("heading", { name: "Templates & Rules" })).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByRole("navigation", { name: /opportunity workflow/i })).toHaveCount(0);
    await expect(page.getByRole("heading", { name: "Template Basics" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Assumptions & Exclusions" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Tone & Terminology" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Sections & Modules" })).toBeVisible();

    await page.getByLabel("Preferred terminology").fill("delivery plan");
    await page.getByLabel("Banned terminology").fill("delivery plan");
    await page.getByLabel("Banned terminology").press("Tab");

    await expect(
      page
        .getByText(
          "Remove the overlap before saving so the drafting guidance stays unambiguous.",
        )
        .first(),
    ).toBeVisible({ timeout: 15_000 });
    await page.getByRole("button", { name: "Save rules" }).click();

    const statusBand = page.getByTestId("templates-rules-status-band");
    await expect(statusBand).toContainText("This ruleset has conflicts. Fix them before saving.", {
      timeout: 15_000,
    });
    await expect(statusBand).toContainText("Remove the overlap before saving so the drafting guidance stays unambiguous.");
    await expect(page.getByRole("link", { name: "Return to Proposal Draft" })).toHaveAttribute("href", returnTo);
  });

  test("shows save rules success with a Proposal Draft impact note and preserved return path", async ({
    page,
    baseURL,
  }) => {
    const webBase = baseURL ?? "http://127.0.0.1:3000";
    const opportunityId = await createOpportunityAndOpenOverview(page, webBase);
    const returnTo = `/opportunities/${opportunityId}/proposal-draft`;

    await page.goto(templatesRoute(webBase, returnTo), { waitUntil: "domcontentloaded" });

    await expect(page.getByTestId("templates-rules-page")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole("heading", { name: "Template Basics" })).toBeVisible({ timeout: 15_000 });
    await page.getByLabel("Tone").selectOption("direct");
    await page.getByLabel("Preferred terminology").fill("experience goals\nprototype sprint");

    await Promise.all([
      page.waitForResponse(
        (response) =>
          response.url().endsWith("/api/v1/workspaces/current/rules") &&
          response.request().method() === "PUT" &&
          response.status() === 200,
      ),
      page.getByRole("button", { name: "Save rules" }).click(),
    ]);

    await expect(page.getByTestId("templates-rules-status-band")).toContainText("Workspace rules saved", {
      timeout: 15_000,
    });
    const impactNote = page.getByTestId("templates-rules-impact-note");
    await expect(impactNote).toContainText("Proposal Draft will use the");
    await expect(impactNote).toContainText("direct tone");
    await expect(impactNote).toContainText("experience goals");
    await expect(page.getByRole("link", { name: "Return to Proposal Draft" })).toHaveAttribute("href", returnTo);
  });

  test("shows a real conflict error inline when the workspace baseline changes elsewhere", async ({
    page,
    baseURL,
  }) => {
    const webBase = baseURL ?? "http://127.0.0.1:3000";
    const opportunityId = await createOpportunityAndOpenOverview(page, webBase);
    const returnTo = `/opportunities/${opportunityId}/proposal-draft`;

    await page.goto(templatesRoute(webBase, returnTo), { waitUntil: "domcontentloaded" });

    await page.getByLabel("Tone").selectOption("direct");
    await page.getByLabel("Preferred terminology").fill("experience goals");
    const concurrentRuleSet = await readWorkspaceRules(page);
    await saveWorkspaceRulesViaApi(page, {
      ...concurrentRuleSet,
      default_assumptions: [
        "A separate editor updated the workspace baseline before this save completed.",
      ],
    });

    await Promise.all([
      page.waitForResponse(
        (response) =>
          response.url().endsWith("/api/v1/workspaces/current/rules") &&
          response.request().method() === "PUT" &&
          response.status() === 409,
      ),
      page.getByRole("button", { name: "Save rules" }).click(),
    ]);

    const statusBand = page.getByTestId("templates-rules-status-band");
    await expect(statusBand).toContainText("Save rules failed", { timeout: 15_000 });
    await expect(statusBand).toContainText("Workspace rules changed elsewhere.");
    await expect(statusBand).toContainText("Reload the latest workspace rules before saving again.");
    await expect(page.getByRole("button", { name: "Retry" })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole("link", { name: "Return to Proposal Draft" })).toHaveAttribute("href", returnTo);
  });

  test("shows the error state once, then recovers on retry against the live backend", async ({
    page,
    baseURL,
  }) => {
    const webBase = baseURL ?? "http://127.0.0.1:3000";
    const opportunityId = await createOpportunityAndOpenOverview(page, webBase);
    const returnTo = `/opportunities/${opportunityId}/proposal-draft`;
    let shouldFailTemplatesRequest = true;

    await page.route(/\/api\/v1\/templates$/, async (route) => {
      if (shouldFailTemplatesRequest) {
        shouldFailTemplatesRequest = false;
        await route.fulfill({
          status: 500,
          contentType: "application/json",
          body: JSON.stringify({
            error: {
              code: "TEMPLATES_RULES_LOAD_FAILED",
              message: "We couldn't load Templates & Rules.",
              details: {
                reload_hint: "Retry the workspace defaults request.",
              },
              restriction_reason: null,
            },
          }),
        });
        return;
      }

      await route.continue();
    });

    await page.goto(templatesRoute(webBase, returnTo), { waitUntil: "domcontentloaded" });

    await expect(page.getByTestId("templates-rules-header").getByRole("heading", { name: "Templates & Rules" })).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByRole("navigation", { name: /opportunity workflow/i })).toHaveCount(0);

    const statusBand = page.getByTestId("templates-rules-status-band");
    await expect(statusBand).toContainText("We couldn't load Templates & Rules.", { timeout: 15_000 });
    await expect(statusBand).toContainText("Retry the workspace defaults request.");
    await Promise.all([
      page.waitForResponse(
        (response) =>
          response.url().endsWith("/api/v1/templates") &&
          response.request().method() === "GET" &&
          response.status() === 200,
      ),
      page.getByRole("button", { name: "Retry" }).click(),
    ]);

    await expect(page.getByRole("heading", { name: "Template Basics" })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId("templates-rules-status-band")).toHaveCount(0);
    await expect(page.getByRole("link", { name: "Return to Proposal Draft" })).toHaveAttribute("href", returnTo);
  });
});
