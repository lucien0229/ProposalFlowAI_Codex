import { expect, test } from "@playwright/test";

import { resolveWorkspaceDatabaseUrl } from "./workspace";

test.describe("workspace helper database resolution", () => {
  test("prefers the explicit test database url", () => {
    expect(
      resolveWorkspaceDatabaseUrl({
        PROPOSALFLOW_TEST_DATABASE_URL:
          "postgresql+psycopg://proposalflow:proposalflow@127.0.0.1:5432/proposalflow_test",
        DATABASE_URL: "postgresql:///proposalflow",
      }),
    ).toBe("postgresql://proposalflow:proposalflow@127.0.0.1:5432/proposalflow_test");
  });

  test("falls back to the app database url when no test database override exists", () => {
    expect(
      resolveWorkspaceDatabaseUrl({
        DATABASE_URL: "postgresql+psycopg://proposalflow:proposalflow@127.0.0.1:5432/proposalflow",
      }),
    ).toBe("postgresql://proposalflow:proposalflow@127.0.0.1:5432/proposalflow");
  });

  test("throws a clear error when no database url is configured", () => {
    expect(() => resolveWorkspaceDatabaseUrl({})).toThrow(
      "Set PROPOSALFLOW_TEST_DATABASE_URL or DATABASE_URL before running workspace-backed Playwright helpers.",
    );
  });
});
