import { expect, test } from "@playwright/test";

const states = [
  "loading",
  "empty",
  "error",
  "blocked",
  "retry",
  "success",
] as const;

test.describe("web shell", () => {
  test("renders the product chrome", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("heading", { name: /A focused workspace/i })).toBeVisible();
    await expect(page.locator(".app-shell__topbar")).toBeVisible();
    await expect(page.locator(".status-panel")).toBeVisible();
    await expect(page.getByText("ProposalFlow AI")).toBeVisible();
  });

  for (const state of states) {
    test(`supports the ${state} product state`, async ({ page }) => {
      await page.goto(`/?state=${state}`);

      await expect(page.getByText(state, { exact: true }).first()).toBeVisible();
      await expect(page.locator(".state-panel")).toBeVisible();
      await expect(page.getByRole("link", { name: state })).toBeVisible();
    });
  }
});
