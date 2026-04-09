import type { Page } from "@playwright/test";

type CreateOpportunityInput = {
  title?: string;
  companyName?: string;
  requestedService?: string;
};

type ToolbarFilters = {
  search?: string;
  status?: string;
  archived?: boolean;
  sortLabel?: string;
};

export async function openNewOpportunity(page: Page) {
  const preferredTriggers = [
    page
      .locator(".product-page-header__actions")
      .getByRole("button", { name: /new opportunity/i }),
    page
      .getByLabel(/opportunities toolbar/i)
      .getByRole("button", { name: /new opportunity/i }),
  ];

  for (const locator of preferredTriggers) {
    if (await locator.count()) {
      await locator.click();
      return;
    }
  }

  const fallbackTrigger = page.getByRole("button", { name: /new opportunity/i });
  if (await fallbackTrigger.count()) {
    await fallbackTrigger.first().click();
    return;
  }

  await fallbackTrigger.click();
}

export async function fillMinimumOpportunityForm(
  page: Page,
  input: CreateOpportunityInput = {},
) {
  await page.getByLabel(/title/i).fill(input.title ?? "Website redesign retainer");
  await page.getByLabel(/company/i).fill(input.companyName ?? "North Star Studio");

  if (input.requestedService !== undefined) {
    await page.getByLabel(/requested service/i).fill(input.requestedService);
  }
}

export async function submitOpportunityForm(page: Page) {
  await page.getByRole("button", { name: /create opportunity|continue to overview|save opportunity/i }).click();
}

export async function setOpportunitiesToolbarFilters(
  page: Page,
  filters: ToolbarFilters = {},
) {
  if (filters.search !== undefined) {
    await page.getByRole("searchbox", { name: /search/i }).fill(filters.search);
  }

  if (filters.status !== undefined) {
    await page.getByLabel(/status/i).selectOption(filters.status);
  }

  if (filters.archived !== undefined) {
    const archivedToggle = page.getByRole("checkbox", { name: /archived/i });
    if ((await archivedToggle.isChecked()) !== filters.archived) {
      await archivedToggle.click();
    }
  }

  if (filters.sortLabel !== undefined) {
    await page.getByLabel(/sort/i).selectOption({ label: filters.sortLabel });
  }
}
