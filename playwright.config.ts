import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  retries: 0,
  reporter: "list",
  use: {
    baseURL: process.env.SMOKE_WEB_URL ?? "http://localhost:3000",
    trace: "retain-on-failure",
  },
});
