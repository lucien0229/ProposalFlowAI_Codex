import { expect, test } from "@playwright/test";

test.describe("admin shell", () => {
  test("renders the internal read-only boundary", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByText("Internal only")).toBeVisible();
    await expect(page.getByText("read-only")).toBeVisible();
    await expect(page.getByText("customer workflow")).toHaveCount(0);
    await expect(page.getByText("launch-scope")).toHaveCount(0);
  });
});
